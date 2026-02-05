---
title: 'GitHub从学生认证到部署上线的四个阶段'
description: '万字长文复盘：如何利用 GitHub 学生包白嫖服务器、域名，并将 Vue3 + Spring Boot 全栈项目部署上线的完整实战指南。'
pubDate: '2026-02-05'
tags: ['GitHub', '部署', 'Full Stack', 'DigitalOcean', '教程']
heroImage: ''
---

> **前言：** 距离 2026 年 6 月毕业还有半年，作为一名全栈方向的应届生，我深知“Talk is cheap, show me the code”。 只有把跑在本地 `localhost` 的代码，真正部署到公网服务器上，才算是一个完整的作品。
>
> 这篇文章整合了我从申请 GitHub 学生包、领取 DigitalOcean 服务器额度、购买域名，直到最终完成 Vue3 + Spring Boot 全栈部署的完整经历。我将这个过程划分为**四个阶段**，希望能为还在迷茫的同学提供一份可执行的“通关指南”。

------

## 🎓 第一阶段：薅羊毛的艺术 (GitHub 学生包)

一切的起点，都源于那个被称为“学生开发者的军火库”的 **GitHub Student Developer Pack**。

### 1. 为什么要申请？
它包含了上百种付费工具的权益。对于我们来说，最核心的三大件是：
*   **DigitalOcean 云服务器**：赠送 $200 信用额度 (有效期1年)。
*   **JetBrains 全家桶**：免费使用专业版 IDEA, WebStorm 等。
*   **Namecheap 域名**：免费一年 `.me` 顶级域名及 SSL 证书。

另外，**阿里云**也有针对学生的“高校学生免费试用”计划，我也成功领取了 **300元无门槛代金券**，不管是用来做备案测试还是跑备用服务都非常划算。

### 2. 申请避坑指南
申请地址：[https://education.github.com/pack](https://education.github.com/pack)
*   **关键点一：** **不要挂代理！** 必须用国内网络直连，否则会被检测 IP 异常直接秒拒。
*   **关键点二：** 使用 **手机摄像头** 实时拍照上传学生证或学信网报告。
*   **关键点三：** 修改 GitHub 个人资料 (Bio)，展示你的学生身份，真诚填写申请理由。

------

## ☁️ 第二阶段：第一台云主机的诞生 (DigitalOcean)

拿到 GitHub 学生包后，第一件事就是去兑换 DigitalOcean 的 **$200 额度**。

### 1. 领取与验证
在 GitHub Benefits 页面找到 DigitalOcean 点击链接进入。最惊险的一步是 **身份验证**，好消息是它支持 **支付宝 (Alipay)**！如果不方便用信用卡，用支付宝预充值 $5 验证即可。

### 2. 创建服务器 (Droplet)
面对全英文控制台，我是这样配置我的“高性价比”服务器的：
*   **Region**: 选择 **Singapore (新加坡)**，延迟相对较低，且无需备案。
*   **Image**: 选择 **Ubuntu 24.04 LTS**，社区资源丰富，适合新手。
*   **Size**: 选择 **Basic (1GB RAM / 1 CPU / 25GB SSD)**，价格 $6/月。$200 够开好几台玩一年！

当 SSH 连接成功，屏幕显示 `Welcome to Ubuntu` 时，你就拥有了互联网上的一块领地。

------

## 🛠️ 第三阶段：基建狂魔 (环境配置 & 部署准备)

服务器刚开好是毛坯房，需要我们手动装修。

### 1. 环境安装
*   **Java**: `apt install openjdk-17-jdk` (根据项目版本选)
*   **MySQL**: `apt install mysql-server` (记得配置 root 密码和远程访问权限)
*   **Nginx**: `apt install nginx` (作为反向代理服务器)

### 2. 数据迁移
使用 `scp` 命令将本地 SQL 文件上传到服务器，然后通过命令行导入数据库。
`mysql -u root -p online_survey_system < /root/db.sql`

### 3. 应用打包
*   **后端**: Maven 打包生成 `app.jar`，上传后使用 `nohup java -jar app.jar > log.txt 2>&1 &` 命令使其在后台运行。
*   **前端**: Vue 项目 `npm run build` 生成 `dist` 目录，上传到 `/var/www/html/survey`。

**🚨 避坑警报**：上传完 Vue 文件后，务必运行 `chmod -R 755 /var/www/html/survey` 赋予 Nginx 读取权限，否则会报 403 错误。

------

## 🚀 第四阶段：终极上线 (Nginx 配置与调试)

这是最考验耐心的一步，也是打通任督二脉的关键。

### 1. Nginx 配置文件 (万能模板)
编辑 `/etc/nginx/sites-available/default`：
```nginx
server {
    listen 80;
    server_name _;

    # 前端：指向 dist 目录
    location / {
        root /var/www/html/survey;
        index index.html;
        try_files $uri $uri/ /index.html; # 解决 Vue 路由 404
    }

    # 后端：反向代理到 8081
    location /api {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
    }
}
```

### 2. 解决 "Localhost之谜"
我在第一次部署时，点击登录报错 `Connection Refused`。原因是前端代码里的 `baseURL` 写死了 `localhost`。
**切记：** 前端代码是在用户浏览器运行的！必须把 `baseURL` 改为服务器的公网 IP 或域名（如 `/api` 配合 Nginx 转发）。

### 3. 域名解析
最后，去 **Namecheap** 把申请到免费域名解析到服务器 IP。配置完成后，看着浏览器地址栏里那串属于自己的域名，所有的折腾都值了！

------

## 📝 总结

从申请学生包的忐忑，到第一次 SSH 连接的兴奋，再到解决 Nginx 报错的抓狂，这四个阶段的经历比任何书本知识都深刻。我不仅省下了 1500+ 元的服务器费用，更被迫点亮了 Linux 运维技能树。

希望这篇复盘能帮到同样在校招冲刺的你。别犹豫，现在就是最好的时机，动手**Apply**, **Build**, **Deploy**!
