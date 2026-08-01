# Next Steps

## 下一项具体任务

Phase 8.7 已完成并由最终状态 commit `d3866d5` / GitHub Actions run `30719518356` 精确验证。PKG-011 随后完成了剩余 Babel、brace-expansion、fast-uri 与 js-yaml 开发工具链告警的映射和隔离候选验证，但仓库依赖文件尚未改变。

最小候选保持 `package.json` 字节不变、lock records `754 → 754`，仅更新 Babel core/generator `7.29.6`、brace-expansion `1.1.18` / `5.0.9`、fast-uri `3.1.5` 与 js-yaml `4.3.1` 六条记录。无新增/删除包、无镜像 URL、无 Next/React/Vite/vinext/Cloudflare 漂移；冷安装、依赖图、完整审计、lint、类型检查、112 项单元测试和 build 均通过。完整审计候选只剩独立延期的 Next/PostCSS/Sharp 3 records / 4 sources。

当前安全门：依赖解析变化必须先获得明确批准。批准后只应用 SHA-256 `b1ee4dec8caa44b2e8d2bbfac6e5e9c4d27a9cde75aacc56699cfd42eb25856c` 对应的六记录 lock-only 候选；任何额外漂移都应停止并重新审计。Next 的 PostCSS/Sharp 仍保持独立上游等待项。

## 相关文件

- `package.json`
- `package-lock.json`
- 六条已验证的 Babel、brace-expansion、fast-uri 与 js-yaml lock records
- `.github/workflows/quality.yml`（只验证 Node 22 clean-install 路径）
- `.codex/TASK_QUEUE.md`
- `.codex/CURRENT_STATE.md`

## 验收标准

- 获得明确的依赖变更批准，并在应用前再次确认当前 Git 与远端基线
- 保持 `package.json` 不变，lockfile 只改变已验证的六条记录且 hash 匹配
- 对比 production 与 complete audit 的 advisory-level 变化；预期 complete audit 只剩 Next/PostCSS/Sharp 3 records / 4 sources
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
npm ci --ignore-scripts
npm run check
npm run test:e2e
npm run test:e2e:webkit
```
