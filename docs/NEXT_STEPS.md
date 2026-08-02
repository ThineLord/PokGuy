# Next Steps

## 下一项具体任务

PKG-012 已完成。产品提交 `50af427` 已推送，GitHub Actions run `30741440606` 对精确 SHA 完成 `success`。

Prettier `3.9.5` 只重写获批的 10 个 TypeScript/config/test 文件。确定性 formatter、规范化 TS/JS AST、受保护哈希、112 项测试/build、13 项 Chromium、7 项 WebKit、production/workerd、范围/安全与精确 SHA CI 均通过；`npm run format:check` 现在全仓为绿色。

推荐下一项为 PKG-013：把已经转绿的 `npm run format:check` 加入 canonical `npm run check` 顺序，让本地与 GitHub Quality 阻止新的格式回归。该任务会改变 `package.json` 的质量命令合同，应用前必须单独批准；不得改变 lockfile、依赖、产品、存储、hosting、部署或 workflow 权限。Next 的 PostCSS/Sharp 继续保持独立上游等待项。

## 相关文件

- `package.json`
- `README.md`
- `TESTING.md`
- `.codex/TASK_QUEUE.md`
- `.codex/CURRENT_STATE.md`

## 验收标准

- `npm run check` 在保留 lint、strict typecheck、Vitest 与 production build 的同时新增 fail-fast 全仓格式检查
- `package-lock.json` 保持字节不变，不改变依赖或 workflow 权限
- README/TESTING 的命令顺序与真实脚本一致
- 精确范围审查、敏感数据扫描、push 与 exact-SHA GitHub Actions 通过

## 推荐执行命令

批准 PKG-013 后，先核对脚本边界，再运行验证：

```bash
npm pkg get scripts.check scripts.format:check
npm run format:check
npm run check
git diff --check
```
