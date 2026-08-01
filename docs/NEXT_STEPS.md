# Next Steps

## 下一项具体任务

PKG-011 已完成。产品提交 `8fafbe9` 已推送，GitHub Actions run `30723138038` 对精确 SHA 完成 `success`。

最小 lock-only 修改保持 `package.json` 字节不变、lock records `754 → 754`，仅更新 Babel core/generator `7.29.6`、brace-expansion `1.1.18` / `5.0.9`、fast-uri `3.1.5` 与 js-yaml `4.3.1` 六条记录。完整与生产 audit 现在都只剩独立延期的 Next/PostCSS/Sharp 3 high records / 4 sources；low 与 critical 均为 0。

推荐下一项为 PKG-012：把现有 `npm run format:check` 报告的 10 个文件作为独立、纯格式化 checkpoint 处理。由于会机械重写 10 个代码/配置文件，应用前必须先经过单独批准；不得夹带语义、依赖、生成物或部署变化。Next 的 PostCSS/Sharp 继续保持独立上游等待项。

## 相关文件

- `next.config.ts`
- `src/ai/adaptation/adapt.ts`
- `src/ai/assessment/assessHand.ts`
- `src/ai/personalities/presets.ts`
- `src/engine/betting/types.ts`
- `src/engine/deck/deck.ts`
- `src/engine/evaluator/evaluator.ts`
- `src/engine/state/positions.ts`
- `tests/engine/positions.test.ts`
- `worker/index.ts`

## 验收标准

- 只有 Prettier 机械差异；无语义、import、API、依赖、lockfile、生成物或部署配置变化
- `npm run format:check` 全仓通过
- `npm run check`、必要的 Chromium/WebKit 与 production/workerd smoke 通过
- 保持 LocalStorage v2、扑克规则、用户体验、部署配置与现有接口不变
- 精确范围审查、敏感数据扫描、push 与 exact-SHA GitHub Actions 通过

## 推荐执行命令

批准 PKG-012 后，先执行精确范围的写入命令，再运行其余验证：

```bash
npx prettier --write next.config.ts src/ai/adaptation/adapt.ts src/ai/assessment/assessHand.ts src/ai/personalities/presets.ts src/engine/betting/types.ts src/engine/deck/deck.ts src/engine/evaluator/evaluator.ts src/engine/state/positions.ts tests/engine/positions.test.ts worker/index.ts
npm run format:check
npx prettier --check next.config.ts src/ai/adaptation/adapt.ts src/ai/assessment/assessHand.ts src/ai/personalities/presets.ts src/engine/betting/types.ts src/engine/deck/deck.ts src/engine/evaluator/evaluator.ts src/engine/state/positions.ts tests/engine/positions.test.ts worker/index.ts
npm run check
npm run test:e2e
npm run test:e2e:webkit
```
