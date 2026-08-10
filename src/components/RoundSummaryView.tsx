import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Play, Sparkles, RefreshCw, HelpCircle, ScrollText, X } from 'lucide-react';
import { GameState } from '../types/game';
import { sounds } from '../utils/audio';

interface RoundSummaryViewProps {
  gameState: GameState;
  onNextRound: () => void;
  onReturnLobby: () => void;
}

export const RoundSummaryView: React.FC<RoundSummaryViewProps> = ({
  gameState,
  onNextRound,
  onReturnLobby,
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    sounds.playVictoryGong();
    sounds.playTokenChime();

    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--color-primary').trim();
    const whiteColor = rootStyles.getPropertyValue('--color-white').trim();

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: [primaryColor, whiteColor],
      });
    }
  }, []);

  useEffect(() => {
    if (!isHistoryOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsHistoryOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isHistoryOpen]);

  const sortedPlayers = [...gameState.players].sort((a, b) => b.totalScore - a.totalScore);
  const winners = sortedPlayers.filter((player) => gameState.gameWinners?.includes(player.id));
  const isGameOver = gameState.status === 'GAME_OVER';
  const roundStartIndex = gameState.actionLogs.findIndex(
    (log) =>
      log.phase === 'ROUND_START' &&
      log.messageVi.includes(`HIỆP ${gameState.currentRound}`),
  );
  const currentRoundLogs = (
    roundStartIndex >= 0
      ? gameState.actionLogs.slice(0, roundStartIndex + 1)
      : gameState.actionLogs
  ).toReversed();

  const phaseLabel = (phase: (typeof gameState.actionLogs)[number]['phase']) => {
    if (!phase) return 'Hệ thống';
    const labels: Record<string, string> = {
      ROUND_START: 'Bắt đầu hiệp',
      DRAFT: 'Draft',
      SPY: 'Spy',
      MYSTIC: 'Mystic',
      TRICKSTER: 'Trickster',
      BLIND_ASSASSIN: 'Blind Assassin',
      SHINOBI: 'Shinobi',
      ROUND_END: 'House Reveal',
    };
    return labels[phase] ?? phase;
  };

  return (
    <div className="game-container screen-stack min-h-[calc(100vh-140px)] justify-center">
      {/* Round / Game End Banner */}
      <div className="game-card game-card-section text-center space-y-3">
        <div className="inline-flex items-center justify-center gap-2">
          <div className="badge badge-primary">
            <Sparkles className="w-4 h-4" />
            <span>{isGameOver ? 'KẾT THÚC TRẬN ĐẤU · MỐC 10 ĐIỂM' : `KẾT THÚC HIỆP ${gameState.currentRound}`}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="btn btn-ghost btn-icon"
            aria-label={`Xem diễn biến hiệp ${gameState.currentRound}`}
            title={`Xem diễn biến hiệp ${gameState.currentRound}`}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {isGameOver ? (
          <div>
            <h1 className="phase-title">
              🏆 BẬC THẦY NINJA TỐI CAO: {winners.map((player) => player.name).join(', ')}!
            </h1>
            <p className="text-sm text-secondary mt-1">
              Tổng điểm Danh Dự cao nhất: <strong className="text-white text-lg">{winners[0]?.totalScore} Điểm</strong>!
            </p>
          </div>
        ) : (
          <div>
            <h2 className="phase-title">
              {gameState.roundSummaryLogs[3] || 'Hoàn Tất Hiệp Đấu!'}
            </h2>
            <div className="text-xs text-secondary max-w-xl mx-auto mt-2 space-y-1">
              {gameState.roundSummaryLogs.map((log, idx) => (
                <p key={idx}>{log}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="game-card game-card-section space-y-4">
        <h3 className="section-title">
          <Trophy className="w-5 h-5" />
          <span>Bảng Xếp Hạng Điểm Danh Dự Tích Lũy</span>
        </h3>

        <div className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const isRank1 = index === 0;

            return (
              <div
                key={player.id}
                className={`player-card justify-between ${isRank1 ? 'is-current' : ''}`}
              >
                {/* Left: Rank & Player Info */}
                <div className="flex items-center space-x-3 truncate">
                  <div className="badge leader-rank">
                    #{index + 1}
                  </div>
                  <div className="text-2xl">{player.avatar}</div>
                  <div className="truncate">
                    <div className="player-card-name flex items-center gap-2">
                      <span>{player.name}</span>
                      {player.house && (
                        <span className="badge px-2 min-h-0">
                          {player.house.icon} {player.house.nameVi}
                        </span>
                      )}
                    </div>
                    <div className="player-card-status">
                      Thẻ Danh Dự: [{player.honorTokens.map((t) => `${t.value}đ`).join(', ') || 'Chưa có'}]
                    </div>
                  </div>
                </div>

                {/* Right: Total Points */}
                <div className="text-right shrink-0">
                  <div className="text-xl font-bold text-white">
                    {player.totalScore} <span className="text-xs text-secondary">điểm</span>
                  </div>
                  <div className="player-card-status">
                    Hạ gục: {player.killsThisRound} Ninja
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="bottom-action-bar flex items-center justify-center gap-4">
        {isGameOver ? (
          <button
            onClick={onReturnLobby}
            className="btn btn-primary btn-cta sm:w-auto"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Trở Về Phòng Chờ / Đấu Trận Mới</span>
          </button>
        ) : (
          <button
            onClick={onNextRound}
            className="btn btn-primary btn-cta sm:w-auto"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Sang Hiệp {gameState.currentRound + 1} Tiếp Theo!</span>
          </button>
        )}
      </div>

      {isHistoryOpen && (
        <div className="modal-overlay">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="round-history-title"
            className="bottom-sheet max-w-2xl max-h-[85vh] flex flex-col"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="eyebrow">Nhật ký công khai</div>
                <h2 id="round-history-title" className="phase-title flex items-center gap-2 mt-1">
                  <ScrollText className="w-6 h-6" />
                  Diễn biến hiệp {gameState.currentRound}
                </h2>
                <p className="text-xs text-secondary mt-1">
                  Theo thứ tự từ đầu hiệp đến House Reveal. Thông tin xem bí mật không xuất hiện tại đây.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="btn btn-ghost btn-icon shrink-0"
                aria-label="Đóng lịch sử hiệp"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="game-log flex-1 overflow-y-auto mt-4 pr-1 space-y-2">
              {currentRoundLogs.map((log, index) => (
                <div
                  key={log.id}
                  className={`game-log-entry ${['KILL', 'DEFENSE', 'REVEAL', 'HONOR'].includes(log.type) ? 'is-important' : ''}`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted mb-1">
                    <span className="badge min-h-0 px-2">{index + 1}</span>
                    <span>{log.timestamp}</span>
                    <span>•</span>
                    <span>{phaseLabel(log.phase)}</span>
                  </div>
                  <div>{log.messageVi}</div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(false)}
              className="btn btn-primary mt-4"
            >
              Đóng nhật ký
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
