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
    <div className="game-container screen-stack">
      {/* Drafting Header Bar */}
      <div className="game-card game-card-section flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="badge badge-primary">
            <Sparkles className="w-4 h-4" />
            <span>GIAI ĐOẠN TUYỂN CHỌN (DRAFT) • HIỆP {gameState.currentRound}</span>
          </div>
          <h2 className="phase-title mt-2">
            Chọn 1 Lá Ninja & Chuyển Bài Qua Bên {passDirectionVi}
          </h2>
          <p className="text-xs text-secondary mt-1">
            Bạn đã chọn <strong>{pickedCount}/3</strong> lá bài Ninja. Còn cần chọn thêm {needPickCount} lá.
          </p>
        </div>

        {/* House Card Reveal Toggle */}
        {currentPlayer.house && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowHouseSecret(!showHouseSecret)}
              className="btn btn-secondary"
            >
              <Eye className="w-5 h-5" />
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
          className="game-card game-card-section flex flex-col items-center text-center space-y-3"
        >
          <div className="eyebrow">
            GIA TỘC BÍ MẬT CỦA BẠN TRONG HIỆP NÀY
          </div>
          <HouseCardView house={currentPlayer.house} isRevealed={true} size="md" />
          <p className="text-xs text-secondary max-w-sm">
            {currentPlayer.house.descriptionVi}
          </p>
        </motion.div>
      )}

      {/* Available Draft Hand Cards */}
      <div className="game-card game-card-section space-y-4">
        <h3 className="section-title flex-col sm:flex-row sm:justify-between sm:items-center">
          <span>Xấp Bài Ninja Trôi Tới Tay Bạn (Chọn 1 Lá):</span>
          <span className="text-xs text-secondary font-normal">
            Hướng chuyển bài sau khi chọn: <strong>{passDirectionVi}</strong>
          </span>
        </h3>

        {currentPlayer.draftHand.length === 0 ? (
          <div className="text-center py-12 text-secondary text-sm">
            ⏳ Đang chờ những Ninja khác hoàn tất chọn bài...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 justify-items-center">
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
          <div className="bottom-action-bar text-center">
            <button
              onClick={handleConfirmPick}
              className="btn btn-primary btn-cta sm:w-auto"
            >
              ✓ Xác Nhận Chọn Lá Bài Này!
            </button>
          </div>
        )}
      </div>

      {/* Selected Cards Deck */}
      {currentPlayer.selectedCards.length > 0 && (
        <div className="game-card game-card-section">
          <h4 className="section-title text-sm mb-3">
            <ShieldCheck className="w-5 h-5" />
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
