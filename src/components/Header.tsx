import React from 'react';
import { Volume2, VolumeX, HelpCircle, Users, Trophy, Flame } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  roomCode?: string;
  currentRound?: number;
  maxRounds?: number;
  gameMode?: string;
  onOpenRules: () => void;
  onReturnLobby?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  currentRound,
  maxRounds = 3,
  gameMode,
  onOpenRules,
  onReturnLobby,
}) => {
  const [isMuted, setIsMuted] = React.useState(sounds.getMuted());

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="w-full bg-slate-950/90 backdrop-blur-md border-b border-amber-900/40 px-3 sm:px-4 py-3 text-amber-100 flex flex-wrap items-center justify-between gap-2 shadow-xl sticky top-0 z-40">
      {/* Brand & Logo */}
      <button type="button" className="flex items-center space-x-3 text-left" onClick={onReturnLobby} aria-label="Trở về phòng chờ">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-950 via-red-900 to-amber-900 border border-amber-500/40 flex items-center justify-center text-2xl shadow-lg shadow-rose-950/50">
          🥷
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-300 to-amber-400 font-serif">
            NIGHT OF THE NINJA
          </h1>
          <p className="text-[10px] text-amber-200/60 uppercase tracking-widest -mt-1 font-mono">
            Đêm Của Ninja • Tráo Bài & Đao Phong
          </p>
        </div>
      </button>

      {/* Round & Room Info */}
      <div className="order-3 sm:order-none w-full sm:w-auto flex items-center justify-center space-x-2 sm:space-x-4">
        {roomCode && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-600/30 font-mono text-xs text-amber-300">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>MÃ PHÒNG:</span>
            <span className="font-bold text-amber-200 tracking-wider text-sm">{roomCode}</span>
          </div>
        )}

        {currentRound !== undefined && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-rose-950/60 border border-rose-600/30 text-xs text-rose-200">
            <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>HIỆP:</span>
            <span className="font-bold text-rose-300 text-sm">
              {currentRound} / {maxRounds}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenRules}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-700/40 text-xs font-medium text-amber-200 transition-all hover:border-amber-500/60"
        >
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">Luật Chơi</span>
        </button>

        <button
          onClick={handleToggleSound}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/50 text-amber-300 transition-all"
          title={isMuted ? 'Bật Âm Thanh' : 'Tắt Âm Thanh'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>
      </div>
    </header>
  );
};
