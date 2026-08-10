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

    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const sortedPlayers = [...gameState.players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sortedPlayers[0];
  const isGameOver = gameState.status === 'GAME_OVER' || gameState.currentRound >= gameState.maxRounds;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 min-h-[85vh] flex flex-col justify-center">
      {/* Round / Game End Banner */}
      <div className="bg-slate-900/95 border border-amber-500/50 rounded-2xl p-6 shadow-2xl backdrop-blur-xl text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-widest">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{isGameOver ? 'KẾT THÚC CẢ TRẬN ĐẤU (3 HIỆP)' : `KẾT THÚC HIỆP ${gameState.currentRound}`}</span>
        </div>

        {isGameOver ? (
          <div>
            <h1 className="text-3xl sm:text-4xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-300 to-amber-300">
              🏆 BẬC THẦY NINJA TỐI CAO: {winner?.name}!
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Đạt tổng điểm Danh Dự vinh quang cao nhất: <strong className="text-amber-400 text-lg font-mono">{winner?.totalScore} Điểm</strong>!
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-200">
              {gameState.roundSummaryLogs[3] || 'Hoàn Tất Hiệp Đấu!'}
            </h2>
            <div className="text-xs text-slate-300 max-w-xl mx-auto mt-2 space-y-1 font-sans">
              {gameState.roundSummaryLogs.map((log, idx) => (
                <p key={idx}>{log}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold font-mono text-amber-300 uppercase tracking-wider flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Bảng Xếp Hạng Điểm Danh Dự Tích Lũy</span>
        </h3>

        <div className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const isRank1 = index === 0;

            return (
              <div
                key={player.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  isRank1
                    ? 'bg-amber-950/60 border-amber-400/80 ring-1 ring-amber-400/30'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                {/* Left: Rank & Player Info */}
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 font-bold font-mono text-sm text-amber-300 flex items-center justify-center shrink-0">
                    #{index + 1}
                  </div>
                  <div className="text-2xl">{player.avatar}</div>
                  <div className="truncate">
                    <div className="font-bold text-sm text-amber-100 truncate flex items-center space-x-1.5">
                      <span>{player.name}</span>
                      {player.house && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-amber-500/30 text-amber-300 font-mono">
                          {player.house.icon} {player.house.nameVi}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Thẻ Danh Dự: [{player.honorTokens.map((t) => `${t.value}đ`).join(', ') || 'Chưa có'}]
                    </div>
                  </div>
                </div>

                {/* Right: Total Points */}
                <div className="text-right shrink-0">
                  <div className="text-xl font-bold font-mono text-amber-300">
                    {player.totalScore} <span className="text-xs text-amber-400/60">điểm</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Hạ gục: {player.killsThisRound} Ninja
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="flex items-center justify-center space-x-4">
        {isGameOver ? (
          <button
            onClick={onReturnLobby}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold font-serif text-base shadow-xl transition-all flex items-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Trở Về Phòng Chờ / Đấu Trận Mới</span>
          </button>
        ) : (
          <button
            onClick={onNextRound}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-bold font-serif text-base shadow-xl transition-all flex items-center space-x-2 transform hover:scale-105"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Sang Hiệp {gameState.currentRound + 1} Tiếp Theo!</span>
          </button>
        )}
      </div>
    </div>
  );
};
