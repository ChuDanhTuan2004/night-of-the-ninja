import { CardPriority, HouseCard, HonorToken, NinjaCard, NinjaPhase } from '../types/game';

export const HOUSES: Record<'LOTUS' | 'CRANE' | 'RONIN', HouseCard> = {
  LOTUS: {
    id: 'LOTUS', type: 'LOTUS', rank: null, nameVi: 'Gia tộc Hoa Sen', icon: '🌸',
    descriptionVi: 'House đối đầu với Hạc. Rank càng nhỏ càng mạnh.',
  },
  CRANE: {
    id: 'CRANE', type: 'CRANE', rank: null, nameVi: 'Gia tộc Chim Hạc', icon: '🪽',
    descriptionVi: 'House đối đầu với Hoa Sen. Rank càng nhỏ càng mạnh.',
  },
  RONIN: {
    id: 'RONIN', type: 'RONIN', rank: null, nameVi: 'Lãng khách Ronin', icon: '⚔️',
    descriptionVi: 'Nếu sống sót đến House Reveal, nhận 1 Honor token bất kể House nào thắng.',
  },
};

const PHASE_NAMES: Record<NinjaPhase, string> = {
  SPY: 'Do thám',
  MYSTIC: 'Thần bí',
  TRICKSTER: 'Mưu sĩ',
  BLIND_ASSASSIN: 'Sát thủ mù',
  SHINOBI: 'Shinobi',
};

function numberedCards(
  prefix: string,
  name: string,
  nameVi: string,
  phase: NinjaPhase,
  effectType: NinjaCard['effectType'],
  descriptionVi: string,
  icon: string,
): NinjaCard[] {
  return ([1, 2, 3, 4, 5, 6] as CardPriority[]).map((priority) => ({
    id: `${prefix}_${priority}`,
    name,
    nameVi,
    cardType: 'NORMAL',
    phase,
    priority,
    phaseNameVi: PHASE_NAMES[phase],
    descriptionVi,
    effectType,
    requiresTarget: true,
    targetType: 'OTHER_PLAYER',
    icon,
  }));
}

const spies = numberedCards(
  'SPY', 'Spy', 'Điệp viên', 'SPY', 'LOOK_HOUSE',
  'Chọn một người chơi khác và bí mật xem House của họ.', '👁️',
);

const mystics = numberedCards(
  'MYS', 'Mystic', 'Nhà thần bí', 'MYSTIC', 'LOOK_HOUSE_AND_NINJA',
  'Bí mật xem House và ngẫu nhiên một Ninja card chưa chơi của một người khác.', '🔮',
);

const tricksters: NinjaCard[] = [
  {
    id: 'TRI_1', name: 'Shapeshifter', nameVi: 'Kẻ biến hình', cardType: 'TRICKSTER',
    phase: 'TRICKSTER', priority: 1, phaseNameVi: PHASE_NAMES.TRICKSTER,
    descriptionVi: 'Bí mật xem House của hai người, sau đó tùy chọn tráo hai House. Chủ mới không được xem House vừa nhận.',
    effectType: 'SHAPESHIFTER', requiresTarget: true, targetType: 'TWO_PLAYERS', icon: '🦊',
  },
  {
    id: 'TRI_2', name: 'Grave Digger', nameVi: 'Kẻ đào mộ', cardType: 'TRICKSTER',
    phase: 'TRICKSTER', priority: 2, phaseNameVi: PHASE_NAMES.TRICKSTER,
    descriptionVi: 'Xem hai Ninja card trong chồng bỏ của Draft và lấy một lá.',
    effectType: 'GRAVE_DIGGER', requiresTarget: true, targetType: 'DISCARD_CARD', icon: '⚰️',
  },
  {
    id: 'TRI_3', name: 'Troublemaker', nameVi: 'Kẻ gây rối', cardType: 'TRICKSTER',
    phase: 'TRICKSTER', priority: 3, phaseNameVi: PHASE_NAMES.TRICKSTER,
    descriptionVi: 'Xem House của một người, sau đó tùy chọn công khai House đó.',
    effectType: 'TROUBLEMAKER', requiresTarget: true, targetType: 'OTHER_PLAYER', icon: '🎭',
  },
  {
    id: 'TRI_4', name: 'Spirit Merchant', nameVi: 'Thương nhân linh hồn', cardType: 'TRICKSTER',
    phase: 'TRICKSTER', priority: 4, phaseNameVi: PHASE_NAMES.TRICKSTER,
    descriptionVi: 'Xem House hoặc một Honor token của một người, rồi tùy chọn đổi một Honor token với họ.',
    effectType: 'SPIRIT_MERCHANT', requiresTarget: true, targetType: 'OTHER_PLAYER', icon: '🪙',
  },
  {
    id: 'TRI_5', name: 'Thief', nameVi: 'Kẻ trộm', cardType: 'TRICKSTER',
    phase: 'TRICKSTER', priority: 5, phaseNameVi: PHASE_NAMES.TRICKSTER,
    descriptionVi: 'Công khai House của bạn, rồi lấy một Honor token từ người đang có nhiều token hơn bạn.',
    effectType: 'THIEF', requiresTarget: true, targetType: 'OTHER_PLAYER', icon: '🥷',
  },
  {
    id: 'TRI_6', name: 'Judge', nameVi: 'Thẩm phán', cardType: 'TRICKSTER',
    phase: 'TRICKSTER', priority: 6, phaseNameVi: PHASE_NAMES.TRICKSTER,
    descriptionVi: 'Công khai House của bạn rồi giết một người. Mirror Monk và Martyr không kích hoạt.',
    effectType: 'JUDGE_KILL', requiresTarget: true, targetType: 'OTHER_PLAYER', icon: '⚖️',
  },
];

