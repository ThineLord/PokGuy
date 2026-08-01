# Next Steps

## 下一项具体任务

Phase 8.0 已把现有训练评价接入历史回放、待复查队列和统计摘要，且没有更改 LocalStorage v2。下一项 P1 是修复无效盲注或损坏 AI 设置被持久化后可能阻止启动/下一手的问题：迁移层必须保留有效用户设置，只把非法字段恢复为安全默认值，并给出可理解提示。完成后再补充 Playwright WebKit 自动化矩阵，特别覆盖新增复盘界面。Review Lab v1.1 的决策快照需要独立设计 v3 迁移，不能与本次恢复修复混合。

## 相关文件

- `playwright.config.ts`
- `tests/e2e/core-flow.spec.ts`
- `tests/e2e/responsive.spec.ts`
- `app/globals.css`
- `src/features/app/PokerTrainer.tsx`
- `src/features/app/review.ts`
- `src/storage/types.ts`
- `src/storage/storage.ts`
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
- 复盘实验室在 WebKit 下可筛选、滚动和刷新，评价与动作不会错配
- 现有 103 项单元测试和 12 项 Chromium E2E 继续通过
- v1.1 若启动，旧 v2 数据迁移不丢失；快照不包含行动时未知的对手底牌
- 锦标赛模式（若启动）必须与现金桌状态隔离，并覆盖最后一名持有全部流通筹码时才结束赛事

## 推荐执行命令

```bash
npm run check
npm run test:e2e
npx playwright install webkit
npx playwright test --project=webkit
```
