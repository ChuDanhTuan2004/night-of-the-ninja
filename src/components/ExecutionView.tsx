import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Crosshair, Scroll, Sparkles, Layers } from 'lucide-react';
import { GameState, NinjaCard, NinjaPhase, Player, ShapeshifterInspection } from '../types/game';
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
  onInspectShapeshifterTargets: (
    cardId: string,
    targetId: string,
    secondTargetId: string,
  ) => Promise<ShapeshifterInspection>;
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
  onInspectShapeshifterTargets,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [secondTargetId, setSecondTargetId] = useState<string | null>(null);
  const [decision, setDecision] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<NinjaCard | null>(null);
  const [shapeshifterInspection, setShapeshifterInspection] = useState<ShapeshifterInspection | null>(null);
  const [inspectionError, setInspectionError] = useState<string | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  const queuedAction = useMemo(() => {
    if (gameState.pendingCard) {
      const player = gameState.players.find((p) => p.id === gameState.pendingCard!.playerId);
      const playerIndex = gameState.players.findIndex((p) => p.id === gameState.pendingCard!.playerId);
      if (player && player.isAlive) {
        return { player, playerIndex, card: gameState.pendingCard!.card };
      }
    }
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
  }, [gameState.executionPhase, gameState.players, gameState.pendingCard]);

  const humanCardToPlay = queuedAction?.player.id === currentPlayer.id ? queuedAction.card : null;
  const phaseIndex = PHASE_STEPS.findIndex((step) => step.phase === gameState.executionPhase);
  const target = gameState.players.find((player) => player.id === selectedTargetId);
  const decisionOptions = activeCard ? DECISIONS[activeCard.effectType] : undefined;

  const resetPicker = () => {
    setActiveCard(null);
    setSelectedTargetId(null);
    setSecondTargetId(null);
    setDecision(null);
    setShapeshifterInspection(null);
    setInspectionError(null);
    setIsInspecting(false);
  };

  const startTargeting = (card: NinjaCard) => {
    setActiveCard(card);
    setSelectedTargetId(null);
    setSecondTargetId(null);
    setDecision(null);
    setShapeshifterInspection(null);
    setInspectionError(null);
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
  const isShapeshifter = activeCard?.effectType === 'SHAPESHIFTER';
  const visibleDiscard = gameState.ninjaDiscardPile.slice(0, 2);
  const needsSecondTarget = activeCard?.targetType === 'TWO_PLAYERS';
  const targetReady = isGraveDigger ? Boolean(selectedTargetId) || visibleDiscard.length === 0 : Boolean(selectedTargetId);
  const canConfirm = targetReady &&
    (!needsSecondTarget || Boolean(secondTargetId)) &&
    (!decisionOptions || Boolean(decision)) &&
    (!isShapeshifter || Boolean(shapeshifterInspection));

  const toggleShapeshifterTarget = (playerId: string) => {
    setDecision(null);
    setShapeshifterInspection(null);
    setInspectionError(null);
    if (selectedTargetId === playerId) {
      setSelectedTargetId(secondTargetId);
      setSecondTargetId(null);
    } else if (secondTargetId === playerId) {
      setSecondTargetId(null);
    } else if (!selectedTargetId) {
      setSelectedTargetId(playerId);
    } else if (!secondTargetId) {
      setSecondTargetId(playerId);
    } else {
      setSecondTargetId(playerId);
    }
  };

  const inspectSelectedRoles = async () => {
    if (!activeCard || !selectedTargetId || !secondTargetId || isInspecting) return;
    setIsInspecting(true);
    setInspectionError(null);
    try {
      const inspection = await onInspectShapeshifterTargets(
        activeCard.id,
        selectedTargetId,
        secondTargetId,
      );
      setShapeshifterInspection(inspection);
      sounds.playSpyWhisper();
    } catch (error) {
      setInspectionError(error instanceof Error ? error.message : 'Không thể xem hai Role đã chọn.');
    } finally {
      setIsInspecting(false);
    }
  };

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
                  (player.revealedHouse || (isCurrentHuman && !player.unknownCurrentHouse) || currentPlayer.name === 'Linh'),
                );
                const cardsInHand = player.selectedCards.filter(
                  (card) => !player.playedCardsThisPhase.some((played) => played.id === card.id)
                ).length;

                return (
                  <div
                    key={player.id}
                    className={`player-card flex-col items-stretch ${!player.isAlive ? 'is-eliminated' : ''} ${isCurrentHuman ? 'is-current' : ''}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="avatar relative">{player.avatar}{!player.isAlive && <span className="absolute -top-1 -right-1 text-xs">💀</span>}</div>
                      <div className="truncate">
                        <div className="player-card-name">{player.name}{isCurrentHuman ? ' (Bạn)' : ''}</div>
                        <div className="player-card-status flex items-center gap-1.5 flex-wrap">
                          <span>{player.isAlive ? '● Còn sống' : '✖ Đã gục ngã'}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-medium flex items-center gap-1">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" className="w-3.5 h-3.5 inline-block text-amber-400">
                              <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z M12 10a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>
                            {player.honorTokens?.length || 0} phi tiêu
                          </span>
                          <span>•</span>
                          <span className="text-sky-400 font-medium flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            {cardsInHand} lá
                          </span>
                        </div>
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
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                <button
                  onClick={() => startTargeting(humanCardToPlay)}
                  className="btn btn-primary btn-cta flex-1"
                >
                  Kích hoạt kỹ năng
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Bạn có chắc chắn không muốn sử dụng lá [${humanCardToPlay.nameVi}]?`)) {
                      onExecuteCardAction(humanCardToPlay.id, undefined, undefined, 'SKIP');
                    }
                  }}
                  className="btn btn-secondary btn-cta flex-1"
                >
                  Không sử dụng
                </button>
              </div>
            </motion.div>
          ) : queuedAction ? (
            <div className="status-panel text-sm text-secondary">Đang chờ {queuedAction.player.name} xử lý lá priority {queuedAction.card.priority}…</div>
          ) : null}
        </div>

        <div className="game-card game-card-section game-log-card">
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
                    <button
                      key={card.id}
                      onClick={() => setSelectedTargetId(card.id)}
                      className={`player-card w-full flex items-start gap-3 p-3 text-left ${selectedTargetId === card.id ? 'is-selected' : ''}`}
                    >
                      <span className="text-2xl mt-1 shrink-0">{card.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-white">
                          {card.nameVi} • {card.phaseNameVi} {card.priority ? `(P${card.priority})` : ''}
                        </div>
                        <div className="text-xs text-secondary mt-1 whitespace-normal leading-normal">
                          {card.descriptionVi}
                        </div>
                      </div>
                    </button>
                  )) : <p className="status-panel text-sm">Chồng bài bỏ đang trống. Kỹ năng không lấy được lá nào.</p>}
                </div>
              ) : isShapeshifter ? (
                !shapeshifterInspection ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="form-label">Chọn đúng 2 người</label>
                      <span className="badge">
                        {[selectedTargetId, secondTargetId].filter(Boolean).length}/2 đã chọn
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                      {gameState.players.filter((player) => player.isAlive).map((player) => {
                        const selectionNumber = selectedTargetId === player.id
                          ? 1
                          : secondTargetId === player.id
                            ? 2
                            : null;
                        return (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => toggleShapeshifterTarget(player.id)}
                            className={`player-card justify-between ${selectionNumber ? 'is-selected' : ''}`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="text-xl">{player.avatar}</span>
                              <span className="text-xs truncate">{player.name}</span>
                            </span>
                            {selectionNumber && <span className="badge badge-primary">#{selectionNumber}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-secondary">
                      Sau khi chọn đủ hai người, bạn sẽ được xem bí mật Role của họ trước khi quyết định đổi.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="eyebrow text-center">Role bí mật bạn vừa xem</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {shapeshifterInspection.targets.map((inspectedTarget, index) => (
                        <div key={inspectedTarget.playerId} className="status-panel text-center space-y-2">
                          <div className="text-xs text-secondary">Người #{index + 1}</div>
                          <div className="font-bold text-white">{inspectedTarget.playerName}</div>
                          <div className="badge badge-primary justify-center">
                            {inspectedTarget.house.icon} {inspectedTarget.house.nameVi}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShapeshifterInspection(null);
                        setDecision(null);
                      }}
                      className="btn btn-ghost w-full"
                    >
                      Chọn lại hai người
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  <label className="form-label">Chọn mục tiêu</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {gameState.players
                      .filter((player) => player.isAlive && player.id !== currentPlayer.id)
                      .filter((player) => activeCard.effectType !== 'THIEF' || player.honorTokens.length > currentPlayer.honorTokens.length)
                      .map((player) => (
                        <button key={player.id} onClick={() => { setSelectedTargetId(player.id); setSecondTargetId(null); setDecision(null); }} className={`player-card ${selectedTargetId === player.id ? 'is-selected' : ''}`}>
                          <span className="text-xl">{player.avatar}</span><span className="text-xs truncate">{player.name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {['TROUBLEMAKER', 'SHINOBI_KILL'].includes(activeCard.effectType) && target?.house && (
                <div className="status-panel text-sm">Bạn thấy House của <strong>{target.name}</strong>: {target.house.icon} <strong>{target.house.nameVi}</strong>.</div>
              )}

              {decisionOptions && targetReady && (!needsSecondTarget || secondTargetId) && (!isShapeshifter || shapeshifterInspection) && (
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
                {isShapeshifter && !shapeshifterInspection ? (
                  <button
                    type="button"
                    onClick={inspectSelectedRoles}
                    disabled={!selectedTargetId || !secondTargetId || isInspecting}
                    className="btn btn-primary flex-1"
                  >
                    {isInspecting ? 'Đang xem…' : 'Bí mật xem 2 Role'}
                  </button>
                ) : (
                  <button onClick={confirmAction} disabled={!canConfirm} className="btn btn-primary flex-1">
                    Xác nhận quyết định
                  </button>
                )}
              </div>
              {inspectionError && <div role="alert" className="text-xs text-center text-red-300">{inspectionError}</div>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
