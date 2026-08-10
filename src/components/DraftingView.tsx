import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeftRight, Eye, ShieldCheck, Sparkles } from 'lucide-react';
import { GameState, Player, NinjaCard } from '../types/game';
import { NinjaCardView, HouseCardView } from './NinjaCardView';
import { sounds } from '../utils/audio';

interface DraftingViewProps {
  gameState: GameState;
  currentPlayer: Player;
  onPickCard: (cardId: string) => void;
}

export const DraftingView: React.FC<DraftingViewProps> = ({
  gameState,
  currentPlayer,
  onPickCard,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showHouseSecret, setShowHouseSecret] = useState(false);

  const passDirectionVi = gameState.currentRound % 2 !== 0 ? 'TRÁI ⬅️' : 'PHẢI ➡️';
  const pickedCount = currentPlayer.selectedCards.length;
  const needPickCount = 3 - pickedCount;

  const handleSelectCard = (card: NinjaCard) => {
    sounds.playCardFlip();
    setSelectedCardId(card.id);
  };

  const handleConfirmPick = () => {
    if (selectedCardId) {
      onPickCard(selectedCardId);
      setSelectedCardId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Drafting Header Bar */}
      <div className="bg-slate-900/90 border border-amber-600/40 rounded-2xl p-5 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>GIAI ĐOẠN TUYỂN CHỌN (DRAFT) • HIỆP {gameState.currentRound}</span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-amber-200 mt-1">
            Chọn 1 Lá Ninja & Chuyển Bài Qua Bên {passDirectionVi}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Bạn đã chọn <strong className="text-amber-300">{pickedCount}/3</strong> lá bài Ninja. Còn cần chọn thêm {needPickCount} lá.
          </p>
        </div>

        {/* House Card Reveal Toggle */}
        {currentPlayer.house && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowHouseSecret(!showHouseSecret)}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-md"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>{showHouseSecret ? 'Ẩn Gia Tộc Bí Mật' : 'Xem Gia Tộc Của Tôi'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Secret House Card View Overlay/Modal */}
      {showHouseSecret && currentPlayer.house && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/95 border border-amber-500/50 rounded-2xl p-4 shadow-2xl flex flex-col items-center text-center space-y-3"
        >
          <div className="text-xs font-mono text-amber-400 font-bold uppercase">
            GIA TỘC BÍ MẬT CỦA BẠN TRONG HIỆP NÀY
          </div>
          <HouseCardView house={currentPlayer.house} isRevealed={true} size="md" />
          <p className="text-xs text-slate-400 max-w-sm">
            {currentPlayer.house.descriptionVi}
          </p>
        </motion.div>
      )}

      {/* Available Draft Hand Cards */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold font-mono text-amber-300 uppercase tracking-wider flex items-center justify-between">
          <span>Xấp Bài Ninja Trôi Tới Tay Bạn (Chọn 1 Lá):</span>
          <span className="text-xs text-slate-400 font-sans">
            Hướng chuyển bài sau khi chọn: <strong className="text-amber-400">{passDirectionVi}</strong>
          </span>
        </h3>

        {currentPlayer.draftHand.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-mono text-sm animate-pulse">
            ⏳ Đang chờ những Ninja khác hoàn tất chọn bài...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center">
            {currentPlayer.draftHand.map((card) => (
              <NinjaCardView
                key={card.id}
                card={card}
                isSelected={selectedCardId === card.id}
                onClick={() => handleSelectCard(card)}
                size="md"
              />
            ))}
          </div>
        )}

        {/* Confirm Selection Button */}
        {selectedCardId && (
          <div className="text-center pt-4 border-t border-amber-900/30">
            <button
              onClick={handleConfirmPick}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-bold font-serif text-base shadow-xl transition-all transform hover:scale-105"
            >
              ✓ Xác Nhận Chọn Lá Bài Bát Này!
            </button>
          </div>
        )}
      </div>

      {/* Selected Cards Deck */}
      {currentPlayer.selectedCards.length > 0 && (
        <div className="bg-slate-950/80 border border-amber-900/40 rounded-2xl p-5 shadow-inner">
          <h4 className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Các Lá Bài Bạn Đã Tuyển Chọn ({currentPlayer.selectedCards.length}/3):</span>
          </h4>

          <div className="flex flex-wrap gap-3 justify-center">
            {currentPlayer.selectedCards.map((card) => (
              <NinjaCardView key={card.id} card={card} size="sm" isDisabled={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
