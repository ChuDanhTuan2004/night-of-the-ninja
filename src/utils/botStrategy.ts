import { GameState, HouseBelief, HouseType, NinjaCard, Player } from '../types/game';

const HOUSE_TYPES: HouseType[] = ['LOTUS', 'CRANE', 'RONIN'];
const EXACT_CONFIDENCE = 0.999;

function exactBelief(type: HouseType): HouseBelief {
  return {
    LOTUS: type === 'LOTUS' ? 1 : 0,
    CRANE: type === 'CRANE' ? 1 : 0,
    RONIN: type === 'RONIN' ? 1 : 0,
  };
}

function normalize(belief: HouseBelief): HouseBelief {
  const total = belief.LOTUS + belief.CRANE + belief.RONIN;
  if (total <= 0) return { LOTUS: 0.5, CRANE: 0.5, RONIN: 0 };
  return {
    LOTUS: belief.LOTUS / total,
    CRANE: belief.CRANE / total,
    RONIN: belief.RONIN / total,
  };
}

function tablePrior(players: Player[], observer: Player): HouseBelief {
  const houseSize = Math.floor(players.length / 2);
  const counts: HouseBelief = {
    LOTUS: houseSize,
    CRANE: houseSize,
    RONIN: players.length % 2,
  };
  if (observer.house && !observer.unknownCurrentHouse) {
    counts[observer.house.type] = Math.max(0, counts[observer.house.type] - 1);
  }
  return normalize(counts);
}

function rebalanceBeliefs(
  players: Player[],
  observer: Player,
  beliefs: Record<string, HouseBelief>,
): Record<string, HouseBelief> {
  let balanced = Object.fromEntries(players.map((target) => {
    if (target.revealedHouse && target.house) return [target.id, exactBelief(target.house.type)];
    if (target.id === observer.id && target.house && !target.unknownCurrentHouse) {
      return [target.id, exactBelief(target.house.type)];
    }
    return [target.id, { ...(beliefs[target.id] ?? tablePrior(players, observer)) }];
  }));

  // Iterative proportional fitting keeps independent beliefs compatible with the finite House deck.
  for (let iteration = 0; iteration < 4; iteration += 1) {
    const totalByType: HouseBelief = {
      LOTUS: Math.floor(players.length / 2),
      CRANE: Math.floor(players.length / 2),
      RONIN: players.length % 2,
    };
    const uncertainIds: string[] = [];
    for (const target of players) {
      const belief = balanced[target.id];
      const certainType = HOUSE_TYPES.find((type) => belief[type] >= EXACT_CONFIDENCE);
      if (certainType) totalByType[certainType] = Math.max(0, totalByType[certainType] - 1);
      else uncertainIds.push(target.id);
    }
    const currentMass: HouseBelief = { LOTUS: 0, CRANE: 0, RONIN: 0 };
    for (const id of uncertainIds) {
      for (const type of HOUSE_TYPES) currentMass[type] += balanced[id][type];
    }
    balanced = {
      ...balanced,
      ...Object.fromEntries(uncertainIds.map((id) => [id, normalize({
        LOTUS: balanced[id].LOTUS * (currentMass.LOTUS > 0 ? totalByType.LOTUS / currentMass.LOTUS : 0),
        CRANE: balanced[id].CRANE * (currentMass.CRANE > 0 ? totalByType.CRANE / currentMass.CRANE : 0),
        RONIN: balanced[id].RONIN * (currentMass.RONIN > 0 ? totalByType.RONIN / currentMass.RONIN : 0),
      })])),
    };
  }
  return balanced;
}

export function initializeBotBeliefs(players: Player[]): NonNullable<GameState['botBeliefs']> {
  return Object.fromEntries(players.filter((player) => player.isBot).map((bot) => {
    const prior = tablePrior(players, bot);
    const beliefs = Object.fromEntries(players.map((target) => {
      const belief = target.id === bot.id && target.house && !target.unknownCurrentHouse
        ? exactBelief(target.house.type)
        : { ...prior };
      return [target.id, belief];
    }));
    return [bot.id, rebalanceBeliefs(players, bot, beliefs)];
  }));
}

