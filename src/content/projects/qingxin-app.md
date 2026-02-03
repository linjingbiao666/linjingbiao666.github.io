---
title: '清心悦耳App'
description: '全栈移动应用解决方案，包含RESTful API后端、数据库优化及跨平台前端。'
pubDate: '2023-06-01'
tags: ['Spring Boot', 'MyBatis-Plus', 'MySQL', 'Uni-App', 'Vue']
repoUrl: 'https://gitee.com/ljb999/uni-app.git'
image: ''
---

## 项目概述
独立全栈开发 "清心悦耳App"。负责从设计到部署的整个生命周期。

## 核心技术成就
- **后端架构**: 使用 **Spring Boot** 和 **MyBatis-Plus** 设计并实现了认证、资源查询和收藏功能。
- **数据库优化**: 设计了6张核心表，并通过建立复合索引 (`user_id`, `resource_id`) 优化慢查询，将查询延迟从 **200ms 降低至 50ms**。
- **前端开发**: 使用 **Uni-App** 构建移动端应用（涵盖首页、详情页、互动模块），并使用 **Vue + Element-UI** 开发管理后台。

## 技术栈
- **后端**: Spring Boot, MyBatis-Plus, MySQL
- **前端**: Uni-App, Vue.js, Element-UI
