"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { assessHand } from "../../ai/assessment/assessHand";
import { decideAIAction } from "../../ai/decision/decide";
import { getPersonality } from "../../ai/personalities/presets";
import type { PokerPersonality } from "../../ai/types";
import {
  amountToCall,
  legalActionsFor,
  validateAction,
} from "../../engine/betting/actionValidator";
import type { PokerAction, PokerActionType } from "../../engine/betting/types";
import { parseCards, rankLabel, type Card } from "../../engine/cards/cards";
import {
  act,
  startHand,
  startTrainingScenario,
  type PokerGameState,
  type TablePlayerInput,
} from "../../engine/state/gameState";
import { rotateButton } from "../../engine/state/positions";
import {
  appendCompletedHand,
  defaultData,
  EMPTY_STATS,
  loadData,
  saveData,
} from "../../storage/storage";
import type {
  AppSettings,
  PersistedData,
  StoredHand,
  TrainingRecord,
} from "../../storage/types";

type View = "table" | "scenario" | "history" | "stats" | "settings";
const HERO_ID = "hero";
const suitGlyph: Record<Card["suit"], string> = {
  clubs: "♣",
  diamonds: "♦",
  hearts: "♥",
  spades: "♠",
};

function CardView({ card, hidden = false }: { card?: Card; hidden?: boolean }) {
  if (hidden || !card)
    return (
      <span className="playing-card card-back" aria-label="隐藏的牌">
        R
      </span>
    );
  const red = card.suit === "hearts" || card.suit === "diamonds";
  return (
    <span
      className={`playing-card ${red ? "red-card" : ""}`}
      aria-label={`${rankLabel(card.rank)} ${card.suit}`}
    >
      {rankLabel(card.rank)}
      <small>{suitGlyph[card.suit]}</small>
    </span>
  );
}

function formatChips(value: number) {
  return Number(value.toFixed(2)).toString();
}

function buildPlayers(
  data: PersistedData,
  stacks?: Record<string, number>,
): TablePlayerInput[] {
  const settings = data.settings;
  const starting = settings.startingStackBb * settings.bigBlind;
  const aiIds = settings.selectedAiIds.length
    ? settings.selectedAiIds
    : data.aiProfiles.map((profile) => profile.id);
  return Array.from({ length: settings.seatCount }, (_, seat) => {
    if (seat === 0)
      return {
        id: HERO_ID,
        name: settings.playerName,
        seat,
        stack: stacks?.[HERO_ID] ?? starting,
        kind: "human",
      };
    const personalityId = aiIds[(seat - 1) % aiIds.length];
    const profile =
      data.aiProfiles.find((candidate) => candidate.id === personalityId) ??
      getPersonality(personalityId);
    return {
      id: `ai-${seat}`,
      name: profile.name,
      seat,
      stack: stacks?.[`ai-${seat}`] ?? starting,
      kind: "ai",
      personalityId: profile.id,
    };
  });
}

function exportJson(filename: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function tablePot(game: PokerGameState) {
  return game.players.reduce(
    (sum, player) => sum + player.totalContribution,
    0,
  );
}

function PokerTable({
  game,
  aiBusy,
}: {
  game: PokerGameState;
  aiBusy: boolean;
}) {
  const reveal = game.settled && game.outcome?.reason === "showdown";
  return (
    <div className="poker-table" aria-label="德州扑克牌桌">
      <div className="table-center">
        <div className="pot-pill">
          底池 <strong>{formatChips(tablePot(game))} BB</strong>
        </div>
        <div className="community-cards" aria-label="公共牌">
          {Array.from({ length: 5 }, (_, index) => (
            <CardView key={index} card={game.board[index]} />
          ))}
        </div>
        <p className="street-label">
          {game.street === "complete" ? "本手结束" : game.street.toUpperCase()}
        </p>
      </div>
      {game.players.map((player, index) => {
        const active = game.actingPlayerId === player.id;
        const seatClass = `seat seat-${index}-${game.players.length}`;
        return (
          <article
            key={player.id}
            className={`${seatClass} ${active ? "is-acting" : ""} ${player.status === "folded" ? "is-folded" : ""}`}
            aria-label={`${player.name}，筹码 ${formatChips(player.stack)}`}
          >
            <div className="seat-topline">
              <strong>{player.name}</strong>
              <span>{player.positionLabel}</span>
            </div>
            <div className="hole-cards">
              {player.holeCards.map((card, cardIndex) => (
                <CardView
                  key={cardIndex}
                  card={card}
                  hidden={player.kind === "ai" && !reveal}
                />
              ))}
            </div>
            <div className="seat-meta">
              <span>{formatChips(player.stack)} BB</span>
              <span>
                {player.status === "all-in"
                  ? "ALL-IN"
                  : (player.lastAction ??
                    (active && aiBusy ? "思考中…" : player.status))}
              </span>
            </div>
            {player.streetContribution > 0 && (
              <span className="seat-bet">
                投入 {formatChips(player.streetContribution)}
              </span>
            )}
          </article>
        );
      })}
    </div>
  );
}

function ReplayPanel({ hand }: { hand: StoredHand }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const actions = hand.game.actions;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setStep((value) => {
          if (value >= actions.length) {
            setPlaying(false);
            return value;
          }
          return value + 1;
        }),
      700,
    );
    return () => window.clearInterval(timer);
  }, [actions.length, playing]);
  const current = actions[Math.max(0, step - 1)];
  return (
    <section className="panel replay-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">逐街复盘</p>
          <h2>{hand.id}</h2>
        </div>
        <span className={hand.heroProfitBb >= 0 ? "positive" : "negative"}>
          {hand.heroProfitBb >= 0 ? "+" : ""}
          {formatChips(hand.heroProfitBb)} BB
        </span>
      </div>
      <div className="replay-board">
        {(current?.board ?? []).map((card, index) => (
          <CardView card={card} key={index} />
        ))}
      </div>
      <div className="replay-event">
        {current ? (
          <>
            <strong>
              {
                hand.game.players.find(
                  (player) => player.id === current.playerId,
                )?.name
              }
            </strong>{" "}
            · {current.street} · {current.action.type}
            {current.action.amount ? ` 到 ${current.action.amount}` : ""}
            <small>
              底池 {formatChips(current.potBefore)} →{" "}
              {formatChips(current.potAfter)}
            </small>
          </>
        ) : (
          <>
            <strong>起始状态</strong>
            <small>
              盲注 {hand.game.smallBlind}/{hand.game.bigBlind}
            </small>
          </>
        )}
      </div>
      <div className="replay-controls">
        <button onClick={() => setStep(Math.max(0, step - 1))}>上一步</button>
        <button onClick={() => setPlaying((value) => !value)}>
          {playing ? "暂停" : "自动播放"}
        </button>
        <button onClick={() => setStep(Math.min(actions.length, step + 1))}>
          下一步
        </button>
        <span>
          {step}/{actions.length}
        </span>
      </div>
      {hand.game.outcome?.showdown && (
        <div className="showdown-summary">
          <strong>摊牌</strong>
          {Object.keys(hand.game.outcome.showdown.evaluations).map((id) => (
            <span key={id}>
              {hand.game.players.find((player) => player.id === id)?.name}：
              {hand.game.outcome?.showdown?.evaluations[id].category}
            </span>
          ))}
        </div>
      )}
      <div className="reason-tags">
        {Object.values(hand.aiDecisionTags)
          .flat()
          .slice(0, 12)
          .map((tag, index) => (
            <span key={`${tag}-${index}`}>{tag}</span>
          ))}
      </div>
    </section>
  );
}

