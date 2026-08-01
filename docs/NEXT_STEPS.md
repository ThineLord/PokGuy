# Next Steps

## 下一项具体任务

Phase 8.2 已完成精选 Playwright WebKit 自动化矩阵：默认 13 项 Chromium 回归保持不变，7 项 WebKit 流程覆盖复盘与刷新、设置持久化和导出、非法盲注恢复、响应式布局、摊牌区域及键盘/输入边界。下一项 P2 是建立不需要 secrets 或部署权限的最小 GitHub Actions 质量门禁。Review Lab v1.1 的决策快照仍需独立设计 v3 迁移，不能与 CI 工作混合。

## 相关文件

- `.github/workflows/`
- `package.json`
- `package-lock.json`
- `TESTING.md`
- `.codex/TASK_QUEUE.md`
- `.codex/CURRENT_STATE.md`

## 验收标准

- pull request 和 `main` push 会运行一个最小、可重复的质量工作流
- CI 使用与项目兼容的 Node 版本和 `npm ci`，不改动锁文件
- `npm run check` 在干净安装后通过，失败会阻止质量门禁成功
- 工作流不读取 secrets，不获得部署或写仓库权限
- 本地现有 112 项单元测试、13 项 Chromium E2E 和 7 项 WebKit E2E 继续通过
- 浏览器二进制下载与 E2E 是否进入 CI 必须按运行成本单独决定；首个工作流不应无意中放大范围

## 推荐执行命令

```bash
npm run check
npm run test:e2e
npm run test:e2e:webkit
```
