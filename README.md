# 个人博客（Astro + Tailwind）

本项目为个人博客与作品集站点，包含文章、项目、关于我与「大学荣誉」页面。

## 本地运行

```bash
npm install
npm run dev
```

默认开发地址：`http://localhost:4321/`

## 构建与部署

```bash
npm run build
npm run preview
```

构建产物输出到 `dist/`，可直接部署到任意静态托管平台（如 Vercel/Netlify/GitHub Pages）。

## 大学荣誉（奖状自动同步）

「大学荣誉」页面来源于 `public/全部奖状` 目录中的文件，并通过脚本自动生成：\n- 结构化数据：`src/data/honors.generated.json`\n- 高清缩略图：`public/全部奖状/_thumbs`（WebP 多规格）

### 新增奖状（推荐流程）

1. 把新的奖状文件放入：
   - `public/全部奖状/校级奖状/` 或
   - `public/全部奖状/省级奖状/<分类目录>/`
2. 执行一键更新：

```bash
npm run honors:update
```

### 仅同步数据与缩略图

```bash
npm run honors:sync
```

### 校验数据完整性（可选）

```bash
npm run honors:check
```

如需让校验失败时返回非 0（用于 CI），可用：

```bash
node scripts/honors-check.mjs --strict
```

### 修正自动解析结果（issuer/时间/标题等）

自动解析基于“目录 + 文件名”推断，若个别奖状的颁发单位或时间需要修正，可在：

`src/data/honors.overrides.json`

内按相对路径（相对于 `public/全部奖状`）写入覆盖配置，例如：

```json
{
  "items": {
    "省级奖状/广西壮族自治区普通高等教育优秀大学毕业生/广西壮族自治区普通高等教育优秀大学毕业生证书奖状.jpg": {
      "issuer": "广西壮族自治区教育厅",
      "time": { "yearStart": 2024, "yearEnd": 2024, "display": "2024" }
    }
  }
}
```

修改 overrides 后重新运行：

```bash
npm run honors:sync
```

## 性能测试（Lighthouse）

先构建并启动预览（固定端口 4322）：

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4322
```

然后运行其中一个：

```bash
npm run perf:honors:desktop
npm run perf:honors:provided
```
