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
    <div role="dialog" aria-modal="true" aria-labelledby="pass-player-title" className="modal-overlay select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bottom-sheet max-w-md flex flex-col items-center space-y-6 text-center"
      >
        <div className="avatar avatar-lg">
          {currentPlayer.avatar}
        </div>

        <div>
          <div className="badge badge-primary mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>CHẾ ĐỘ MẬT • BẢO MẬT MÀN HÌNH</span>
          </div>
          <h2 id="pass-player-title" className="phase-title">
            Chuyển Thiết Bị Cho
          </h2>
          <p className="text-xl font-bold text-white mt-1">
            {currentPlayer.name}
          </p>
        </div>

        <p className="text-sm text-secondary leading-relaxed">
          Đảm bảo những người chơi khác không nhìn vào màn hình trước khi nhấn nút mở thẻ!
        </p>

        <button
          onClick={onReveal}
          className="btn btn-primary btn-cta"
        >
          <Eye className="w-5 h-5" />
          <span>Tôi Là {currentPlayer.name} • Mở Thẻ!</span>
        </button>
      </motion.div>
    </div>
  );
};
