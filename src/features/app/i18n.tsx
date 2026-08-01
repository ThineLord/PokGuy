"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppLocale = "zh-CN" | "en";

const LOCALE_STORAGE_KEY = "riverlab-locale";

const ENGLISH: Record<string, string> = {
  牌背: "Card back",
  尚未发出的公共牌: "Undealt community card",
  德州扑克牌桌: "Texas Hold'em table",
  洗牌: "SHUFFLE",
  准备发牌: "DEALING",
  顺时针行动: "Action moves clockwise",
  从庄家左侧开始发牌: "Deal starts left of the dealer",
  当前行动: "ACTING NOW",
  底池: "Pot",
  个边池: "side pots",
  公共牌: "Board",
  本手结束: "HAND COMPLETE",
  摊牌结算: "Showdown settled",
  弃牌获胜: "Won uncontested",
  正式牌型比较: "Official hand comparison",
  只比较最佳五张牌: "Best five cards only",
  同牌型按比较项逐级决定胜负:
    "Equal categories are resolved by their ordered tie-break values",
  获胜: "Winner",
  底牌: "Hole cards",
  最佳五张: "Best five",
  主池: "Main pot",
  边池: "Side pot",
  无人跟注退回: "Uncalled chips returned",
  筹码: "stack",
  庄家按钮: "Dealer button",
  思考中: "Thinking…",
  投入: "Committed",
  逐街复盘: "Street-by-street replay",
  到: "to",
  起始状态: "Starting state",
  盲注: "Blinds",
  上一步: "Previous",
  暂停: "Pause",
  自动播放: "Autoplay",
  下一步: "Next",
  摊牌: "Showdown",
  最近牌局: "Recent hands",
  "完成一手牌后，行动和底池变化会保存在这里。":
    "Actions and pot changes will appear here after you complete a hand.",
  复盘筛选: "Review filters",
  全部: "All",
  待复查: "To review",
  暂无待复查牌局: "No hands currently need review.",
  复盘实验室: "REVIEW LAB",
  训练反馈: "Decision feedback",
  个决策: "decisions",
  个待复查: "to review",
  "这里使用训练级启发式回看你的选择，不代表唯一正确答案或 GTO 结论。":
    "These training heuristics help you revisit a choice; they are not a unique answer or a GTO verdict.",
  "本手没有已保存的训练反馈。":
    "No saved decision feedback is available for this hand.",
  已记录的训练反馈: "Saved decision feedback",
  行动前底池: "Pot before action",
  本次投入: "Committed this action",
  "该条旧记录缺少完整动作上下文，因此只显示原始评分。":
    "This older record lacks complete action context, so only its original grade is shown.",
  有争议: "Needs review",
  "有争议：建议结合对手范围、位置和当时信息重新检查。":
    "Needs review: revisit the decision with the opponent range, position, and information available at the time.",
  玩家笔记: "Player notes",
  "记录对手习惯、自己的思路或下次要复查的节点…":
    "Record opponent tendencies, your reasoning, or spots to revisit…",
  总手数: "Hands played",
  盈亏: "Net result",
  翻牌持续下注: "Flop c-bet",
  到摊牌率: "Went to showdown",
  摊牌胜率: "Won at showdown",
  已点评决策: "Reviewed decisions",
  待复查决策: "Decisions to review",
  待复查手牌: "Hands to review",
  长期统计: "Long-term statistics",
  训练概览: "Training overview",
  少量样本统计不稳定: "Small samples are volatile",
  位置表现: "Positional performance",
  按位置拆分: "Breakdown by position",
  位置: "Position",
  手数: "Hands",
  手: "hands",
  短动画: "Short animations",
  "自动 AI 行动": "Automatic AI actions",
  显示粗略胜率: "Show estimated equity",
  显示底池赔率: "Show pot odds",
  "显示 outs": "Show estimated outs",
  推荐动作: "Recommended action",
  推荐尺度: "Recommended sizing",
  危险牌面提示: "Board texture warnings",
  声音: "Sound",
  深海流纹: "River Current",
  "蓝绿雕版 · 默认": "Teal engraved pattern · Default",
  酒红编织: "Burgundy Weave",
  经典亚麻纹理: "Classic linen texture",
  石墨构造: "Graphite Grid",
  现代碳纤几何: "Modern carbon-fiber geometry",
  牌桌: "Table",
  基础设置: "Table settings",
  玩家名称: "Player name",
  桌面人数: "Table size",
  "初始筹码（BB）": "Starting stack (BB)",
  小盲: "Small blind",
  大盲: "Big blind",
  "AI 思考延迟（ms）": "AI action delay (ms)",
  "开启动画时，机器人会至少留出约一秒观察时间。":
    "With animations on, each AI leaves about a second for you to follow the action.",
  动画速度: "Animation speed",
  快速: "Fast",
  标准: "Standard",
  舒缓: "Relaxed",
  训练提示强度: "Coaching detail",
  关闭: "Off",
  轻提示: "Concise",
  完整: "Detailed",
  牌背收藏: "Card-back collection",
  "仅改变视觉，不影响发牌与概率":
    "Visual preference only; dealing and probabilities are unchanged",
  选择牌背: "Choose a card back",
  对手池: "Opponent pool",
  "AI 个性": "AI player profiles",
  已上桌: "Active",
  未选择: "Not selected",
  实际: "Observed",
  移出对手池: "Remove from pool",
  加入对手池: "Add to pool",
  本地数据: "Local data",
  导入与导出: "Import and export",
  导出设置: "Export settings",
  导出牌局记录: "Export hand history",
  导入设置: "Import settings",
  无法读取该设置文件: "The settings file could not be read.",
  "确定重置所有统计？牌局历史不会删除。":
    "Reset all statistics? Your hand history will be preserved.",
  重置统计: "Reset statistics",
  "确定清除全部历史牌局？此操作无法撤销。":
    "Delete the entire hand history? This cannot be undone.",
  清除历史牌局: "Clear hand history",
  底牌必须正好两张: "Hole cards must contain exactly two cards.",
  无法创建训练场景: "Unable to create the training scenario.",
  单手牌训练: "Single-hand training",
  构建一个决策节点: "Build a decision spot",
  "牌使用简写输入，例如": "Enter cards in compact notation, for example",
  "。未指定的公共牌会从剩余牌堆随机补齐。":
    ". Unspecified community cards are dealt randomly from the remaining deck.",
  你的底牌: "Your hole cards",
  "；留空为随机": "; leave blank for random cards",
  起始街: "Starting street",
  翻牌前: "Preflop",
  翻牌: "Flop",
  转牌: "Turn",
  河牌: "River",
  有效筹码: "Effective stack",
  "有效筹码（BB）": "Effective stack (BB)",
  对手数量: "Number of opponents",
  随机底牌: "Random hole cards",
  开始此训练: "Start training",
  "AI 行动失败": "AI action failed",
  动作失败: "Action failed",
  尺度异常: "Sizing error",
  偏紧: "Too tight",
  偏松: "Too loose",
  高风险: "High variance",
  合理: "Sound",
  "尺度异常：该下注显著超过当前底池，通常需要很强的特定理由。":
    "Sizing error: this wager is far larger than the pot and normally requires a strong, specific rationale.",
  "偏紧：无需跟注时弃牌通常损失了免费看牌机会。":
    "Too tight: folding when a check is available usually gives up a free card.",
  "偏松：粗略胜率低于当前底池赔率门槛。":
    "Too loose: estimated equity is below the pot-odds threshold.",
  "高风险：深街前全押会显著放大方差。":
    "High variance: moving all-in before the river substantially increases variance.",
  "合理：该动作处于可辩护范围；扑克决策通常不存在唯一答案。":
    "Sound: the action is within a defensible range; poker decisions rarely have one uniquely correct answer.",
  主导航: "Main navigation",
  训练桌: "Training table",
  单手牌: "Single hand",
  场景: "Scenario",
  历史与复盘: "History & replay",
  复盘: "Replay",
  统计: "Stats",
  设置: "Settings",
  "仅本地 · 非真钱": "LOCAL ONLY · NO REAL MONEY",
  标准现金桌训练: "Standard cash-game training",
  调整场景: "Edit scenario",
  返回现金桌: "Return to cash game",
  重新开局: "Restart session",
  重新买入: "Rebuy",
  等待本手结束后才能重新买入:
    "A rebuy can only take effect after the current hand ends",
  当前筹码不低于买入目标: "Your stack is already at or above the buy-in target",
  跟注: "Call",
  最小加注到: "Minimum raise-to",
  "位置 / 街": "Position / street",
  剩余玩家: "Players remaining",
  结果: "Result",
  弃牌结束: "Won by folds",
  本手盈亏: "Hand result",
  底池赔率: "Pot odds",
  粗略胜率: "Estimated equity",
  估算补牌张数: "Estimated outs",
  可选建议: "Suggested action",
  参考尺度: "Reference sizing",
  牌面提示: "Board warning",
  危险度较高: "Coordinated board",
  本手已结算: "Hand settled",
  本手正式结束: "HAND OFFICIALLY COMPLETE",
  摊牌完成: "Showdown complete",
  "只剩一手活牌，底池已直接推送":
    "Only one live hand remains; the pot has been pushed",
  "All-in 后无后续下注，公共牌已发完并摊牌":
    "All betting closed after an all-in; the board ran out and hands were shown",
  "河牌下注完成，所有活牌已摊牌比较":
    "River betting is complete; all live hands were compared",
  结算检查: "Settlement checks",
  赢家已经确定: "Winner determined",
  主池和边池已经分别结算: "Main and side pots awarded separately",
  无人跟注筹码已经退回: "Uncalled chips returned",
  筹码已经到账: "Payouts added to stacks",
  本桌训练结束: "TABLE SESSION COMPLETE",
  "你的筹码为 0，请重新买入后继续":
    "Your stack is zero; rebuy before continuing",
  桌上只剩一名有筹码玩家: "Only one funded player remains at the table",
  重新买入并继续: "Rebuy and continue",
  筹码归零: "Stack exhausted",
  新场景: "New scenario",
  下一手: "Next hand",
  玩家操作区: "Player action controls",
  轮到你行动: "Your action",
  行动中: "is acting",
  下注滑杆: "Bet sizing slider",
  下注总额: "Total wager",
  最近合法值: "Nearest legal value",
  行动: "ACTING",
  德州扑克训练台: "POKER TRAINER",
  切换到英文: "Switch to English",
  切换到中文: "Switch to Chinese",
  英文: "English",
  中文: "Chinese",
  人桌: "-max",
};

