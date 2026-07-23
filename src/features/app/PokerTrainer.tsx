"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/preserve-manual-memoization */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
import type { HandEvaluation } from "../../engine/evaluator/evaluator";
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
  migrateData,
  saveData,
} from "../../storage/storage";
import type {
  AppSettings,
  PersistedData,
  StoredHand,
  TrainingRecord,
} from "../../storage/types";
import { LanguageProvider, useI18n } from "./i18n";

type View = "table" | "scenario" | "history" | "stats" | "settings";
const HERO_ID = "hero";
const suitGlyph: Record<Card["suit"], string> = {
  clubs: "♣",
  diamonds: "♦",
  hearts: "♥",
  spades: "♠",
};

function CardView({
  card,
  hidden = false,
  className = "",
}: {
  card?: Card;
  hidden?: boolean;
  className?: string;
}) {
  const { suitLabel, t } = useI18n();
  if (hidden)
    return (
      <span
        className={`playing-card card-back ${className}`}
        aria-label={t("牌背")}
      >
        <span className="card-back-pattern" aria-hidden="true" />
      </span>
    );
  if (!card)
    return (
      <span
        className={`playing-card card-placeholder ${className}`}
        aria-label={t("尚未发出的公共牌")}
      />
    );
  const red = card.suit === "hearts" || card.suit === "diamonds";
  const label = rankLabel(card.rank);
  const suit = suitGlyph[card.suit];
  return (
    <span
      className={`playing-card card-face ${red ? "red-card" : ""} ${className}`}
      aria-label={`${label} ${suitLabel(card.suit)}`}
    >
      <span className="card-corner card-corner-top" aria-hidden="true">
        <strong>{label}</strong>
        <small>{suit}</small>
      </span>
      <span className="card-center-suit" aria-hidden="true">
        {suit}
      </span>
      <span className="card-corner card-corner-bottom" aria-hidden="true">
        <strong>{label}</strong>
        <small>{suit}</small>
      </span>
    </span>
  );
}

function formatChips(value: number) {
  return Number(value.toFixed(2)).toString();
}

function roundChips(value: number) {
  return Number(value.toFixed(2));
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
  if (game.settled && game.outcome) {
    return game.outcome.pots
      .filter((pot) => pot.contributors.length > 1)
      .reduce((sum, pot) => sum + pot.amount, 0);
  }
  return game.players.reduce(
    (sum, player) => sum + player.totalContribution,
    0,
  );
}

function handEvaluationDetail(
  evaluation: HandEvaluation,
  locale: "zh-CN" | "en",
): string {
  const ranks = evaluation.tiebreakers.map((rank) =>
    rankLabel(rank as Card["rank"]),
  );
  const kickers =
    locale === "zh-CN"
      ? `踢脚 ${ranks.slice(1).join(" · ")}`
      : `kickers ${ranks.slice(1).join(" · ")}`;

  switch (evaluation.category) {
    case "high-card":
      return locale === "zh-CN"
        ? `${ranks[0]} 高牌 · ${kickers}`
        : `${ranks[0]}-high · ${kickers}`;
    case "pair":
      return locale === "zh-CN"
        ? `${ranks[0]} 对 · ${kickers}`
        : `Pair of ${ranks[0]} · ${kickers}`;
    case "two-pair":
      return locale === "zh-CN"
        ? `${ranks[0]} 与 ${ranks[1]} 两对 · 踢脚 ${ranks[2]}`
        : `${ranks[0]} and ${ranks[1]} · kicker ${ranks[2]}`;
    case "three-of-a-kind":
      return locale === "zh-CN"
        ? `${ranks[0]} 三条 · ${kickers}`
        : `Trip ${ranks[0]} · ${kickers}`;
    case "straight":
      return locale === "zh-CN"
        ? `${ranks[0]} 高顺子`
        : `${ranks[0]}-high straight`;
    case "flush":
      return locale === "zh-CN"
        ? `${ranks.join(" · ")} 同花`
        : `${ranks.join(" · ")} flush`;
    case "full-house":
      return locale === "zh-CN"
        ? `${ranks[0]} 带 ${ranks[1]} 葫芦`
        : `${ranks[0]} full of ${ranks[1]}`;
    case "four-of-a-kind":
      return locale === "zh-CN"
        ? `${ranks[0]} 四条 · 踢脚 ${ranks[1]}`
        : `Quad ${ranks[0]} · kicker ${ranks[1]}`;
    case "straight-flush":
      return locale === "zh-CN"
        ? `${ranks[0]} 高同花顺`
        : `${ranks[0]}-high straight flush`;
  }
}

function positionScore(positionLabel: string): number {
  if (positionLabel.startsWith("BTN")) return 1;
  return (
    {
      CO: 0.78,
      HJ: 0.52,
      UTG: 0.18,
      SB: 0.12,
      BB: 0.28,
    }[positionLabel] ?? 0.5
  );
}

function availableScenarioPositions(playerCount: number): string[] {
  if (playerCount <= 2) return ["BTN", "BB"];
  if (playerCount === 3) return ["BTN", "SB", "BB"];
  if (playerCount === 4) return ["BTN", "SB", "BB", "CO"];
  if (playerCount === 5) return ["BTN", "SB", "BB", "UTG", "CO"];
  return ["BTN", "SB", "BB", "UTG", "HJ", "CO"];
}

function dealerSeatForPosition(position: string, playerCount: number): number {
  if (position === "BTN") return 0;
  if (position === "SB") return playerCount - 1;
  if (position === "BB") return playerCount - 2;
  if (position === "UTG") return playerCount - 3;
  if (position === "HJ") return playerCount - 4;
  if (position === "CO") return 1;
  return 0;
}

