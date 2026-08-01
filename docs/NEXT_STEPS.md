# Next Steps

## 下一项具体任务

Phase 8.6 已把 Vite 从 `8.0.13` 最小升级到首个修复两条直接公告的 `8.0.16`。隔离候选、冷安装、peer 与精确 lock 边界、112 项单元测试、13 项 Chromium、7 项 WebKit、production smoke、Cloudflare workerd preview、deploy dry-run 与精确 SHA GitHub Actions run `30716519172` 均通过。

下一项 P1 是 PKG-010：单独审计 `@cloudflare/vite-plugin` `1.37.1`、Wrangler `4.92.0`、Miniflare 与 workerd 的完整公告/peer/部署边界，并把官方当前稳定候选放入隔离目录比较。只有在构建产物、真实 workerd preview 和无上传 deploy dry-run 均兼容时才更新；Next 的 PostCSS/Sharp 仍保持独立上游等待项。

## 相关文件

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `vitest.config.ts`
- `worker/`
- `tests/`
- `.openai/hosting.json`（只验证，不改变部署资源）
- `.codex/TASK_QUEUE.md`
- `.codex/CURRENT_STATE.md`

## 验收标准

- 以 Cloudflare、Wrangler 与 npm 官方元数据确认每条公告、修复版本、Node 要求和全部 direct peer 约束
- 先在隔离目录生成候选并证明 lockfile 变化边界；不把 Next、React 或其他产品依赖隐式混入
- 对比 production 与 complete audit 的 advisory-level 变化，不用 package-level 汇总冒充漏洞清零
- 不把 PostCSS/Sharp、Next、React 或 preview/canary 版本混入同一提交
- 冷缓存 `npm ci`、112 项单元测试、13 项 Chromium E2E、7 项 WebKit E2E、production build/smoke、workerd preview、无上传 deploy dry-run 与精确 SHA GitHub Actions 全部通过
- 保持 LocalStorage v2、扑克规则、用户体验、部署配置与现有接口不变

## 推荐执行命令

```bash
npm audit --json
npm view @cloudflare/vite-plugin versions --json
npm view @cloudflare/vite-plugin peerDependencies --json
npm view wrangler versions --json
npm ls @cloudflare/vite-plugin wrangler miniflare vite
npm ci
npm run check
npm run test:e2e
npm run test:e2e:webkit
npx wrangler deploy --dry-run --experimental-autoconfig=false
```
