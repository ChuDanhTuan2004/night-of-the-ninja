import React, { useState } from 'react';
import { Users, Bot, Play, ShieldAlert, Plus, Trash2, Copy, Check, Sparkles } from 'lucide-react';
import { GameMode, Player } from '../types/game';
import { AVATARS } from '../data/cards';

interface LobbyViewProps {
  roomCode?: string;
  gameMode: GameMode;
  players: Player[];
  isHost: boolean;
  isBusy: boolean;
  onSetGameMode: (mode: GameMode) => void;
  onCreateRoom: (hostName: string, mode: GameMode) => void;
  onJoinRoom: (roomCode: string, name: string) => void;
  onAddLocalPlayer: (name: string) => void;
  onAddBot: () => void;
  onRemoveBot: (botId: string) => void;
  onStartGame: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomCode,
  gameMode,
  players,
  isHost,
  isBusy,
  onSetGameMode,
  onCreateRoom,
  onJoinRoom,
  onAddLocalPlayer,
  onAddBot,
  onRemoveBot,
  onStartGame,
}) => {
  const [hostName, setHostName] = useState('Ninja Master');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinNameInput, setJoinNameInput] = useState('Shinobi');
  const [localPlayerName, setLocalPlayerName] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [tab, setTab] = useState<'CREATE' | 'JOIN'>('CREATE');

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const isLobbyReadyToStart = players.length >= 4 && players.length <= 11;

  if (!roomCode) {
    return (
      <div className="game-container min-h-[calc(100vh-140px)] flex flex-col items-center justify-center">
        {/* Hero Title */}
        <div className="text-center max-w-xl mx-auto mb-8 space-y-3">
          <div className="badge badge-primary">
            <Sparkles className="w-4 h-4" />
            <span>GAME BÀI BẤT NGỜ • ẨN DANH & CHIẾN THUẬT</span>
          </div>
          <h1 className="hero-title tracking-wide">
            NIGHT OF THE NINJA
          </h1>
          <p className="text-secondary text-sm sm:text-base leading-relaxed">
            Gia Tộc Hoa Sen & Chim Hạc đụng độ trong bóng đêm! Đoán thân phận, tuyển chọn Ninja, tung đao ám sát và tích lũy Thẻ Danh Dự vinh quang!
          </p>
        </div>

        {/* Tab Selection */}
        <div className="game-card game-card-section max-w-md w-full">
          <div className="segmented-control mb-6">
            <button
              onClick={() => setTab('CREATE')}
              className={`btn ${tab === 'CREATE' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Tạo Phòng Mới
            </button>
            <button
              onClick={() => setTab('JOIN')}
              className={`btn ${tab === 'JOIN' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Vào Phòng Có Sẵn
            </button>
          </div>

          {tab === 'CREATE' ? (
            <div className="space-y-5">
              <div>
                <label className="form-label">
                  Tên Của Bạn (Trưởng Môn)
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="form-control"
                  placeholder="Nhập tên nhân vật..."
                />
              </div>

              <div>
                <label className="form-label">
                  Chế Độ Chơi
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => onSetGameMode('SOLO_BOTS')}
                    className={`mode-option ${gameMode === 'SOLO_BOTS' ? 'is-selected' : ''}`}
                  >
                    <Bot className="w-5 h-5 mt-1 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm text-white">Chơi Với AI Bot (Solo)</div>
                      <div className="text-xs text-secondary">Tự động thêm 4 Bot AI thông minh. Vào chơi ngay lập tức!</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSetGameMode('PASS_AND_PLAY')}
                    className={`mode-option ${gameMode === 'PASS_AND_PLAY' ? 'is-selected' : ''}`}
                  >
                    <ShieldAlert className="w-5 h-5 mt-1 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm text-white">Pass & Play (Cùng 1 Màn Hình)</div>
                      <div className="text-xs text-secondary">Chơi trực tiếp trên 1 thiết bị, có màn hình che thẻ bảo mật!</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSetGameMode('ONLINE_ROOM')}
                    className={`mode-option ${gameMode === 'ONLINE_ROOM' ? 'is-selected' : ''}`}
                  >
                    <Users className="w-5 h-5 mt-1 shrink-0" />
                    <div>
                      <div className="font-semibold text-sm text-white">Phòng Trực Tuyến</div>
                      <div className="text-xs text-secondary">Tạo mã phòng chia sẻ cho bạn bè ở nhiều thiết bị cùng vào!</div>
                    </div>
                  </button>
                </div>
              </div>

              <button
                onClick={() => onCreateRoom(hostName, gameMode)}
                disabled={isBusy || !hostName.trim()}
                className="btn btn-primary btn-cta"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{isBusy ? 'Đang Khởi Tạo…' : 'Khởi Tạo Phòng Ngay!'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="form-label">
                  Mã Phòng (5 Ký Tự)
                </label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="form-control font-mono font-bold tracking-widest uppercase"
                  placeholder="VD: NINJA"
                  maxLength={5}
                />
              </div>

              <div>
                <label className="form-label">
                  Tên Của Bạn
                </label>
                <input
                  type="text"
                  value={joinNameInput}
                  onChange={(e) => setJoinNameInput(e.target.value)}
                  className="form-control"
                  placeholder="Nhập biệt hiệu Ninja..."
                />
              </div>

              <button
                onClick={() => onJoinRoom(joinCodeInput, joinNameInput)}
                disabled={isBusy || !joinCodeInput.trim() || !joinNameInput.trim()}
                className="btn btn-primary btn-cta"
              >
                <Users className="w-5 h-5" />
                <span>{isBusy ? 'Đang Tham Gia…' : 'Tham Gia Phòng!'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Waiting Lobby View
  return (
    <div className="game-container screen-stack min-h-[calc(100vh-140px)] justify-center">
      {/* Lobby Header Card */}
      <div className="game-card game-card-section flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="eyebrow">
            PHÒNG CHỜ NINJA • {gameMode === 'SOLO_BOTS' ? 'ĐẤU BOT AI' : gameMode === 'PASS_AND_PLAY' ? 'PASS & PLAY' : 'TRỰC TUYẾN'}
          </div>
          <h2 className="phase-title mt-1">
            Mã Phòng: <span className="font-mono">{roomCode}</span>
          </h2>
          <p className="text-xs text-secondary mt-1">
            Yêu cầu từ <strong>4 đến 11 người chơi</strong>. Hiện tại: <strong>{players.length} Ninja</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyCode}
            className="btn btn-secondary"
          >
            {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Đã Sa Chép!' : 'Sao Chép Mã'}</span>
          </button>

          {isHost && gameMode !== 'PASS_AND_PLAY' && (
            <button
              onClick={onAddBot}
              disabled={players.length >= 11}
              className="btn btn-secondary"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm AI Bot</span>
            </button>
          )}
        </div>
      </div>

      {/* Players Grid */}
      <div className="game-card game-card-section">
        <h3 className="section-title mb-4">
          <Users className="w-5 h-5" />
          <span>Danh Sách Ninja Tham Gia ({players.length}/11)</span>
        </h3>

        {isHost && gameMode === 'PASS_AND_PLAY' && (
          <form
            className="mb-4 flex flex-col sm:flex-row gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!localPlayerName.trim()) return;
              onAddLocalPlayer(localPlayerName);
              setLocalPlayerName('');
            }}
          >
            <label htmlFor="local-player-name" className="sr-only">
              Tên người chơi tiếp theo
            </label>
            <input
              id="local-player-name"
              value={localPlayerName}
              onChange={(event) => setLocalPlayerName(event.target.value)}
              maxLength={24}
              placeholder="Tên người chơi tiếp theo…"
              className="form-control flex-1"
            />
            <button
              type="submit"
              disabled={!localPlayerName.trim() || players.length >= 11}
              className="btn btn-primary"
            >
              Thêm Người Chơi
            </button>
          </form>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {players.map((p, idx) => (
            <div
              key={p.id}
              className="player-card justify-between relative group"
            >
              <div className="flex items-center space-x-3 truncate">
                <div className="avatar">
                  {p.avatar || AVATARS[idx % AVATARS.length]}
                </div>
                <div className="truncate">
                  <div className="player-card-name flex items-center space-x-1">
                    <span>{p.name}</span>
                    {p.isHost && <span className="badge px-2 min-h-0">Host</span>}
                  </div>
                  <div className="player-card-status">
                    {p.isBot ? '🤖 AI Bot' : '👤 Người chơi'}
                  </div>
                </div>
              </div>

              {isHost && (p.isBot || (gameMode === 'PASS_AND_PLAY' && !p.isHost)) && (
                <button
                  onClick={() => onRemoveBot(p.id)}
                  className="btn btn-ghost btn-icon"
                  title="Xóa người chơi"
                  aria-label={`Xóa ${p.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {!isLobbyReadyToStart && (
          <div className="status-panel mt-4 text-xs text-center">
            ⚠️ Cần ít nhất 4 người chơi để bắt đầu! Nhấn "Thêm AI Bot" nếu thiếu người.
          </div>
        )}
      </div>

      {/* Start Action */}
      {isHost && (
        <div className="bottom-action-bar">
          <button
            onClick={onStartGame}
            disabled={!isLobbyReadyToStart || isBusy}
            className="btn btn-primary btn-cta"
          >
            {isBusy ? 'ĐANG CHUẨN BỊ TRẬN ĐẤU…' : '⚔️ BẮT ĐẦU TRẬN ĐẤU NIGHT OF THE NINJA!'}
          </button>
        </div>
      )}
    </div>
  );
};
