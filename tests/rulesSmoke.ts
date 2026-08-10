import assert from 'node:assert/strict';
import { NINJA_CARDS } from '../src/data/cards';
import { createHouseDeckForPlayerCount, evaluateRoundEnd, executeCardAction, initializeNewGame, inspectShapeshifterTargets } from '../src/utils/gameEngine';
import { GameState, HouseCard, Player } from '../src/types/game';

function player(id: string): Player {
  return {
    id,
    name: id,
    avatar: '🥷',
    isBot: false,
    isHost: id === 'a',
    isReady: true,
    house: null,
    revealedHouse: false,
    unknownCurrentHouse: false,
    isAlive: true,
    draftHand: [],
    selectedCards: [],
    playedCardsThisPhase: [],
    honorTokens: [],
    totalScore: 0,
    killsThisRound: 0,
  };
}

function house(type: 'LOTUS' | 'CRANE' | 'RONIN', rank: number | null): HouseCard {
  return {
    id: rank ? `${type}_${rank}` : type,
    type,
    rank,
    nameVi: rank ? `${type} ${rank}` : type,
    descriptionVi: '',
    icon: '',
  };
}

assert.equal(NINJA_CARDS.length, 33, 'database phải có đúng 33 Ninja cards');
assert.equal(new Set(NINJA_CARDS.map((card) => card.id)).size, 33, 'ID Ninja card phải duy nhất');
for (const phase of ['SPY', 'MYSTIC', 'TRICKSTER', 'BLIND_ASSASSIN', 'SHINOBI']) {
  assert.equal(NINJA_CARDS.filter((card) => card.phase === phase).length, 6, `${phase} phải có 6 lá`);
}
assert.equal(NINJA_CARDS.filter((card) => card.phase === null).length, 3, 'phải có 3 Special cards');

const sevenPlayerHouses = createHouseDeckForPlayerCount(7);
assert.deepEqual(
  sevenPlayerHouses.filter((card) => card.type === 'LOTUS').map((card) => card.rank).sort(),
  [1, 2, 3],
);
assert.deepEqual(
  sevenPlayerHouses.filter((card) => card.type === 'CRANE').map((card) => card.rank).sort(),
  [1, 2, 3],
);
assert.equal(sevenPlayerHouses.filter((card) => card.type === 'RONIN').length, 1);

const mirror = NINJA_CARDS.find((card) => card.id === 'SPC_MM')!;
const blindAssassin = NINJA_CARDS.find((card) => card.id === 'BA_1')!;
let reactionState = initializeNewGame([player('a'), player('b')], 'SOLO_BOTS');
reactionState = {
  ...reactionState,
  status: 'EXECUTION',
  executionPhase: 'BLIND_ASSASSIN',
  players: reactionState.players.map((candidate) => candidate.id === 'a'
    ? { ...candidate, house: house('LOTUS', 1), selectedCards: [blindAssassin] }
    : { ...candidate, house: house('CRANE', 1), selectedCards: [mirror] }),
};
reactionState = executeCardAction(reactionState, 'a', blindAssassin.id, 'b');
assert.equal(reactionState.players.find((candidate) => candidate.id === 'a')?.isAlive, false, 'Mirror Monk phải giết ngược attacker');
assert.equal(reactionState.players.find((candidate) => candidate.id === 'b')?.isAlive, true, 'chủ Mirror Monk phải sống');

const judge = NINJA_CARDS.find((card) => card.id === 'TRI_6')!;
let judgeState = initializeNewGame([player('a'), player('b')], 'SOLO_BOTS');
judgeState = {
  ...judgeState,
  status: 'EXECUTION',
  executionPhase: 'TRICKSTER',
  players: judgeState.players.map((candidate) => candidate.id === 'a'
    ? { ...candidate, house: house('LOTUS', 1), selectedCards: [judge] }
    : { ...candidate, house: house('CRANE', 1), selectedCards: [mirror] }),
};
judgeState = executeCardAction(judgeState, 'a', judge.id, 'b');
assert.equal(judgeState.players.find((candidate) => candidate.id === 'b')?.isAlive, false, 'Judge phải bỏ qua Mirror Monk');

const shapeshifter = NINJA_CARDS.find((card) => card.id === 'TRI_1')!;
let shapeshifterState = initializeNewGame([player('a'), player('b'), player('c')], 'SOLO_BOTS');
shapeshifterState = {
  ...shapeshifterState,
  status: 'EXECUTION',
  executionPhase: 'TRICKSTER',
  players: shapeshifterState.players.map((candidate) => {
    if (candidate.id === 'a') return { ...candidate, house: house('LOTUS', 1), selectedCards: [shapeshifter] };
    if (candidate.id === 'b') return { ...candidate, house: house('CRANE', 1) };
    return { ...candidate, house: house('RONIN', null) };
  }),
};
const inspection = inspectShapeshifterTargets(shapeshifterState, 'a', shapeshifter.id, 'b', 'c');
assert.deepEqual(
  inspection?.targets.map((target) => target.house.type),
  ['CRANE', 'RONIN'],
  'Kẻ biến hình phải xem được đúng Role của hai người đã chọn',
);
assert.equal(
  inspectShapeshifterTargets(shapeshifterState, 'a', shapeshifter.id, 'b', 'b'),
  null,
  'Kẻ biến hình không được chọn cùng một người hai lần',
);
const unresolvedShapeshifter = executeCardAction(shapeshifterState, 'a', shapeshifter.id, 'b', 'c');
assert.equal(
  unresolvedShapeshifter.players.find((candidate) => candidate.id === 'a')?.playedCardsThisPhase.length,
  0,
  'Kẻ biến hình chưa được resolve trước khi chọn Đổi hoặc Giữ nguyên',
);
const swappedShapeshifter = executeCardAction(shapeshifterState, 'a', shapeshifter.id, 'b', 'c', 'SWAP');
assert.equal(swappedShapeshifter.players.find((candidate) => candidate.id === 'b')?.house?.type, 'RONIN');
assert.equal(swappedShapeshifter.players.find((candidate) => candidate.id === 'c')?.house?.type, 'CRANE');

const rankingBase = initializeNewGame([player('a'), player('b'), player('c')], 'SOLO_BOTS');
const rankingState: GameState = {
  ...rankingBase,
  players: rankingBase.players.map((candidate) => {
    if (candidate.id === 'a') return { ...candidate, house: house('LOTUS', 1) };
    if (candidate.id === 'b') return { ...candidate, house: house('CRANE', 2) };
    return { ...candidate, house: house('LOTUS', 2), isAlive: false };
  }),
};
const ranked = evaluateRoundEnd(rankingState);
assert.equal(ranked.roundWinnerClan, 'LOTUS', 'Lotus 1 phải thắng Crane 2');
assert.equal(ranked.players.find((candidate) => candidate.id === 'c')?.honorTokens.length, 1, 'thành viên House thắng đã chết vẫn nhận Honor');
assert.equal(ranked.players.find((candidate) => candidate.id === 'c')?.revealedHouse, false, 'người chết không lật House ở House Reveal');

console.log('✓ Rules smoke tests passed: 33 cards, House ranks, reactions, rewards.');