const ACTIONS: Record<string, { "zh-CN": string; en: string }> = {
  fold: { "zh-CN": "弃牌", en: "Fold" },
  check: { "zh-CN": "过牌", en: "Check" },
  call: { "zh-CN": "跟注", en: "Call" },
  bet: { "zh-CN": "下注", en: "Bet" },
  raise: { "zh-CN": "加注", en: "Raise" },
  "all-in": { "zh-CN": "全押", en: "All-in" },
};

const STREETS: Record<string, { "zh-CN": string; en: string }> = {
  preflop: { "zh-CN": "翻牌前", en: "Preflop" },
  flop: { "zh-CN": "翻牌", en: "Flop" },
  turn: { "zh-CN": "转牌", en: "Turn" },
  river: { "zh-CN": "河牌", en: "River" },
  complete: { "zh-CN": "本手结束", en: "Hand complete" },
};

const STATUSES: Record<string, { "zh-CN": string; en: string }> = {
  active: { "zh-CN": "等待行动", en: "Active" },
  folded: { "zh-CN": "已弃牌", en: "Folded" },
  "all-in": { "zh-CN": "全押", en: "All-in" },
  busted: { "zh-CN": "已离桌", en: "Busted" },
};

const SUITS: Record<string, { "zh-CN": string; en: string }> = {
  clubs: { "zh-CN": "梅花", en: "clubs" },
  diamonds: { "zh-CN": "方片", en: "diamonds" },
  hearts: { "zh-CN": "红桃", en: "hearts" },
  spades: { "zh-CN": "黑桃", en: "spades" },
};

