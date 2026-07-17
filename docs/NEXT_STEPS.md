# Next Steps

## 下一项具体任务

实现 Phase 2 核心规则引擎：牌、牌堆、最佳五张评估、动作验证、下注轮、主池与边池、摊牌。

## 相关文件

- `src/engine/cards/`
- `src/engine/deck/`
- `src/engine/evaluator/`
- `src/engine/betting/`
- `src/engine/pots/`
- `src/engine/showdown/`
- `src/engine/state/`
- `tests/engine/`

## 验收标准

- 牌型、比较、A2345、公共牌成牌测试通过
- 单/多边池、平分、奇数筹码、弃牌资格测试通过
- 非法动作、最小加注、短码 all-in 重新开放规则测试通过
- heads-up 与多人行动顺序、按钮轮转测试通过

## 推荐执行命令

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```
