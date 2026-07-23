# Next Steps

## 下一项具体任务

当前深度实玩修复没有未完成的必需任务。下一项建议是在获得安装浏览器运行时的许可后加入 Playwright WebKit 项目，覆盖 Safari 引擎的 iPhone、iPad 与 Mac 视口；随后再为 Monte Carlo 加入按 AI 人格和公开行动加权的对手范围。

## 相关文件

- `playwright.config.ts`
- `tests/e2e/core-flow.spec.ts`
- `tests/e2e/responsive.spec.ts`
- `TESTING.md`
- `src/ai/equity/monteCarlo.ts`
- `src/ai/decision/decide.ts`

## 验收标准

- WebKit 下核心流程、LocalStorage 持久化和导出通过
- iPhone / iPad 安全区无控件遮挡、无横向溢出
- Mac Safari 下键盘快捷键和下注输入互不干扰
- 范围加权不读取真实隐藏牌，并保留 seed 可复现性
- 现有 58 项单元测试和 8 项 Chromium E2E 继续通过

## 推荐执行命令

```bash
npm run check
npm run test:e2e
npx playwright install webkit
npx playwright test --project=webkit
```
