---
title: '💀 告别 Localhost：手把手教你把 Vue+Spring Boot 部署到 DigitalOcean (含踩坑实录)'
description: '保姆级上线指南：手把手教你把 Vue+Spring Boot 全栈项目部署到 DigitalOcean Linux 服务器，涵盖环境配置、Nginx 反向代理、MySQL 导入及常见踩坑解决方案。'
pubDate: '2026-02-05'
tags: ['部署', 'Vue3', 'Spring Boot', 'DigitalOcean', 'Nginx', 'Linux']
heroImage: ''
---

> **前言：** 在上一篇文章里，我成功用 GitHub 学生包白嫖到了 DigitalOcean 的服务器。 但是，手里握着服务器 IP，看着本地跑得欢快的代码，我陷入了沉思：**“这中间的鸿沟，到底该怎么跨过去？”**
>
> 这篇文章不是枯燥的官方文档，而是我作为一个全栈新手，在 Linux 黑窗口里摸爬滚打一整天总结出来的**“保姆级上线指南”**。如果你也正对着黑屏幕发呆，跟着我走，保证能把你的项目跑起来！

------

## 🛠️ 第一关：基建狂魔 (环境配置)

刚连上 SSH 的时候，这台 Ubuntu 服务器就像一间刚交付的毛坯房，啥都没有。我们需要先把水电硬装搞定。

### 1. 更新系统

这是标准起手式，不管三七二十一，先让服务器保持最新：

Bash

```
apt update
```

### 2. 安装 Java (后端的心脏)

我的项目是用 JDK 17 写的，所以必须装对应版本：

Bash

```
apt install openjdk-17-jdk -y
# 验证一下装没装好
java -version
```

看到版本号的那一刻，第一块砖算是砌好了。

### 3. 安装 MySQL (数据的家)

Bash

```
apt install mysql-server -y
```

**🚨 踩坑警报 1：** 装完数据库不是结束，是开始！ 默认的 root 密码我也知道是啥，必须重置。进入 MySQL 后，我用了这行命令才把密码改成自己的：

SQL

```
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '你的强密码';
FLUSH PRIVILEGES;
```

### 4. 安装 Nginx (大管家)

Bash

```
apt install nginx -y
```

装完直接在浏览器访问服务器 IP，看到 "Welcome to Nginx"，说明大门已经装好了。

------

## 📦 第二关：数据大迁徙 (数据库导入)

这一步我卡了很久。我在本地有几十条测试数据，总不能在服务器上一条条敲吧？

### 1. 本地导出

在我的电脑上（Navicat/DBeaver），把 `online_survey_system` 数据库转储成了 `db.sql` 文件。

### 2. 上传到服务器

这里要用到一个神器命令 `scp`（在本地 CMD 里敲，不是服务器里）：

Bash

```
# 把桌面的 sql 文件传到服务器的 /root 目录下
scp "C:\Users\Lin\Desktop\db.sql" root@139.59.xx.xx:/root/
```

### 3. 服务器导入

回到服务器 SSH，把数据“灌”进去：

Bash

```
# 创建空数据库
mysql -u root -p -e "CREATE DATABASE online_survey_system;"
# 导入数据
mysql -u root -p online_survey_system < /root/db.sql
```

------

## ☕ 第三关：后端起飞 (Spring Boot)

### 1. 打包上传

在 IDEA 里双击 Maven 的 `package`，生成了 `app.jar`。同样用 `scp` 传上去。

### 2. 第一次尝试 (失败)

我兴奋地输入 `java -jar app.jar`，看着日志滚动，Starting... Started! 我高兴地关掉了 SSH 窗口。**结果网站立马挂了。**

**🚨 踩坑警报 2：** 直接运行是“前台运行”，窗口一关，程序就死。 **解决方案：** 使用“长生不老”命令 `nohup`。

Bash

```
# 让它在后台静默运行，并把日志写进 log.txt
nohup java -jar app.jar > log.txt 2>&1 &
```

现在，即使我关机睡觉，它也在云端 24 小时待命。

------

## 🎨 第四关：前端安家 (Vue3 + Nginx)

### 1. 也是打包上传

在 VSCode 里 `npm run build`，生成 `dist` 文件夹。 把整个 `dist` 文件夹搬运到 Nginx 的地盘：

Bash

```
mkdir -p /var/www/html/survey
# 上传完后，把 dist 里的东西拷过去
cp -r /root/dist/* /var/www/html/survey/
```

### 2. 赋予权限 (关键！)

**🚨 踩坑警报 3：** 我刚传完访问时，网页报 **403 Forbidden**。这是因为 Nginx 没有权限读取我上传的文件。

Bash

```
# 赋予读取权限
chmod -R 755 /var/www/html/survey
```

------

## 🕸️ 终极 BOSS：Nginx 配置文件

这是最容易劝退新手的一步。我们需要告诉 Nginx：**什么时候给看网页，什么时候转发给 Java 后端。**

编辑配置文件：`nano /etc/nginx/sites-available/default`

我摸索了半天，总结出了这份**“万能配置”**：

Nginx

```
server {
    listen 80;
    server_name _;  # 匹配所有域名

    # 1. 前端：指向 Vue 的 dist 目录
    location / {
        root /var/www/html/survey;
        index index.html;
        try_files $uri $uri/ /index.html; # 解决 Vue 路由刷新变 404 的问题
    }

    # 2. 后端：反向代理给 8081 端口
    location /api {
        proxy_pass http://127.0.0.1:8081;
        # 加上这些头，后端才能获取到用户的真实IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

保存重启：`systemctl reload nginx`。

------

## 💥 最后的隐藏大坑：Localhost 之谜

当我一切部署就绪，激动的打开网页点击“登录”时，控制台却飘红了：`Connection Refused`。 仔细一看请求地址：`http://localhost:8081/api/login`。

**🚨 踩坑警报 4 (新手必死)：** 我在本地开发时，把 Axios 的 BaseURL 写死了 `localhost`。 但是！**代码是在用户的浏览器里跑的**，用户的电脑上并没有 8081 端口！ **解决方法：** 把前端代码里的 `baseURL` 改成 `/api` (相对路径)，或者服务器的真实域名。重新打包，重新上传。

------

## 🎉 结语

当看到登录成功跳转到 Dashboard 的那一刻，那种成就感真的无法用语言形容。从一个本地的文件夹，变成了一个互联网上任何人都能访问的链接，这就是我们做开发的魅力所在。

这篇教程里的每一个命令，都是我这两天用报错换来的。希望我的踩坑经历，能让你的上线之路少走一点弯路！

**我的项目地址：http://linjingbiao.me** *(欢迎来测！)*