function PokerTable({
  game,
  aiBusy,
}: {
  game: PokerGameState;
  aiBusy: boolean;
}) {
  const { actionLabel, aiName, locale, statusLabel, streetLabel, t } =
    useI18n();
  const displayName = (player: PokerGameState["players"][number]) =>
    player.kind === "ai"
      ? aiName(player.personalityId, player.name)
      : player.name;
  const reveal = game.settled && game.outcome?.reason === "showdown";
  const lastRecord = game.actions.at(-1);
  const lastActorId = lastRecord?.playerId;
  const dealSeats = [...game.players]
    .filter((player) => player.status !== "busted")
    .sort((left, right) => left.seat - right.seat);
  const firstDealIndex = dealSeats.findIndex(
    (player) => player.seat > game.dealerSeat,
  );
  const dealStart = firstDealIndex >= 0 ? firstDealIndex : 0;
  const clockwiseDealOrder = [
    ...dealSeats.slice(dealStart),
    ...dealSeats.slice(0, dealStart),
  ];
  const dealOrderByPlayer = new Map(
    clockwiseDealOrder.map((player, order) => [player.id, order]),
  );
  const sidePotCount =
    game.outcome?.pots
      .slice(1)
      .filter((sidePot) => sidePot.contributors.length > 1).length ?? 0;
  const winnerIds = game.outcome?.showdown
    ? [
        ...new Set(
          game.outcome.showdown.awards
            .filter((award) => award.pot.contributors.length > 1)
            .flatMap((award) => award.winnerIds),
        ),
      ]
    : Object.entries(game.outcome?.payouts ?? {})
        .filter(([, amount]) => amount > 0)
        .map(([id]) => id);
  const winnerNames = winnerIds
    .map((id) => {
      const player = game.players.find((candidate) => candidate.id === id);
      return player ? displayName(player) : undefined;
    })
    .filter(Boolean)
    .join(" / ");
  const [showShuffle, setShowShuffle] = useState(true);
  useEffect(() => {
    setShowShuffle(true);
    const timer = window.setTimeout(() => setShowShuffle(false), 720);
    return () => window.clearTimeout(timer);
  }, [game.handId]);
  return (
    <div
      className={`poker-table street-${game.street} ${game.settled ? "is-settled" : ""}`}
      aria-label={t("德州扑克牌桌")}
    >
      <div className="table-rail" aria-hidden="true" />
      <div
        className="table-flow-ring"
        aria-label={`${t("顺时针行动")}。${t("从庄家左侧开始发牌")}`}
      >
        <i className="flow-arrow flow-arrow-top" aria-hidden="true">
          ›
        </i>
        <i className="flow-arrow flow-arrow-right" aria-hidden="true">
          ⌄
        </i>
        <i className="flow-arrow flow-arrow-bottom" aria-hidden="true">
          ‹
        </i>
        <i className="flow-arrow flow-arrow-left" aria-hidden="true">
          ⌃
        </i>
      </div>
      <div className="table-flow-legend">
        <span aria-hidden="true">↻</span>
        <div>
          <strong>{t("顺时针行动")}</strong>
          <small>{t("从庄家左侧开始发牌")}</small>
        </div>
      </div>
      {showShuffle && (
        <div
          className="shuffle-theater"
          key={`shuffle-${game.handId}`}
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
          <span />
          <i>
            {t("洗牌")} · {t("准备发牌")}
          </i>
        </div>
      )}
      <div className="table-center">
        <div className="pot-pill">
          <span className="pot-stack" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            {t("底池")} <strong>{formatChips(tablePot(game))} BB</strong>
          </span>
          {sidePotCount > 0 && (
            <small>
              {sidePotCount}{" "}
              {locale === "en"
                ? sidePotCount === 1
                  ? "side pot"
                  : t("个边池")
                : t("个边池")}
            </small>
          )}
        </div>
        <div className="community-cards" aria-label={t("公共牌")}>
          {Array.from({ length: 5 }, (_, index) => {
            const card = game.board[index];
            return (
              <span
                className={`board-card-slot ${card ? "has-card street-reveal" : ""}`}
                key={card ? `${card.rank}-${card.suit}` : `slot-${index}`}
                style={{ animationDelay: `${index < 3 ? index * 75 : 0}ms` }}
              >
                <CardView card={card} />
              </span>
            );
          })}
        </div>
        <p className="street-label">{streetLabel(game.street).toUpperCase()}</p>
        {game.settled && game.outcome && (
          <div className="pot-award" key={`award-${game.handId}`} role="status">
            <span aria-hidden="true">● ● ●</span>
            {winnerNames ? `${winnerNames} · ` : ""}
            {game.outcome.reason === "showdown" ? t("摊牌结算") : t("弃牌获胜")}
          </div>
        )}
      </div>
      {game.players.map((player, index) => {
        const active = game.actingPlayerId === player.id;
        const visualIndex =
          (game.players.length - player.seat) % game.players.length;
        const seatClass = `seat seat-${visualIndex}-${game.players.length}`;
        const isLastActor = lastActorId === player.id;
        const lastActionType = isLastActor
          ? lastRecord?.action.type
          : undefined;
        const actionClass = lastActionType ? `action-${lastActionType}` : "";
        const isSmallBlind = player.positionLabel.includes("SB");
        const isBigBlind = player.positionLabel === "BB";
        const blindClass = isSmallBlind
          ? "small-blind"
          : isBigBlind
            ? "big-blind"
            : "";
        const playerName = displayName(player);
        return (
          <article
            key={player.id}
            className={`${seatClass} ${active ? "is-acting" : ""} ${isLastActor ? "is-last-actor" : ""} ${actionClass} ${player.status === "folded" ? "is-folded" : ""}`}
            aria-label={
              locale === "zh-CN"
                ? `${playerName}，${t("筹码")} ${formatChips(player.stack)}`
                : `${playerName}, ${t("筹码")} ${formatChips(player.stack)}`
            }
            data-acting-label={t("当前行动")}
            data-deal-order={dealOrderByPlayer.get(player.id)}
            data-last-action={lastActionType}
            data-seat={player.seat}
          >
            {player.positionLabel.startsWith("BTN") && (
              <span className="dealer-button" aria-label={t("庄家按钮")}>
                D
              </span>
            )}
            <div className="seat-topline">
              <strong>{playerName}</strong>
              <span
                className={`seat-position ${blindClass}`}
                aria-label={
                  isSmallBlind
                    ? `${t("小盲")}，${formatChips(game.smallBlind)} BB`
                    : isBigBlind
                      ? `${t("大盲")}，${formatChips(game.bigBlind)} BB`
                      : player.positionLabel
                }
              >
                {isSmallBlind ? (
                  <>
                    <b>{t("小盲")}</b>
                    <small>SB · {formatChips(game.smallBlind)}</small>
                  </>
                ) : isBigBlind ? (
                  <>
                    <b>{t("大盲")}</b>
                    <small>BB · {formatChips(game.bigBlind)}</small>
                  </>
                ) : (
                  player.positionLabel
                )}
              </span>
            </div>
            <div className="hole-cards">
              {player.holeCards.map((card, cardIndex) => {
                const dealOrder = dealOrderByPlayer.get(player.id) ?? index;
                const dealStep = cardIndex * dealSeats.length + dealOrder;
                return (
                  <span
                    className="dealt-card"
                    data-deal-step={dealStep}
                    key={`${game.handId}-${player.id}-${cardIndex}`}
                    style={
                      {
                        animationDelay: `${620 + dealStep * 105}ms`,
                        "--deal-step": dealStep,
                      } as CSSProperties
                    }
                  >
                    <CardView
                      card={card}
                      hidden={
                        player.kind === "ai" &&
                        !(reveal && player.status !== "folded")
                      }
                    />
                  </span>
                );
              })}
            </div>
            <div className="seat-meta">
              <span>{formatChips(player.stack)} BB</span>
              <span>
                {player.status === "all-in"
                  ? actionLabel("all-in").toUpperCase()
                  : player.lastAction
                    ? actionLabel(player.lastAction)
                    : active && aiBusy
                      ? t("思考中")
                      : statusLabel(player.status)}
              </span>
            </div>
            {player.streetContribution > 0 && (
              <span
                className="seat-bet"
                key={`${game.actionSequence}-${player.streetContribution}`}
              >
                <span className="mini-chip-stack" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>
                  {t("投入")} {formatChips(player.streetContribution)}
                </span>
              </span>
            )}
            {isLastActor && player.lastAction && (
              <span
                className={`action-callout action-callout-${lastActionType}`}
                key={`${game.actionSequence}-${player.id}`}
                aria-hidden="true"
              >
                {actionLabel(player.lastAction)}
              </span>
            )}
            {isLastActor && lastActionType && (
              <span
                className={`action-effect action-effect-${lastActionType}`}
                key={`effect-${game.actionSequence}-${player.id}`}
                aria-hidden="true"
              >
                <i />
                <i />
              </span>
            )}
          </article>
        );
      })}
    </div>
  );
}

