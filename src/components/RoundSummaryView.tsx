import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Trophy, Play, Users, Sparkles, RefreshCw } from 'lucide-react';
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

  const sortedPlayers = [...gameState.players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sortedPlayers[0];
  const isGameOver = gameState.status === 'GAME_OVER' || gameState.currentRound >= gameState.maxRounds;

  return (
    <div className="game-container screen-stack min-h-[calc(100vh-140px)] justify-center">
      {/* Round / Game End Banner */}
      <div className="game-card game-card-section text-center space-y-3">
        <div className="badge badge-primary">
          <Sparkles className="w-4 h-4" />
          <span>{isGameOver ? 'KẾT THÚC CẢ TRẬN ĐẤU (3 HIỆP)' : `KẾT THÚC HIỆP ${gameState.currentRound}`}</span>
        </div>

        {isGameOver ? (
          <div>
            <h1 className="phase-title">
              🏆 BẬC THẦY NINJA TỐI CAO: {winner?.name}!
            </h1>
            <p className="text-sm text-secondary mt-1">
              Đạt tổng điểm Danh Dự vinh quang cao nhất: <strong className="text-white text-lg">{winner?.totalScore} Điểm</strong>!
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
    </div>
  );
};
