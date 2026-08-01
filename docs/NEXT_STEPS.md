# Next Steps

## 下一项具体任务

Phase 8.3 已完成首个 GitHub Actions 质量门禁：官方 Actions 固定到不可变 SHA，token 仅可读取仓库内容，Node `22.x` 会执行 `npm ci` 与 `npm run check`；首次干净 Linux run 已完成且成功。下一项 P2 是审计 `package-lock.json` 中混合的 npmjs.org / npmmirror.com 下载来源，并在不改变版本、integrity 或依赖图的前提下决定是否规范化。若执行规范化会重写锁文件，因此必须单独经过配置/依赖安全检查点。

## 相关文件

- `package-lock.json`
- `package.json`
- 用户级与项目级 npm registry 配置（只读审计，不提交本机配置）
- `.github/workflows/ci.yml`
- `TESTING.md`
- `.codex/TASK_QUEUE.md`
- `.codex/CURRENT_STATE.md`

## 验收标准

- 解释 98 个 npmmirror.com 与 619 个 npmjs.org `resolved` 条目的来源，不把首次 CI 成功误当成来源一致性证明
- 若规范化，所有包版本、integrity、依赖关系和 lockfile v3 保持不变，只允许必要的 `resolved` 来源差异
- 不把本机 npm registry、代理、凭据或绝对路径写入仓库
- 在隔离干净安装和 GitHub Actions 中验证 `npm ci` 与 `npm run check`
- 本地 112 项单元测试、13 项 Chromium E2E 和 7 项 WebKit E2E 继续通过
- 若无法证明机械改写安全，记录审计结论并保持锁文件不变

## 推荐执行命令

```bash
npm config get registry
git diff -- package-lock.json
npm ci
npm run check
```