function ShowdownBreakdown({ game }: { game: PokerGameState }) {
  const { aiName, categoryLabel, locale, t } = useI18n();
  const showdown = game.outcome?.showdown;
  if (!showdown) return null;

  const playerName = (id: string) => {
    const player = game.players.find((candidate) => candidate.id === id);
    if (!player) return id;
    return player.kind === "ai"
      ? aiName(player.personalityId, player.name)
      : player.name;
  };
  const winnerIds = new Set(
    showdown.awards.flatMap((award) => award.winnerIds),
  );
  const winnings = Object.fromEntries(
    Object.keys(showdown.evaluations).map((id) => [
      id,
      showdown.awards.reduce((sum, award) => sum + (award.shares[id] ?? 0), 0),
    ]),
  );
  const evaluatedPlayers = game.players
    .filter((player) => showdown.evaluations[player.id])
    .sort((left, right) => {
      const winnerDifference =
        Number(winnerIds.has(right.id)) - Number(winnerIds.has(left.id));
      return winnerDifference || left.seat - right.seat;
    });
  const uncalledReturns = Object.entries(
    showdown.uncalledReturns ?? game.outcome?.uncalledReturns ?? {},
  ).filter(([, amount]) => amount > 0);

  return (
    <section className="showdown-breakdown" aria-label={t("正式牌型比较")}>
      <div className="showdown-breakdown-heading">
        <div>
          <p className="eyebrow">{t("正式牌型比较")}</p>
          <strong>{t("只比较最佳五张牌")}</strong>
        </div>
        <small>{t("同牌型按比较项逐级决定胜负")}</small>
      </div>
      <div className="showdown-player-grid">
        {evaluatedPlayers.map((player) => {
          const evaluation = showdown.evaluations[player.id];
          const won = winnerIds.has(player.id);
          return (
            <article
              className={`showdown-player ${won ? "is-winner" : ""}`}
              key={player.id}
            >
              <div className="showdown-player-title">
                <span>
                  {won ? t("获胜") : t("摊牌")}
                  {won && winnings[player.id] > 0
                    ? ` +${formatChips(winnings[player.id])} BB`
                    : ""}
                </span>
                <strong>{playerName(player.id)}</strong>
              </div>
              <div className="showdown-card-line">
                <div aria-label={t("底牌")}>
                  {player.holeCards.map((card) => (
                    <CardView
                      card={card}
                      className="showdown-mini-card"
                      key={`${card.rank}-${card.suit}`}
                    />
                  ))}
                </div>
                <i aria-hidden="true">→</i>
                <div aria-label={t("最佳五张")}>
                  {evaluation.cards.map((card) => (
                    <CardView
                      card={card}
                      className="showdown-mini-card"
                      key={`${card.rank}-${card.suit}`}
                    />
                  ))}
                </div>
              </div>
              <div className="showdown-hand-label">
                <strong>{categoryLabel(evaluation.category)}</strong>
                <span>{handEvaluationDetail(evaluation, locale)}</span>
              </div>
            </article>
          );
        })}
      </div>
      <div className="showdown-pot-ledger">
        {showdown.awards.map((award, index) => (
          <span key={award.pot.id}>
            <small>{index === 0 ? t("主池") : `${t("边池")} ${index}`}</small>
            <strong>{formatChips(award.pot.amount)} BB</strong>
            <i aria-hidden="true">→</i>
            {award.winnerIds.map((id) => (
              <b key={id}>
                {playerName(id)} +{formatChips(award.shares[id])}
              </b>
            ))}
          </span>
        ))}
        {uncalledReturns.map(([id, amount]) => (
          <span className="uncalled-return" key={id}>
            <small>{t("无人跟注退回")}</small>
            <strong>{formatChips(amount)} BB</strong>
            <i aria-hidden="true">→</i>
            <b>{playerName(id)}</b>
          </span>
        ))}
      </div>
    </section>
  );
}

