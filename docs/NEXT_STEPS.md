# Next Steps

## 下一项具体任务

Phase 8.5 已把 React、React DOM 与 `react-server-dom-webpack` 从 `19.2.6` 同步到 `19.2.8`。直接 RSC 高危公告已从完整 audit 消失，三件套 peer 关系、冷安装、112 项单元测试、13 项 Chromium、7 项 WebKit、production build、RSC/异常请求 smoke 与精确 SHA GitHub Actions 均通过。

下一项 P1 是 PKG-009：单独审计 Vite `8.0.13` 的两条直接公告（一条 high、一条 moderate）及官方建议的 `8.2.0` 边界，先验证 vinext、React RSC plugin、Vitest 与 Cloudflare adapter 的 peer/构建兼容，再决定是否更新。Cloudflare plugin、Wrangler、Miniflare、PostCSS/Sharp 继续保留为独立检查点，避免一次升级多个构建系统。

## 相关文件

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `vitest.config.ts`
- `tests/`
- `.openai/hosting.json`（只验证，不改变部署资源）
- `.codex/TASK_QUEUE.md`
- `.codex/CURRENT_STATE.md`

## 验收标准

- 以官方 Vite 公告与 npm 元数据确认受影响范围、修复版本和全部 direct peer 约束
- 先在隔离目录生成候选并证明 lockfile 变化边界；不把 Cloudflare plugin/Wrangler 更新隐式混入
- 对比 production 与 complete audit 的 advisory-level 变化，不用 package-level 汇总冒充漏洞清零
- 不把 Cloudflare/Wrangler、PostCSS/Sharp、React 或 preview/canary 版本混入同一提交
- 冷缓存 `npm ci`、112 项单元测试、13 项 Chromium E2E、7 项 WebKit E2E、production build/smoke 与精确 SHA GitHub Actions 全部通过
- 保持 LocalStorage v2、扑克规则、用户体验、部署配置与现有接口不变

## 推荐执行命令

```bash
npm audit --json
npm view vite versions --json
npm view vite peerDependencies --json
npm ls vite vitest vinext @vitejs/plugin-react @cloudflare/vite-plugin
npm ci
npm run check
npm run test:e2e
npm run test:e2e:webkit
```
