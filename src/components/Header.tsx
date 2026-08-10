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
    <header className="game-header">
      {/* Brand & Logo */}
      <button type="button" className="game-brand" onClick={onReturnLobby} aria-label="Trở về phòng chờ">
        <div className="game-logo">
          🥷
        </div>
        <div>
          <h1 className="game-brand-title">
            NIGHT OF THE NINJA
          </h1>
          <p className="game-brand-subtitle">
            Đêm Của Ninja • Tráo Bài & Đao Phong
          </p>
        </div>
      </button>

      {/* Round & Room Info */}
      <div className="game-header-info">
        {roomCode && (
          <div className="badge">
            <Users className="w-4 h-4" />
            <span>MÃ PHÒNG:</span>
            <span className="font-bold tracking-wider">{roomCode}</span>
          </div>
        )}

        {currentRound !== undefined && (
          <div className="badge badge-primary">
            <Flame className="w-4 h-4" />
            <span>HIỆP:</span>
            <span className="font-bold">
              {currentRound} / {maxRounds}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="game-header-actions">
        <button
          onClick={onOpenRules}
          className="btn btn-ghost"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="hidden md:inline">Luật Chơi</span>
        </button>

        <button
          onClick={handleToggleSound}
          className="btn btn-ghost btn-icon"
          title={isMuted ? 'Bật Âm Thanh' : 'Tắt Âm Thanh'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};
