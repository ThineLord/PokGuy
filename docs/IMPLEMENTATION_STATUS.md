# Implementation Status

## 当前状态

- 当前阶段：Phase 3–4 已完成，准备收尾 Phase 5–7
- 可运行状态：标准现金桌和单手牌场景可玩；历史、复盘、统计和设置已接入
- 当前分支：`main`
- 当前稳定提交：`e9fd98c`（Phase 1 基线）；Phase 2 提交见最新 `git log`

## 已完成模块

- React 19 + TypeScript 5 + Vite/vinext 项目基线
- Tailwind CSS 4
- ESLint、Prettier、Vitest、Testing Library、Playwright 配置
- `lint`、`typecheck`、`test`、`test:e2e`、`build`、`check` 命令
- 52 张牌、可注入 seed 的 Fisher-Yates 洗牌与发牌
- 最佳五张评估器与完整牌型/kicker 比较
- 统一动作验证器、下注轮、短码 all-in 重新开放逻辑
- heads-up / 多人盲注与行动顺序
- 主池、多个边池、平分与奇数筹码分配
- 弃牌结算、摊牌结算、自动 all-in runout 与重复结算保护
- 现代深色 2–6 人响应式牌桌与完整操作栏
- 8 种可编辑 AI 个性、受控随机、决策标签与思考速度
- 不读取隐藏牌的 Monte Carlo 胜率估算
- 版本化 LocalStorage、最近 100 手、玩家笔记和训练记录
- 逐步复盘、基础统计、设置导入导出和牌局导出

## 已通过测试

- 50 项 Vitest 测试通过
- ESLint 通过
- TypeScript strict typecheck 通过
- vinext/Vite production build 通过
- 4 项 Chromium E2E 通过
- 390×844 移动端实际截图检查通过

## 已知问题

- 精细范围加权、完整 tilt 状态和求解器级建议不在第一版范围
- 当前 UI 为单路由客户端导航；不含账户、后端或跨设备同步

## 重要架构决定

- 第一版无后端，所有持久化仅使用版本化 LocalStorage
- 核心扑克规则使用纯 TypeScript 函数，与 React UI 解耦
- 单一权威牌局状态；所有用户和 AI 动作经过统一验证器
- 随机源可注入 seed，以便测试与复现