const CATEGORIES: Record<string, { "zh-CN": string; en: string }> = {
  "high-card": { "zh-CN": "高牌", en: "High card" },
  pair: { "zh-CN": "一对", en: "One pair" },
  "two-pair": { "zh-CN": "两对", en: "Two pair" },
  "three-of-a-kind": { "zh-CN": "三条", en: "Three of a kind" },
  straight: { "zh-CN": "顺子", en: "Straight" },
  flush: { "zh-CN": "同花", en: "Flush" },
  "full-house": { "zh-CN": "葫芦", en: "Full house" },
  "four-of-a-kind": { "zh-CN": "四条", en: "Four of a kind" },
  "straight-flush": { "zh-CN": "同花顺", en: "Straight flush" },
};

const DECISION_TAGS: Record<string, { "zh-CN": string; en: string }> = {
  "strong-made-hand": { "zh-CN": "强成牌", en: "Strong made hand" },
  "semi-bluff": { "zh-CN": "半诈唬", en: "Semi-bluff" },
  "position-advantage": { "zh-CN": "位置优势", en: "Positional advantage" },
  "good-pot-odds": { "zh-CN": "底池赔率合适", en: "Favorable pot odds" },
  "board-too-dangerous": { "zh-CN": "危险牌面", en: "Dangerous board" },
  "stack-pressure": { "zh-CN": "筹码压力", en: "Stack pressure" },
  "calling-station-profile": {
    "zh-CN": "跟注站倾向",
    en: "Calling-station profile",
  },
  "high-fold-equity": { "zh-CN": "高弃牌率收益", en: "High fold equity" },
  "continuation-bet": { "zh-CN": "持续下注", en: "Continuation bet" },
};

