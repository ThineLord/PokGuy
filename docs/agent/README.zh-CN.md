# PokGuy Agent README

[English](README.md) · [简体中文](README.zh-CN.md) · [Agent 指令](../../AGENTS.md)

## 分工与工作流程

Codex 负责组织任务、实施和仓库管理。独立 subagents 负责 review 与已授权的合并。不调用 bots、Cursor bridge 或外部 Agent 服务；使用常规 CI 完成验证。

1. 阅读当前用户指令、`AGENTS.md`、`package.json`、[当前发布说明](../releases/0.3.1.zh-CN.md)和 `git status`。检查远端 main 与已有 PR，保留无关工作。
2. 从最新 main 创建 `codex/` 分支，需要时使用隔离 worktree 或 clone。建立 draft PR，写清具体范围与验证。
3. 完成最小而完整的修改。保持中英文 README 内容一致；设计、用户、发布与历史资料放入规定目录。
4. 执行[开发门禁](../development/README.md)。将精确候选 SHA 和 diff 交给独立 review subagent；修复实质问题后，对新的 SHA 再次审查。
5. 由另一名 merge subagent 核对审查 SHA、目标分支、必要 CI、未解决问题和合并授权。将 PR 标为 ready 后合并，不绕过仓库保护。同账号技术审查不等于 GitHub APPROVED。
6. 用户要求发布时，按[发布流程](../releases/README.md)核对合并提交、标签和已发布 Release，再报告结果。

每项任务按当前用户授权核对执行范围；仓库规范不自动授予合并、发布或部署权限。

## 文件归属

| 位置                 | 用途                                 |
| -------------------- | ------------------------------------ |
| 根目录 README        | 简洁简介与入口                       |
| `docs/user/`         | 中英文用户 README                    |
| `docs/agent/`        | 中英文 Agent README                  |
| `docs/architecture/` | 引擎、AI 与规则约定                  |
| `docs/development/`  | 环境与验证命令                       |
| `docs/releases/`     | 发布流程与逐版本说明                 |
| `docs/archive/`      | 固定版本历史记录索引，不作为当前指令 |
| `src/`、`tests/`     | 运行代码与回归测试                   |
| `scripts/`           | 仓库校验工具                         |

框架配置留在工具要求的根目录。构建产物、测试输出、本地导出和临时文件应被忽略；不要为清空工作区而删除用户文件。

## 核心约定与发布边界

应用版本与持久化格式相互独立。除非任务包含单独设计的数据迁移，否则保留 `riverlab-poker-v2`、数据格式 `2` 与现有偏好键。AI 观察数据不得暴露对手暗牌；下注、结算与边池必须保持筹码守恒。

修改文档或版本后执行 `npm run release:check`，核对版本、必要发布文档和本地 Markdown 文件链接。`npm run check` 已包含此项，继续作为核心门禁；精确候选提交还必须通过完整 Chromium CI。

GitHub Release 发布源码，不证明线上部署已验证。未获任务授权时，不修改托管、凭据、绑定或付费服务。旧依赖／Worker 候选 PR [#2](https://github.com/ThineLord/PokGuy/pull/2) 已由合并的 PR [#4](https://github.com/ThineLord/PokGuy/pull/4) 取代。
