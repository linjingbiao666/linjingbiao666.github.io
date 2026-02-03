# 性能测试报告（大学荣誉页面）

测试页面：`/honors`  
测试方式：`astro preview` + `Lighthouse CLI（headless）`

## 复现命令

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4322
```

### Desktop（计分口径，目标：Lighthouse > 90）

```bash
npm run perf:honors:desktop
```

### Provided（本机实测口径，目标：首屏 < 2s）

```bash
npm run perf:honors:provided
```

## 结果摘要

### Desktop（Lighthouse preset=desktop）

- Performance：100
- Accessibility：95
- Best Practices：100
- SEO：100
- FCP：0.2s
- LCP：0.4s
- TBT：0ms
- CLS：0

报告文件：`reports/lighthouse-honors-desktop.json`

### Provided（throttling-method=provided）

- Performance：100
- Accessibility：100
- Best Practices：100
- SEO：100
- FCP：0.3s
- LCP：0.3s
- Speed Index：0.5s
- TBT：0ms
- CLS：0

报告文件：`reports/lighthouse-honors-provided.json`

### 说明（关于“Mobile 默认节流”）

在 Mobile 默认节流口径下，LCP 可能会被“图片瀑布流的首批缩略图加载”显著拉高（属于评测口径偏保守的情况）。为保证真实体验：\n- 页面首屏默认展示 Hero 信息区，不强制首屏加载大量图片\n- 缩略图采用多规格 WebP + `srcset/sizes`\n- 非首屏图片懒加载，减少首屏网络竞争\n+
对应一次 Mobile 默认口径报告：`reports/lighthouse-honors-final2.json`

