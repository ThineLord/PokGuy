# AI Design

## 目标与边界

RiverLab 的 AI 用于单机训练，不追求求解器级最优。它强调长期可辨认的风格、有限适应和可复现性。AI 的观察接口只包含自己的底牌、公共牌、公开行动/筹码信息和聚合用户统计；其他玩家未公开底牌不会进入决策函数。

## 个性模型

内置八种预设：TAG、LAG、Rock、Calling Station、Recreational、Maniac、Grinder、Trapper。每个预设完整实现 `PokerPersonality` 参数，包括 VPIP、PFR、进攻性、诈唬、跟到底、压力弃牌、位置/赔率/筹码/牌面意识、持续下注、double barrel、check-raise、慢打、陷阱、tilt、适应、方差和思考速度。

个性参数是长期基线。用户在设置页编辑后，版本化 LocalStorage 会保存修改；新牌局继续使用相同配置，而不是每手随机生成性格。

## 手牌评估

`HandAssessment` 综合：

- 当前成牌等级与摊牌价值；
- 同花、顺子连接性等粗略听牌强度；
- Monte Carlo 粗略胜率；
- nut 潜力；
- 同花密度、连接度、成对牌面产生的危险度。

翻牌前另有可复现的起手牌强度启发式，考虑对子、牌张高度、同花、连接度和 gap。

## Monte Carlo 安全性与性能

- 模拟牌堆由完整 52 张牌减去 AI 自己底牌、公共牌和显式公开死牌构成。
- 模拟器接口没有真实对手底牌字段。
- 每轮为对手从剩余牌堆随机发牌，再补齐公共牌，并使用同一最佳五张评估器比较。
- 默认决策使用 72 次轻量模拟；训练 UI 使用 48 次，避免阻塞交互。
- `estimateEquityAsync` 在计算前主动让出事件循环；后续可平移到 Web Worker 而不改变调用数据结构。
- seed 可注入；相同输入与 seed 产生相同结果。

## 决策流程

决策输入包含底池、跟注额、赔率、有效筹码、SPR、位置、街、对手数、all-in 数量、合法动作、是否为翻前进攻者及平滑后的用户倾向。

流程先计算价值、赔率门槛、位置修正和受控随机扰动，再根据个性选择 fold/check/call/bet/raise/all-in。最终动作仍会通过统一规则验证器；若建议因边界状态失效，控制层只降级到合法的 check/call/fold，不会绕过引擎。

`AIDecision.reasoningTags` 只在牌局结束后的复盘中展示，例如 `strong-made-hand`、`good-pot-odds`、`semi-bluff`、`position-advantage`、`stack-pressure` 和 `board-too-dangerous`。

## 习惯统计与适应

每种人格会保存实际运行的 VPIP、PFR、3-bet、fold to 3-bet、c-bet、fold to c-bet、aggression factor、摊牌率、诈唬估计和河牌跟注率。设置页同时显示人格预设和已积累的实际样本。

用户适应至少需要 20 手样本，并在 100 手附近逐步获得完整权重。适应强度乘以人格的 `adaptability`；任一单项整体调整封顶为基线附近 12% × 适应权重。少样本不会触发极端变化。

当前适应方向包括：用户过度弃牌时增加进攻/诈唬，跟注过多时减少诈唬，翻前过松时增加价值 PFR，频繁 c-bet 时提高 check-raise，频繁过牌时增加位置下注倾向。

## 当前限制

- 胜率模拟采用均匀未知范围，不做精细的范围加权。
- 听牌 outs 和牌面危险度是训练级启发式，不是求解器输出。
- tilt 参数已持久化但尚未根据连续输赢建立完整状态机。
- AI 习惯统计按人格聚合；同一人格在多个座位的样本会合并。
