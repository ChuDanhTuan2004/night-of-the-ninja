import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Crosshair, Scroll, Sparkles } from 'lucide-react';
import { GameState, NinjaCard, NinjaPhase, Player } from '../types/game';
import { sounds } from '../utils/audio';

interface ExecutionViewProps {
  gameState: GameState;
  currentPlayer: Player;
  onExecuteCardAction: (
    cardId: string,
    targetId?: string,
    secondTargetId?: string,
    decision?: string,
  ) => void;
}

const PHASE_STEPS: { phase: NinjaPhase; labelVi: string; icon: string }[] = [
  { phase: 'SPY', labelVi: 'Do thám', icon: '👁️' },
  { phase: 'MYSTIC', labelVi: 'Thần bí', icon: '🔮' },
  { phase: 'TRICKSTER', labelVi: 'Mưu sĩ', icon: '🎭' },
  { phase: 'BLIND_ASSASSIN', labelVi: 'Sát thủ mù', icon: '🗡️' },
  { phase: 'SHINOBI', labelVi: 'Shinobi', icon: '🥷' },
];

const DECISIONS: Partial<Record<NinjaCard['effectType'], { value: string; label: string }[]>> = {
  SHAPESHIFTER: [
    { value: 'KEEP', label: 'Giữ nguyên hai House' },
    { value: 'SWAP', label: 'Tráo hai House' },
  ],
  TROUBLEMAKER: [
    { value: 'KEEP', label: 'Giữ thông tin bí mật' },
    { value: 'REVEAL', label: 'Công khai House' },
  ],
  SPIRIT_MERCHANT: [
    { value: 'HOUSE_KEEP', label: 'Xem House · Không đổi token' },
    { value: 'HOUSE_SWAP', label: 'Xem House · Đổi token' },
    { value: 'HONOR_KEEP', label: 'Xem Honor · Không đổi token' },
    { value: 'HONOR_SWAP', label: 'Xem Honor · Đổi token' },
  ],
  SHINOBI_KILL: [
    { value: 'SPARE', label: 'Tha mục tiêu' },
    { value: 'KILL', label: 'Giết mục tiêu' },
  ],
};

