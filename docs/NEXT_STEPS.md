# Next Steps

## 下一项具体任务

当前单手结束、正式分池和现金桌延续修复没有未完成的必需任务。下一项建议仍是补充 Playwright WebKit 自动化矩阵。若要继续“全面对标锦标赛”，必须作为独立模式实现 tournament state machine：盲注级别、ante、淘汰与座位关闭、多桌平衡/破桌、hand-for-hand、重入规则、暂停和名次，而不能把现金桌的手动重新买入复用为锦标赛流程。

## 相关文件

- `playwright.config.ts`
- `tests/e2e/core-flow.spec.ts`
- `tests/e2e/responsive.spec.ts`
- `app/globals.css`
- `src/features/app/PokerTrainer.tsx`
- `TESTING.md`
- `app/layout.tsx`
- `public/`
- `src/engine/state/cashTable.ts`
- `docs/TOURNAMENT_RULES_ALIGNMENT.md`

## 验收标准

- WebKit 下核心流程、LocalStorage 持久化和导出通过
- iPhone / iPad 安全区无控件遮挡、无横向溢出
- Mac Safari 下键盘快捷键和下注输入互不干扰
- 动画开启/关闭、reduced-motion 与三套牌背均不改变游戏状态
- 正式摊牌比较区在 Safari/WebKit 中始终可见，主池/边池与退回筹码标签正确
- 弃牌动画结束后牌局继续推进，用户弃牌后的 AI 旁观流程不会长时间停滞
- PWA 缓存不缓存或同步用户牌局到外部服务
- 现有 80 项单元测试和 11 项 Chromium E2E 继续通过
- 锦标赛模式（若启动）必须与现金桌状态隔离，并覆盖最后一名持有全部流通筹码时才结束赛事

## 推荐执行命令

```bash
npm run check
npm run test:e2e
npx playwright install webkit
npx playwright test --project=webkit
```
