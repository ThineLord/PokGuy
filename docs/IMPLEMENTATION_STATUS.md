# Implementation Status

## 当前状态

- 当前阶段：Phase 1 — 项目骨架
- 可运行状态：开发服务器可启动；产品功能尚未接入
- 当前分支：`main`
- 当前稳定提交：将在 Phase 1 验证后写入

## 已完成模块

- React 19 + TypeScript 5 + Vite/vinext 项目基线
- Tailwind CSS 4
- ESLint、Prettier、Vitest、Testing Library、Playwright 配置
- `lint`、`typecheck`、`test`、`test:e2e`、`build`、`check` 命令

## 已通过测试

- 待 Phase 1 验证后更新

## 已知问题

- 核心规则引擎、AI 和产品页面尚待实现

## 重要架构决定

- 第一版无后端，所有持久化仅使用版本化 LocalStorage
- 核心扑克规则使用纯 TypeScript 函数，与 React UI 解耦
- 单一权威牌局状态；所有用户和 AI 动作经过统一验证器
- 随机源可注入 seed，以便测试与复现