const blindAssassins = numberedCards(
  'BA', 'Blind Assassin', 'Sát thủ mù', 'BLIND_ASSASSIN', 'BLIND_ASSASSIN_KILL',
  'Chọn và giết một người chơi khác mà không được xem House trước.', '🗡️',
);

const shinobi = numberedCards(
  'SHI', 'Shinobi', 'Shinobi', 'SHINOBI', 'SHINOBI_KILL',
  'Bí mật xem House của một người chơi khác, sau đó chọn giết hoặc tha.', '🥷',
);

const specials: NinjaCard[] = [
  {
    id: 'SPC_MM', name: 'Mirror Monk', nameVi: 'Kính tăng', cardType: 'REACTION',
    phase: null, priority: null, phaseNameVi: 'Phản ứng',
    descriptionVi: 'Khi bị Blind Assassin hoặc Shinobi giết: bạn sống, kẻ tấn công chết.',
    effectType: 'MIRROR_MONK', requiresTarget: false, icon: '🪞',
  },
  {
    id: 'SPC_MA', name: 'Martyr', nameVi: 'Kẻ tử vì đạo', cardType: 'REACTION',
    phase: null, priority: null, phaseNameVi: 'Phản ứng',
    descriptionVi: 'Khi bị Blind Assassin hoặc Shinobi giết: bạn vẫn chết nhưng nhận 1 Honor token.',
    effectType: 'MARTYR', requiresTarget: false, icon: '🕯️',
  },
  {
    id: 'SPC_MS', name: 'Mastermind', nameVi: 'Chủ mưu', cardType: 'REVEAL',
    phase: null, priority: null, phaseNameVi: 'House Reveal',
    descriptionVi: 'Nếu còn sống ở House Reveal, House hiện tại của bạn thắng. Ronin khiến không House nào thắng.',
    effectType: 'MASTERMIND', requiresTarget: false, icon: '🧠',
  },
];

/** Complete, unique 33-card Ninja database. */
export const NINJA_CARDS: NinjaCard[] = [
  ...spies,
  ...mystics,
  ...tricksters,
  ...blindAssassins,
  ...shinobi,
  ...specials,
];

export function createInitialHonorDeck(): HonorToken[] {
  // The supplied rules specify 35 tokens and values 2–5, but not the printed distribution.
  const values = [
    ...Array(10).fill(2),
    ...Array(10).fill(3),
    ...Array(10).fill(4),
    ...Array(5).fill(5),
  ] as number[];
  return shuffleArray(values.map((value, index) => ({ id: `honor-${index + 1}`, value })));
}

export function createFullNinjaDeck(): NinjaCard[] {
  return shuffleArray(NINJA_CARDS.map((card) => ({ ...card })));
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export const AVATARS = ['🥷', '🥷🏻', '🥷🏼', '🥷🏽', '🥷🏾', '🥷🏿', '🦊', '🐺', '🐉', '🦅', '👺'];

export const BOT_NAMES = [
  'Hanzō (Bot)', 'Kenshin (Bot)', 'Chiyo (Bot)', 'Saizō (Bot)', 'Kagero (Bot)',
  'Taro (Bot)', 'Kaede (Bot)', 'Sasuke (Bot)', 'Kotarō (Bot)', 'Hayate (Bot)',
];