function ReplayPanel({ hand }: { hand: StoredHand }) {
  const {
    actionLabel,
    aiName,
    categoryLabel,
    decisionTagLabel,
    formatDate,
    locale,
    streetLabel,
    t,
  } = useI18n();
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
          <p className="eyebrow">{t("逐街复盘")}</p>
          <h2>{formatDate(hand.completedAt)}</h2>
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
              {(() => {
                const player = hand.game.players.find(
                  (player) => player.id === current.playerId,
                );
                return player?.kind === "ai"
                  ? aiName(player.personalityId, player.name)
                  : player?.name;
              })()}
            </strong>{" "}
            · {streetLabel(current.street)} · {actionLabel(current.action.type)}
            {current.action.amount
              ? ` ${t("到")} ${current.action.amount}`
              : ""}
            <small>
              {t("底池")} {formatChips(current.potBefore)} →{" "}
              {formatChips(current.potAfter)}
            </small>
          </>
        ) : (
          <>
            <strong>{t("起始状态")}</strong>
            <small>
              {t("盲注")} {hand.game.smallBlind}/{hand.game.bigBlind}
            </small>
          </>
        )}
      </div>
      <div className="replay-controls">
        <button onClick={() => setStep(Math.max(0, step - 1))}>
          {t("上一步")}
        </button>
        <button onClick={() => setPlaying((value) => !value)}>
          {playing ? t("暂停") : t("自动播放")}
        </button>
        <button onClick={() => setStep(Math.min(actions.length, step + 1))}>
          {t("下一步")}
        </button>
        <span>
          {step}/{actions.length}
        </span>
      </div>
      {hand.game.outcome?.showdown && (
        <div className="showdown-summary">
          <strong>{t("摊牌")}</strong>
          {Object.keys(hand.game.outcome.showdown.evaluations).map((id) => (
            <span key={id}>
              {(() => {
                const player = hand.game.players.find(
                  (candidate) => candidate.id === id,
                );
                return player?.kind === "ai"
                  ? aiName(player.personalityId, player.name)
                  : player?.name;
              })()}
              {locale === "zh-CN" ? "：" : ": "}
              {categoryLabel(
                hand.game.outcome?.showdown?.evaluations[id].category ?? "",
              )}
            </span>
          ))}
        </div>
      )}
      <div className="reason-tags">
        {Object.values(hand.aiDecisionTags)
          .flat()
          .slice(0, 12)
          .map((tag, index) => (
            <span key={`${tag}-${index}`}>{decisionTagLabel(tag)}</span>
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
  const { formatDate, t } = useI18n();
  const [selected, setSelected] = useState(data.recentHands[0]?.id ?? "");
  const hand =
    data.recentHands.find((candidate) => candidate.id === selected) ??
    data.recentHands[0];
  return (
    <div className="content-grid history-grid">
      <section className="panel history-list">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{t("最近牌局")}</p>
            <h2>{data.recentHands.length} / 100</h2>
          </div>
        </div>
        {data.recentHands.length === 0 ? (
          <p className="empty-state">
            {t("完成一手牌后，行动和底池变化会保存在这里。")}
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
              <span>{formatDate(item.completedAt)}</span>
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
            {t("玩家笔记")}
            <textarea
              value={data.playerNotes[hand.id] ?? ""}
              onChange={(event) => onNote(hand.id, event.target.value)}
              placeholder={t("记录对手习惯、自己的思路或下次要复查的节点…")}
            />
          </label>
        </div>
      )}
    </div>
  );
}

function StatsView({ data }: { data: PersistedData }) {
  const { t } = useI18n();
  const stats = data.stats;
  const rate = (value: number, total: number) =>
    total ? `${((value / total) * 100).toFixed(1)}%` : "—";
  const items = [
    [t("总手数"), stats.hands],
    [
      t("盈亏"),
      `${stats.profitBb >= 0 ? "+" : ""}${formatChips(stats.profitBb)} BB`,
    ],
    [
      "BB / 100",
      stats.hands ? formatChips((stats.profitBb / stats.hands) * 100) : "—",
    ],
    ["VPIP", rate(stats.vpipHands, stats.vpipOpportunities)],
    ["PFR", rate(stats.pfrHands, stats.pfrOpportunities)],
    ["3-bet", rate(stats.threeBets, stats.threeBetOpportunities)],
    [t("翻牌持续下注"), rate(stats.cbets, stats.cbetOpportunities)],
    [t("到摊牌率"), rate(stats.showdowns, stats.hands)],
    [t("摊牌胜率"), rate(stats.showdownWins, stats.showdowns)],
  ];
  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{t("长期统计")}</p>
            <h2>{t("训练概览")}</h2>
          </div>
          <span className="sample-warning">{t("少量样本统计不稳定")}</span>
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
            <p className="eyebrow">{t("位置表现")}</p>
            <h2>{t("按位置拆分")}</h2>
          </div>
        </div>
        <div className="position-table">
          <div className="position-row header">
            <span>{t("位置")}</span>
            <span>{t("手数")}</span>
            <span>{t("盈亏")}</span>
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
  const { aiDescription, aiName, profileLabel, t } = useI18n();
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
    ["animations", t("短动画")],
    ["autoAi", t("自动 AI 行动")],
    ["showEquity", t("显示粗略胜率")],
    ["showPotOdds", t("显示底池赔率")],
    ["showOuts", t("显示 outs")],
    ["showRecommendedAction", t("推荐动作")],
    ["showRecommendedSizing", t("推荐尺度")],
    ["showBoardWarnings", t("危险牌面提示")],
    ["sound", t("声音")],
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
  const deckThemes: {
    id: AppSettings["deckTheme"];
    name: string;
    description: string;
  }[] = [
    {
      id: "river-current",
      name: t("深海流纹"),
      description: t("蓝绿雕版 · 默认"),
    },
    {
      id: "burgundy-weave",
      name: t("酒红编织"),
      description: t("经典亚麻纹理"),
    },
    {
      id: "graphite",
      name: t("石墨构造"),
      description: t("现代碳纤几何"),
    },
  ];

  return (
    <div className="settings-layout">
      <section className="panel settings-section">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{t("牌桌")}</p>
            <h2>{t("基础设置")}</h2>
          </div>
        </div>
        <div className="form-grid">
          <label>
            {t("玩家名称")}
            <input
              value={data.settings.playerName}
              onChange={(event) =>
                updateSettings({ playerName: event.target.value })
              }
            />
          </label>
          <label>
            {t("桌面人数")}
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
            {t("初始筹码（BB）")}
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
            {t("小盲")}
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
            {t("大盲")}
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
            {t("AI 思考延迟（ms）")}
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
            <small className="form-helper">
              {t("开启动画时，机器人会至少留出约一秒观察时间。")}
            </small>
          </label>
          <label>
            {t("动画速度")}
            <select
              value={data.settings.animationSpeed}
              onChange={(event) =>
                updateSettings({
                  animationSpeed: event.target
                    .value as AppSettings["animationSpeed"],
                })
              }
            >
              <option value="fast">{t("快速")}</option>
              <option value="normal">{t("标准")}</option>
              <option value="slow">{t("舒缓")}</option>
            </select>
          </label>
          <label>
            {t("训练提示强度")}
            <select
              value={data.settings.hintStrength}
              onChange={(event) =>
                updateSettings({
                  hintStrength: event.target
                    .value as AppSettings["hintStrength"],
                })
              }
            >
              <option value="off">{t("关闭")}</option>
              <option value="light">{t("轻提示")}</option>
              <option value="full">{t("完整")}</option>
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
        <div className="deck-theme-setting">
          <div>
            <strong>{t("牌背收藏")}</strong>
            <small>{t("仅改变视觉，不影响发牌与概率")}</small>
          </div>
          <div
            className="deck-theme-grid"
            role="group"
            aria-label={t("选择牌背")}
          >
            {deckThemes.map((theme) => (
              <button
                type="button"
                key={theme.id}
                className={
                  data.settings.deckTheme === theme.id ? "selected" : ""
                }
                aria-pressed={data.settings.deckTheme === theme.id}
                onClick={() => updateSettings({ deckTheme: theme.id })}
              >
                <span
                  className={`deck-preview deck-preview-${theme.id}`}
                  aria-hidden="true"
                />
                <span>
                  <strong>{theme.name}</strong>
                  <small>{theme.description}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="panel settings-section">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{t("对手池")}</p>
            <h2>{t("AI 个性")}</h2>
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
                <strong>{aiName(item.id, item.name)}</strong>
                <span>{aiDescription(item.id, item.description)}</span>
                <small>{selected ? t("已上桌") : t("未选择")}</small>
              </button>
            );
          })}
        </div>
        {profile && (
          <div className="profile-editor">
            <div className="profile-editor-heading">
              <div>
                <h3>{aiName(profile.id, profile.name)}</h3>
                {habit && (
                  <small>
                    {t("实际")} {habit.hands} {t("手")} · VPIP{" "}
                    {(habit.vpip * 100).toFixed(0)}% · PFR{" "}
                    {(habit.pfr * 100).toFixed(0)}% · AF{" "}
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
                  ? t("移出对手池")
                  : t("加入对手池")}
              </button>
            </div>
            {profileKeys.map((key) => (
              <label className="range-row" key={key}>
                <span>{profileLabel(key)}</span>
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
            <p className="eyebrow">{t("本地数据")}</p>
            <h2>{t("导入与导出")}</h2>
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
            {t("导出设置")}
          </button>
          <button
            onClick={() => exportJson("riverlab-hands.json", data.recentHands)}
          >
            {t("导出牌局记录")}
          </button>
          <button onClick={() => importRef.current?.click()}>
            {t("导入设置")}
          </button>
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
                replaceData(
                  migrateData({
                    ...data,
                    settings: { ...data.settings, ...(parsed.settings ?? {}) },
                    aiProfiles: parsed.aiProfiles ?? data.aiProfiles,
                  }),
                );
              } catch {
                window.alert(t("无法读取该设置文件"));
              }
            }}
          />
          <button
            className="danger-button"
            onClick={() => {
              if (window.confirm(t("确定重置所有统计？牌局历史不会删除。")))
                replaceData({
                  ...data,
                  stats: { ...EMPTY_STATS, byPosition: {} },
                });
            }}
          >
            {t("重置统计")}
          </button>
          <button
            className="danger-button"
            onClick={() => {
              if (window.confirm(t("确定清除全部历史牌局？此操作无法撤销。")))
                replaceData({ ...data, recentHands: [], playerNotes: {} });
            }}
          >
            {t("清除历史牌局")}
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
  const { locale, runtimeMessage, t } = useI18n();
  const [hole, setHole] = useState("AS KH");
  const [board, setBoard] = useState("");
  const [street, setStreet] = useState<"preflop" | "flop" | "turn" | "river">(
    "preflop",
  );
  const [position, setPosition] = useState("BTN");
  const [stack, setStack] = useState(100);
  const [opponents, setOpponents] = useState(2);
  const [error, setError] = useState("");
  useEffect(() => setError(""), [locale]);
  const positionOptions = availableScenarioPositions(opponents + 1);
  const effectivePosition = positionOptions.includes(position)
    ? position
    : "BTN";
  const start = () => {
    try {
      const heroCards = hole.trim() ? parseCards(hole) : undefined;
      if (heroCards && heroCards.length !== 2)
        throw new Error(t("底牌必须正好两张"));
      const boardCards = board.trim() ? parseCards(board) : [];
      const count = opponents + 1;
      const dealerSeat = dealerSeatForPosition(effectivePosition, count);
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
      setError(
        reason instanceof Error
          ? runtimeMessage(reason.message)
          : t("无法创建训练场景"),
      );
    }
  };
  return (
    <section className="panel scenario-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t("单手牌训练")}</p>
          <h2>{t("构建一个决策节点")}</h2>
        </div>
      </div>
      <p className="panel-copy">
        {t("牌使用简写输入，例如")} <code>AS KH</code>
        {t("。未指定的公共牌会从剩余牌堆随机补齐。")}
      </p>
      <div className="scenario-grid">
        <label>
          {t("你的底牌")}
          <input
            value={hole}
            onChange={(event) => setHole(event.target.value)}
            placeholder={`AS KH${t("；留空为随机")}`}
          />
        </label>
        <label>
          {t("起始街")}
          <select
            value={street}
            onChange={(event) => setStreet(event.target.value as typeof street)}
          >
            <option value="preflop">{t("翻牌前")}</option>
            <option value="flop">{t("翻牌")}</option>
            <option value="turn">{t("转牌")}</option>
            <option value="river">{t("河牌")}</option>
          </select>
        </label>
        <label>
          {t("公共牌")}
          <input
            value={board}
            onChange={(event) => setBoard(event.target.value)}
            placeholder="QD JC 2S"
          />
        </label>
        <label>
          {t("位置")}
          <select
            value={effectivePosition}
            onChange={(event) => setPosition(event.target.value)}
          >
            {positionOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          {t("有效筹码（BB）")}
          <input
            type="number"
            min="5"
            max="500"
            value={stack}
            onChange={(event) => setStack(Number(event.target.value))}
          />
        </label>
        <label>
          {t("对手数量")}
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
        <button onClick={() => setHole("")}>{t("随机底牌")}</button>
        <button className="primary-button" onClick={start}>
          {t("开始此训练")}
        </button>
      </div>
    </section>
  );
}

function PokerTrainerApp() {
  const {
    actionLabel,
    aiName,
    locale,
    runtimeMessage,
    streetLabel,
    t,
    toggleLocale,
  } = useI18n();
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

  useEffect(() => {
    setError("");
    setFeedback("");
  }, [locale]);

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
  const isScenarioHand = game?.handId.startsWith("scenario-") ?? false;
  const pot = game ? tablePot(game) : 0;
  const toCall = game && hero ? amountToCall(game, hero) : 0;
  const liveOpponentCount = game
    ? Math.max(
        1,
        game.players.filter(
          (player) => player.id !== HERO_ID && player.status !== "folded",
        ).length,
      )
    : 1;
  const assessment = useMemo(
    () =>
      game && !game.settled && hero && hero.holeCards.length === 2
        ? assessHand(
            hero.holeCards as [Card, Card],
            game.board,
            liveOpponentCount,
            game.seed + game.board.length * 997 + liveOpponentCount * 37,
            240,
          )
        : null,
    [game, hero, liveOpponentCount],
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
        ? 0.88
        : actorProfile.thinkingSpeed === "slow"
          ? 1.42
          : 1;
    const baseDelay = data.settings.animations
      ? (() => {
          const heroFolded =
            game.players.find((player) => player.id === HERO_ID)?.status ===
            "folded";
          if (!heroFolded) return Math.max(900, data.settings.aiDelayMs);
          const lastAction = game.actions.at(-1);
          return lastAction?.playerId === HERO_ID &&
            lastAction.action.type === "fold"
            ? 760
            : 90;
        })()
      : data.settings.aiDelayMs;
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
        const preflopAggressorId = [...game.actions]
          .reverse()
          .find(
            (record) =>
              record.street === "preflop" &&
              ["bet", "raise", "all-in"].includes(record.action.type),
          )?.playerId;
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
            position: positionScore(actor.positionLabel),
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
            wasPreflopAggressor: preflopAggressorId === actor.id,
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
            ? `${t("AI 行动失败")}${locale === "zh-CN" ? "：" : ": "}${runtimeMessage(reason.message)}`
            : t("AI 行动失败"),
        );
      } finally {
        setAiBusy(false);
      }
    }, baseDelay * speedFactor);
    return () => {
      window.clearTimeout(timer);
      setAiBusy(false);
    };
  }, [
    data.aiProfiles,
    data.settings.aiDelayMs,
    data.settings.animations,
    data.settings.autoAi,
    data.stats,
    game,
    locale,
    pot,
    runtimeMessage,
    t,
  ]);

  const humanAction = (action: PokerAction) => {
    if (!game || game.actingPlayerId !== HERO_ID) return;
    const validation = validateAction(game, HERO_ID, action);
    if (!validation.legal) {
      setError(
        `${runtimeMessage(validation.reason ?? "")}${
          validation.nearestLegalAmount !== undefined
            ? locale === "zh-CN"
              ? `；${t("最近合法值")}为 ${formatChips(validation.nearestLegalAmount)}`
              : ` ${t("最近合法值")}: ${formatChips(validation.nearestLegalAmount)}`
            : ""
        }`,
      );
      if (validation.nearestLegalAmount !== undefined)
        setBetAmount(roundChips(validation.nearestLegalAmount));
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
          ? t("尺度异常：该下注显著超过当前底池，通常需要很强的特定理由。")
          : grade === "偏紧"
            ? t("偏紧：无需跟注时弃牌通常损失了免费看牌机会。")
            : grade === "偏松"
              ? t("偏松：粗略胜率低于当前底池赔率门槛。")
              : grade === "高风险"
                ? t("高风险：深街前全押会显著放大方差。")
                : t("合理：该动作处于可辩护范围；扑克决策通常不存在唯一答案。");
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
      setError(
        reason instanceof Error
          ? runtimeMessage(reason.message)
          : t("动作失败"),
      );
    }
  };

  const legal = game && hero ? legalActionsFor(game, HERO_ID) : null;
  const minRaiseTo = roundChips(
    game
      ? game.currentBet === 0
        ? game.bigBlind
        : game.currentBet + game.minRaiseIncrement
      : 0,
  );
  const maxRaiseTo = roundChips(
    hero ? hero.streetContribution + hero.stack : 0,
  );
  const sizedActionType =
    game?.currentBet === 0 ? ("bet" as const) : ("raise" as const);
  const sizedActionValidation =
    game && hero
      ? validateAction(game, HERO_ID, {
          type: sizedActionType,
          amount: betAmount,
        })
      : null;
  useEffect(() => {
    if (!game || !hero || game.settled) return;
    const minimum = roundChips(
      Math.min(
        hero.streetContribution + hero.stack,
        game.currentBet === 0
          ? game.bigBlind
          : game.currentBet + game.minRaiseIncrement,
      ),
    );
    const maximum = roundChips(hero.streetContribution + hero.stack);
    setBetAmount((current) =>
      !Number.isFinite(current) || current < minimum || current > maximum
        ? minimum
        : roundChips(current),
    );
  }, [game, hero]);
  const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
  const recommendedAction = !assessment
    ? "—"
    : assessment.equityEstimate > 0.62
      ? game?.currentBet === 0
        ? actionLabel("bet")
        : actionLabel("raise")
      : toCall === 0
        ? actionLabel("check")
        : assessment.equityEstimate + 0.04 >= potOdds
          ? actionLabel("call")
          : actionLabel("fold");
  const recommendedSizing = game
    ? Math.min(maxRaiseTo, Math.max(minRaiseTo, game.currentBet + pot * 0.66))
    : 0;
  const quickSizes = !game
    ? []
    : game.street === "preflop"
      ? [2, 2.2, 2.5, 3].map((value) => roundChips(value * game.bigBlind))
      : [0.25, 0.33, 0.5, 0.66, 0.75, 1].map((value) =>
          roundChips(game.currentBet + Math.max(game.bigBlind, pot * value)),
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
      className={`app-shell deck-${data.settings.deckTheme} ${data.settings.animations ? `speed-${data.settings.animationSpeed}` : "animations-off"}`}
    >
      <header className="topbar">
        <button className="brand" onClick={() => setView("table")}>
          <span>R</span>
          <div>
            <strong>RiverLab</strong>
            <small>{t("德州扑克训练台")}</small>
          </div>
        </button>
        <nav aria-label={t("主导航")}>
          {(
            [
              ["table", t("训练桌"), t("牌桌")],
              ["scenario", t("单手牌"), t("场景")],
              ["history", t("历史与复盘"), t("复盘")],
              ["stats", t("统计"), t("统计")],
              ["settings", t("设置"), t("设置")],
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
        <div className="topbar-meta">
          <span className="local-badge">{t("仅本地 · 非真钱")}</span>
          <button
            type="button"
            className="language-toggle"
            onClick={toggleLocale}
            aria-label={t(locale === "zh-CN" ? "切换到英文" : "切换到中文")}
            title={t(locale === "zh-CN" ? "切换到英文" : "切换到中文")}
          >
            <span aria-hidden="true">🌐</span>
            {t(locale === "zh-CN" ? "英文" : "中文")}
          </button>
        </div>
      </header>
      <div className="app-content">
        {view === "table" && game && (
          <div className="table-view">
            <section className="table-toolbar">
              <div>
                <p className="eyebrow">
                  {isScenarioHand ? t("单手牌训练") : t("标准现金桌训练")}
                </p>
                <h1>
                  {locale === "zh-CN"
                    ? `${game.players.length} ${t("人桌")}`
                    : `${game.players.length}${t("人桌")}`}{" "}
                  ·{" "}
                  {formatChips(
                    (hero?.startingStack ?? data.settings.startingStackBb) /
                      game.bigBlind,
                  )}{" "}
                  BB
                </h1>
              </div>
              <div className="toolbar-actions">
                {isScenarioHand ? (
                  !game.settled && (
                    <>
                      <button onClick={() => setView("scenario")}>
                        {t("调整场景")}
                      </button>
                      <button onClick={() => startCashHand(data)}>
                        {t("返回现金桌")}
                      </button>
                    </>
                  )
                ) : (
                  <>
                    <button onClick={() => startCashHand(data)}>
                      {t("重新开局")}
                    </button>
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
                      {t("重新买入")}
                    </button>
                  </>
                )}
              </div>
            </section>
            <PokerTable game={game} aiBusy={aiBusy} />
            {game.settled && <ShowdownBreakdown game={game} />}
            <section className="info-strip">
              <span>
                <small>{t("底池")}</small>
                {formatChips(pot)} BB
              </span>
              {!game.settled && (
                <>
                  <span>
                    <small>{t("跟注")}</small>
                    {formatChips(toCall)} BB
                  </span>
                  <span>
                    <small>{t("最小加注到")}</small>
                    {formatChips(minRaiseTo)} BB
                  </span>
                  <span>
                    <small>{t("有效筹码")}</small>
                    {formatChips(
                      Math.min(
                        hero?.stack ?? 0,
                        Math.max(
                          0,
                          ...game.players
                            .filter(
                              (player) =>
                                player.id !== HERO_ID &&
                                player.status !== "folded",
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
                </>
              )}
              <span>
                <small>{t("位置 / 街")}</small>
                {hero?.positionLabel || "—"} · {streetLabel(game.street)}
              </span>
              <span>
                <small>{t("剩余玩家")}</small>
                {
                  game.players.filter(
                    (player) =>
                      player.status !== "folded" && player.status !== "busted",
                  ).length
                }
              </span>
              {game.settled && (
                <>
                  <span>
                    <small>{t("结果")}</small>
                    {game.outcome?.reason === "showdown"
                      ? t("摊牌")
                      : t("弃牌结束")}
                  </span>
                  <span>
                    <small>{t("本手盈亏")}</small>
                    {(hero?.stack ?? 0) - (hero?.startingStack ?? 0) >= 0
                      ? "+"
                      : ""}
                    {formatChips(
                      ((hero?.stack ?? 0) - (hero?.startingStack ?? 0)) /
                        game.bigBlind,
                    )}{" "}
                    BB
                  </span>
                </>
              )}
              {!game.settled && data.settings.showPotOdds && (
                <span>
                  <small>{t("底池赔率")}</small>
                  {toCall
                    ? `${((toCall / (pot + toCall)) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              )}
              {!game.settled && data.settings.showEquity && assessment && (
                <span>
                  <small>{t("粗略胜率")}</small>≈{" "}
                  {(assessment.equityEstimate * 100).toFixed(0)}%
                </span>
              )}
              {!game.settled && data.settings.showOuts && assessment && (
                <span>
                  <small>{t("估算补牌张数")}</small>≈{" "}
                  {Math.round(assessment.drawStrength * 16)}
                </span>
              )}
              {!game.settled && data.settings.showRecommendedAction && (
                <span>
                  <small>{t("可选建议")}</small>
                  {recommendedAction}
                </span>
              )}
              {!game.settled && data.settings.showRecommendedSizing && (
                <span>
                  <small>{t("参考尺度")}</small>
                  {formatChips(recommendedSizing)} BB
                </span>
              )}
              {!game.settled &&
                data.settings.showBoardWarnings &&
                assessment &&
                assessment.boardDanger > 0.58 && (
                  <span>
                    <small>{t("牌面提示")}</small>
                    {t("危险度较高")}
                  </span>
                )}
            </section>
            {game.settled ? (
              <section className="action-bar complete-bar">
                <div>
                  <p className="eyebrow">{t("本手已结算")}</p>
                  <strong>
                    {game.outcome?.reason === "showdown"
                      ? t("摊牌完成")
                      : t("弃牌获胜")}
                  </strong>
                </div>
                <button
                  className="primary-button"
                  onClick={
                    isScenarioHand ? () => setView("scenario") : nextHand
                  }
                >
                  {isScenarioHand ? t("新场景") : t("下一手")}
                </button>
                {isScenarioHand && (
                  <button onClick={() => startCashHand(data)}>
                    {t("返回现金桌")}
                  </button>
                )}
              </section>
            ) : (
              <section
                ref={actionBarRef}
                className={
                  "action-bar " +
                  (game.actingPlayerId === HERO_ID ? "is-hero-turn" : "")
                }
                aria-label={t("玩家操作区")}
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
                    ? t("轮到你行动")
                    : (() => {
                        const actor = game.players.find(
                          (player) => player.id === game.actingPlayerId,
                        );
                        const actorName = actor
                          ? actor.kind === "ai"
                            ? aiName(actor.personalityId, actor.name)
                            : actor.name
                          : t("牌桌");
                        return `${actorName} ${t("行动中")}`;
                      })()}
                  <span className="decision-context">
                    {t("底池")} {formatChips(pot)} · {t("跟注")}{" "}
                    {formatChips(toCall)} · {hero?.positionLabel || "—"}
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
                      {actionLabel("all-in")}
                    </button>
                  </div>
                  <div className="sizing-input">
                    <input
                      aria-label={t("下注滑杆")}
                      type="range"
                      min={Math.min(minRaiseTo, maxRaiseTo)}
                      max={maxRaiseTo}
                      step={0.01}
                      value={Math.min(maxRaiseTo, Math.max(0, betAmount))}
                      onChange={(event) => {
                        const nextAmount = event.currentTarget.valueAsNumber;
                        if (Number.isFinite(nextAmount))
                          setBetAmount(roundChips(nextAmount));
                      }}
                    />
                    <input
                      aria-label={t("下注总额")}
                      type="number"
                      min={Math.min(minRaiseTo, maxRaiseTo)}
                      max={maxRaiseTo}
                      step={0.01}
                      value={betAmount}
                      aria-invalid={
                        game.actingPlayerId === HERO_ID &&
                        sizedActionValidation?.legal === false
                      }
                      onChange={(event) => {
                        const nextAmount = event.currentTarget.valueAsNumber;
                        if (Number.isFinite(nextAmount))
                          setBetAmount(roundChips(nextAmount));
                      }}
                    />
                  </div>
                  {game.actingPlayerId === HERO_ID &&
                    sizedActionValidation?.legal === false && (
                      <small className="sizing-error" role="status">
                        {runtimeMessage(sizedActionValidation.reason ?? "")}
                        {sizedActionValidation.nearestLegalAmount !== undefined
                          ? locale === "zh-CN"
                            ? `；${t("最近合法值")} ${formatChips(sizedActionValidation.nearestLegalAmount)} BB`
                            : `; ${t("最近合法值")}: ${formatChips(sizedActionValidation.nearestLegalAmount)} BB`
                          : ""}
                      </small>
                    )}
                </div>
                <div className="action-buttons">
                  <button
                    disabled={
                      game.actingPlayerId !== HERO_ID || !legal?.fold.legal
                    }
                    onClick={() => humanAction({ type: "fold" })}
                  >
                    {actionLabel("fold")} <kbd aria-hidden="true">F</kbd>
                  </button>
                  <button
                    disabled={
                      game.actingPlayerId !== HERO_ID || !legal?.check.legal
                    }
                    onClick={() => humanAction({ type: "check" })}
                  >
                    {actionLabel("check")} <kbd aria-hidden="true">K</kbd>
                  </button>
                  <button
                    disabled={
                      game.actingPlayerId !== HERO_ID || !legal?.call.legal
                    }
                    onClick={() => humanAction({ type: "call" })}
                  >
                    {actionLabel("call")} {formatChips(toCall)}{" "}
                    <kbd aria-hidden="true">C</kbd>
                  </button>
                  <button
                    disabled={
                      game.actingPlayerId !== HERO_ID ||
                      !sizedActionValidation?.legal
                    }
                    onClick={() =>
                      humanAction({
                        type: sizedActionType,
                        amount: betAmount,
                      })
                    }
                  >
                    {actionLabel(sizedActionType)}{" "}
                    <kbd aria-hidden="true">R</kbd>
                  </button>
                  <button
                    disabled={
                      game.actingPlayerId !== HERO_ID ||
                      !legal?.["all-in"].legal
                    }
                    onClick={() => humanAction({ type: "all-in" })}
                  >
                    {actionLabel("all-in")} <kbd aria-hidden="true">A</kbd>
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

export function PokerTrainer() {
  return (
    <LanguageProvider>
      <PokerTrainerApp />
    </LanguageProvider>
  );
}
