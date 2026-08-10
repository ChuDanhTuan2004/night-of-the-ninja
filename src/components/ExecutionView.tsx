import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Eye, Skull, Crosshair, Sparkles, Scroll } from 'lucide-react';
import { GameState, Player, NinjaCard, CardRank } from '../types/game';
import { NinjaCardView, HouseCardView } from './NinjaCardView';
import { sounds } from '../utils/audio';

interface ExecutionViewProps {
  gameState: GameState;
  currentPlayer: Player;
  onExecuteCardAction: (
    cardId: string,
    targetId?: string,
    secondTargetId?: string
  ) => void;
}

const RANK_STEPS: { rank: CardRank; labelVi: string; icon: string }[] = [
  { rank: 1, labelVi: 'P1: Do Thám', icon: '👁️' },
  { rank: 2, labelVi: 'P2: Thần Thông', icon: '🔮' },
  { rank: 3, labelVi: 'P3: Sát Thủ', icon: '🗡️' },
  { rank: 4, labelVi: 'P4: Vệ Sĩ & Mẹo', icon: '🛡️' },
];

export const ExecutionView: React.FC<ExecutionViewProps> = ({
  gameState,
  currentPlayer,
  onExecuteCardAction,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [secondTargetId, setSecondTargetId] = useState<string | null>(null);
  const [activeCardToTarget, setActiveCardToTarget] = useState<NinjaCard | null>(null);

  // Find human's unplayed card for current execution rank
  const humanCardToPlay = currentPlayer.isAlive
    ? currentPlayer.selectedCards.find(
        (c) =>
          c.rank === gameState.executionRank &&
          !currentPlayer.playedCardsThisPhase.some((p) => p.id === c.id)
      )
    : null;

  const handleStartCardTargeting = (card: NinjaCard) => {
    setActiveCardToTarget(card);
    setSelectedTargetId(null);
    setSecondTargetId(null);

    // If card doesn't require target (like Iron Guard or Retaliation), execute immediately!
    if (!card.requiresTarget) {
      if (card.rank === 3) sounds.playSlash();
      else if (card.rank === 4) sounds.playShield();
      else sounds.playSpyWhisper();

      onExecuteCardAction(card.id);
      setActiveCardToTarget(null);
    }
  };

  const handleConfirmTargetAction = () => {
    if (!activeCardToTarget) return;

    if (activeCardToTarget.rank === 3) sounds.playSlash();
    else if (activeCardToTarget.rank === 4) sounds.playShield();
    else sounds.playSpyWhisper();

    onExecuteCardAction(
      activeCardToTarget.id,
      selectedTargetId || undefined,
      secondTargetId || undefined
    );

    setActiveCardToTarget(null);
    setSelectedTargetId(null);
    setSecondTargetId(null);
  };

  const alivePlayersCount = gameState.players.filter((p) => p.isAlive).length;

  return (
    <div className="game-container-wide screen-stack">
      {/* Execution Rank Timeline Bar */}
      <div className="game-card game-card-section">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <h2 className="phase-title">
              Đêm Hành Động • Tiến Trình Tốc Độ
            </h2>
          </div>
          <div className="badge">
            Ninja Còn Sống: <strong>{alivePlayersCount}/{gameState.players.length}</strong>
          </div>
        </div>

        <div className="phase-track">
          {RANK_STEPS.map((step) => {
            const isActive = gameState.executionRank === step.rank;
            const isPassed = gameState.executionRank > step.rank;

            return (
              <div
                key={step.rank}
                className={`phase-step ${isActive ? 'is-active' : ''} ${isPassed ? 'is-complete' : ''}`}
              >
                <span className="text-lg">{step.icon}</span>
                <span className="text-xs font-bold font-mono tracking-wider">{step.labelVi}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Execution Split View: Player Table vs Battle Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Player Table Grid */}
        <div className="lg:col-span-2 space-y-4">
          {gameState.privateNotices?.[currentPlayer.id]?.[0] && (
            <div role="status" className="status-panel">
              <div className="eyebrow mb-1">
                Thông Tin Bí Mật • Chỉ Bạn Biết
              </div>
              <p className="text-sm text-white">
                {gameState.privateNotices[currentPlayer.id][0]}
              </p>
            </div>
          )}
          <div className="game-card game-card-section">
            <h3 className="section-title mb-4">
              <Crosshair className="w-5 h-5" />
              <span>Toàn Bàn Ninja ({gameState.players.length} Nhân Vật)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gameState.players.map((p) => {
                const isCurrentHuman = p.id === currentPlayer.id;

                return (
                  <div
                    key={p.id}
                    className={`player-card flex-col items-stretch justify-between ${!p.isAlive ? 'is-eliminated' : ''} ${isCurrentHuman ? 'is-current' : ''}`}
                  >
                    {/* Top Status & Avatar */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="avatar relative">
                        {p.avatar}
                        {!p.isAlive && (
                          <div className="absolute -top-1 -right-1 text-xs">💀</div>
                        )}
                      </div>

                      <div className="truncate">
                        <div className="player-card-name">
                          {p.name} {isCurrentHuman && '(Bạn)'}
                        </div>
                        <div className="player-card-status flex items-center space-x-1">
                          {p.isAlive ? (
                            <span>● Còn Sống</span>
                          ) : (
                            <span>✖ Đã Gục Ngã</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* House Card Reveal Status */}
                    {p.revealedHouse && p.house ? (
                      <div className="badge rounded-lg justify-center">
                        <span>{p.house.icon}</span>
                        <span className="truncate">{p.house.nameVi}</span>
                      </div>
                    ) : (
                      <div className="player-card-status text-center">
                        🔒 Thân Phận Mật
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Human Action Control Panel */}
          {currentPlayer.isAlive && humanCardToPlay && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="game-card is-active game-card-section flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="eyebrow">
                  ĐẾN LƯỢT BẠN XUẤT CHIÊU!
                </div>
                <h3 className="section-title text-xl mt-1">
                  Lá Bài [P{humanCardToPlay.rank} - {humanCardToPlay.nameVi}]
                </h3>
                <p className="text-xs text-secondary mt-1 max-w-md">
                  {humanCardToPlay.descriptionVi}
                </p>
              </div>

              <button
                onClick={() => handleStartCardTargeting(humanCardToPlay)}
                className="btn btn-primary btn-cta md:w-auto shrink-0"
              >
                ⚡ Kích Hoạt Kỹ Năng Ngay!
              </button>
            </motion.div>
          )}
        </div>

        {/* Right Col: Live Battle Action Log */}
        <div className="game-card game-card-section flex flex-col h-[520px]">
          <h3 className="section-title mb-3 border-b border-white/10 pb-2">
            <Scroll className="w-5 h-5" />
            <span>Nhật Ký Đêm Đấu ({gameState.actionLogs.length})</span>
          </h3>

          <div className="game-log flex-1 overflow-y-auto pr-1">
            {gameState.actionLogs.map((log) => (
              <div
                key={log.id}
                className={`game-log-entry ${['KILL', 'DEFENSE', 'REVEAL', 'HONOR'].includes(log.type) ? 'is-important' : ''}`}
              >
                <div className="text-xs text-muted mb-1">{log.timestamp}</div>
                <div>{log.messageVi}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Target Picker Modal */}
      <AnimatePresence>
        {activeCardToTarget && activeCardToTarget.requiresTarget && (
          <div className="modal-overlay">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bottom-sheet max-w-lg space-y-5"
            >
              <div className="text-center space-y-1">
                <div className="eyebrow">
                  CHỌN MỤC TIÊU CHO KỸ NĂNG
                </div>
                <h3 className="phase-title">
                  [{activeCardToTarget.nameVi}]
                </h3>
                <p className="text-xs text-secondary">{activeCardToTarget.descriptionVi}</p>
              </div>

              {/* Target List Selection */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <label className="form-label">
                  {activeCardToTarget.effectType === 'SWAP_HOUSE'
                    ? 'Chọn Người Chơi Thứ 1:'
                    : 'Chọn Mục Tiêu:'}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {gameState.players
                    .filter((p) => p.isAlive && p.id !== currentPlayer.id)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedTargetId(p.id)}
                        className={`player-card ${selectedTargetId === p.id ? 'is-selected' : ''}`}
                      >
                        <span className="text-xl">{p.avatar}</span>
                        <span className="text-xs truncate">{p.name}</span>
                      </button>
                    ))}
                </div>

                {/* If SWAP_HOUSE requires 2 targets */}
                {activeCardToTarget.effectType === 'SWAP_HOUSE' && selectedTargetId && (
                  <div className="mt-4 space-y-2">
                    <label className="form-label">
                      Chọn Người Chơi Thứ 2 Để Tráo Đổi:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {gameState.players
                        .filter((p) => p.isAlive && p.id !== selectedTargetId)
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSecondTargetId(p.id)}
                            className={`player-card ${secondTargetId === p.id ? 'is-selected' : ''}`}
                          >
                            <span className="text-xl">{p.avatar}</span>
                            <span className="text-xs truncate">{p.name}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm / Cancel Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => setActiveCardToTarget(null)}
                  className="btn btn-secondary flex-1"
                >
                  Hủy Chiêu
                </button>

                <button
                  onClick={handleConfirmTargetAction}
                  disabled={
                    !selectedTargetId ||
                    (activeCardToTarget.effectType === 'SWAP_HOUSE' && !secondTargetId)
                  }
                  className="btn btn-primary flex-1"
                >
                  Xác Nhận Xuất Chiêu!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