export function getBotBelief(state: GameState, bot: Player, target: Player): HouseBelief {
  if (target.revealedHouse && target.house) return exactBelief(target.house.type);
  if (target.id === bot.id && target.house && !target.unknownCurrentHouse) {
    return exactBelief(target.house.type);
  }
  return state.botBeliefs?.[bot.id]?.[target.id] ?? tablePrior(state.players, bot);
}

export function rememberHouse(
  state: GameState,
  observerId: string,
  targetId: string,
  houseType: HouseType,
): GameState {
  const observer = state.players.find((player) => player.id === observerId);
  if (!observer?.isBot) return state;
  const observerBeliefs = {
    ...state.botBeliefs?.[observerId],
    [targetId]: exactBelief(houseType),
  };
  return {
    ...state,
    botBeliefs: {
      ...state.botBeliefs,
      [observerId]: rebalanceBeliefs(state.players, observer, observerBeliefs),
    },
  };
}

export function revealHouseToBots(state: GameState, targetId: string, houseType: HouseType): GameState {
  return state.players.filter((player) => player.isBot).reduce(
    (nextState, bot) => rememberHouse(nextState, bot.id, targetId, houseType),
    state,
  );
}

/** A swapped bot knows whose card it received, but not more than it knew about that player. */
export function updateBotBeliefAfterBeingSwapped(
  stateBeforeSwap: GameState,
  stateAfterSwap: GameState,
  playerId: string,
  receivedFromId: string,
): GameState {
  const bot = stateBeforeSwap.players.find((player) => player.id === playerId);
  const source = stateBeforeSwap.players.find((player) => player.id === receivedFromId);
  if (!bot?.isBot || !source) return stateAfterSwap;
  const inheritedBelief = getBotBelief(stateBeforeSwap, bot, source);
  return {
    ...stateAfterSwap,
    botBeliefs: {
      ...stateAfterSwap.botBeliefs,
      [bot.id]: {
        ...stateAfterSwap.botBeliefs?.[bot.id],
        [bot.id]: { ...inheritedBelief },
      },
    },
  };
}

/** Bayesian-style update from public behaviour without revealing the real House. */
export function inferRelationshipFromAction(
  state: GameState,
  actorId: string,
  targetId: string,
  relationship: 'ALLY' | 'ENEMY',
  reliability: number,
): GameState {
  const actor = state.players.find((player) => player.id === actorId);
  const target = state.players.find((player) => player.id === targetId);
  if (!actor || !target || target.revealedHouse) return state;

  let nextState = state;
  for (const bot of state.players.filter((player) => player.isBot && player.id !== actorId)) {
    const current = getBotBelief(nextState, bot, target);
    if (Math.max(...HOUSE_TYPES.map((type) => current[type])) >= EXACT_CONFIDENCE) continue;
    const actorBelief = getBotBelief(nextState, bot, actor);
    const weighted = { ...current };
    for (const type of HOUSE_TYPES) {
      const sameClanProbability = actorBelief[type];
      const signal = relationship === 'ALLY'
        ? 1 - reliability + reliability * sameClanProbability
        : 1 - reliability * sameClanProbability;
      weighted[type] *= type === 'RONIN' ? Math.max(0.45, signal) : Math.max(0.05, signal);
    }
    const updatedBeliefs = {
      ...nextState.botBeliefs?.[bot.id],
      [targetId]: normalize(weighted),
    };
    nextState = {
      ...nextState,
      botBeliefs: {
        ...nextState.botBeliefs,
        [bot.id]: rebalanceBeliefs(nextState.players, bot, updatedBeliefs),
      },
    };
  }
  return nextState;
}