const PROFILE_LABELS: Record<string, { "zh-CN": string; en: string }> = {
  vpip: { "zh-CN": "VPIP（主动入池率）", en: "VPIP" },
  pfr: { "zh-CN": "PFR（翻牌前加注率）", en: "PFR" },
  aggression: { "zh-CN": "进攻性", en: "Aggression" },
  bluffFrequency: { "zh-CN": "诈唬频率", en: "Bluff frequency" },
  callDownTendency: { "zh-CN": "跟到底倾向", en: "Call-down tendency" },
  foldToPressure: { "zh-CN": "面对压力弃牌率", en: "Fold to pressure" },
  positionAwareness: { "zh-CN": "位置意识", en: "Position awareness" },
  potOddsAwareness: { "zh-CN": "底池赔率意识", en: "Pot-odds awareness" },
  stackAwareness: { "zh-CN": "筹码深度意识", en: "Stack awareness" },
  boardTextureAwareness: {
    "zh-CN": "牌面结构意识",
    en: "Board-texture awareness",
  },
  adaptability: { "zh-CN": "适应能力", en: "Adaptability" },
  variance: { "zh-CN": "随机波动", en: "Variance" },
};

const AI_PROFILES: Record<
  string,
  {
    name: { "zh-CN": string; en: string };
    description: { "zh-CN": string; en: string };
  }
