import React, { useState } from 'react';
import { Users, Bot, Play, ShieldAlert, Plus, Trash2, Copy, Check, Sparkles } from 'lucide-react';
import { GameMode, Player } from '../types/game';
import { AVATARS } from '../data/cards';

interface LobbyViewProps {
  roomCode?: string;
  gameMode: GameMode;
  players: Player[];
  isHost: boolean;
  onSetGameMode: (mode: GameMode) => void;
  onCreateRoom: (hostName: string, mode: GameMode) => void;
  onJoinRoom: (roomCode: string, name: string) => void;
  onAddBot: () => void;
  onRemoveBot: (botId: string) => void;
  onStartGame: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomCode,
  gameMode,
  players,
  isHost,
  onSetGameMode,
  onCreateRoom,
  onJoinRoom,
  onAddBot,
  onRemoveBot,
  onStartGame,
}) => {
  const [hostName, setHostName] = useState('Ninja Master');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinNameInput, setJoinNameInput] = useState('Shinobi');
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
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
        {/* Hero Title */}
        <div className="text-center max-w-xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold tracking-wider uppercase shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>GAME BÀI BẤT NGỜ • ẨN DANH & CHIẾN THUẬT</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-rose-200 to-amber-300 tracking-wide drop-shadow-md">
            NIGHT OF THE NINJA
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
            Gia Tộc Hoa Sen & Chim Hạc đụng độ trong bóng đêm! Đoán thân phận, tuyển chọn Ninja, tung đao ám sát và tích lũy Thẻ Danh Dự vinh quang!
          </p>
        </div>

        {/* Tab Selection */}
        <div className="max-w-md w-full bg-slate-900/90 border border-amber-600/40 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex border-b border-amber-900/40 pb-4 mb-6 gap-2">
            <button
              onClick={() => setTab('CREATE')}
              className={`flex-1 py-2.5 rounded-xl font-bold font-serif text-sm transition-all ${
                tab === 'CREATE'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'bg-slate-800 text-slate-400 hover:text-amber-200'
              }`}
            >
              Tạo Phòng Mới
            </button>
            <button
              onClick={() => setTab('JOIN')}
              className={`flex-1 py-2.5 rounded-xl font-bold font-serif text-sm transition-all ${
                tab === 'JOIN'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'bg-slate-800 text-slate-400 hover:text-amber-200'
              }`}
            >
              Vào Phòng Có Sẵn
            </button>
          </div>

          {tab === 'CREATE' ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-amber-300 font-mono mb-1.5 uppercase">
                  Tên Của Bạn (Trưởng Môn)
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-amber-700/50 text-amber-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm font-medium"
                  placeholder="Nhập tên nhân vật..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 font-mono mb-2 uppercase">
                  Chế Độ Chơi
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onSetGameMode('SOLO_BOTS')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                      gameMode === 'SOLO_BOTS'
                        ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-amber-700/40'
                    }`}
                  >
                    <Bot className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-amber-100 font-serif">Chơi Với AI Bot (Solo)</div>
                      <div className="text-xs text-slate-400">Tự động thêm 4 Bot AI thông minh. Vào chơi ngay lập tức!</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSetGameMode('PASS_AND_PLAY')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                      gameMode === 'PASS_AND_PLAY'
                        ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-amber-700/40'
                    }`}
                  >
                    <ShieldAlert className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-amber-100 font-serif">Pass & Play (Cùng 1 Màn Hình)</div>
                      <div className="text-xs text-slate-400">Chơi trực tiếp trên 1 thiết bị, có màn hình che thẻ bảo mật!</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSetGameMode('ONLINE_ROOM')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start space-x-3 ${
                      gameMode === 'ONLINE_ROOM'
                        ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-amber-700/40'
                    }`}
                  >
                    <Users className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-amber-100 font-serif">Phòng Trực Tuyến 多人</div>
                      <div className="text-xs text-slate-400">Tạo mã phòng chia sẻ cho bạn bè ở nhiều thiết bị cùng vào!</div>
                    </div>
                  </button>
                </div>
              </div>

              <button
                onClick={() => onCreateRoom(hostName, gameMode)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-bold font-serif text-base shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Khởi Tạo Phòng Ngay!</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-300 font-mono mb-1.5 uppercase">
                  Mã Phòng (5 Ký Tự)
                </label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-amber-700/50 text-amber-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 text-base font-mono font-bold tracking-widest uppercase"
                  placeholder="VD: NINJA"
                  maxLength={5}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 font-mono mb-1.5 uppercase">
                  Tên Của Bạn
                </label>
                <input
                  type="text"
                  value={joinNameInput}
                  onChange={(e) => setJoinNameInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-amber-700/50 text-amber-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm font-medium"
                  placeholder="Nhập biệt hiệu Ninja..."
                />
              </div>

              <button
                onClick={() => onJoinRoom(joinCodeInput, joinNameInput)}
                disabled={!joinCodeInput.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold font-serif text-base shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Users className="w-5 h-5" />
                <span>Tham Gia Phòng!</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Waiting Lobby View
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 min-h-[85vh] flex flex-col justify-center">
      {/* Lobby Header Card */}
      <div className="bg-slate-900/90 border border-amber-600/40 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">
            PHÒNG CHỜ NINJA • {gameMode === 'SOLO_BOTS' ? 'ĐẤU BOT AI' : gameMode === 'PASS_AND_PLAY' ? 'PASS & PLAY' : 'TRỰC TUYẾN'}
          </div>
          <h2 className="text-3xl font-bold font-serif text-amber-200 mt-1">
            Mã Phòng: <span className="font-mono text-amber-400">{roomCode}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Yêu cầu từ <strong className="text-amber-300">4 đến 11 người chơi</strong>. Hiện tại: <strong className="text-amber-300">{players.length} Ninja</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyCode}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center space-x-1.5 transition-all"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Đã Sa Chép!' : 'Sao Chép Mã'}</span>
          </button>

          {isHost && (
            <button
              onClick={onAddBot}
              disabled={players.length >= 11}
              className="px-4 py-2 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Thêm AI Bot</span>
            </button>
          )}
        </div>
      </div>

      {/* Players Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-bold font-mono text-amber-300 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Users className="w-4 h-4 text-amber-400" />
          <span>Danh Sách Ninja Tham Gia ({players.length}/11)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {players.map((p, idx) => (
            <div
              key={p.id}
              className="bg-slate-950 border border-amber-900/40 rounded-xl p-3 flex items-center justify-between shadow-md relative group"
            >
              <div className="flex items-center space-x-3 truncate">
                <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                  {p.avatar || AVATARS[idx % AVATARS.length]}
                </div>
                <div className="truncate">
                  <div className="font-bold text-sm text-amber-100 truncate flex items-center space-x-1">
                    <span>{p.name}</span>
                    {p.isHost && <span className="text-[10px] text-amber-400 font-mono">(Host)</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {p.isBot ? '🤖 AI Bot' : '👤 Người chơi'}
                  </div>
                </div>
              </div>

              {isHost && p.isBot && (
                <button
                  onClick={() => onRemoveBot(p.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Xóa Bot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {!isLobbyReadyToStart && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs text-center font-mono">
            ⚠️ Cần ít nhất 4 người chơi để bắt đầu! Nhấn "Thêm AI Bot" nếu thiếu người.
          </div>
        )}
      </div>

      {/* Start Action */}
      {isHost && (
        <div className="text-center">
          <button
            onClick={onStartGame}
            disabled={!isLobbyReadyToStart}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-black font-serif text-lg shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
          >
            ⚔️ BẮT ĐẦU TRẬN ĐẤU NIGHT OF THE NINJA!
          </button>
        </div>
      )}
    </div>
  );
};
