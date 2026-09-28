# Next Steps

> 2026-09-28 交互式测试修复已通过干净 Node 22 本地门禁；发布建议为 **RELEASE WITH DOCUMENTED LIMITATIONS**。精确提交仍以 GitHub Actions Node 22 Quality 和依赖 Chromium job 为远端门禁。门禁通过后回到维护模式，无主动开发任务。托管部署和实体 iPhone/iPad 未复验。见 [CURRENT_STATE.md](../.codex/CURRENT_STATE.md) 与 [交互式测试记录](interactive_playtest_2026-09-28.md)。下方 PKG-014/PKG-015、13/7 浏览器数及 Next 16.2.12 均为历史维护提案/检查点，不是当前发布门禁或依赖状态。

## 当前下一步

完成本次 P2 修复的精确提交远端 CI 验证后，进入维护模式。没有排期中的下一项产品开发。若今后要宣称实体移动设备支持，应单独验证 iPhone/iPad；托管发布、持久化增强和工具链升级均需另行确定范围。现有限制见 [CURRENT_STATE.md](../.codex/CURRENT_STATE.md)。

## 历史 PKG-015 提案（非当前发布任务）

PKG-014 已完成。产品提交 `58280a9` 已推送，GitHub Actions run `30743841409` 对精确 SHA 的核心质量与依赖 Chromium E2E 两个 job 均为 `completed/success`；13/13 浏览器测试通过。

推荐下一项为 PKG-015：只在 Chromium CI 非取消失败时，上传 Playwright 已生成的 `test-results/` 失败 trace，并使用短期显式保留。当前 runner 会生成 `retain-on-failure` trace，但 job 结束后不会保留，远程 CI 失败因此缺少可下载的浏览器诊断材料。

该任务会修改 CI 配置、引入一个固定 SHA 的官方 artifact action，并把渲染后的本地游戏状态作为短期 GitHub artifact 保存，因此必须单独批准供应链、隐私、存储与运行成本边界。成功运行、WebKit、依赖、package/lock、产品、Playwright 测试/config、secrets、部署、workflow 权限/events 和 branch protection 均保持在范围外。Next 的 PostCSS/Sharp 继续作为独立上游等待项。

## 相关文件

- `.github/workflows/ci.yml`
- `README.md`
- `TESTING.md`
- `.codex/TASK_QUEUE.md`
- `.codex/CURRENT_STATE.md`

## 验收标准

- 两个现有 job 及其执行顺序保持不变
- 仅在 Chromium job 非取消失败时上传 `test-results/`
- 官方 upload action 固定到完整 commit SHA，并设置短期显式 retention
- 成功运行不产生 artifact；trace 不包含 secrets 或真实用户数据
- lockfile、依赖、产品、测试/config、权限、events、hosting 与部署均无变化
- 两个 job 对同一个精确提交 SHA 均为 `completed/success`

## 推荐执行命令

批准 PKG-015 后，先核对官方 action、失败条件、trace 内容与存储边界，再修改并验证：

```bash
npm run check
npm run test:e2e
npm run test:e2e:webkit
git diff --check
```
