# Next Steps

## 下一项具体任务

第一版没有未完成的必需任务。下一项可选增强是把 Monte Carlo 分批计算迁移到 Web Worker，并加入按公共牌/人数缓存。

## 相关文件

- `src/ai/equity/monteCarlo.ts`
- `src/workers/`
- `src/ai/assessment/assessHand.ts`
- `tests/ai/ai.test.ts`

## 验收标准

- 主线程决策期间保持可交互
- 相同输入与 seed 仍可复现
- Worker 不接收对手隐藏底牌
- 现有 52 项测试和 4 项 E2E 继续通过

## 推荐执行命令

```bash
npm run check
npm run test:e2e
```
