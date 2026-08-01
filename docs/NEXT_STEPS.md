# Next Steps

## 下一项具体任务

Phase 8.7 已完成。PKG-011 审批 checkpoint `6f3f4d0` / GitHub Actions run `30720162214` 也已精确验证；随后已收到明确批准并在本地应用六记录 lock-only 候选。

最小候选保持 `package.json` 字节不变、lock records `754 → 754`，仅更新 Babel core/generator `7.29.6`、brace-expansion `1.1.18` / `5.0.9`、fast-uri `3.1.5` 与 js-yaml `4.3.1` 六条记录。无新增/删除包、无镜像 URL、无 Next/React/Vite/vinext/Cloudflare 漂移；冷安装、依赖图、完整审计、lint、类型检查、112 项单元测试和 build 均通过。完整审计候选只剩独立延期的 Next/PostCSS/Sharp 3 records / 4 sources。

仓库冷安装、clean dependency graph、完整/生产 audit、112 项单元测试与 build、13 项 Chromium、7 项 WebKit、production/workerd HTML/RSC/SVG、产物约束、格式/范围/安全检查均通过。当前下一步是发布产品 checkpoint 并要求 exact-SHA CI；成功后再写入最终完成状态。Next 的 PostCSS/Sharp 仍保持独立上游等待项。

## 相关文件

- `package.json`
- `package-lock.json`
- 六条已验证的 Babel、brace-expansion、fast-uri 与 js-yaml lock records
- `.github/workflows/quality.yml`（只验证 Node 22 clean-install 路径）
- `.codex/TASK_QUEUE.md`
- `.codex/CURRENT_STATE.md`

## 验收标准

- 保持已获得的明确批准和已验证 Git/远端基线证据
- 保持 `package.json` 不变，lockfile 只改变已验证的六条记录且 hash 匹配
- 对比 production 与 complete audit 的 advisory-level 变化；预期 complete audit 只剩 Next/PostCSS/Sharp 3 records / 4 sources
- 不把 PostCSS/Sharp、Next、React 或 preview/canary 版本混入同一提交
- 冷缓存 `npm ci`、112 项单元测试、13 项 Chromium E2E、7 项 WebKit E2E、production/workerd smoke 与精确 SHA GitHub Actions 全部通过
- 保持 LocalStorage v2、扑克规则、用户体验、部署配置与现有接口不变
- 产品 checkpoint 与最终状态 checkpoint 都必须 push 并通过各自 exact-SHA CI 后才能标记 DONE

## 推荐执行命令

```bash
npm audit --json --registry=https://registry.npmjs.org
npm audit --omit=dev --json --registry=https://registry.npmjs.org
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
