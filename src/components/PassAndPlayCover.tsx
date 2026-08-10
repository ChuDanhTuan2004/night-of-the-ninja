import React from 'react';
import { motion } from 'motion/react';
import { Eye, ShieldAlert } from 'lucide-react';
import { Player } from '../types/game';

interface PassAndPlayCoverProps {
  currentPlayer: Player;
  onReveal: () => void;
}

export const PassAndPlayCover: React.FC<PassAndPlayCoverProps> = ({
  currentPlayer,
  onReveal,
}) => {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="pass-player-title" className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 text-center select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-slate-900 border border-amber-600/40 rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-5xl shadow-lg">
          {currentPlayer.avatar}
        </div>

        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>CHẾ ĐỘ MẬT • BẢO MẬT MÀN HÌNH</span>
          </div>
          <h2 id="pass-player-title" className="text-2xl font-bold font-serif text-amber-200">
            Chuyển Thiết Bị Cho
          </h2>
          <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-amber-200 mt-1">
            {currentPlayer.name}
          </p>
        </div>

        <p className="text-sm text-slate-400 font-sans leading-relaxed">
          Đảm bảo những người chơi khác không nhìn vào màn hình trước khi nhấn nút mở thẻ!
        </p>

        <button
          onClick={onReveal}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-bold font-serif text-base shadow-xl hover:shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
        >
          <Eye className="w-5 h-5" />
          <span>Tôi Là {currentPlayer.name} • Mở Thẻ!</span>
        </button>
      </motion.div>
    </div>
  );
};
