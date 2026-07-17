# Implementation Status

## 当前状态

- 当前阶段：Phase 2 已完成，准备进入 Phase 3–4
- 可运行状态：开发服务器和规则引擎可运行；可视牌桌尚待接入
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

## 已通过测试

- 39 项 Vitest 测试通过
- ESLint 通过
- TypeScript strict typecheck 通过
- vinext/Vite production build 通过

## 已知问题

- AI、产品页面、持久化、复盘与统计尚待实现

## 重要架构决定

- 第一版无后端，所有持久化仅使用版本化 LocalStorage
- 核心扑克规则使用纯 TypeScript 函数，与 React UI 解耦
- 单一权威牌局状态；所有用户和 AI 动作经过统一验证器
- 随机源可注入 seed，以便测试与复现