> = {
  tag: {
    name: { "zh-CN": "林 · 紧凶型（TAG）", en: "Lin · TAG" },
    description: {
      "zh-CN": "选择性入池，主动争夺价值，位置纪律良好。",
      en: "Selective preflop entry, assertive value play, and strong positional discipline.",
    },
  },
  lag: {
    name: { "zh-CN": "凯 · 松凶型（LAG）", en: "Kai · LAG" },
    description: {
      "zh-CN": "范围宽、施压频繁，擅长利用位置和弃牌率。",
      en: "Wide ranges and frequent pressure, exploiting position and fold equity.",
    },
  },
  rock: {
    name: { "zh-CN": "石 · 岩石型", en: "Shi · Rock" },
    description: {
      "zh-CN": "极其谨慎，只用强范围投入大底池。",
      en: "Extremely cautious, committing to large pots only with a strong range.",
    },
  },
  station: {
    name: { "zh-CN": "沫沫 · 跟注站", en: "Momo · Calling Station" },
    description: {
      "zh-CN": "入池宽、喜欢跟到底，主动加注较少。",
      en: "Enters pots widely and calls down often, with relatively few aggressive raises.",
    },
  },
  recreational: {
    name: { "zh-CN": "阿乐 · 娱乐型玩家", en: "Le · Recreational" },
    description: {
      "zh-CN": "被动而随性，偏爱看翻牌，尺度偶有偏差。",
      en: "Loose and passive, eager to see flops, with occasionally inconsistent sizing.",
    },
  },
  maniac: {
    name: { "zh-CN": "维克斯 · 疯狂型", en: "Vex · Maniac" },
    description: {
      "zh-CN": "极高频率下注与诈唬，用巨大方差持续施压。",
      en: "Bets and bluffs at extreme frequency, applying relentless high-variance pressure.",
    },
  },
  grinder: {
    name: { "zh-CN": "诺拉 · 稳健常客", en: "Nora · Grinder" },
    description: {
      "zh-CN": "数学导向，重视赔率、有效筹码和稳定决策。",
      en: "Mathematically disciplined, prioritizing odds, effective stacks, and consistent decisions.",
    },
  },
  trapper: {
    name: { "zh-CN": "西尔瓦 · 陷阱型", en: "Silva · Trapper" },
    description: {
      "zh-CN": "控制底池并隐藏强度，伺机慢打与反加。",
      en: "Controls pot size and disguises strength, looking to slow-play and re-raise.",
    },
  },
};

const ERROR_MESSAGES: Record<string, { "zh-CN": string; en: string }> = {
  "Unknown player": { "zh-CN": "未知玩家。", en: "Unknown player." },
  "Not this player's turn": {
    "zh-CN": "当前不是该玩家行动。",
    en: "It is not this player's turn.",
  },
  "Player cannot act": {
    "zh-CN": "该玩家无法行动。",
    en: "This player cannot act.",
  },
  "Nothing to call": {
    "zh-CN": "当前没有需要跟注的金额。",
    en: "There is nothing to call.",
  },
  "Betting has not been reopened": {
    "zh-CN": "下注权尚未重新开放。",
    en: "Betting has not been reopened.",
  },
  "A target total is required": {
    "zh-CN": "必须填写下注或加注到的总额。",
    en: "A target total is required.",
  },
  "Amount exceeds stack": {
    "zh-CN": "金额超过可用筹码。",
    en: "The amount exceeds the available stack.",
  },
  "Raise must exceed the current bet": {
    "zh-CN": "加注总额必须高于当前下注额。",
    en: "The raise-to amount must exceed the current bet.",
  },
  "No chips available": {
    "zh-CN": "没有可用筹码。",
    en: "No chips are available.",
  },
  "Betting has not been reopened; all-in may only call": {
    "zh-CN": "下注权尚未重新开放；全押只能完成跟注。",
    en: "Betting has not been reopened; an all-in may only call.",
  },
  "Hand is already complete": {
    "zh-CN": "本手牌已经结束。",
    en: "The hand is already complete.",
  },
  "Too many board cards for the selected street": {
    "zh-CN": "公共牌数量超过所选街允许的数量。",
    en: "There are too many board cards for the selected street.",
  },
  "Duplicate cards are not allowed": {
    "zh-CN": "不能输入重复的牌。",
    en: "Duplicate cards are not allowed.",
  },
  "Invalid blind structure": {
    "zh-CN": "盲注结构无效。",
    en: "The blind structure is invalid.",
  },
};

function localizedEntry(
  entries: Record<string, { "zh-CN": string; en: string }>,
  key: string,
  locale: AppLocale,
) {
  return entries[key]?.[locale] ?? key;
}

