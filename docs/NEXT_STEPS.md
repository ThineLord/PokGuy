# Next Steps

## 下一项具体任务

Phase 8.7 已把 Cloudflare Vite plugin、Wrangler 与 Workers types 最小升级到 `1.47.0`、`4.114.0` 与 `5.20260722.1`，并显式保持既有 Worker compatibility date `2026-05-15`。隔离/仓库冷安装、peer、112 项单元测试、13 项 Chromium、7 项 WebKit、production/workerd、产物约束与无上传 strict deploy dry-run 均通过；远端精确 SHA CI 待产品提交后确认。

PKG-010 的无上传部署回归命令为 `npx wrangler deploy --dry-run --strict --autoconfig=false`；不得省略 `--dry-run` 或在自动维护中执行真实上传。

下一项建议是 PKG-011：把完整审计剩余的 `@babel/core`、`brace-expansion`、`fast-uri` 与 `js-yaml` 开发工具链逐条映射到直接依赖和实际构建路径，优先采用稳定上游版本，不用 override 或宽泛 `npm audit fix`。Next 的 PostCSS/Sharp 仍保持独立上游等待项。

## 相关文件

- `package.json`
- `package-lock.json`
- ESLint、Babel、Webpack 与 JSON-schema 相关 lock records
- `.github/workflows/quality.yml`（只验证 Node 22 clean-install 路径）
- `.codex/TASK_QUEUE.md`
- `.codex/CURRENT_STATE.md`

## 验收标准

- 以 npm 公告和直接依赖官方发布记录确认每条剩余开发工具链来源、修复版本、Node 要求和 peer 约束
- 先在隔离目录生成候选并证明 lockfile 变化边界；不把 Next、React、Vite 或 Cloudflare 版本隐式混入
- 对比 production 与 complete audit 的 advisory-level 变化，不用 package-level 汇总冒充漏洞清零
- 不把 PostCSS/Sharp、Next、React 或 preview/canary 版本混入同一提交
- 冷缓存 `npm ci`、112 项单元测试、13 项 Chromium E2E、7 项 WebKit E2E、production/workerd smoke 与精确 SHA GitHub Actions 全部通过
- 保持 LocalStorage v2、扑克规则、用户体验、部署配置与现有接口不变

## 推荐执行命令

```bash
npm audit --json
npm ls @babel/core brace-expansion fast-uri js-yaml
npm explain @babel/core
npm explain brace-expansion
npm explain fast-uri
npm explain js-yaml
npm ci
npm run check
npm run test:e2e
npm run test:e2e:webkit
```