export const ExecutionView: React.FC<ExecutionViewProps> = ({
  gameState,
  currentPlayer,
  onExecuteCardAction,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [secondTargetId, setSecondTargetId] = useState<string | null>(null);
  const [decision, setDecision] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<NinjaCard | null>(null);

  const queuedAction = useMemo(() => {
    const queue = gameState.players.flatMap((player, playerIndex) => {
      if (!player.isAlive) return [];
      return player.selectedCards
        .filter((card) =>
          card.phase === gameState.executionPhase &&
          !player.playedCardsThisPhase.some((played) => played.id === card.id))
        .map((card) => ({ player, playerIndex, card }));
    });
    queue.sort((a, b) => (a.card.priority ?? 99) - (b.card.priority ?? 99) || a.playerIndex - b.playerIndex);
    return queue[0] ?? null;
  }, [gameState.executionPhase, gameState.players]);

  const humanCardToPlay = queuedAction?.player.id === currentPlayer.id ? queuedAction.card : null;
  const phaseIndex = PHASE_STEPS.findIndex((step) => step.phase === gameState.executionPhase);
  const target = gameState.players.find((player) => player.id === selectedTargetId);
  const secondTarget = gameState.players.find((player) => player.id === secondTargetId);
  const decisionOptions = activeCard ? DECISIONS[activeCard.effectType] : undefined;

  const resetPicker = () => {
    setActiveCard(null);
    setSelectedTargetId(null);
    setSecondTargetId(null);
    setDecision(null);
  };

  const startTargeting = (card: NinjaCard) => {
    setActiveCard(card);
    setSelectedTargetId(null);
    setSecondTargetId(null);
    setDecision(null);
  };

  const confirmAction = () => {
    if (!activeCard) return;
    if (activeCard.phase === 'BLIND_ASSASSIN' || (activeCard.effectType === 'SHINOBI_KILL' && decision === 'KILL')) {
      sounds.playSlash();
    } else {
      sounds.playSpyWhisper();
    }
    onExecuteCardAction(
      activeCard.id,
      selectedTargetId ?? undefined,
      secondTargetId ?? undefined,
      decision ?? undefined,
    );
    resetPicker();
  };

  const isGraveDigger = activeCard?.effectType === 'GRAVE_DIGGER';
  const visibleDiscard = gameState.ninjaDiscardPile.slice(0, 2);
  const needsSecondTarget = activeCard?.targetType === 'TWO_PLAYERS';
  const targetReady = isGraveDigger ? Boolean(selectedTargetId) || visibleDiscard.length === 0 : Boolean(selectedTargetId);
  const canConfirm = targetReady && (!needsSecondTarget || Boolean(secondTargetId)) && (!decisionOptions || Boolean(decision));

  return (
    <div className="game-container-wide screen-stack">
      <div className="game-card game-card-section">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <h2 className="phase-title">Đêm · Resolve theo priority 1 → 6</h2>
          </div>
          <div className="badge">Còn sống: <strong>{gameState.players.filter((player) => player.isAlive).length}/{gameState.players.length}</strong></div>
        </div>
        <div className="phase-track">
          {PHASE_STEPS.map((step, index) => (
            <div
              key={step.phase}
              className={`phase-step ${index === phaseIndex ? 'is-active' : ''} ${index < phaseIndex ? 'is-complete' : ''}`}
            >
              <span className="text-lg">{step.icon}</span>
              <span className="text-xs font-bold tracking-wider">{step.labelVi}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {gameState.privateNotices?.[currentPlayer.id]?.[0] && (
            <div role="status" className="status-panel">
              <div className="eyebrow mb-1">Thông tin bí mật · Chỉ bạn biết</div>
              <p className="text-sm text-white">{gameState.privateNotices[currentPlayer.id][0]}</p>
            </div>
          )}

          <div className="game-card game-card-section">
            <h3 className="section-title mb-4"><Crosshair className="w-5 h-5" /> Toàn bàn</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gameState.players.map((player) => {
                const isCurrentHuman = player.id === currentPlayer.id;
                const canSeeHouse = Boolean(
                  player.house &&
                  (player.revealedHouse || (isCurrentHuman && !player.unknownCurrentHouse)),
                );

                return (
                  <div
                    key={player.id}
                    className={`player-card flex-col items-stretch ${!player.isAlive ? 'is-eliminated' : ''} ${isCurrentHuman ? 'is-current' : ''}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="avatar relative">{player.avatar}{!player.isAlive && <span className="absolute -top-1 -right-1 text-xs">💀</span>}</div>
                      <div className="truncate">
                        <div className="player-card-name">{player.name}{isCurrentHuman ? ' (Bạn)' : ''}</div>
                        <div className="player-card-status">{player.isAlive ? '● Còn sống' : '✖ Đã gục ngã'}</div>
                      </div>
                    </div>

                    {canSeeHouse && player.house ? (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <div className="badge rounded-lg justify-center">
                          {player.house.icon} {player.house.nameVi}
                        </div>
                        {isCurrentHuman && (
                          <div className={`badge rounded-lg justify-center ${player.revealedHouse ? 'badge-primary' : ''}`}>
                            {player.revealedHouse ? '👁 Đã bị lộ' : '🔒 Chưa bị lộ'}
                          </div>
                        )}
                      </div>
                    ) : isCurrentHuman && player.unknownCurrentHouse ? (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <div className="player-card-status text-center">🔀 House đã bị tráo</div>
                        <div className="badge rounded-lg justify-center">🔒 Chưa bị lộ</div>
                      </div>
                    ) : (
                      <div className="player-card-status text-center">🔒 House bí mật</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {currentPlayer.isAlive && humanCardToPlay ? (
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="game-card is-active game-card-section turn-action-panel">
              <div className="turn-action-copy">
                <div className="eyebrow">Đến lượt bạn · Priority {humanCardToPlay.priority}</div>
                <h3 className="section-title text-xl mt-1">{humanCardToPlay.icon} {humanCardToPlay.nameVi}</h3>
                <p className="text-xs text-secondary mt-1 max-w-md">{humanCardToPlay.descriptionVi}</p>
              </div>
              <button onClick={() => startTargeting(humanCardToPlay)} className="btn btn-primary btn-cta turn-action-button">Kích hoạt kỹ năng</button>
            </motion.div>
          ) : queuedAction ? (
            <div className="status-panel text-sm text-secondary">Đang chờ {queuedAction.player.name} xử lý lá priority {queuedAction.card.priority}…</div>
          ) : null}
        </div>

        <div className="game-card game-card-section flex flex-col h-[520px]">
          <h3 className="section-title mb-3 border-b border-white/10 pb-2"><Scroll className="w-5 h-5" /> Nhật ký đêm</h3>
          <div className="game-log flex-1 overflow-y-auto pr-1">
            {gameState.actionLogs.map((log) => (
              <div key={log.id} className={`game-log-entry ${['KILL', 'DEFENSE', 'REVEAL', 'HONOR'].includes(log.type) ? 'is-important' : ''}`}>
                <div className="text-xs text-muted mb-1">{log.timestamp}</div>
                <div>{log.messageVi}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeCard && (
          <div className="modal-overlay">
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="bottom-sheet max-w-lg space-y-5">
              <div className="text-center space-y-1">
                <div className="eyebrow">Priority {activeCard.priority} · {activeCard.phaseNameVi}</div>
                <h3 className="phase-title">{activeCard.icon} {activeCard.nameVi}</h3>
                <p className="text-xs text-secondary">{activeCard.descriptionVi}</p>
              </div>

              {isGraveDigger ? (
                <div className="space-y-2">
                  <label className="form-label">Hai lá trên chồng bỏ</label>
                  {visibleDiscard.length ? visibleDiscard.map((card) => (
                    <button key={card.id} onClick={() => setSelectedTargetId(card.id)} className={`player-card w-full ${selectedTargetId === card.id ? 'is-selected' : ''}`}>
                      <span className="text-xl">{card.icon}</span><span className="text-sm">{card.nameVi} · {card.phaseNameVi} {card.priority ?? ''}</span>
                    </button>
                  )) : <p className="status-panel text-sm">Chồng bài bỏ đang trống. Kỹ năng không lấy được lá nào.</p>}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  <label className="form-label">{needsSecondTarget ? 'Mục tiêu thứ nhất' : 'Chọn mục tiêu'}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {gameState.players
                      .filter((player) => player.isAlive && (activeCard.effectType === 'SHAPESHIFTER' || player.id !== currentPlayer.id))
                      .filter((player) => activeCard.effectType !== 'THIEF' || player.honorTokens.length > currentPlayer.honorTokens.length)
                      .map((player) => (
                        <button key={player.id} onClick={() => { setSelectedTargetId(player.id); setSecondTargetId(null); setDecision(null); }} className={`player-card ${selectedTargetId === player.id ? 'is-selected' : ''}`}>
                          <span className="text-xl">{player.avatar}</span><span className="text-xs truncate">{player.name}</span>
                        </button>
                      ))}
                  </div>

                  {needsSecondTarget && selectedTargetId && (
                    <div className="pt-3 space-y-2">
                      <label className="form-label">Mục tiêu thứ hai</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {gameState.players.filter((player) => player.isAlive && player.id !== selectedTargetId).map((player) => (
                          <button key={player.id} onClick={() => { setSecondTargetId(player.id); setDecision(null); }} className={`player-card ${secondTargetId === player.id ? 'is-selected' : ''}`}>
                            <span className="text-xl">{player.avatar}</span><span className="text-xs truncate">{player.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeCard.effectType === 'SHAPESHIFTER' && target?.house && secondTarget?.house && (
                <div className="status-panel text-sm">Bạn thấy: <strong>{target.name}</strong> là {target.house.nameVi}; <strong>{secondTarget.name}</strong> là {secondTarget.house.nameVi}.</div>
              )}
              {['TROUBLEMAKER', 'SHINOBI_KILL'].includes(activeCard.effectType) && target?.house && (
                <div className="status-panel text-sm">Bạn thấy House của <strong>{target.name}</strong>: {target.house.icon} <strong>{target.house.nameVi}</strong>.</div>
              )}

              {decisionOptions && targetReady && (!needsSecondTarget || secondTargetId) && (
                <div className="space-y-2">
                  <label className="form-label">Quyết định bí mật của bạn</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {decisionOptions.map((option) => (
                      <button key={option.value} onClick={() => setDecision(option.value)} className={`btn ${decision === option.value ? 'btn-primary' : 'btn-secondary'}`}>{option.label}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button onClick={resetPicker} className="btn btn-secondary flex-1">Hủy</button>
                <button onClick={confirmAction} disabled={!canConfirm} className="btn btn-primary flex-1">Xác nhận</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
