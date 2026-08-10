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

const RANK_COLORS: Record<number, { border: string; bg: string; text: string; badge: string }> = {
  1: {
    border: 'border-emerald-600/60',
    bg: 'from-slate-900 via-emerald-950/40 to-slate-950',
    text: 'text-emerald-400',
    badge: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
  },
  2: {
    border: 'border-indigo-600/60',
    bg: 'from-slate-900 via-indigo-950/40 to-slate-950',
    text: 'text-indigo-400',
    badge: 'bg-indigo-950 text-indigo-300 border-indigo-500/40',
  },
  3: {
    border: 'border-rose-600/60',
    bg: 'from-slate-900 via-rose-950/50 to-slate-950',
    text: 'text-rose-400',
    badge: 'bg-rose-950 text-rose-300 border-rose-500/40',
  },
  4: {
    border: 'border-amber-500/60',
    bg: 'from-slate-900 via-amber-950/40 to-slate-950',
    text: 'text-amber-400',
    badge: 'bg-amber-950 text-amber-300 border-amber-500/40',
  },
};

export const NinjaCardView: React.FC<NinjaCardViewProps> = ({
  card,
  isSelected = false,
  isFaceDown = false,
  isDisabled = false,
  onClick,
  className = '',
  size = 'md',
}) => {
  const rankStyle = RANK_COLORS[card.rank] || RANK_COLORS[1];

  const sizeClasses = {
    sm: 'w-28 h-40 text-xs p-2',
    md: 'w-full max-w-40 h-56 sm:h-60 text-sm p-3',
    lg: 'w-52 h-80 text-base p-4',
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
        className={`${sizeClasses} rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/80 border-2 border-amber-600/40 flex flex-col items-center justify-between cursor-pointer shadow-xl relative overflow-hidden group select-none ${className}`}
      >
        <div className="w-full text-right text-[10px] font-mono text-amber-500/40 uppercase">
          Ninja Card
        </div>
        <div className="w-16 h-16 rounded-full bg-slate-900/90 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner group-hover:border-amber-400 transition-colors">
          🥷
        </div>
        <div className="text-[11px] font-serif text-amber-400/60 tracking-widest text-center">
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
      className={`${sizeClasses} rounded-xl bg-gradient-to-b ${rankStyle.bg} border-2 ${
        isSelected ? 'border-amber-400 ring-4 ring-amber-500/30 shadow-2xl scale-105' : rankStyle.border
      } flex flex-col justify-between cursor-pointer shadow-xl relative overflow-hidden transition-all duration-200 select-none ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-amber-900/20'
      } ${className}`}
    >
      {/* Top Header: Speed Rank Badge & Name */}
      <div className="flex items-center justify-between gap-1 w-full border-b border-white/10 pb-1.5">
        <span
          className={`px-1.5 py-0.5 rounded border text-[10px] font-bold font-mono tracking-wider ${rankStyle.badge}`}
        >
          P{card.rank} • {card.rankNameVi}
        </span>
        <span className="text-xl">{card.icon}</span>
      </div>

      {/* Main Card Content */}
      <div className="my-auto flex flex-col items-center text-center space-y-1">
        <h3 className={`font-bold font-serif ${rankStyle.text} tracking-wide drop-shadow`}>
          {card.nameVi}
        </h3>
        <p className="text-slate-300/90 text-[11px] leading-tight px-0.5 font-sans">
          {card.descriptionVi}
        </p>
      </div>

      {/* Bottom Quote */}
      {card.flavorQuoteVi && (
        <div className="border-t border-white/10 pt-1 text-[9px] italic text-amber-200/50 text-center font-serif truncate">
          "{card.flavorQuoteVi}"
        </div>
      )}

      {/* Selection Checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow-md animate-bounce">
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
  const sizeClasses = size === 'sm' ? 'w-24 h-36 text-xs p-2' : 'w-36 h-52 text-sm p-3';

  if (!isRevealed) {
    return (
      <div
        className={`${sizeClasses} rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 border-2 border-amber-600/40 flex flex-col items-center justify-center text-center shadow-lg select-none ${className}`}
      >
        <div className="text-3xl mb-1 opacity-80">⛩️</div>
        <div className="font-serif text-amber-400/80 text-xs tracking-wider">
          GIA TỘC BÍ MẬT
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-xl bg-gradient-to-b ${house.bgGradient} border-2 border-amber-500/50 flex flex-col items-center justify-between text-center shadow-xl select-none ${className}`}
    >
      <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-300/80">
        THẺ GIA TỘC
      </div>
      <div className="text-4xl my-1 drop-shadow-md">{house.icon}</div>
      <div>
        <h4 className="font-bold font-serif text-amber-200 text-sm">{house.nameVi}</h4>
        <p className="text-[10px] text-slate-300 leading-tight mt-0.5 opacity-90">
          {house.descriptionVi}
        </p>
      </div>
    </div>
  );
};
