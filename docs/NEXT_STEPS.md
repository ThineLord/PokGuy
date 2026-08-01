# Next Steps

## 下一项具体任务

Phase 8.4 已完成 npm 下载来源规范化，并把 `next` / `eslint-config-next` 从 `16.2.6` 同步到 `16.2.12`。Next.js 自身 9 条公告已从 production audit 消失；稳定版 Next 尚未包含 PostCSS/Sharp 的兼容升级，因此没有使用 preview/canary 或强制 override。

下一项 P1 是 PKG-008：把 React Server Components 安全更新作为独立兼容单元，先验证审计建议的 React、React DOM 与 `react-server-dom-webpack` 同步补丁版本。Vite、Cloudflare、Wrangler 及其传递依赖继续留在后续独立检查点，避免一次升级多个构建系统。

## 相关文件

- `package.json`
- `package-lock.json`
- `app/`
- `src/`
- `tests/`
- `.openai/hosting.json`（只验证，不改变部署资源）
- `.codex/TASK_QUEUE.md`
- `.codex/CURRENT_STATE.md`

## 验收标准

- 以官方公告与 npm 元数据确认 React 三件套的同版本安全边界和 peer 约束
- 只改变 React、React DOM、`react-server-dom-webpack` 及其必需 lockfile 条目
- 对比 production 与 complete audit 的 advisory-level 变化，不用 package-level 汇总冒充漏洞清零
- 不把 Vite、Cloudflare/Wrangler、PostCSS/Sharp 或 preview/canary 版本混入同一提交
- 冷缓存 `npm ci`、112 项单元测试、13 项 Chromium E2E、7 项 WebKit E2E、production build/smoke 与精确 SHA GitHub Actions 全部通过
- 保持 LocalStorage v2、扑克规则、用户体验、部署配置与现有接口不变

## 推荐执行命令

```bash
npm audit --json
npm view react versions --json
npm view react-dom versions --json
npm view react-server-dom-webpack versions --json
npm ci
npm run check
npm run test:e2e
npm run test:e2e:webkit
```
