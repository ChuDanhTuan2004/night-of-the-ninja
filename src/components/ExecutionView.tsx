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

const RANK_STEPS: { rank: CardRank; labelVi: string; icon: string; color: string }[] = [
  { rank: 1, labelVi: 'P1: Do Thám', icon: '👁️', color: 'text-emerald-400 bg-emerald-950 border-emerald-500/40' },
  { rank: 2, labelVi: 'P2: Thần Thông', icon: '🔮', color: 'text-indigo-400 bg-indigo-950 border-indigo-500/40' },
  { rank: 3, labelVi: 'P3: Sát Thủ', icon: '🗡️', color: 'text-rose-400 bg-rose-950 border-rose-500/40' },
  { rank: 4, labelVi: 'P4: Vệ Sĩ & Mẹo', icon: '🛡️', color: 'text-amber-400 bg-amber-950 border-amber-500/40' },
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
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Execution Rank Timeline Bar */}
      <div className="bg-slate-900/90 border border-amber-600/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-900/30 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold font-serif text-amber-200">
              Đêm Hành Động • Tiến Trình Tốc Độ
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-300">
            Ninja Còn Sống Trụ Lại: <strong className="text-emerald-400">{alivePlayersCount}/{gameState.players.length}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RANK_STEPS.map((step) => {
            const isActive = gameState.executionRank === step.rank;
            const isPassed = gameState.executionRank > step.rank;

            return (
              <div
                key={step.rank}
                className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center space-x-2 ${
                  isActive
                    ? `${step.color} ring-2 ring-amber-400 shadow-lg scale-102`
                    : isPassed
                    ? 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
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
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold font-mono text-amber-300 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Crosshair className="w-4 h-4 text-rose-400" />
              <span>Toàn Bàn Ninja ({gameState.players.length} Nhân Vật)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gameState.players.map((p) => {
                const isCurrentHuman = p.id === currentPlayer.id;

                return (
                  <div
                    key={p.id}
                    className={`rounded-xl p-3 border transition-all relative flex flex-col justify-between ${
                      !p.isAlive
                        ? 'bg-slate-950/90 border-rose-950/80 opacity-60 grayscale'
                        : isCurrentHuman
                        ? 'bg-amber-950/40 border-amber-500/60 ring-2 ring-amber-500/20'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    {/* Top Status & Avatar */}
                    <div className="flex items-center space-x-2.5 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-xl shrink-0 relative">
                        {p.avatar}
                        {!p.isAlive && (
                          <div className="absolute -top-1 -right-1 text-xs">💀</div>
                        )}
                      </div>

                      <div className="truncate">
                        <div className="font-bold text-sm text-amber-100 truncate">
                          {p.name} {isCurrentHuman && '(Bạn)'}
                        </div>
                        <div className="text-[10px] font-mono flex items-center space-x-1">
                          {p.isAlive ? (
                            <span className="text-emerald-400">● Còn Sống</span>
                          ) : (
                            <span className="text-rose-400">✖ Đã Gục Ngã</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* House Card Reveal Status */}
                    {p.revealedHouse && p.house ? (
                      <div className="p-1.5 rounded bg-slate-900 border border-amber-500/30 text-[11px] font-bold text-amber-200 flex items-center space-x-1">
                        <span>{p.house.icon}</span>
                        <span className="truncate">{p.house.nameVi}</span>
                      </div>
                    ) : (
                      <div className="p-1.5 rounded bg-slate-900/60 text-[10px] font-mono text-slate-500 text-center">
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
              className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-2 border-amber-500/60 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div>
                <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  ĐẾN LƯỢT BẠN XUẤT CHIÊU!
                </div>
                <h3 className="text-xl font-bold font-serif text-amber-200 mt-1">
                  Lá Bài [P{humanCardToPlay.rank} - {humanCardToPlay.nameVi}]
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 max-w-md">
                  {humanCardToPlay.descriptionVi}
                </p>
              </div>

              <button
                onClick={() => handleStartCardTargeting(humanCardToPlay)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold font-serif text-sm shadow-xl transition-all transform hover:scale-105 shrink-0"
              >
                ⚡ Kích Hoạt Kỹ Năng Ngay!
              </button>
            </motion.div>
          )}
        </div>

        {/* Right Col: Live Battle Action Log */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[520px]">
          <h3 className="text-sm font-bold font-mono text-amber-300 uppercase tracking-wider mb-3 flex items-center space-x-2 border-b border-amber-900/30 pb-2">
            <Scroll className="w-4 h-4 text-amber-400" />
            <span>Nhật Ký Đêm Đấu ({gameState.actionLogs.length})</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-sans text-xs">
            {gameState.actionLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2.5 rounded-lg border leading-relaxed ${
                  log.type === 'KILL'
                    ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                    : log.type === 'DEFENSE'
                    ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                    : log.type === 'REVEAL'
                    ? 'bg-indigo-950/50 border-indigo-500/40 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="text-[10px] font-mono opacity-60 mb-0.5">{log.timestamp}</div>
                <div>{log.messageVi}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Target Picker Modal */}
      <AnimatePresence>
        {activeCardToTarget && activeCardToTarget.requiresTarget && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-lg w-full bg-slate-900 border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="text-center space-y-1">
                <div className="text-xs font-mono font-bold text-amber-400 uppercase">
                  CHỌN MỤC TIÊU CHO KỸ NĂNG
                </div>
                <h3 className="text-2xl font-bold font-serif text-amber-200">
                  [{activeCardToTarget.nameVi}]
                </h3>
                <p className="text-xs text-slate-300">{activeCardToTarget.descriptionVi}</p>
              </div>

              {/* Target List Selection */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <label className="block text-xs font-mono text-amber-300 font-bold uppercase">
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
                        className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition-all ${
                          selectedTargetId === p.id
                            ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-lg'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/40'
                        }`}
                      >
                        <span className="text-xl">{p.avatar}</span>
                        <span className="text-xs truncate">{p.name}</span>
                      </button>
                    ))}
                </div>

                {/* If SWAP_HOUSE requires 2 targets */}
                {activeCardToTarget.effectType === 'SWAP_HOUSE' && selectedTargetId && (
                  <div className="mt-4 space-y-2">
                    <label className="block text-xs font-mono text-amber-300 font-bold uppercase">
                      Chọn Người Chơi Thứ 2 Để Tráo Đổi:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {gameState.players
                        .filter((p) => p.isAlive && p.id !== selectedTargetId)
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSecondTargetId(p.id)}
                            className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition-all ${
                              secondTargetId === p.id
                                ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold shadow-lg'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/40'
                            }`}
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
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Hủy Chiêu
                </button>

                <button
                  onClick={handleConfirmTargetAction}
                  disabled={
                    !selectedTargetId ||
                    (activeCardToTarget.effectType === 'SWAP_HOUSE' && !secondTargetId)
                  }
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-bold font-serif text-sm transition-all disabled:opacity-50 shadow-lg"
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
