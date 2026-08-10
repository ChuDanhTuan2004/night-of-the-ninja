import React from 'react';
import { motion } from 'motion/react';
import { NinjaCard, HouseCard } from '../types/game';

interface NinjaCardViewProps {
  card: NinjaCard;
  isSelected?: boolean;
  isFaceDown?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NinjaCardView: React.FC<NinjaCardViewProps> = ({
  card,
  isSelected = false,
  isFaceDown = false,
  isDisabled = false,
  onClick,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'ninja-card-sm',
    md: '',
    lg: 'ninja-card-lg',
  }[size];

  if (isFaceDown) {
    return (
      <motion.button
        type="button"
        disabled={isDisabled}
        aria-label="Lá bài Ninja đang úp"
        whileHover={{ scale: isDisabled ? 1 : 1.05 }}
        whileTap={{ scale: isDisabled ? 1 : 0.95 }}
        onClick={isDisabled ? undefined : onClick}
        className={`ninja-card ${sizeClasses} items-center group select-none ${className}`}
      >
        <div className="w-full text-right text-xs text-muted uppercase">
          Ninja Card
        </div>
        <div className="avatar avatar-card-icon">
          🥷
        </div>
        <div className="text-xs text-secondary tracking-widest text-center">
          ĐÊM NINJA
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      disabled={isDisabled}
      aria-pressed={isSelected}
      aria-label={`${card.nameVi}: ${card.descriptionVi}`}
      whileHover={{ scale: isDisabled ? 1 : 1.05, y: isDisabled ? 0 : -6 }}
      whileTap={{ scale: isDisabled ? 1 : 0.95 }}
      onClick={isDisabled ? undefined : onClick}
      className={`ninja-card ${sizeClasses} ${isSelected ? 'is-selected' : ''} select-none ${className}`}
    >
      {/* Top Header: Speed Rank Badge & Name */}
      <div className="flex items-center justify-between gap-1 w-full border-b border-white/10 pb-2">
        <span
          className="ninja-card-rank"
        >
          P{card.rank} • {card.rankNameVi}
        </span>
        <span className="text-xl">{card.icon}</span>
      </div>

      {/* Main Card Content */}
      <div className="my-auto flex flex-col items-center text-center space-y-1">
        <h3 className="ninja-card-title">
          {card.nameVi}
        </h3>
        <p className="ninja-card-copy px-1">
          {card.descriptionVi}
        </p>
      </div>

      {/* Bottom Quote */}
      {card.flavorQuoteVi && (
        <div className="border-t border-white/10 pt-1 text-xs italic text-muted text-center truncate">
          "{card.flavorQuoteVi}"
        </div>
      )}

      {/* Selection Checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-ninja-primary text-white font-bold text-xs flex items-center justify-center">
          ✓
        </div>
      )}
    </motion.button>
  );
};

interface HouseCardViewProps {
  house: HouseCard;
  isRevealed?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const HouseCardView: React.FC<HouseCardViewProps> = ({
  house,
  isRevealed = true,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'house-card-sm' : '';

  if (!isRevealed) {
    return (
      <div
        className={`house-card ${sizeClasses} justify-center select-none ${className}`}
      >
        <div className="text-3xl mb-1 opacity-80">⛩️</div>
        <div className="text-secondary text-xs tracking-wider">
          GIA TỘC BÍ MẬT
        </div>
      </div>
    );
  }

  return (
    <div
      className={`house-card ${sizeClasses} select-none ${className}`}
    >
      <div className="eyebrow">
        THẺ GIA TỘC
      </div>
      <div className="text-4xl my-1 drop-shadow-md">{house.icon}</div>
      <div>
        <h4 className="font-bold text-white text-sm">{house.nameVi}</h4>
        <p className="text-xs text-secondary leading-tight mt-1">
          {house.descriptionVi}
        </p>
      </div>
    </div>
  );
};
