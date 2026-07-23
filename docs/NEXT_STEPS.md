# Next Steps

## 下一项具体任务

当前弃牌动画与正式摊牌修复没有未完成的必需任务。下一项建议是在获得安装浏览器运行时的许可后，把本轮真实发现的“核心内容不可依赖透明度动画、弃牌飞行动画、最佳五张比较、无人跟注返还和下注精度”加入 Playwright WebKit 项目，覆盖 Safari 引擎的 iPhone、iPad 与 Mac 视口；随后可增加离线 PWA 外壳，让同一局域网首次加载后拥有更接近原生应用的启动体验。

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
- 正式摊牌比较区在 Safari/WebKit 中始终可见，主池/边池与退回筹码标签正确
- 弃牌动画结束后牌局继续推进，用户弃牌后的 AI 旁观流程不会长时间停滞
- PWA 缓存不缓存或同步用户牌局到外部服务
- 现有 70 项单元测试和 11 项 Chromium E2E 继续通过

## 推荐执行命令

```bash
npm run check
npm run test:e2e
npx playwright install webkit
npx playwright test --project=webkit
```