function HistoryView({
  data,
  onNote,
}: {
  data: PersistedData;
  onNote: (id: string, note: string) => void;
}) {
  const [selected, setSelected] = useState(data.recentHands[0]?.id ?? "");
  const hand =
    data.recentHands.find((candidate) => candidate.id === selected) ??
    data.recentHands[0];
  return (
    <div className="content-grid history-grid">
      <section className="panel history-list">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">最近牌局</p>
            <h2>{data.recentHands.length} / 100</h2>
          </div>
        </div>
        {data.recentHands.length === 0 ? (
          <p className="empty-state">
            完成一手牌后，行动和底池变化会保存在这里。
          </p>
        ) : (
          data.recentHands.map((item) => (
            <button
              className={
                item.id === hand?.id ? "history-item selected" : "history-item"
              }
              key={item.id}
              onClick={() => setSelected(item.id)}
            >
              <span>{new Date(item.completedAt).toLocaleString("zh-CN")}</span>
              <strong
                className={item.heroProfitBb >= 0 ? "positive" : "negative"}
              >
                {item.heroProfitBb >= 0 ? "+" : ""}
                {formatChips(item.heroProfitBb)} BB
              </strong>
            </button>
          ))
        )}
      </section>
      {hand && (
        <div>
          <ReplayPanel hand={hand} />
          <label className="note-field">
            玩家笔记
            <textarea
              value={data.playerNotes[hand.id] ?? ""}
              onChange={(event) => onNote(hand.id, event.target.value)}
              placeholder="记录对手习惯、自己的思路或下次要复查的节点…"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function StatsView({ data }: { data: PersistedData }) {
  const stats = data.stats;
  const rate = (value: number, total: number) =>
    total ? `${((value / total) * 100).toFixed(1)}%` : "—";
  const items = [
    ["总手数", stats.hands],
    [
      "盈亏",
      `${stats.profitBb >= 0 ? "+" : ""}${formatChips(stats.profitBb)} BB`,
    ],
    [
      "BB / 100",
      stats.hands ? formatChips((stats.profitBb / stats.hands) * 100) : "—",
    ],
    ["VPIP", rate(stats.vpipHands, stats.vpipOpportunities)],
    ["PFR", rate(stats.pfrHands, stats.pfrOpportunities)],
    ["3-bet", rate(stats.threeBets, stats.threeBetOpportunities)],
    ["翻牌持续下注", rate(stats.cbets, stats.cbetOpportunities)],
    ["到摊牌率", rate(stats.showdowns, stats.hands)],
    ["摊牌胜率", rate(stats.showdownWins, stats.showdowns)],
  ];
  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">长期统计</p>
            <h2>训练概览</h2>
          </div>
          <span className="sample-warning">少量样本统计不稳定</span>
        </div>
        <div className="stats-grid">
          {items.map(([label, value]) => (
            <div className="stat-card" key={String(label)}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">位置表现</p>
            <h2>按位置拆分</h2>
          </div>
        </div>
        <div className="position-table">
          <div className="position-row header">
            <span>位置</span>
            <span>手数</span>
            <span>盈亏</span>
            <span>VPIP</span>
            <span>PFR</span>
          </div>
          {Object.entries(stats.byPosition).map(([position, item]) => (
            <div className="position-row" key={position}>
              <strong>{position}</strong>
              <span>{item.hands}</span>
              <span>{formatChips(item.profitBb)} BB</span>
              <span>{rate(item.vpip, item.hands)}</span>
              <span>{rate(item.pfr, item.hands)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SettingsView({
  data,
  updateSettings,
  updateProfile,
  replaceData,
}: {
  data: PersistedData;
  updateSettings: (patch: Partial<AppSettings>) => void;
  updateProfile: (id: string, patch: Partial<PokerPersonality>) => void;
  replaceData: (data: PersistedData) => void;
}) {
  const [editingId, setEditingId] = useState(
    data.settings.selectedAiIds[0] ?? "tag",
  );
  const profile =
    data.aiProfiles.find((candidate) => candidate.id === editingId) ??
    data.aiProfiles[0];
  const habit = profile ? data.aiHabits[profile.id] : undefined;
  const importRef = useRef<HTMLInputElement>(null);
  const numberSetting = (key: keyof AppSettings, value: string) =>
    updateSettings({ [key]: Number(value) } as Partial<AppSettings>);
  const toggles: [keyof AppSettings, string][] = [
    ["animations", "短动画"],
    ["autoAi", "自动 AI 行动"],
    ["showEquity", "显示粗略胜率"],
    ["showPotOdds", "显示底池赔率"],
    ["showOuts", "显示 outs"],
    ["showRecommendedAction", "推荐动作"],
    ["showRecommendedSizing", "推荐尺度"],
    ["showBoardWarnings", "危险牌面提示"],
    ["sound", "声音"],
  ];
  const profileKeys = [
    "vpip",
    "pfr",
    "aggression",
    "bluffFrequency",
    "callDownTendency",
    "foldToPressure",
    "positionAwareness",
    "potOddsAwareness",
    "stackAwareness",
    "boardTextureAwareness",
    "adaptability",
    "variance",
  ] as const;

  return (
    <div className="settings-layout">
      <section className="panel settings-section">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">牌桌</p>
            <h2>基础设置</h2>
          </div>
        </div>
        <div className="form-grid">
          <label>
            玩家名称
            <input
              value={data.settings.playerName}
              onChange={(event) =>
                updateSettings({ playerName: event.target.value })
              }
            />
          </label>
          <label>
            桌面人数
            <select
              value={data.settings.seatCount}
              onChange={(event) =>
                numberSetting("seatCount", event.target.value)
              }
            >
              {[2, 3, 4, 5, 6].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            初始筹码（BB）
            <input
              type="number"
              min="20"
              max="500"
              value={data.settings.startingStackBb}
              onChange={(event) =>
                numberSetting("startingStackBb", event.target.value)
              }
            />
          </label>
          <label>
            小盲
            <input
              type="number"
              min="0.01"
              step="0.5"
              value={data.settings.smallBlind}
              onChange={(event) =>
                numberSetting("smallBlind", event.target.value)
              }
            />
          </label>
          <label>
            大盲
            <input
              type="number"
              min="0.02"
              step="0.5"
              value={data.settings.bigBlind}
              onChange={(event) =>
                numberSetting("bigBlind", event.target.value)
              }
            />
          </label>
          <label>
            AI 思考延迟（ms）
            <input
              type="number"
              min="0"
              max="3000"
              step="50"
              value={data.settings.aiDelayMs}
              onChange={(event) =>
                numberSetting("aiDelayMs", event.target.value)
              }
            />
          </label>
          <label>
            动画速度
            <select
              value={data.settings.animationSpeed}
              onChange={(event) =>
                updateSettings({
                  animationSpeed: event.target
                    .value as AppSettings["animationSpeed"],
                })
              }
            >
              <option value="fast">快速</option>
              <option value="normal">标准</option>
              <option value="slow">舒缓</option>
            </select>
          </label>
          <label>
            训练提示强度
            <select
              value={data.settings.hintStrength}
              onChange={(event) =>
                updateSettings({
                  hintStrength: event.target
                    .value as AppSettings["hintStrength"],
                })
              }
            >
              <option value="off">关闭</option>
              <option value="light">轻提示</option>
              <option value="full">完整</option>
            </select>
          </label>
        </div>
        <div className="toggle-grid">
          {toggles.map(([key, label]) => (
            <label className="toggle" key={key}>
              <input
                type="checkbox"
                checked={Boolean(data.settings[key])}
                onChange={(event) =>
                  updateSettings({
                    [key]: event.target.checked,
                  } as Partial<AppSettings>)
                }
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>
      <section className="panel settings-section">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">对手池</p>
            <h2>AI 个性</h2>
          </div>
        </div>
        <div className="ai-picker">
          {data.aiProfiles.map((item) => {
            const selected = data.settings.selectedAiIds.includes(item.id);
            return (
              <button
                key={item.id}
                className={`${editingId === item.id ? "editing" : ""} ${selected ? "selected" : ""}`}
                onClick={() => setEditingId(item.id)}
              >
                <strong>{item.name}</strong>
                <span>{item.description}</span>
                <small>{selected ? "已上桌" : "未选择"}</small>
              </button>
            );
          })}
        </div>
        {profile && (
          <div className="profile-editor">
            <div className="profile-editor-heading">
              <div>
                <h3>{profile.name}</h3>
                {habit && (
                  <small>
                    实际 {habit.hands} 手 · VPIP {(habit.vpip * 100).toFixed(0)}
                    % · PFR {(habit.pfr * 100).toFixed(0)}% · AF{" "}
                    {habit.aggressionFactor.toFixed(1)}
                  </small>
                )}
              </div>
              <button
                onClick={() =>
                  updateSettings({
                    selectedAiIds: data.settings.selectedAiIds.includes(
                      profile.id,
                    )
                      ? data.settings.selectedAiIds.filter(
                          (id) => id !== profile.id,
                        )
                      : [...data.settings.selectedAiIds, profile.id],
                  })
                }
              >
                {data.settings.selectedAiIds.includes(profile.id)
                  ? "移出对手池"
                  : "加入对手池"}
              </button>
            </div>
            {profileKeys.map((key) => (
              <label className="range-row" key={key}>
                <span>{key}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={profile[key]}
                  onChange={(event) =>
                    updateProfile(profile.id, {
                      [key]: Number(event.target.value),
                    })
                  }
                />
                <output>{Math.round(profile[key] * 100)}</output>
              </label>
            ))}
          </div>
        )}
      </section>
      <section className="panel settings-section">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">本地数据</p>
            <h2>导入与导出</h2>
          </div>
        </div>
        <div className="button-grid">
          <button
            onClick={() =>
              exportJson("riverlab-settings.json", {
                version: data.version,
                settings: data.settings,
                aiProfiles: data.aiProfiles,
              })
            }
          >
            导出设置
          </button>
          <button
            onClick={() => exportJson("riverlab-hands.json", data.recentHands)}
          >
            导出牌局记录
          </button>
          <button onClick={() => importRef.current?.click()}>导入设置</button>
          <input
            ref={importRef}
            hidden
            type="file"
            accept="application/json"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                const parsed = JSON.parse(await file.text());
                replaceData({
                  ...data,
                  settings: { ...data.settings, ...(parsed.settings ?? {}) },
                  aiProfiles: parsed.aiProfiles ?? data.aiProfiles,
                });
              } catch {
                window.alert("无法读取该设置文件");
              }
            }}
          />
          <button
            className="danger-button"
            onClick={() => {
              if (window.confirm("确定重置所有统计？牌局历史不会删除。"))
                replaceData({
                  ...data,
                  stats: { ...EMPTY_STATS, byPosition: {} },
                });
            }}
          >
            重置统计
          </button>
          <button
            className="danger-button"
            onClick={() => {
              if (window.confirm("确定清除全部历史牌局？此操作无法撤销。"))
                replaceData({ ...data, recentHands: [], playerNotes: {} });
            }}
          >
            清除历史牌局
          </button>
        </div>
      </section>
    </div>
  );
}

function ScenarioView({
  data,
  onStart,
}: {
  data: PersistedData;
  onStart: (game: PokerGameState) => void;
}) {
  const [hole, setHole] = useState("AS KH");
  const [board, setBoard] = useState("");
  const [street, setStreet] = useState<"preflop" | "flop" | "turn" | "river">(
    "preflop",
  );
  const [position, setPosition] = useState("BTN");
  const [stack, setStack] = useState(100);
  const [opponents, setOpponents] = useState(2);
  const [error, setError] = useState("");
  const start = () => {
    try {
      const heroCards = hole.trim() ? parseCards(hole) : undefined;
      if (heroCards && heroCards.length !== 2)
        throw new Error("底牌必须正好两张");
      const boardCards = board.trim() ? parseCards(board) : [];
      const count = opponents + 1;
      const dealerSeat =
        position === "BTN"
          ? 0
          : position === "SB"
            ? count - 1
            : Math.max(0, count - 2);
      const settings = {
        ...data.settings,
        seatCount: count,
        startingStackBb: stack,
      };
      const scenarioData = { ...data, settings };
      const game = startTrainingScenario({
        players: buildPlayers(scenarioData),
        dealerSeat,
        smallBlind: settings.smallBlind,
        bigBlind: settings.bigBlind,
        seed: Date.now(),
        heroId: HERO_ID,
        heroHoleCards: heroCards as [Card, Card] | undefined,
        board: boardCards,
        startStreet: street,
        handId: `scenario-${Date.now()}`,
      });
      onStart(game);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "无法创建训练场景");
    }
  };
  return (
    <section className="panel scenario-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">单手牌训练</p>
          <h2>构建一个决策节点</h2>
        </div>
      </div>
      <p className="panel-copy">
        牌使用简写输入，例如 <code>AS KH</code>
        。未指定的公共牌会从剩余牌堆随机补齐。
      </p>
      <div className="scenario-grid">
        <label>
          你的底牌
          <input
            value={hole}
            onChange={(event) => setHole(event.target.value)}
            placeholder="AS KH；留空为随机"
          />
        </label>
        <label>
          起始街
          <select
            value={street}
            onChange={(event) => setStreet(event.target.value as typeof street)}
          >
            <option value="preflop">翻牌前</option>
            <option value="flop">翻牌</option>
            <option value="turn">转牌</option>
            <option value="river">河牌</option>
          </select>
        </label>
        <label>
          公共牌
          <input
            value={board}
            onChange={(event) => setBoard(event.target.value)}
            placeholder="QD JC 2S"
          />
        </label>
        <label>
          位置
          <select
            value={position}
            onChange={(event) => setPosition(event.target.value)}
          >
            <option>BTN</option>
            <option>SB</option>
            <option>BB</option>
          </select>
        </label>
        <label>
          有效筹码（BB）
          <input
            type="number"
            min="5"
            max="500"
            value={stack}
            onChange={(event) => setStack(Number(event.target.value))}
          />
        </label>
        <label>
          对手数量
          <input
            type="number"
            min="1"
            max="5"
            value={opponents}
            onChange={(event) => setOpponents(Number(event.target.value))}
          />
        </label>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="scenario-actions">
        <button onClick={() => setHole("")}>随机底牌</button>
        <button className="primary-button" onClick={start}>
          开始此训练
        </button>
      </div>
    </section>
  );
}

export function PokerTrainer() {
  const [data, setData] = useState<PersistedData>(() => defaultData());
  const [view, setView] = useState<View>("table");
  const [game, setGame] = useState<PokerGameState | null>(null);
  const [dealerSeat, setDealerSeat] = useState(0);
  const [betAmount, setBetAmount] = useState(2.5);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiTags, setAiTags] = useState<Record<string, string[]>>({});
  const savedHand = useRef<string | null>(null);
  const actionBarRef = useRef<HTMLElement>(null);

  const persist = useCallback((next: PersistedData) => {
    setData(next);
    if (typeof window !== "undefined") saveData(next, window.localStorage);
  }, []);
  const startCashHand = useCallback(
    (
      source: PersistedData,
      stacks?: Record<string, number>,
      button = dealerSeat,
    ) => {
      const funded = buildPlayers(source, stacks).map((player) => ({
        ...player,
        stack:
          player.stack < source.settings.bigBlind
            ? source.settings.startingStackBb * source.settings.bigBlind
            : player.stack,
      }));
      const next = startHand({
        players: funded,
        dealerSeat: button,
        smallBlind: source.settings.smallBlind,
        bigBlind: source.settings.bigBlind,
        seed: Date.now(),
        handId: `hand-${Date.now()}`,
      });
      setGame(next);
      setBetAmount(source.settings.bigBlind * 2.5);
      setError("");
      setFeedback("");
      setAiTags({});
      savedHand.current = null;
    },
    [dealerSeat],
  );

  useEffect(() => {
    const loaded = loadData(
      typeof window !== "undefined" ? window.localStorage : undefined,
    );
    setData(loaded);
    startCashHand(loaded, undefined, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!game?.settled || savedHand.current === game.handId) return;
    savedHand.current = game.handId;
    const next = appendCompletedHand(data, game, HERO_ID, aiTags);
    persist(next);
  }, [aiTags, data, game, persist]);

  const hero = game?.players.find((player) => player.id === HERO_ID);
  const pot = game ? tablePot(game) : 0;
  const toCall = game && hero ? amountToCall(game, hero) : 0;
  const assessment = useMemo(
    () =>
      game && hero && hero.holeCards.length === 2
        ? assessHand(
            hero.holeCards as [Card, Card],
            game.board,
            Math.max(
              1,
              game.players.filter(
                (player) => player.id !== HERO_ID && player.status !== "folded",
              ).length,
            ),
            game.seed + game.actionSequence,
            48,
          )
        : null,
    [game, hero],
  );

  useEffect(() => {
    if (!game || game.settled || !game.actingPlayerId || !data.settings.autoAi)
      return;
    const actor = game.players.find(
      (player) => player.id === game.actingPlayerId,
    );
    if (!actor || actor.kind !== "ai" || actor.status !== "active") return;
    const actorProfile =
      data.aiProfiles.find((profile) => profile.id === actor.personalityId) ??
      getPersonality(actor.personalityId ?? "tag");
    const speedFactor =
      actorProfile.thinkingSpeed === "fast"
        ? 0.65
        : actorProfile.thinkingSpeed === "slow"
          ? 1.45
          : 1;
    setAiBusy(true);
    const timer = window.setTimeout(() => {
      try {
        const validations = legalActionsFor(game, actor.id);
        const legalActions = Object.entries(validations)
          .filter(([, result]) => result.legal)
          .map(([action]) => action as PokerActionType);
        const opponentStacks = game.players
          .filter(
            (player) => player.id !== actor.id && player.status !== "folded",
          )
          .map((player) => player.stack);
        const userHands = data.stats.hands;
        const decision = decideAIAction(
          {
            heroHoleCards: actor.holeCards as [Card, Card],
            board: game.board,
            street: game.street,
            pot,
            toCall: amountToCall(game, actor),
            minRaiseTo:
              game.currentBet === 0
                ? game.bigBlind
                : game.currentBet + game.minRaiseIncrement,
            maxRaiseTo: actor.streetContribution + actor.stack,
            currentBet: game.currentBet,
            heroStreetContribution: actor.streetContribution,
            heroStack: actor.stack,
            effectiveStack: Math.min(
              actor.stack,
              Math.max(0, ...opponentStacks),
            ),
            position:
              game.players.length <= 1
                ? 0.5
                : actor.seat / (game.players.length - 1),
            opponents: Math.max(
              1,
              game.players.filter(
                (player) =>
                  player.id !== actor.id && player.status !== "folded",
              ).length,
            ),
            allInOpponents: game.players.filter(
              (player) => player.id !== actor.id && player.status === "all-in",
            ).length,
            legalActions,
            wasPreflopAggressor: game.lastAggressorId === actor.id,
            userProfile: {
              sampleSize: userHands,
              foldRate: userHands
                ? 1 -
                  data.stats.vpipHands /
                    Math.max(1, data.stats.vpipOpportunities)
                : 0.48,
              callRate: userHands
                ? Math.max(
                    0,
                    (data.stats.vpipHands - data.stats.pfrHands) /
                      Math.max(1, data.stats.vpipOpportunities),
                  )
                : 0.32,
              vpip: userHands
                ? data.stats.vpipHands /
                  Math.max(1, data.stats.vpipOpportunities)
                : 0.28,
              continuationBetRate: data.stats.cbetOpportunities
                ? data.stats.cbets / data.stats.cbetOpportunities
                : 0.55,
              checkRate: 0.45,
            },
          },
          actorProfile,
          game.seed + game.actionSequence * 97 + actor.seat,
        );
        let action: PokerAction = {
          type: decision.action,
          amount: decision.amount,
        };
        if (!validateAction(game, actor.id, action).legal)
          action = {
            type: legalActions.includes("check")
              ? "check"
              : legalActions.includes("call")
                ? "call"
                : "fold",
          };
        setAiTags((tags) => ({
          ...tags,
          [`${game.handId}-${game.actionSequence}-${actor.id}`]:
            decision.reasoningTags,
        }));
        setGame((current) =>
          current?.handId === game.handId &&
          current.actionSequence === game.actionSequence
            ? act(current, actor.id, action)
            : current,
        );
      } catch (reason) {
        setError(
          reason instanceof Error
            ? `AI 行动失败：${reason.message}`
            : "AI 行动失败",
        );
      } finally {
        setAiBusy(false);
      }
    }, data.settings.aiDelayMs * speedFactor);
    return () => {
      window.clearTimeout(timer);
      setAiBusy(false);
    };
  }, [
    data.aiProfiles,
    data.settings.aiDelayMs,
    data.settings.autoAi,
    data.stats,
    game,
    pot,
  ]);

  const humanAction = (action: PokerAction) => {
    if (!game || game.actingPlayerId !== HERO_ID) return;
    const validation = validateAction(game, HERO_ID, action);
    if (!validation.legal) {
      setError(
        `${validation.reason}${validation.nearestLegalAmount !== undefined ? `；最近合法值为 ${validation.nearestLegalAmount}` : ""}`,
      );
      if (validation.nearestLegalAmount !== undefined)
        setBetAmount(validation.nearestLegalAmount);
      return;
    }
    const priorToCall = toCall;
    try {
      const next = act(game, HERO_ID, action);
      const grade: TrainingRecord["grade"] =
        (action.type === "bet" || action.type === "raise") &&
        (action.amount ?? 0) > pot * 2.25 + game.currentBet
          ? "尺度异常"
          : action.type === "fold" && priorToCall === 0
            ? "偏紧"
            : action.type === "call" &&
                pot > 0 &&
                priorToCall / (pot + priorToCall) >
                  (assessment?.equityEstimate ?? 0) + 0.08
              ? "偏松"
              : action.type === "all-in" &&
                  game.street !== "river" &&
                  (assessment?.equityEstimate ?? 0) < 0.55
                ? "高风险"
                : "合理";
      const message =
        grade === "尺度异常"
          ? "尺度异常：该下注显著超过当前底池，通常需要很强的特定理由。"
          : grade === "偏紧"
            ? "偏紧：无需跟注时弃牌通常损失了免费看牌机会。"
            : grade === "偏松"
              ? "偏松：粗略胜率低于当前底池赔率门槛。"
              : grade === "高风险"
                ? "高风险：深街前全押会显著放大方差。"
                : "合理：该动作处于可辩护范围；扑克决策通常不存在唯一答案。";
      setGame(next);
      setError("");
      setFeedback(data.settings.hintStrength === "off" ? "" : message);
      persist({
        ...data,
        trainingRecords: [
          { handId: game.handId, createdAt: new Date().toISOString(), grade },
          ...data.trainingRecords,
        ].slice(0, 500),
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "动作失败");
    }
  };

  const legal = game && hero ? legalActionsFor(game, HERO_ID) : null;
  const minRaiseTo = game
    ? game.currentBet === 0
      ? game.bigBlind
      : game.currentBet + game.minRaiseIncrement
    : 0;
  const maxRaiseTo = hero ? hero.streetContribution + hero.stack : 0;
  const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
  const recommendedAction = !assessment
    ? "—"
    : assessment.equityEstimate > 0.62
      ? game?.currentBet === 0
        ? "Bet"
        : "Raise"
      : toCall === 0
        ? "Check"
        : assessment.equityEstimate + 0.04 >= potOdds
          ? "Call"
          : "Fold";
  const recommendedSizing = game
    ? Math.min(maxRaiseTo, Math.max(minRaiseTo, game.currentBet + pot * 0.66))
    : 0;
  const quickSizes = !game
    ? []
    : game.street === "preflop"
      ? [2, 2.2, 2.5, 3].map((value) => value * game.bigBlind)
      : [0.25, 0.33, 0.5, 0.66, 0.75, 1].map(
          (value) => game.currentBet + Math.max(game.bigBlind, pot * value),
        );
  const humanActionRef = useRef(humanAction);
  useEffect(() => {
    humanActionRef.current = humanAction;
  });

  useEffect(() => {
    if (
      !game ||
      game.settled ||
      game.actingPlayerId !== HERO_ID ||
      !window.matchMedia("(max-width: 760px)").matches
    )
      return;
    const frame = window.requestAnimationFrame(() => {
      actionBarRef.current?.scrollIntoView({
        behavior: data.settings.animations ? "smooth" : "auto",
        block: "end",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [data.settings.animations, game]);

  useEffect(() => {
    if (!game || game.settled || game.actingPlayerId !== HERO_ID) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.matches("input, select, textarea, [contenteditable='true']") ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      const actionByKey: Record<string, PokerAction> = {
        f: { type: "fold" },
        k: { type: "check" },
        c: { type: "call" },
        r: {
          type: game.currentBet === 0 ? "bet" : "raise",
          amount: betAmount,
        },
        a: { type: "all-in" },
      };
      const action = actionByKey[event.key.toLowerCase()];
      if (!action) return;
      event.preventDefault();
      humanActionRef.current(action);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [betAmount, game]);
  const nextHand = () => {
    if (!game) return;
    const stacks = Object.fromEntries(
      game.players.map((player) => [player.id, player.stack]),
    );
    const seats = game.players
      .filter((player) => player.stack > 0)
      .map((player) => ({ id: player.id, seat: player.seat }));
    const button = rotateButton(
      seats.length >= 2
        ? seats
        : game.players.map((player) => ({ id: player.id, seat: player.seat })),
      game.dealerSeat,
    );
    setDealerSeat(button);
    startCashHand(data, stacks, button);
  };
  const updateSettings = (patch: Partial<AppSettings>) =>
    persist({ ...data, settings: { ...data.settings, ...patch } });
  const replaceData = (next: PersistedData) => persist(next);

  return (
    <main
      className={`app-shell ${data.settings.animations ? `speed-${data.settings.animationSpeed}` : "animations-off"}`}
    >
      <header className="topbar">
        <button className="brand" onClick={() => setView("table")}>
          <span>R</span>
          <div>
            <strong>RiverLab</strong>
            <small>POKER TRAINER</small>
          </div>
        </button>
        <nav aria-label="主导航">
          {(
            [
              ["table", "训练桌", "牌桌"],
              ["scenario", "单手牌", "场景"],
              ["history", "历史与复盘", "复盘"],
              ["stats", "统计", "统计"],
              ["settings", "设置", "设置"],
            ] as [View, string, string][]
          ).map(([id, label, shortLabel]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => setView(id)}
            >
              <span className="nav-label-full">{label}</span>
              <span className="nav-label-short">{shortLabel}</span>
            </button>
          ))}
        </nav>
        <span className="local-badge">仅本地 · 非真钱</span>
      </header>
      <div className="app-content">
        {view === "table" && game && (
          <div className="table-view">
            <section className="table-toolbar">
              <div>
                <p className="eyebrow">标准现金桌训练</p>
                <h1>
                  {data.settings.seatCount}-max ·{" "}
                  {data.settings.startingStackBb} BB
                </h1>
              </div>
              <div className="toolbar-actions">
                <button onClick={() => startCashHand(data)}>重新开局</button>
                <button
                  onClick={() => {
                    const stacks = Object.fromEntries(
                      game.players.map((player) => [
                        player.id,
                        player.id === HERO_ID
                          ? data.settings.startingStackBb *
                            data.settings.bigBlind
                          : player.stack,
                      ]),
                    );
                    startCashHand(data, stacks, game.dealerSeat);
                  }}
                >
                  重新买入
                </button>
              </div>
            </section>
            <PokerTable game={game} aiBusy={aiBusy} />
            <section className="info-strip">
              <span>
                <small>底池</small>
                {formatChips(pot)} BB
              </span>
              <span>
                <small>跟注</small>
                {formatChips(toCall)} BB
              </span>
              <span>
                <small>最小加注到</small>
                {formatChips(minRaiseTo)} BB
              </span>
              <span>
                <small>有效筹码</small>
                {formatChips(
                  Math.min(
                    hero?.stack ?? 0,
                    Math.max(
                      0,
                      ...game.players
                        .filter(
                          (player) =>
                            player.id !== HERO_ID && player.status !== "folded",
                        )
                        .map((player) => player.stack),
                    ),
                  ),
                )}{" "}
                BB
              </span>
              <span>
                <small>SPR</small>
                {pot ? ((hero?.stack ?? 0) / pot).toFixed(1) : "—"}
              </span>
              <span>
                <small>位置 / 街</small>
                {hero?.positionLabel} · {game.street}
              </span>
              <span>
                <small>剩余玩家</small>
                {
                  game.players.filter(
                    (player) =>
                      player.status !== "folded" && player.status !== "busted",
                  ).length
                }
              </span>
              {data.settings.showPotOdds && (
                <span>
                  <small>底池赔率</small>
                  {toCall
                    ? `${((toCall / (pot + toCall)) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              )}
              {data.settings.showEquity && assessment && (
                <span>
                  <small>粗略胜率</small>
                  {(assessment.equityEstimate * 100).toFixed(0)}%
                </span>
              )}
              {data.settings.showOuts && assessment && (
                <span>
                  <small>估算 Outs</small>≈{" "}
                  {Math.round(assessment.drawStrength * 16)}
                </span>
              )}
              {data.settings.showRecommendedAction && (
                <span>
                  <small>可选建议</small>
                  {recommendedAction}
                </span>
              )}
              {data.settings.showRecommendedSizing && (
                <span>
                  <small>参考尺度</small>
                  {formatChips(recommendedSizing)} BB
                </span>
              )}
              {data.settings.showBoardWarnings &&
                assessment &&
                assessment.boardDanger > 0.58 && (
                  <span>
                    <small>牌面提示</small>
                    危险度较高
                  </span>
                )}
            </section>
            {game.settled ? (
              <section className="action-bar complete-bar">
                <div>
                  <p className="eyebrow">本手已结算</p>
                  <strong>
                    {game.outcome?.reason === "showdown"
                      ? "摊牌完成"
                      : "弃牌获胜"}
                  </strong>
                </div>
                <button className="primary-button" onClick={nextHand}>
                  下一手
                </button>
              </section>
            ) : (
              <section
                ref={actionBarRef}
                className={
                  "action-bar " +
                  (game.actingPlayerId === HERO_ID ? "is-hero-turn" : "")
                }
                aria-label="玩家操作区"
              >
                <div className="decision-status" aria-live="polite">
                  <span
                    className={
                      game.actingPlayerId === HERO_ID
                        ? "turn-dot active"
                        : "turn-dot"
                    }
                  />
                  {game.actingPlayerId === HERO_ID
                    ? "轮到你行动"
                    : `${game.players.find((player) => player.id === game.actingPlayerId)?.name ?? "牌桌"} 行动中`}
                  <span className="decision-context">
                    底池 {formatChips(pot)} · 跟注 {formatChips(toCall)} ·{" "}
                    {hero?.positionLabel || "—"}
                  </span>
                  {feedback && <small>{feedback}</small>}
                  {error && <small className="error-message">{error}</small>}
                </div>
                <div className="bet-controls">
                  <div className="quick-sizes">
                    {quickSizes.map((amount, index) => (
                      <button
                        key={`${amount}-${index}`}
                        onClick={() =>
                          setBetAmount(
                            Math.min(
                              maxRaiseTo,
                              Math.max(minRaiseTo, Number(amount.toFixed(2))),
                            ),
                          )
                        }
                      >
                        {game.street === "preflop"
                          ? `${[2, 2.2, 2.5, 3][index]}BB`
                          : `${[25, 33, 50, 66, 75, 100][index]}%`}
                      </button>
                    ))}
                    <button onClick={() => setBetAmount(maxRaiseTo)}>
                      All-in
                    </button>
                  </div>
                  <div className="sizing-input">
                    <input
                      aria-label="下注滑杆"
                      type="range"
                      min={Math.min(minRaiseTo, maxRaiseTo)}
                      max={maxRaiseTo}
                      step={data.settings.smallBlind}
                      value={Math.min(maxRaiseTo, Math.max(0, betAmount))}
                      onChange={(event) =>
                        setBetAmount(Number(event.target.value))
                      }
                    />
                    <input
                      aria-label="下注总额"
                      type="number"
                      min={0}
                      max={maxRaiseTo}
                      step={data.settings.smallBlind}
                      value={betAmount}
                      onChange={(event) =>
                        setBetAmount(Number(event.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="action-buttons">
                  <button
                    disabled={
                      game.actingPlayerId !== HERO_ID || !legal?.fold.legal
                    }
                    onClick={() => humanAction({ type: "fold" })}
                  >
                    Fold <kbd aria-hidden="true">F</kbd>
                  </button>
                  <button
                    disabled={
                      game.actingPlayerId !== HERO_ID || !legal?.check.legal
                    }
                    onClick={() => humanAction({ type: "check" })}
                  >
                    Check <kbd aria-hidden="true">K</kbd>
                  </button>
                  <button
                    disabled={
                      game.actingPlayerId !== HERO_ID || !legal?.call.legal
                    }
                    onClick={() => humanAction({ type: "call" })}
                  >
                    Call {formatChips(toCall)} <kbd aria-hidden="true">C</kbd>
                  </button>
                  <button
                    disabled={
                      game.actingPlayerId !== HERO_ID ||
                      !(game.currentBet === 0 ? legal?.bet : legal?.raise)
                    }
                    onClick={() =>
                      humanAction({
                        type: game.currentBet === 0 ? "bet" : "raise",
                        amount: betAmount,
                      })
                    }
                  >
                    {game.currentBet === 0 ? "Bet" : "Raise"}{" "}
                    <kbd aria-hidden="true">R</kbd>
                  </button>
                  <button
                    disabled={
                      game.actingPlayerId !== HERO_ID ||
                      !legal?.["all-in"].legal
                    }
                    onClick={() => humanAction({ type: "all-in" })}
                  >
                    All-in <kbd aria-hidden="true">A</kbd>
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
        {view === "scenario" && (
          <ScenarioView
            data={data}
            onStart={(next) => {
              setGame(next);
              setView("table");
              setAiTags({});
              savedHand.current = null;
            }}
          />
        )}
        {view === "history" && (
          <HistoryView
            data={data}
            onNote={(id, note) =>
              persist({
                ...data,
                playerNotes: { ...data.playerNotes, [id]: note },
              })
            }
          />
        )}
        {view === "stats" && <StatsView data={data} />}
        {view === "settings" && (
          <SettingsView
            data={data}
            updateSettings={updateSettings}
            updateProfile={(id, patch) =>
              persist({
                ...data,
                aiProfiles: data.aiProfiles.map((profile) =>
                  profile.id === id ? { ...profile, ...patch } : profile,
                ),
              })
            }
            replaceData={replaceData}
          />
        )}
      </div>
    </main>
  );
}
