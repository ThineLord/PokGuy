# Changelog

## Unreleased — 2026-07-17

### Improved

- 重构响应式尺寸策略，使牌桌按可用视口高度收缩，消除 Mac 与 iPad 横屏中的操作栏覆盖；
- iPhone 导航改为单行紧凑标签，信息条支持横向滑动，轮到用户时自动定位到完整操作区；
- 动作按钮提升到 48px 高，加入 iOS 安全区、动态视口和防输入缩放支持；
- Mac 新增 `F/K/C/R/A` 动作快捷键与可见键帽提示；
- 新增 `npm run dev:lan`，可从同一可信 Wi-Fi 的 iPhone / iPad 访问；
- 新增 3 项跨设备 Playwright 回归，E2E 总数增至 7 项。

## 0.1.0 — 2026-07-17

### Added

- React、TypeScript、Vite/vinext、Tailwind、Vitest、Testing Library、Playwright、ESLint 和 Prettier 基线；
- 完整第一版德州扑克规则引擎、边池与摊牌；
- 2–6 人标准现金桌与单手牌训练；
- 8 种可编辑 AI 人格、Monte Carlo、决策标签、习惯统计和受限适应；
- 响应式深色牌桌、下注快捷尺度、非法动作反馈和训练提示；
- LocalStorage v2、最近 100 手、逐步复盘、玩家笔记、训练记录和统计；
- 设置与牌局 JSON 导入导出；
- 核心单元、组件和 Chromium E2E 测试；
- 架构、规则、AI、测试和断点恢复文档。

### Safety

- 无真钱、充值、提款、真人匹配、远程牌局或赌场品牌素材；
- AI 观察接口不接收其他玩家未公开底牌；
- 所有持久化仅限当前浏览器 LocalStorage。
