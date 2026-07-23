# Architecture

## 设计原则

- 规则正确性优先于视觉效果；
- 规则引擎使用纯函数和可注入随机源；
- React 不自行修改筹码、行动顺序或底池；
- `PokerGameState` 是每手牌唯一权威状态；
- 人类与 AI 动作经过同一个 `validateAction` 和 `act` 路径；
- 持久化数据带版本号，损坏数据回退到安全默认值；
- 所有牌局完全在浏览器本地运行。

## 数据流

```text
人类按钮 / AI 决策
        │
        ▼
统一 action validator ── 非法 ──> 明确原因与最近合法值
        │ 合法
        ▼
betting engine → game state transition → street / runout / showdown
        │                                  │
        └──────── React 只读渲染 <────────┘
                                           │
                                  完成后保存 LocalStorage
```

## 核心规则层

- `cards`：牌的值对象、解析、唯一性和展示标签；
- `deck`：52 张牌、Fisher-Yates 和 `RandomSource`；
- `evaluator`：枚举 5–7 张牌的所有五张组合，返回类别和逐项 tiebreaker；
- `betting`：跟注额、最小 raise-to、下注是否重新开放、动作应用和下注轮完成判断；
- `chips`：以 `0.01BB` 为单位规范小数筹码，集中处理浮点比较与守恒边界；
- `pots`：按投入上限分层，保留弃牌筹码但排除其获奖资格；
- `showdown`：逐池确定赢家、平分和按钮左侧开始的奇数筹码；
- `state`：发牌、盲注、行动顺序、烧牌、街道推进、自动 runout、结束原因和一次性结算；
- `cashTable`：在完整结算后判断下一手能否发出、Hero 是否需要手动重新买入，以及哪些归零座位不再参与按钮轮转。

`PokerGameState` 扩展下注轮状态，玩家数组只存在一份。下注引擎返回的基础玩家字段会合并回同一 `HandPlayer`，React 不保留第二套筹码或投入状态。

### 正式结算边界

`HandOutcome.termination` 只允许 `uncontested`、`river-showdown` 或 `all-in-runout`。状态进入 `complete` 前必须同时满足：

- 主池、边池和无人跟注退回的总额与累计投入守恒；
- 写回所有玩家的支付总额与累计投入守恒；
- 不存在待行动玩家；
- 不产生零金额池、零金额退回或浮点残量玩家。

UI 只根据完成态显示结果，不能通过动画结束、河牌出现或按钮点击自行宣布一手结束。从翻牌后开始的训练场景会建立已经匹配的起始投入，避免把不存在的盲注差额带入结算。

## AI 边界

`AIObservation` 是 AI 与真实牌局之间的安全边界。它包含 AI 自己的两张牌、公共牌和公开数值，不包含任何对手未公开牌。Monte Carlo 从 52 张牌中移除已知牌后重新抽取对手牌。

AI 的输出只是建议动作及 `reasoningTags`。控制层再次调用规则验证器；AI 不能直接写牌局状态。完整设计见 `AI_DESIGN.md`。

## UI 层

`PokerTrainer` 负责编排：

- 当前视图；
- 唯一 `PokerGameState`；
- AI 定时器和 stale-state 防护；
- 用户输入与非法值反馈；
- 完成牌局后的去重保存；
- 设置、复盘和导出。

座位、公共牌和操作栏都是状态的只读投影。AI 定时回调在提交前比较 `handId` 和 `actionSequence`，防止旧定时器向新牌局提交动作。

### 视觉与动画边界

- 牌面、筹码、公共牌和获胜者信息只读取 `PokerGameState`，视觉层不推进街道、不延迟引擎，也不复制筹码状态；
- 洗牌层是临时覆盖层，CSS 动画结束后还会由 React 定时卸载，避免 Safari 动画终态异常遮挡真实牌面；
- 发牌、公共牌揭示和筹码动画只作用于包装层；核心 `.playing-card` 的最终可见性不依赖动画成功；
- 动画关闭和 `prefers-reduced-motion` 会移除所有装饰运动，但不会改变合法动作、AI 定时器或结算；
- 牌面等级和花色继续由规则引擎的 `rankLabel` 与 `Card` 数据渲染，生成图片只用于无信息的牌背纹理；
- `deckTheme` 是版本化本地设置，未知或损坏值在迁移时回退到 `river-current`。

## 持久化

LocalStorage key 为 `riverlab-poker-v2`。数据包括：

- 设置和 AI 人格；
- AI 实际习惯统计；
- 总体与位置统计；
- 最近 100 手完整牌局；
- 最多 500 条用户训练决策；
- 玩家笔记。

读取时捕获 JSON、Storage 和 schema 异常；不识别的版本回退到默认数据。v1 数据会合并到 v2 默认字段。

## 可扩展点

- `RandomSource` 可换成测试 seed、加密随机或回放源；
- `AIObservation` 可加入公开范围模型而不暴露隐藏牌；
- `estimateEquityAsync` 可迁移到 Worker；
- `StoredHand` 可增加标准手牌文本导入/导出；
- 统计聚合器可从当前累计字段扩展为事件流派生。