function entropy(belief: HouseBelief): number {
  return HOUSE_TYPES.reduce((sum, type) => {
    const probability = belief[type];
    return probability > 0 ? sum - probability * Math.log2(probability) : sum;
  }, 0);
}

function enemyProbability(state: GameState, bot: Player, target: Player): number {
  const self = getBotBelief(state, bot, bot);
  const candidate = getBotBelief(state, bot, target);
  const sameClan = self.LOTUS * candidate.LOTUS + self.CRANE * candidate.CRANE;
  const roninTension = self.RONIN * (candidate.LOTUS + candidate.CRANE) * 0.55
    + candidate.RONIN * (self.LOTUS + self.CRANE) * 0.55;
  return Math.min(1, Math.max(0, 1 - sameClan + roninTension - self.RONIN * candidate.RONIN * 0.5));
}

function stableNoise(...parts: Array<string | number>): number {
  const input = parts.join('|');
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

function publicThreat(player: Player): number {
  return player.honorTokens.length * 5 + player.killsThisRound * 8 + (player.revealedHouse ? 2 : 0);
}

function targetScore(
  state: GameState,
  bot: Player,
  target: Player,
  purpose: 'ATTACK' | 'INFORMATION' | 'MANIPULATE',
): number {
  const belief = getBotBelief(state, bot, target);
  const hostility = enemyProbability(state, bot, target);
  const threat = publicThreat(target);
  const uncertainty = entropy(belief);
  const tieBreaker = stableNoise(bot.id, target.id, state.currentRound, state.executionStep) * 2;

  if (purpose === 'INFORMATION') {
    return uncertainty * 38 + hostility * 18 + threat * 0.5 + tieBreaker;
  }
  if (purpose === 'MANIPULATE') {
    return uncertainty * 20 + hostility * 35 + threat + tieBreaker;
  }
  return hostility * 75 + threat + uncertainty * 4 + tieBreaker;
}

function pickBestTarget(
  state: GameState,
  bot: Player,
  candidates: Player[],
  purpose: 'ATTACK' | 'INFORMATION' | 'MANIPULATE',
): Player | undefined {
  return [...candidates].sort(
    (a, b) => targetScore(state, bot, b, purpose) - targetScore(state, bot, a, purpose),
  )[0];
}

function cardStrategicValue(card: NinjaCard, bot: Player, state?: GameState): number {
  const baseValue: Record<NinjaCard['effectType'], number> = {
    MIRROR_MONK: 94,
    MARTYR: 86,
    MASTERMIND: 91,
    SHINOBI_KILL: 82,
    JUDGE_KILL: 78,
    BLIND_ASSASSIN_KILL: 68,
    SHAPESHIFTER: 72,
    THIEF: 60 + Math.max(0, 3 - bot.honorTokens.length) * 5,
    TROUBLEMAKER: 66,
    LOOK_HOUSE_AND_NINJA: 62,
    LOOK_HOUSE: 58,
    SPIRIT_MERCHANT: 56,
    GRAVE_DIGGER: 50,
  };
  const alreadyHasReaction = bot.selectedCards.some((selected) => selected.cardType === 'REACTION');
  const duplicateReactionPenalty = alreadyHasReaction && card.cardType === 'REACTION' ? 18 : 0;
  const phaseDiversityBonus = bot.selectedCards.some((selected) => selected.phase === card.phase) ? 0 : 3;
  const contextNoise = stableNoise(bot.id, card.id, state?.currentRound ?? 0) * 1.5;
  return baseValue[card.effectType] - duplicateReactionPenalty + phaseDiversityBonus + contextNoise;
}

export function chooseBotDraftCard(bot: Player, state?: GameState): NinjaCard | null {
  return [...bot.draftHand].sort(
    (a, b) => cardStrategicValue(b, bot, state) - cardStrategicValue(a, bot, state),
  )[0] ?? null;
}

function estimatedClanStrength(state: GameState, bot: Player, clan: HouseType): number {
  if (clan === 'RONIN') return bot.isAlive ? 1.2 : 0;
  return state.players.filter((player) => player.isAlive).reduce((score, player) => {
    const belief = getBotBelief(state, bot, player);
    const revealedRankBonus = player.revealedHouse && player.house?.type === clan
      ? 1 / Math.max(1, player.house.rank ?? 4)
      : 0;
    return score + belief[clan] + revealedRankBonus;
  }, 0);
}

export function chooseBotAction(bot: Player, card: NinjaCard, state: GameState): {
  targetId?: string;
  secondTargetId?: string;
  decision?: string;
} {
  if (card.effectType === 'GRAVE_DIGGER') {
    const recovered = [...state.ninjaDiscardPile.slice(0, 2)].sort(
      (a, b) => cardStrategicValue(b, bot, state) - cardStrategicValue(a, bot, state),
    )[0];
    return { targetId: recovered?.id };
  }

  const others = state.players.filter((player) => player.isAlive && player.id !== bot.id);
  if (others.length === 0) return {};

  if (card.effectType === 'SHAPESHIFTER') {
    const partner = pickBestTarget(state, bot, others, 'MANIPULATE');
    if (!partner?.house || !bot.house) return {};
    const currentStrength = estimatedClanStrength(state, bot, bot.house.type);
    const candidateStrength = estimatedClanStrength(state, bot, partner.house.type);
    const shouldSwap = partner.house.type !== bot.house.type && (
      partner.house.type === 'RONIN' || candidateStrength > currentStrength + 0.35
    );
    return {
      targetId: bot.id,
      secondTargetId: partner.id,
      decision: shouldSwap ? 'SWAP' : 'KEEP',
    };
  }

  if (card.effectType === 'THIEF') {
    const eligible = others.filter((player) => player.honorTokens.length > bot.honorTokens.length);
    const target = [...eligible].sort((a, b) =>
      b.honorTokens.length - a.honorTokens.length ||
      targetScore(state, bot, b, 'ATTACK') - targetScore(state, bot, a, 'ATTACK'))[0];
    return { targetId: target?.id };
  }

  const informationEffects: NinjaCard['effectType'][] = [
    'LOOK_HOUSE', 'LOOK_HOUSE_AND_NINJA', 'TROUBLEMAKER', 'SPIRIT_MERCHANT', 'SHINOBI_KILL',
  ];
  const purpose = informationEffects.includes(card.effectType) ? 'INFORMATION' : 'ATTACK';
  const target = pickBestTarget(state, bot, others, purpose);
  if (!target) return {};

  if (card.effectType === 'TROUBLEMAKER') {
    const targetTruth = target.house ? exactBelief(target.house.type) : getBotBelief(state, bot, target);
    const selfBelief = getBotBelief(state, bot, bot);
    const sameClan = selfBelief.LOTUS * targetTruth.LOTUS + selfBelief.CRANE * targetTruth.CRANE;
    return {
      targetId: target.id,
      decision: sameClan < 0.5 ? 'REVEAL' : 'KEEP',
    };
  }
  if (card.effectType === 'SPIRIT_MERCHANT') {
    const ownToken = bot.honorTokens[0];
    const targetToken = target.honorTokens[0];
    if (!ownToken || !targetToken) return { targetId: target.id, decision: 'HOUSE_KEEP' };
    const beneficialSwap = ownToken && targetToken && targetToken.value > ownToken.value;
    return { targetId: target.id, decision: beneficialSwap ? 'HONOR_SWAP' : 'HONOR_KEEP' };
  }
  if (card.effectType === 'SHINOBI_KILL' && target.house) {
    const targetTruth = exactBelief(target.house.type);
    const selfBelief = getBotBelief(state, bot, bot);
    const sameClan = selfBelief.LOTUS * targetTruth.LOTUS + selfBelief.CRANE * targetTruth.CRANE;
    return { targetId: target.id, decision: sameClan < 0.5 ? 'KILL' : 'SPARE' };
  }
  return { targetId: target.id };
}
