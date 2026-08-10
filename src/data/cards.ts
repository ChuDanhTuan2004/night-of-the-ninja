import { HouseCard, NinjaCard, HonorToken } from '../types/game';

export const HOUSES: Record<string, HouseCard> = {
  LOTUS: {
    id: 'LOTUS',
    type: 'LOTUS',
    nameVi: 'Gia Tộc Hoa Sen',
    descriptionVi: 'Mục tiêu: Đảm bảo Gia Tộc Hoa Sen có người sống sót và tiêu diệt kẻ thù Gia Tộc Hạc!',
    color: '#F43F5E',
    bgGradient: 'from-rose-950 via-rose-900 to-slate-950',
    icon: '🌸',
  },
  CRANE: {
    id: 'CRANE',
    type: 'CRANE',
    nameVi: 'Gia Tộc Chim Hạc',
    descriptionVi: 'Mục tiêu: Đảm bảo Gia Tộc Chim Hạc có người sống sót và quét sạch phe Hoa Sen!',
    color: '#0EA5E9',
    bgGradient: 'from-sky-950 via-sky-900 to-slate-950',
    icon: '🦩',
  },
  RONIN: {
    id: 'RONIN',
    type: 'RONIN',
    nameVi: 'Lãng Khách Ronin',
    descriptionVi: 'Mục tiêu: Bạn không thuộc phe nào. Sống sót một mình hoặc trở thành người duy nhất trụ lại!',
    color: '#F59E0B',
    bgGradient: 'from-amber-950 via-amber-900 to-slate-950',
    icon: '⚔️',
  },
};

