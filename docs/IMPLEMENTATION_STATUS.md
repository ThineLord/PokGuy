# Implementation Status

## 当前状态

- 当前阶段：Phase 7.3 macOS Safari 直接实玩与场景流程修复完成
- 可运行状态：可安装、启动、连续游戏、训练、复盘、统计、导出和可信局域网访问
- 当前分支：`main`
- 当前稳定代码提交：`60fcec5`（Safari 牌面渲染、下注输入保护和完整的单手牌场景返回流程）

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
- Mac 自适应视口牌桌与 `F/K/C/R/A` 键盘操作
- iPad 横/竖屏零覆盖布局与 iPhone 自动行动区定位
- iOS 安全区、动态视口、44px+ 触控目标与输入防缩放
- `npm run dev:lan` 同一可信 Wi-Fi 访问入口
- AI 正常 bet/raise、稳定牌面 equity、多人平局按赢家数分摊
- 完整 6-max 位置标签及随按钮轮转的位置感知
- 隐藏牌/空牌槽无伪造牌面，十点统一显示为 `10`
- Safari 启用动画时牌面正常可见，数字输入不会被动作快捷键清零
- 单手牌场景显示实际人数，支持“调整场景”“新场景”和“返回现金桌”

## 已通过测试

- 58 项 Vitest 测试通过
- ESLint 通过
- TypeScript strict typecheck 通过
- vinext/Vite production build 通过
- 8 项 Chromium E2E 通过
- 120 手种子化六人桌规则压力测试通过
- 1440×900 Mac、1194×834 与 1024×1366 iPad、390×844 与 393×852 iPhone 实际截图检查通过
- macOS Safari 直接操控完成两手现金桌、一个河牌场景和复盘流程
- iPad 信息区/操作区重叠为 0；iPhone 动作按钮实测高度 48px
- `npm run dev:lan` 绑定 `*:3000`，局域网地址 HTTP smoke 通过
- 新浏览器会话控制台无产品错误

## 已知问题

- 精细范围加权、完整 tilt 状态和求解器级建议不在第一版范围
- 当前 Monte Carlo 对未知对手牌采用均匀随机范围，不代表某个具体 AI 的加权持牌范围
- 当前 UI 为单路由客户端导航；不含账户、后端或跨设备同步
- Playwright WebKit 浏览器二进制尚未安装；Safari 已直接实玩验证，但尚未纳入自动化矩阵

## 重要架构决定

- 第一版无后端，所有持久化仅使用版本化 LocalStorage
- 核心扑克规则使用纯 TypeScript 函数，与 React UI 解耦
- 单一权威牌局状态；所有用户和 AI 动作经过统一验证器
- 随机源可注入 seed，以便测试与复现

## 恢复命令

```bash
cd "/Users/hanzhiyou/Documents/New project"
npm install
npm run check
npm run dev
```

同一可信 Wi-Fi 的移动设备访问：

```bash
npm run dev:lan
```

## 目录说明

- 实际项目仓库仍位于 `/Users/hanzhiyou/Documents/New project`。
- `/Users/hanzhiyou/Documents/PokGuy` 于本轮开始时是一个无提交、无项目文件的空 Git 仓库；本轮没有擅自移动或覆盖两个仓库。
