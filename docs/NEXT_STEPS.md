# Next Steps

## 下一项具体任务

实现 Phase 3–4：接入可玩牌桌、统一人类/AI 动作循环、8 类稳定 AI 个性、Monte Carlo 胜率与受限适应。

## 相关文件

- `src/features/game/`
- `src/features/table/`
- `src/features/betting/`
- `src/ai/personalities/`
- `src/ai/equity/`
- `src/ai/adaptation/`
- `src/ai/decision/`
- `tests/ai/`

## 验收标准

- 用户可完成多街行动并连续开始下一手
- 至少 8 种 AI 个性具有可观察的稳定差异
- AI 决策输入不包含其他玩家未公开底牌
- Monte Carlo 排除全部已知牌且相同 seed 可复现
- AI 自动行动不会卡住或重复提交

## 推荐执行命令

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```