function localizeRuntimeMessage(message: string, locale: AppLocale): string {
  if (ERROR_MESSAGES[message]) return ERROR_MESSAGES[message][locale];

  const invalidCard = message.match(/^Invalid card token: (.+)$/);
  if (invalidCard)
    return locale === "zh-CN"
      ? `无法识别牌面简写：${invalidCard[1]}。`
      : `Invalid card notation: ${invalidCard[1]}.`;

  const checkFacing = message.match(/^Cannot check facing (.+)$/);
  if (checkFacing)
    return locale === "zh-CN"
      ? `面对 ${checkFacing[1]} 的下注时不能过牌。`
      : `You cannot check while facing ${checkFacing[1]}.`;

  const requiredAction = message.match(/^Action must be (bet|raise)$/);
  if (requiredAction)
    return locale === "zh-CN"
      ? `当前动作必须是${ACTIONS[requiredAction[1]]["zh-CN"]}。`
      : `The action must be ${ACTIONS[requiredAction[1]].en.toLowerCase()}.`;

  const minimum = message.match(/^Minimum legal total is (.+)$/);
  if (minimum)
    return locale === "zh-CN"
      ? `最小合法加注总额为 ${minimum[1]}。`
      : `The minimum legal raise-to amount is ${minimum[1]}.`;

  return message;
}

interface I18nValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
  formatDate: (value: string) => string;
  actionLabel: (action: string) => string;
  streetLabel: (street: string) => string;
  statusLabel: (status: string) => string;
  suitLabel: (suit: string) => string;
  categoryLabel: (category: string) => string;
  decisionTagLabel: (tag: string) => string;
  profileLabel: (key: string) => string;
  aiName: (id: string | undefined, fallback: string) => string;
  aiDescription: (id: string, fallback: string) => string;
  runtimeMessage: (message: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("zh-CN");

  useEffect(() => {
    const saved = window.localStorage?.getItem(LOCALE_STORAGE_KEY);
    if (saved !== "zh-CN" && saved !== "en") return;
    const timer = window.setTimeout(() => setLocaleState(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    window.localStorage?.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "zh-CN" ? "en" : "zh-CN");
  }, [locale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title =
      locale === "zh-CN"
        ? "RiverLab · 德州扑克训练台"
        : "RiverLab · Texas Hold'em Poker Trainer";
    const description =
      locale === "zh-CN"
        ? "完全本地运行的单机德州扑克训练、复盘与统计工具。"
        : "A fully local Texas Hold'em training, replay, and statistics tool.";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
  }, [locale]);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t: (key) => (locale === "en" ? (ENGLISH[key] ?? key) : key),
      formatDate: (value) =>
        new Date(value).toLocaleString(locale === "zh-CN" ? "zh-CN" : "en-US"),
      actionLabel: (action) => {
        const callWithAmount = action.match(/^call (.+)$/);
        if (callWithAmount)
          return `${ACTIONS.call[locale]} ${callWithAmount[1]}`;
        return localizedEntry(ACTIONS, action, locale);
      },
      streetLabel: (street) => localizedEntry(STREETS, street, locale),
      statusLabel: (status) => localizedEntry(STATUSES, status, locale),
      suitLabel: (suit) => localizedEntry(SUITS, suit, locale),
      categoryLabel: (category) => localizedEntry(CATEGORIES, category, locale),
      decisionTagLabel: (tag) => localizedEntry(DECISION_TAGS, tag, locale),
      profileLabel: (key) => localizedEntry(PROFILE_LABELS, key, locale),
      aiName: (id, fallback) =>
        (id && AI_PROFILES[id]?.name[locale]) ?? fallback,
      aiDescription: (id, fallback) =>
        AI_PROFILES[id]?.description[locale] ?? fallback,
      runtimeMessage: (message) => localizeRuntimeMessage(message, locale),
    }),
    [locale, setLocale, toggleLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used within LanguageProvider");
  return value;
}
