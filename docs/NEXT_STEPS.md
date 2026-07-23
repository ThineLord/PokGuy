# Next Steps

## 下一项具体任务

当前 3D 视觉升级没有未完成的必需任务。下一项建议是在获得安装浏览器运行时的许可后，把本轮真实发现的“洗牌层终态、牌背纹理、公共牌揭示和结算标签”加入 Playwright WebKit 项目，覆盖 Safari 引擎的 iPhone、iPad 与 Mac 视口；随后可增加离线 PWA 外壳，让同一局域网首次加载后拥有更接近原生应用的启动体验。

## 相关文件

- `playwright.config.ts`
- `tests/e2e/core-flow.spec.ts`
- `tests/e2e/responsive.spec.ts`
- `app/globals.css`
- `src/features/app/PokerTrainer.tsx`
- `TESTING.md`
- `app/layout.tsx`
- `public/`

## 验收标准

- WebKit 下核心流程、LocalStorage 持久化和导出通过
- iPhone / iPad 安全区无控件遮挡、无横向溢出
- Mac Safari 下键盘快捷键和下注输入互不干扰
- 动画开启/关闭、reduced-motion 与三套牌背均不改变游戏状态
- PWA 缓存不缓存或同步用户牌局到外部服务
- 现有 60 项单元测试和 8 项 Chromium E2E 继续通过

## 推荐执行命令

```bash
npm run check
npm run test:e2e
npx playwright install webkit
npx playwright test --project=webkit
```
