# Next Steps

## 下一项具体任务

PKG-013 已完成。产品提交 `0cb96bc` 已推送，GitHub Actions run `30742915491` 对精确 SHA 完成 `success`。

Canonical `npm run check` 现在先执行只读全仓 `format:check`，随后保持 lint、strict typecheck、112 项 Vitest 与 production build 的原有顺序。README/TESTING、package/lock/workflow/runtime 边界、13 项 Chromium、7 项 WebKit、范围/安全与远端 CI 均已验证。

推荐下一项为 PKG-014：把现有完整 13 项 Chromium E2E 作为独立、只读、依赖核心质量 job 的 GitHub Actions 门禁。当前浏览器回归只在本地执行，干净 Linux runner 尚不能自动捕获浏览器编排、持久化与响应式流程回归。

该任务会修改 CI 配置并增加每次 push / pull request 的 Chromium 与系统依赖下载、运行时间和潜在 flake 成本，因此必须单独批准。WebKit、依赖、package/lock、产品、Playwright 测试/config、artifact 上传、secrets、部署、workflow 权限/events 和 branch protection 均保持在范围外。Next 的 PostCSS/Sharp 继续作为独立上游等待项。

## 相关文件

- `.github/workflows/ci.yml`
- `README.md`
- `TESTING.md`
- `.codex/TASK_QUEUE.md`
- `.codex/CURRENT_STATE.md`

## 验收标准

- 现有 Node 22 core quality job 保持不变并成功
- 新 job 使用 Ubuntu 24.04、Node `22.x`、干净 `npm ci`，只安装 Chromium 后运行 `npm run test:e2e`
- 13/13 Chromium 在 clean runner 通过；WebKit 继续作为本地门禁
- lockfile、依赖、产品、权限、events、hosting 与部署均无变化
- 两个 job 对同一个精确提交 SHA 均为 `completed/success`

## 推荐执行命令

批准 PKG-014 后，先核对 workflow 与浏览器边界，再修改并验证：

```bash
npm run check
npm run test:e2e
npm run test:e2e:webkit
git diff --check
```
