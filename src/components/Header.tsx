import React from 'react';
import { Volume2, VolumeX, HelpCircle, Users, Flame, XCircle } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  roomCode?: string;
  currentRound?: number;
  onOpenRules: () => void;
  onReturnLobby?: () => void;
  canCancelRoom?: boolean;
  isCancellingRoom?: boolean;
  onCancelRoom?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  currentRound,
  onOpenRules,
  onReturnLobby,
  canCancelRoom = false,
  isCancellingRoom = false,
  onCancelRoom,
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
            <span className="hidden sm:inline">MÃ PHÒNG:</span>
            <span className="font-bold tracking-wider">{roomCode}</span>
          </div>
        )}

        {currentRound !== undefined && (
          <div className="badge badge-primary">
            <Flame className="w-4 h-4" />
            <span className="hidden sm:inline">HIỆP:</span>
            <span className="font-bold">
              {currentRound}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="game-header-actions">
        {canCancelRoom && onCancelRoom && (
          <button
            type="button"
            onClick={onCancelRoom}
            disabled={isCancellingRoom}
            className="btn btn-danger"
            title="Hủy phòng"
          >
            <XCircle className="w-5 h-5" />
            <span className="hidden lg:inline">
              {isCancellingRoom ? 'Đang hủy…' : 'Hủy phòng'}
            </span>
          </button>
        )}

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
