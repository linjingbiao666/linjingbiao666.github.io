---
title: '在线问卷调查系统'
description: '基于 Vue3 + Spring Boot 的前后端分离问卷系统，支持自定义问卷设计与数据分析。'
pubDate: '2026-01-01'
tags: ['Vue3', 'Spring Boot', 'Nginx', 'MySQL', 'Linux']
image: ''
---

## 项目概述
这是一个基于 **Vue3** 和 **Spring Boot** 的前后端分离在线问卷调查系统，也是我的毕业设计项目。该系统允许用户创建自定义问卷，分发问卷链接，并实时查看数据统计分析。

## 核心功能
- **可视化问卷设计**：支持拖拽式添加题目（单选、多选、填空等）。
- **实时数据分析**：后台通过 ECharts 展示问卷回收数据的统计图表。
- **用户权限管理**：基于 JWT 的用户认证与权限控制。
- **响应式设计**：前端适配桌面端与移动端访问。

## 技术栈
- **前端**: Vue 3, Element Plus, ECharts, Axios
- **后端**: Spring Boot, MyBatis-Plus, Spring Security, JWT
- **数据库**: MySQL 8.0
- **部署**: Nginx, Docker, Linux (DigitalOcean)

## 部署经历
该项目已成功部署在 DigitalOcean 的新加坡节点服务器上。使用了 Nginx 进行反向代理，解决了前后端分离带来的跨域问题 (CORS) 和 404 路由问题。详细的部署过程记录在我的博客文章[《从踩坑到白嫖：我是如何把全栈项目部署上线的？》](/blog/deploy-fullstack-project-github-student-pack)中。
