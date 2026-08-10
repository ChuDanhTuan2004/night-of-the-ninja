import assert from 'node:assert/strict';
import { NINJA_CARDS } from '../src/data/cards';
import {
  chooseBotAction,
  getBotBelief,
  inferRelationshipFromAction,
  initializeBotBeliefs,
  rememberHouse,
} from '../src/utils/botStrategy';
import { GameState, HouseCard, HouseType, Player } from '../src/types/game';
import { initializeNewGame, startRound } from '../src/utils/gameEngine';

function house(type: HouseType, rank: number | null): HouseCard {
  return { id: `${type}_${rank ?? 'X'}`, type, rank, nameVi: type, descriptionVi: '', icon: '' };
}

function player(id: string, type: HouseType, isBot = false): Player {
  return {
    id,
    name: id,
    avatar: '🥷',
    isBot,
    isHost: false,
    isReady: true,
    house: house(type, type === 'RONIN' ? null : 1),
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

const bot = player('bot', 'LOTUS', true);
const actualEnemy = player('enemy', 'CRANE');
const actualAlly = player('ally', 'LOTUS');
let state: GameState = {
  ...initializeNewGame([bot, actualEnemy, actualAlly], 'SOLO_BOTS'),
  status: 'EXECUTION',
  executionPhase: 'BLIND_ASSASSIN',
  players: [bot, actualEnemy, actualAlly],
};
state.botBeliefs = initializeBotBeliefs(state.players);

// The AI must obey its knowledge, not peek at the hidden true House values.
state = {
  ...state,
  botBeliefs: {
    bot: {
      bot: { LOTUS: 1, CRANE: 0, RONIN: 0 },
      enemy: { LOTUS: 0.9, CRANE: 0.1, RONIN: 0 },
      ally: { LOTUS: 0.1, CRANE: 0.9, RONIN: 0 },
    },
  },
};
const blindAssassin = NINJA_CARDS.find((card) => card.id === 'BA_1')!;
assert.equal(
  chooseBotAction(bot, blindAssassin, state).targetId,
  'ally',
  'bot phải chọn theo niềm tin, không được đọc House bí mật thật',
);

state = rememberHouse(state, bot.id, actualEnemy.id, 'CRANE');
state = rememberHouse(state, bot.id, actualAlly.id, 'LOTUS');
assert.equal(
  chooseBotAction(bot, blindAssassin, state).targetId,
  'enemy',
  'sau khi do thám, bot phải ưu tiên đối thủ đã biết',
);

const ronin = player('ronin', 'RONIN');
let eliminationState: GameState = {
  ...initializeNewGame([bot, actualEnemy, ronin], 'SOLO_BOTS'),
  players: [bot, actualEnemy, ronin],
};
eliminationState.botBeliefs = initializeBotBeliefs(eliminationState.players);
eliminationState = rememberHouse(eliminationState, bot.id, actualEnemy.id, 'CRANE');
assert.ok(
  getBotBelief(eliminationState, bot, ronin).RONIN > 0.99,
  'bot phải dùng số House còn lại để suy luận loại trừ',
);

const beforeInference = getBotBelief(state, bot, actualAlly).LOTUS;
state = inferRelationshipFromAction(state, actualEnemy.id, actualAlly.id, 'ENEMY', 0.8);
const afterInference = getBotBelief(state, bot, actualAlly).LOTUS;
assert.equal(
  afterInference,
  beforeInference,
  'thông tin chắc chắn từ do thám không bị suy luận công khai ghi đè',
);

const observer = player('observer', 'LOTUS', true);
const publicActor = { ...player('actor', 'CRANE'), revealedHouse: true };
const uncertainTarget = player('target', 'CRANE');
const filler = player('filler', 'LOTUS');
let inferenceState: GameState = {
  ...initializeNewGame([observer, publicActor, uncertainTarget, filler], 'SOLO_BOTS'),
  players: [observer, publicActor, uncertainTarget, filler],
};
inferenceState.botBeliefs = initializeBotBeliefs(inferenceState.players);
const craneBefore = getBotBelief(inferenceState, observer, uncertainTarget).CRANE;
inferenceState = inferRelationshipFromAction(inferenceState, publicActor.id, uncertainTarget.id, 'ENEMY', 0.8);
assert.ok(
  getBotBelief(inferenceState, observer, uncertainTarget).CRANE < craneBefore,
  'hành vi tấn công phải làm giảm xác suất mục tiêu cùng phe với người tấn công',
);

for (let simulation = 0; simulation < 20; simulation += 1) {
  const bots = Array.from({ length: 5 }, (_, index) => player(`sim-${simulation}-${index}`, 'LOTUS', true));
  const completedRound = startRound(initializeNewGame(bots, 'SOLO_BOTS'), 1);
  assert.ok(
    completedRound.status === 'ROUND_SUMMARY' || completedRound.status === 'GAME_OVER',
    'một bàn toàn bot phải tự hoàn tất mà không mắc kẹt ở Draft hoặc Execution',
  );
}

console.log('✓ Bot strategy smoke tests passed: beliefs, private knowledge, targeting, inference.');
