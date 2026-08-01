# RiverLab Poker Trainer

RiverLab 是一个完全在浏览器本地运行的单机德州扑克训练应用。它面向个人练习和复盘，不包含真钱、充值、提款、真人匹配或在线赌场功能。

## 功能

- 2–6 人无上限德州扑克现金桌，默认 6-max、100BB、0.5/1BB；
- 完整 fold、check、call、bet、raise、all-in 与合法尺度验证；
- heads-up 特殊顺序、大盲 option、完整/不足完整加注、多人 all-in、主池、多个边池和无人跟注筹码退回；
- 参照 TDA/WSOP 的单手结束边界，明确区分弃牌获胜、河牌摊牌与 all-in runout，并在筹码完全支付后才允许下一手；
- 最佳五张牌评估、公共牌成牌、A2345、全部标准牌型、多人平局和奇数筹码，并在摊牌后逐人展示比较依据；
- TAG、LAG、Rock、Calling Station、Recreational、Maniac、Grinder、Trapper 八种稳定 AI；
- AI 个性编辑、实际习惯统计、受限用户适应和不读取隐藏牌的 Monte Carlo 胜率估算；
- 稳定的同牌面胜率 seed、多人平局 equity 分摊，以及 120 手种子化规则压力验证；
- 小数筹码余额带精度归零保护，避免 0 BB 玩家因浮点残量重新进入行动队列；
- 单手牌训练：指定或随机底牌、位置、有效筹码、对手数、公共牌与起始街；
- 底池赔率、粗略胜率、outs、建议动作/尺度和危险牌面提示均可独立开关；
- 最近 100 手牌局、逐步/自动复盘、AI 决策摘要、玩家笔记和训练评价；
- 复盘实验室逐项展示 Hero 决策评价，支持“全部 / 待复查”队列、手牌标记和训练反馈统计；
- 盈亏、BB/100、VPIP、PFR、3-bet、c-bet、摊牌及位置统计；
- 设置与牌局 JSON 导入/导出，全部数据保存在版本化 LocalStorage；
- 具有桌沿厚度、亚麻桌布、纸张纹理、筹码层次和克制光影的 3D 深色牌桌；
- 洗牌/发牌、翻牌成组揭示、转牌/河牌揭示、下注、弃牌与底池结算短动画，支持三档速度、关闭动画和 reduced-motion；
- 三套原创写实牌背（深海流纹、酒红编织、石墨构造），设置会安全持久化且不影响发牌概率；
- 响应式桌面针对 Mac、iPad 横/竖屏和 iPhone 竖屏优化，提供安全区、44px+ 触控目标、键盘 focus 与 reduced-motion 支持；
- 移动端轮到用户时自动定位到操作区，并把关键动作按钮前置；Mac 可使用 `F/K/C/R/A` 快捷执行 Fold/Check/Call/Raise/All-in。

## 环境要求

- Node.js 22.13 或更高版本；
- npm；
- E2E 首次运行需要安装 Playwright Chromium。

## 安装与启动

```bash
npm install
npm run dev
```

终端会打印本地地址，默认是 `http://localhost:3000`。

### 在 iPhone / iPad 上通过同一 Wi-Fi 使用

让 Mac 与移动设备连接同一可信 Wi-Fi，然后在 Mac 运行：

```bash
npm run dev:lan
```

终端会显示类似 `Network: http://192.168.x.x:3000/` 的地址。在 iPhone 或 iPad 的 Safari 中打开该地址即可。仅在可信局域网使用此命令；关闭终端中的开发服务器后，局域网访问也会停止。

LocalStorage 按浏览器和设备分别保存，因此 Mac、iPhone 与 iPad 的统计不会自动同步；需要转移数据时请使用设置页的导出功能。

## 测试与质量检查

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
```

首次运行 E2E：

```bash
npx playwright install chromium
npm run test:e2e
```

`npm run check` 依次执行 ESLint、TypeScript、Vitest 和 production build。E2E 独立执行，以便没有浏览器运行时的环境仍能完成核心检查。

## 项目结构

```text
app/                         页面入口与全局样式
src/engine/                  与 UI 解耦的扑克规则引擎
  cards/ deck/ evaluator/    牌、随机源、洗牌和最佳五张评估
  betting/ pots/ showdown/   动作验证、下注轮、边池与摊牌
  state/                     单一权威牌局状态和位置顺序
src/ai/                      个性、评估、Monte Carlo、适应和决策
src/features/app/            客户端产品界面与动作编排
src/storage/                 LocalStorage schema、迁移和统计更新
public/assets/card-backs/     原创压缩牌背素材
tests/engine/ tests/ai/      规则与 AI 单元测试
tests/storage/               持久化迁移测试
tests/e2e/                   Playwright 核心流程
docs/                        实施状态与安全恢复入口
```

详细设计见 [ARCHITECTURE.md](ARCHITECTURE.md)、[POKER_RULES.md](POKER_RULES.md)、[AI_DESIGN.md](AI_DESIGN.md) 和 [TESTING.md](TESTING.md)。

## 数据与隐私

应用不需要账号或后端。设置、AI 配置、统计、牌局、训练记录和笔记只写入当前浏览器的 LocalStorage。清除浏览器站点数据会移除这些记录；建议定期使用设置页导出 JSON。

AI 决策接口只接收自己的底牌和公开信息。牌局结束前，其他玩家底牌不会传入 AI 观察对象。

## 当前限制

- Monte Carlo 使用均匀随机未知范围，不是求解器或 GTO 输出；
- outs、危险度和动作反馈属于训练级启发式，不代表唯一正确答案；
- 单手牌场景第一版不提供自定义已形成底池或逐个对手范围；
- 当前是现金桌/单手训练器，不包含盲注级别、ante、多桌平衡、hand-for-hand、淘汰名次和奖金结构等完整锦标赛管理；
- AI 的 tilt 参数尚未形成完整的连续输赢状态机；
- 数据只在当前浏览器设备保存，不跨设备同步；
- 没有声音素材，声音开关为后续扩展预留。

## 后续路线

1. 为新决策记录增加行动时不可变快照，并支持从待复查节点重新练习；
2. 增加可分享但不含隐藏信息的手牌文本格式；
3. 将 Monte Carlo 批次迁移到 Web Worker，并加入明确标注的范围加权缓存；
4. 扩展单手牌场景的底池、前序行动与对手范围编辑；
5. 增加 WebKit 自动化矩阵与可安装的离线 PWA 外壳。

## 免责声明

RiverLab 仅用于规则学习和个人娱乐训练，不提供赌博服务，也不宣传为获利工具。扑克决策具有不确定性，少量样本统计不稳定。