export const NINJA_CARDS: Omit<NinjaCard, 'id'>[] = [
  // --- RANK 1: DO THÁM (SPY) ---
  {
    name: 'Eye Spy',
    nameVi: 'Thần Mắt',
    rank: 1,
    rankNameVi: 'Do Thám',
    descriptionVi: 'Bí mật xem Thẻ Gia Tộc của 1 người chơi bất kỳ.',
    effectType: 'SPY_HOUSE',
    requiresTarget: true,
    targetType: 'OTHER_PLAYER',
    icon: '👁️',
    flavorQuoteVi: 'Nhìn thấu tâm can, nhìn tỏ gia tộc.',
  },
  {
    name: 'Scout',
    nameVi: 'Thám Tử',
    rank: 1,
    rankNameVi: 'Do Thám',
    descriptionVi: 'Xem ngầm 2 thẻ Ninja tiếp theo trong xấp bài chưa rút.',
    effectType: 'SPY_DECK',
    requiresTarget: false,
    icon: '📜',
    flavorQuoteVi: 'Biết trước thiên cơ, đi trước một bước.',
  },
  {
    name: 'Ninja Informant',
    nameVi: 'Mật Thám',
    rank: 1,
    rankNameVi: 'Do Thám',
    descriptionVi: 'Chọn 1 người chơi. Họ phải trả lời riêng cho bạn biết có thuộc Gia Tộc Sen hay không.',
    effectType: 'SPY_CLAN_CHECK',
    requiresTarget: true,
    targetType: 'OTHER_PLAYER',
    icon: '🕵️',
    flavorQuoteVi: 'Lời thì xầm xào xé rách bức màn bí mật.',
  },

  // --- RANK 2: THẦN THÔNG (MYSTIC) ---
  {
    name: 'House Swap',
    nameVi: 'Tráo Gia Tộc',
    rank: 2,
    rankNameVi: 'Thần Thông',
    descriptionVi: 'Tráo đổi bí mật Thẻ Gia Tộc giữa 2 người chơi bất kỳ.',
    effectType: 'SWAP_HOUSE',
    requiresTarget: true,
    targetType: 'TWO_PLAYERS',
    icon: '🔄',
    flavorQuoteVi: 'Số phận chuyển dời trong chớp mắt.',
  },
  {
    name: 'Forced Reveal',
    nameVi: 'Bộc Lộ',
    rank: 2,
    rankNameVi: 'Thần Thông',
    descriptionVi: 'Ép 1 người chơi phải lật mở Thẻ Gia Tộc của họ công khai cho toàn bàn.',
    effectType: 'FORCE_REVEAL',
    requiresTarget: true,
    targetType: 'OTHER_PLAYER',
    icon: '🌟',
    flavorQuoteVi: 'Mặt nạ rơi xuống, thân phận lộ ra.',
  },
  {
    name: 'Mind Shift',
    nameVi: 'Tẩy Não',
    rank: 2,
    rankNameVi: 'Thần Thông',
    descriptionVi: 'Tráo 1 Thẻ Ninja trên tay bạn với 1 người chơi khác.',
    effectType: 'MIND_SHIFT',
    requiresTarget: true,
    targetType: 'OTHER_PLAYER',
    icon: '🔮',
    flavorQuoteVi: 'Ý niệm đổi thay trong không trung.',
  },

  // --- RANK 3: SÁT THỦ (ASSASSIN) ---
  {
    name: 'Night Assassin',
    nameVi: 'Sát Thủ Đêm',
    rank: 3,
    rankNameVi: 'Sát Thủ',
    descriptionVi: 'Ám sát 1 người chơi bất kỳ. Nếu họ không có Vệ Sĩ bảo vệ, họ bị tiêu diệt!',
    effectType: 'ASSASSINATE',
    requiresTarget: true,
    targetType: 'OTHER_PLAYER',
    icon: '🗡️',
    flavorQuoteVi: 'Lưỡi kiếm trong đêm, không để lại vết vết.',
  },
  {
    name: 'Twin Blades',
    nameVi: 'Song Đao',
    rank: 3,
    rankNameVi: 'Sát Thủ',
    descriptionVi: 'Hạ gục 1 người chơi kề bên (trái hoặc phải bạn).',
    effectType: 'TWIN_BLADES',
    requiresTarget: true,
    targetType: 'ADJACENT_PLAYER',
    icon: '⚔️',
    flavorQuoteVi: 'Gần trong gang tấc, sát khí bàng hoàng.',
  },
  {
    name: 'Poison Shuriken',
    nameVi: 'Phi Tiêu Độc',
    rank: 3,
    rankNameVi: 'Sát Thủ',
    descriptionVi: 'Ám sát 1 người chơi. Nếu hạ gục thành công, bạn nhận ngay 1 Thẻ Danh Dự bonus.',
    effectType: 'POISON_SHURIKEN',
    requiresTarget: true,
    targetType: 'OTHER_PLAYER',
    icon: '🎯',
    flavorQuoteVi: 'Một giọt độc tàn, vinh quang nắm chắc.',
  },

  // --- RANK 4: VỆ SĨ & MẸO THUẬT (GUARD / TRICKSTER) ---
  {
    name: 'Iron Shield',
    nameVi: 'Khiên Thép',
    rank: 4,
    rankNameVi: 'Vệ Sĩ',
    descriptionVi: 'Chống đỡ BẤT KỲ đòn ám sát nào nhắm vào bạn trong vòng này.',
    effectType: 'IRON_GUARD',
    requiresTarget: false,
    icon: '🛡️',
    flavorQuoteVi: 'Vững như bàn thạch, bất xâm bất phạm.',
  },
  {
    name: 'Substitution',
    nameVi: 'Độn Thổ',
    rank: 4,
    rankNameVi: 'Vệ Sĩ',
    descriptionVi: 'Né đòn ám sát nhắm vào bạn và chuyển đòn đánh đó cho người chơi khác!',
    effectType: 'SUBSTITUTION',
    requiresTarget: true,
    targetType: 'OTHER_PLAYER',
    icon: '🪵',
    flavorQuoteVi: 'Khúc gỗ thay thân, tai họa chuyển chủ.',
  },
  {
    name: 'Retaliation',
    nameVi: 'Trả Thù',
    rank: 4,
    rankNameVi: 'Mẹo Thuật',
    descriptionVi: 'Nếu bạn bị tiêu diệt trong vòng này, kẻ sát hại bạn cũng phải chết theo!',
    effectType: 'RETALIATION',
    requiresTarget: false,
    icon: '💥',
    flavorQuoteVi: 'Chết không nhắm mắt, kéo kẻ thù cùng xuống suối vàng.',
  },
  {
    name: 'Honor Thief',
    nameVi: 'Đoạt Danh Dự',
    rank: 4,
    rankNameVi: 'Mẹo Thuật',
    descriptionVi: 'Cướp 1 Thẻ Danh Dự từ 1 người chơi khác.',
    effectType: 'HONOR_THIEF',
    requiresTarget: true,
    targetType: 'OTHER_PLAYER',
    icon: '🪙',
    flavorQuoteVi: 'Bàn tay vô hình cuỗm đi vinh quang.',
  },
];

export function createInitialHonorDeck(): HonorToken[] {
  const values = [2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5];
  return shuffleArray(
    values.map((val, idx) => ({
      id: `token-${idx}-${Date.now()}`,
      value: val,
    }))
  );
}

export function createFullNinjaDeck(): NinjaCard[] {
  let cardId = 1;
  const deck: NinjaCard[] = [];
  // Repeat cards 3 times for a rich 4-11 player drafting pool
  for (let copy = 0; copy < 3; copy++) {
    for (const card of NINJA_CARDS) {
      deck.push({
        ...card,
        id: `card-${cardId++}`,
      });
    }
  }
  return shuffleArray(deck);
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const AVATARS = [
  '🥷', '🥷🏻', '🥷🏼', '🥷🏽', '🥷🏾', '🥷🏿', '🦊', '🐺', '🐉', '🦅', '👺', '👹', '🐱'
];

export const BOT_NAMES = [
  'Hanzō (Bot)', 'Kenshin (Bot)', 'Chiyo (Bot)', 'Saizō (Bot)', 
  'Kagero (Bot)', 'Taro (Bot)', 'Kaede (Bot)', 'Sasuke (Bot)', 
  'Kotarō (Bot)', 'Hayate (Bot)'
];
