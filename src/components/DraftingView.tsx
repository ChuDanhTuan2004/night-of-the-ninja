import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
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
  const [discardingCardId, setDiscardingCardId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmTimerRef = useRef<number | null>(null);

  const pickedCount = currentPlayer.selectedCards.length;
  const draftPickNumber = gameState.draftPickNumber || 1;
  const needPickCount = Math.max(0, 2 - pickedCount);
  const hasCompletedDraft = pickedCount >= 2;
  const hasPickedCurrentStage = pickedCount >= draftPickNumber;
  const isReceivedHand =
    draftPickNumber === 2 &&
    !hasPickedCurrentStage &&
    currentPlayer.draftHand.length === 2;
  const handKey = currentPlayer.draftHand.map((card) => card.id).join('-') || 'empty';
  const receiveOffset = 96;

  useEffect(() => {
    setSelectedCardId(null);
    setDiscardingCardId(null);
    setIsConfirming(false);
  }, [currentPlayer.id, handKey]);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current !== null) {
        window.clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  const handleSelectCard = (card: NinjaCard) => {
    if (isConfirming || hasCompletedDraft) return;
    sounds.playCardFlip();
    setSelectedCardId(card.id);
  };

  const handleConfirmPick = () => {
    if (!selectedCardId || isConfirming) return;

    if (isReceivedHand) {
      const cardToDiscard = currentPlayer.draftHand.find(
        (card) => card.id !== selectedCardId
      );
      setDiscardingCardId(cardToDiscard?.id || null);
      setIsConfirming(true);
      sounds.playCardFlip();
      confirmTimerRef.current = window.setTimeout(() => {
        onPickCard(selectedCardId);
        setSelectedCardId(null);
        setDiscardingCardId(null);
        setIsConfirming(false);
      }, 420);
      return;
    }

    onPickCard(selectedCardId);
    setSelectedCardId(null);
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
            {hasCompletedDraft
              ? 'Bạn Đã Hoàn Tất Tuyển Chọn'
              : hasPickedCurrentStage
              ? 'Đang Chờ Những Ninja Khác Chọn Lá'
              : draftPickNumber === 1
              ? 'Chọn 1 Lá & Chuyển 2 Lá Sang Trái ⬅️'
              : 'Nhận 2 Lá • Chọn 1 Lá, Bỏ 1 Lá'}
          </h2>
          <p className="text-xs text-secondary mt-1">
            Bạn đã giữ <strong>{pickedCount}/2</strong> lá bài Ninja.
            {needPickCount > 0 ? ` Còn cần chọn thêm ${needPickCount} lá.` : ' Đang chờ bàn chơi hoàn tất.'}
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
          <span>
            {isReceivedHand
              ? 'Hai Lá Người Chơi Khác Vừa Chuyển Tới'
              : hasCompletedDraft
              ? 'Tuyển Chọn Hoàn Tất'
              : hasPickedCurrentStage
              ? 'Đang Chờ Chuyển Bài'
              : 'Ba Lá Bài Ban Đầu Của Bạn'}
          </span>
          <span className="badge font-normal">
            <Trash2 className="w-4 h-4" />
            Chồng bài bỏ: {gameState.ninjaDiscardPile?.length || 0}
          </span>
        </h3>

        {hasCompletedDraft || hasPickedCurrentStage ? (
          <div className="status-panel text-center py-8">
            {hasCompletedDraft
              ? '✓ Bạn đã chọn đủ 2 lá. Đang chờ những Ninja khác hoàn tất…'
              : '✓ Đã giữ lá đầu tiên. Đang chờ mọi người chọn xong để nhận 2 lá được chuyển tới…'}
          </div>
        ) : currentPlayer.draftHand.length === 0 ? (
          <div className="text-center py-12 text-secondary text-sm">
            ⏳ Đang chờ nhận 2 lá bài từ người chơi bên cạnh…
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={handKey}
              initial={
                isReceivedHand
                  ? { opacity: 0, x: receiveOffset, scale: 0.94 }
                  : { opacity: 0, y: 20, scale: 0.96 }
              }
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className={`grid gap-3 justify-items-center ${
                currentPlayer.draftHand.length === 2
                  ? 'grid-cols-2 max-w-sm mx-auto'
                  : 'grid-cols-2 sm:grid-cols-3'
              }`}
            >
              {currentPlayer.draftHand.map((card) => (
                <NinjaCardView
                  key={card.id}
                  card={card}
                  isSelected={selectedCardId === card.id}
                  onClick={() => handleSelectCard(card)}
                  className={
                    discardingCardId === card.id
                      ? 'is-discarding'
                      : isConfirming && selectedCardId === card.id
                      ? 'is-keeping'
                      : ''
                  }
                  size="md"
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {isReceivedHand && !hasCompletedDraft && (
          <div className="status-panel text-sm">
            Chọn đúng 1 trong 2 lá. Lá không chọn sẽ được đưa vào chồng bài bỏ và không quay lại ván này.
          </div>
        )}

        {/* Confirm Selection Button */}
        {selectedCardId && (
          <div className="bottom-action-bar text-center">
            <button
              onClick={handleConfirmPick}
              disabled={isConfirming}
              className="btn btn-primary btn-cta sm:w-auto"
            >
              {isConfirming
                ? 'Đang Đưa Lá Còn Lại Vào Chồng Bài Bỏ…'
                : isReceivedHand
                ? 'Giữ Lá Này & Bỏ Lá Còn Lại'
                : 'Giữ Lá Này & Chuyển 2 Lá Còn Lại'}
            </button>
          </div>
        )}
      </div>

      {/* Selected Cards Deck */}
      {currentPlayer.selectedCards.length > 0 && (
        <div className="game-card game-card-section">
          <h4 className="section-title text-sm mb-3">
            <ShieldCheck className="w-5 h-5" />
            <span>Các Lá Bài Bạn Đã Giữ ({currentPlayer.selectedCards.length}/2):</span>
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
