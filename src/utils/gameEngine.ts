import {
  ActionLogEntry,
  GameMode,
  GameState,
  HouseCard,
  HouseType,
  NinjaCard,
  NinjaPhase,
  Player,
  ShapeshifterInspection,
} from '../types/game';
import { HOUSES, createFullNinjaDeck, createInitialHonorDeck, shuffleArray } from '../data/cards';
import {
  chooseBotAction,
  chooseBotDraftCard,
  inferRelationshipFromAction,
  initializeBotBeliefs,
  rememberHouse,
  revealHouseToBots,
  updateBotBeliefAfterBeingSwapped,
} from './botStrategy';

export const NIGHT_PHASES: NinjaPhase[] = ['SPY', 'MYSTIC', 'TRICKSTER', 'BLIND_ASSASSIN', 'SHINOBI'];
export const PENDING_CARD_AFTER_OWNER_DEATH = 'CANCEL' as const;

const PHASE_LABELS: Record<NinjaPhase, string> = {
  SPY: 'Do thám',
  MYSTIC: 'Thần bí',
  TRICKSTER: 'Mưu sĩ',
  BLIND_ASSASSIN: 'Sát thủ mù',
  SHINOBI: 'Shinobi',
};

function now() {
  return new Date().toLocaleTimeString('vi-VN');
}

function logEntry(messageVi: string, type: ActionLogEntry['type'], extra: Partial<ActionLogEntry> = {}): ActionLogEntry {
  return { id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: now(), messageVi, type, ...extra };
}

export function createHouseDeckForPlayerCount(count: number): HouseCard[] {
  const houseSize = Math.floor(count / 2);
  const cards: HouseCard[] = [];

  for (let rank = 1; rank <= houseSize; rank += 1) {
    cards.push({
      ...HOUSES.LOTUS,
      id: `LOTUS_${rank}`,
      rank,
      nameVi: `Hoa Sen ${rank}`,
      descriptionVi: `Gia tộc Hoa Sen · Rank ${rank}. Số càng nhỏ càng mạnh.`,
    });
    cards.push({
      ...HOUSES.CRANE,
      id: `CRANE_${rank}`,
      rank,
      nameVi: `Chim Hạc ${rank}`,
      descriptionVi: `Gia tộc Chim Hạc · Rank ${rank}. Số càng nhỏ càng mạnh.`,
    });
  }

  if (count % 2 === 1) cards.push({ ...HOUSES.RONIN, id: 'RONIN', rank: null });
  return shuffleArray(cards);
}

export function initializeNewGame(players: Player[], mode: GameMode): GameState {
  return {
    roomCode: Math.random().toString(36).substring(2, 7).toUpperCase(),
    status: 'LOBBY',
    gameMode: mode,
    currentRound: 1,
    draftPickNumber: 1,
    executionPhase: 'SPY',
    executionStep: 0,
    players: players.map((player) => ({
      ...player,
      isAlive: true,
      revealedHouse: false,
      unknownCurrentHouse: false,
      house: null,
      draftHand: [],
      selectedCards: [],
      playedCardsThisPhase: [],
      honorTokens: [],
      totalScore: 0,
      killsThisRound: 0,
    })),
    honorDeck: createInitialHonorDeck(),
    ninjaDeck: createFullNinjaDeck(),
    ninjaDiscardPile: [],
    roundWinnerClan: null,
    roundSummaryLogs: [],
    privateNotices: {},
    gameWinners: [],
    botBeliefs: {},
    actionLogs: [logEntry('Trận đấu Night of the Ninja đã được khởi tạo.', 'INFO')],
  };
}

export function startRound(state: GameState, roundNum: number): GameState {
  const houseDeck = createHouseDeckForPlayerCount(state.players.length);
  const fullNinjaDeck = createFullNinjaDeck();
  const players = state.players.map((player, index) => ({
    ...player,
    isAlive: true,
    revealedHouse: false,
    unknownCurrentHouse: false,
    house: houseDeck[index] ?? null,
    draftHand: [] as NinjaCard[],
    selectedCards: [] as NinjaCard[],
    playedCardsThisPhase: [] as NinjaCard[],
    killsThisRound: 0,
  }));

  let deckIndex = 0;
  for (let cardIndex = 0; cardIndex < 3; cardIndex += 1) {
    for (const player of players) {
      const card = fullNinjaDeck[deckIndex];
      if (card) player.draftHand.push(card);
      deckIndex += 1;
    }
  }

  const nextState: GameState = {
    ...state,
    status: 'DRAFTING',
    currentRound: roundNum,
    draftPickNumber: 1,
    executionPhase: 'SPY',
    executionStep: 0,
    players,
    ninjaDeck: fullNinjaDeck.slice(deckIndex),
    ninjaDiscardPile: [],
    roundWinnerClan: null,
    roundSummaryLogs: [],
    privateNotices: {},
    gameWinners: [],
    botBeliefs: initializeBotBeliefs(players),
    pendingCard: null,
    actionLogs: [
      logEntry(`— HIỆP ${roundNum} BẮT ĐẦU — House đã được phát bí mật.`, 'INFO', { phase: 'ROUND_START' }),
      ...state.actionLogs,
    ],
  };

  return processBotDraftingIfNeeded(nextState);
}

export function handleDraftPick(state: GameState, playerId: string, cardId: string): GameState {
  if (state.status !== 'DRAFTING') return state;
  const player = state.players.find((candidate) => candidate.id === playerId);
  const expectedPicks = state.draftPickNumber - 1;
  if (!player || player.selectedCards.length !== expectedPicks) return state;

  const selectedCard = player.draftHand.find((card) => card.id === cardId);
  if (!selectedCard) return state;

  const isSecondPick = state.draftPickNumber === 2;
  const discarded = isSecondPick ? player.draftHand.filter((card) => card.id !== cardId) : [];
  let players = state.players.map((candidate) => candidate.id === playerId
    ? {
        ...candidate,
        selectedCards: [...candidate.selectedCards, selectedCard],
        draftHand: isSecondPick ? [] : candidate.draftHand.filter((card) => card.id !== cardId),
      }
    : candidate);
  const discardPile = [...state.ninjaDiscardPile, ...discarded];

  const allPicked = players.every((candidate) => candidate.selectedCards.length === state.draftPickNumber);
  if (!allPicked) return processBotDraftingIfNeeded({ ...state, players, ninjaDiscardPile: discardPile });

  if (!isSecondPick) {
    const hands = players.map((candidate) => candidate.draftHand);
    // Every round passes the two unchosen cards to the player on the left.
    players = players.map((candidate, index) => ({
      ...candidate,
      draftHand: hands[(index + players.length - 1) % players.length],
    }));
    return processBotDraftingIfNeeded({
      ...state,
      players,
      draftPickNumber: 2,
      ninjaDiscardPile: discardPile,
    });
  }

  return processNextExecutionStep({
    ...state,
    status: 'EXECUTION',
    executionPhase: 'SPY',
    executionStep: 0,
    players,
    ninjaDiscardPile: discardPile,
    actionLogs: [logEntry('Draft kết thúc. Đêm bắt đầu với phase Do thám.', 'INFO', { phase: 'SPY' }), ...state.actionLogs],
  });
}

export function processBotDraftingIfNeeded(state: GameState): GameState {
  if (state.status !== 'DRAFTING') return state;
  const bot = state.players.find((player) =>
    player.isBot &&
    player.selectedCards.length === state.draftPickNumber - 1 &&
    player.draftHand.length > 0);
  if (!bot) return state;
  const chosenCard = chooseBotDraftCard(bot, state);
  return chosenCard ? handleDraftPick(state, bot.id, chosenCard.id) : state;
}

function getNextAction(state: GameState): { player: Player; card: NinjaCard } | null {
  if (state.pendingCard) {
    const player = state.players.find((p) => p.id === state.pendingCard!.playerId);
    if (player && player.isAlive) {
      return { player, card: state.pendingCard!.card };
    }
  }
  const queue = state.players.flatMap((player, playerIndex) => {
    if (!player.isAlive) return [];
    return player.selectedCards
      .filter((card) =>
        card.phase === state.executionPhase &&
        !player.playedCardsThisPhase.some((played) => played.id === card.id))
      .map((card) => ({ player, playerIndex, card }));
  });
  queue.sort((a, b) => (a.card.priority ?? 99) - (b.card.priority ?? 99) || a.playerIndex - b.playerIndex);
  return queue[0] ?? null;
}

export function inspectShapeshifterTargets(
  state: GameState,
  actorId: string,
  cardId: string,
  targetId: string,
  secondTargetId: string,
): ShapeshifterInspection | null {
  if (state.status !== 'EXECUTION') return null;
  const queuedAction = getNextAction(state);
  if (
    !queuedAction ||
    queuedAction.player.id !== actorId ||
    queuedAction.card.id !== cardId ||
    queuedAction.card.effectType !== 'SHAPESHIFTER' ||
    targetId === secondTargetId
  ) {
    return null;
  }

  const targets = [targetId, secondTargetId].map((id) =>
    state.players.find((player) => player.id === id && player.isAlive));
  if (targets.some((player) => !player?.house)) return null;

  return {
    targets: targets.map((player) => ({
      playerId: player!.id,
      playerName: player!.name,
      house: player!.house!,
    })),
  };
}

export function processNextExecutionStep(state: GameState): GameState {
  if (state.status !== 'EXECUTION') return state;
  const action = getNextAction(state);
  if (action) {
    if (!action.player.isBot) return state;
    const botAction = chooseBotAction(action.player, action.card, state);
    return executeCardAction(
      state,
      action.player.id,
      action.card.id,
      botAction.targetId,
      botAction.secondTargetId,
      botAction.decision,
    );
  }

  const phaseIndex = NIGHT_PHASES.indexOf(state.executionPhase);
  if (phaseIndex < NIGHT_PHASES.length - 1) {
    const executionPhase = NIGHT_PHASES[phaseIndex + 1];
    return processNextExecutionStep({
      ...state,
      executionPhase,
      executionStep: 0,
      actionLogs: [
        logEntry(`Chuyển sang phase ${PHASE_LABELS[executionPhase]}.`, 'INFO', { phase: executionPhase }),
        ...state.actionLogs,
      ],
    });
  }
  return evaluateRoundEnd(state);
}

export function executeCardAction(
  state: GameState,
  actorId: string,
  cardId: string,
  targetId?: string,
  secondTargetId?: string,
  decision?: string,
): GameState {
  if (state.status !== 'EXECUTION') return state;
  const queuedAction = getNextAction(state);
  if (!queuedAction || queuedAction.player.id !== actorId || queuedAction.card.id !== cardId) return state;

  const actor = queuedAction.player;
  const card = queuedAction.card;
  if (card.effectType === 'SHAPESHIFTER') {
    const validDecision = decision === 'KEEP' || decision === 'SWAP';
    if (
      !targetId ||
      !secondTargetId ||
      !validDecision ||
      !inspectShapeshifterTargets(state, actorId, cardId, targetId, secondTargetId)
    ) {
      return state;
    }
  }
  let nextState: GameState = {
    ...state,
    executionStep: state.executionStep + 1,
    players: state.players.map((player) => player.id === actorId
      ? { ...player, playedCardsThisPhase: [...player.playedCardsThisPhase, card] }
      : player),
    pendingCard: state.pendingCard && state.pendingCard.card.id === cardId ? null : state.pendingCard,
  };
  const logs = [...nextState.actionLogs];

  const addPrivateNotice = (playerId: string, message: string) => {
    nextState = {
      ...nextState,
      privateNotices: {
        ...nextState.privateNotices,
        [playerId]: [message, ...(nextState.privateNotices?.[playerId] ?? [])].slice(0, 8),
      },
    };
  };

  const target = targetId ? nextState.players.find((player) => player.id === targetId && player.isAlive) : undefined;
  const secondTarget = secondTargetId
    ? nextState.players.find((player) => player.id === secondTargetId && player.isAlive)
    : undefined;
  const phase = card.phase ?? undefined;

  switch (card.effectType) {
    case 'LOOK_HOUSE': {
      if (target?.house) {
        nextState = rememberHouse(nextState, actorId, target.id, target.house.type);
        addPrivateNotice(actorId, `👁️ House của ${target.name}: ${target.house.nameVi} ${target.house.icon}.`);
        logs.unshift(logEntry(`${actor.name} dùng [${card.nameVi}] bí mật xem House của ${target.name}.`, 'ACTION', { phase, actorId, targetId }));
      }
      break;
    }
    case 'LOOK_HOUSE_AND_NINJA': {
      if (target?.house) {
        nextState = rememberHouse(nextState, actorId, target.id, target.house.type);
        const hiddenCards = target.selectedCards.filter((candidate) =>
          !target.playedCardsThisPhase.some((played) => played.id === candidate.id));
        const seenCard = hiddenCards[Math.floor(Math.random() * hiddenCards.length)];
        addPrivateNotice(
          actorId,
          `🔮 ${target.name}: ${target.house.nameVi}; Ninja card: ${seenCard?.nameVi ?? 'không còn lá chưa chơi'}.`,
        );
        logs.unshift(logEntry(`${actor.name} dùng [${card.nameVi}] dò xét ${target.name}.`, 'ACTION', { phase, actorId, targetId }));
      }
      break;
    }
    case 'SHAPESHIFTER': {
      if (target?.house && secondTarget?.house && target.id !== secondTarget.id) {
        addPrivateNotice(actorId, `🦊 ${target.name}: ${target.house.nameVi}; ${secondTarget.name}: ${secondTarget.house.nameVi}.`);
        if (decision === 'SWAP') {
          const stateBeforeSwap = nextState;
          const firstHouse = target.house;
          const secondHouse = secondTarget.house;
          nextState.players = nextState.players.map((player) => {
            if (player.id === target.id) return { ...player, house: secondHouse, unknownCurrentHouse: true, revealedHouse: false };
            if (player.id === secondTarget.id) return { ...player, house: firstHouse, unknownCurrentHouse: true, revealedHouse: false };
            return player;
          });
          nextState = updateBotBeliefAfterBeingSwapped(
            stateBeforeSwap,
            nextState,
            target.id,
            secondTarget.id,
          );
          nextState = updateBotBeliefAfterBeingSwapped(
            stateBeforeSwap,
            nextState,
            secondTarget.id,
            target.id,
          );
          const updatedFirst = nextState.players.find((player) => player.id === target.id);
          const updatedSecond = nextState.players.find((player) => player.id === secondTarget.id);
          if (updatedFirst?.house) {
            nextState = rememberHouse(nextState, actorId, updatedFirst.id, updatedFirst.house.type);
          }
          if (updatedSecond?.house) {
            nextState = rememberHouse(nextState, actorId, updatedSecond.id, updatedSecond.house.type);
          }
        } else {
          nextState = rememberHouse(nextState, actorId, target.id, target.house.type);
          nextState = rememberHouse(nextState, actorId, secondTarget.id, secondTarget.house.type);
        }
        logs.unshift(logEntry(`${actor.name} dùng [${card.nameVi}] lên ${target.name} và ${secondTarget.name}. Quyết định tráo được giữ bí mật.`, 'ACTION', { phase, actorId }));
      }
      break;
    }
    case 'GRAVE_DIGGER': {
      const visibleDiscard = nextState.ninjaDiscardPile.slice(0, 2);
      const recovered = visibleDiscard.find((candidate) => candidate.id === targetId);
      if (recovered) {
        nextState.ninjaDiscardPile = nextState.ninjaDiscardPile.filter((candidate) => candidate.id !== recovered.id);
        nextState.players = nextState.players.map((player) => player.id === actorId
          ? {
              ...player,
              selectedCards: [...player.selectedCards, recovered],
            }
          : player);

        const isReactiveOrReveal = recovered.cardType === 'REACTION' || recovered.cardType === 'REVEAL' || recovered.phase === null;
        if (!isReactiveOrReveal) {
          nextState.pendingCard = {
            playerId: actorId,
            card: recovered,
          };
          addPrivateNotice(
            actorId,
            `🪦 Bạn lấy [${recovered.nameVi}] từ chồng bài bỏ và phải sử dụng lập tức!`,
          );
          logs.unshift(logEntry(`${actor.name} dùng [${card.nameVi}] lấy lá [${recovered.nameVi}] từ chồng bỏ và phải dùng lập tức.`, 'ACTION', { phase, actorId }));
        } else {
          addPrivateNotice(
            actorId,
            `🪦 Bạn lấy [${recovered.nameVi}] từ chồng bài bỏ và giữ lá này để sử dụng khi đủ điều kiện.`,
          );
          logs.unshift(logEntry(`${actor.name} dùng [${card.nameVi}] lấy lá phản ứng/reveal [${recovered.nameVi}] từ chồng bỏ.`, 'ACTION', { phase, actorId }));
        }
      }
      break;
    }
    case 'TROUBLEMAKER': {
      if (target?.house) {
        nextState = rememberHouse(nextState, actorId, target.id, target.house.type);
        addPrivateNotice(actorId, `🎭 House của ${target.name}: ${target.house.nameVi}.`);
        if (decision === 'REVEAL') {
          nextState.players = nextState.players.map((player) => player.id === target.id
            ? { ...player, revealedHouse: true }
            : player);
          nextState = revealHouseToBots(nextState, target.id, target.house.type);
          logs.unshift(logEntry(`${actor.name} dùng [${card.nameVi}] công khai House của ${target.name}: ${target.house.nameVi}.`, 'REVEAL', { phase, actorId, targetId }));
        } else {
          logs.unshift(logEntry(`${actor.name} dùng [${card.nameVi}] xem riêng House của ${target.name}.`, 'ACTION', { phase, actorId, targetId }));
        }
      }
      break;
    }
    case 'SPIRIT_MERCHANT': {
      if (target) {
        if (decision?.startsWith('HOUSE') && target.house) {
          nextState = rememberHouse(nextState, actorId, target.id, target.house.type);
          addPrivateNotice(actorId, `🪙 House của ${target.name}: ${target.house.nameVi}.`);
        } else {
          addPrivateNotice(actorId, `🪙 Honor token của ${target.name}: ${target.honorTokens[0]?.value ?? 'không có'}.`);
        }
        if (decision?.endsWith('SWAP') && actor.honorTokens.length > 0 && target.honorTokens.length > 0) {
          const actorToken = actor.honorTokens[0];
          const targetToken = target.honorTokens[0];
          nextState.players = nextState.players.map((player) => {
            if (player.id === actorId) return {
              ...player,
              honorTokens: [targetToken, ...player.honorTokens.slice(1)],
              totalScore: player.totalScore - actorToken.value + targetToken.value,
            };
            if (player.id === target.id) return {
              ...player,
              honorTokens: [actorToken, ...player.honorTokens.slice(1)],
              totalScore: player.totalScore - targetToken.value + actorToken.value,
            };
            return player;
          });
        }
        logs.unshift(logEntry(`${actor.name} dùng [${card.nameVi}] giao dịch bí mật với ${target.name}.`, 'ACTION', { phase, actorId, targetId }));
      }
      break;
    }
    case 'THIEF': {
      nextState.players = nextState.players.map((player) => player.id === actorId ? { ...player, revealedHouse: true } : player);
      if (actor.house) nextState = revealHouseToBots(nextState, actorId, actor.house.type);
      const currentActor = nextState.players.find((player) => player.id === actorId)!;
      const currentTarget = target ? nextState.players.find((player) => player.id === target.id) : undefined;
      if (currentTarget && currentTarget.honorTokens.length > currentActor.honorTokens.length) {
        const stolen = currentTarget.honorTokens[0];
        nextState.players = nextState.players.map((player) => {
          if (player.id === actorId) return { ...player, honorTokens: [...player.honorTokens, stolen], totalScore: player.totalScore + stolen.value };
          if (player.id === currentTarget.id) return { ...player, honorTokens: player.honorTokens.slice(1), totalScore: player.totalScore - stolen.value };
          return player;
        });
        logs.unshift(logEntry(`${actor.name} công khai House và dùng [${card.nameVi}] lấy 1 Honor token từ ${currentTarget.name}.`, 'HONOR', { phase, actorId, targetId }));
      } else {
        logs.unshift(logEntry(`${actor.name} công khai House khi dùng [${card.nameVi}], nhưng không có mục tiêu hợp lệ.`, 'REVEAL', { phase, actorId }));
      }
      break;
    }
    case 'JUDGE_KILL': {
      nextState.players = nextState.players.map((player) => player.id === actorId ? { ...player, revealedHouse: true } : player);
      if (actor.house) nextState = revealHouseToBots(nextState, actorId, actor.house.type);
      logs.unshift(logEntry(`${actor.name} công khai House và tuyên án bằng [${card.nameVi}].`, 'REVEAL', { phase, actorId }));
      if (target) {
        nextState = resolveKill(nextState, actorId, target.id, card, logs, false);
        nextState = inferRelationshipFromAction(nextState, actorId, target.id, 'ENEMY', 0.35);
      }
      break;
    }
    case 'BLIND_ASSASSIN_KILL': {
      if (target) {
        nextState = resolveKill(nextState, actorId, target.id, card, logs, true);
        nextState = inferRelationshipFromAction(nextState, actorId, target.id, 'ENEMY', 0.15);
      }
      break;
    }
    case 'SHINOBI_KILL': {
      if (target?.house) {
        nextState = rememberHouse(nextState, actorId, target.id, target.house.type);
        addPrivateNotice(actorId, `🥷 House của ${target.name}: ${target.house.nameVi}.`);
        if (decision === 'KILL') {
          nextState = resolveKill(nextState, actorId, target.id, card, logs, true);
          nextState = inferRelationshipFromAction(nextState, actorId, target.id, 'ENEMY', 0.85);
        } else {
          nextState = inferRelationshipFromAction(nextState, actorId, target.id, 'ALLY', 0.85);
          logs.unshift(logEntry(`${actor.name} dùng [${card.nameVi}] kiểm tra rồi tha cho ${target.name}.`, 'ACTION', { phase, actorId, targetId }));
        }
      }
      break;
    }
    case 'MIRROR_MONK':
    case 'MARTYR':
    case 'MASTERMIND':
      break;
  }

  nextState.actionLogs = logs;
  return processNextExecutionStep(nextState);
}

function resolveKill(
  state: GameState,
  killerId: string,
  victimId: string,
  card: NinjaCard,
  logs: ActionLogEntry[],
  reactionsAllowed: boolean,
): GameState {
  const killer = state.players.find((player) => player.id === killerId);
  const victim = state.players.find((player) => player.id === victimId);
  if (!killer?.isAlive || !victim?.isAlive || killerId === victimId) return state;
  let nextState = state;

  if (reactionsAllowed) {
    const mirrorMonk = victim.selectedCards.find((candidate) =>
      candidate.effectType === 'MIRROR_MONK' &&
      !victim.playedCardsThisPhase.some((played) => played.id === candidate.id));
    if (mirrorMonk) {
      nextState = {
        ...nextState,
        players: nextState.players.map((player) => {
          if (player.id === victimId) return { ...player, playedCardsThisPhase: [...player.playedCardsThisPhase, mirrorMonk] };
          if (player.id === killerId) return { ...player, isAlive: false };
          return player;
        }),
      };
      logs.unshift(logEntry(`🪞 ${victim.name} lật [Mirror Monk]: phản đòn, ${killer.name} chết còn ${victim.name} sống.`, 'DEFENSE', { phase: card.phase ?? undefined, actorId: victimId, targetId: killerId }));
      return nextState;
    }

    const martyr = victim.selectedCards.find((candidate) =>
      candidate.effectType === 'MARTYR' &&
      !victim.playedCardsThisPhase.some((played) => played.id === candidate.id));
    if (martyr) {
      const reward = nextState.honorDeck[0];
      nextState = {
        ...nextState,
        honorDeck: reward ? nextState.honorDeck.slice(1) : nextState.honorDeck,
        players: nextState.players.map((player) => {
          if (player.id === victimId) return {
            ...player,
            isAlive: false,
            playedCardsThisPhase: [...player.playedCardsThisPhase, martyr],
            honorTokens: reward ? [...player.honorTokens, reward] : player.honorTokens,
            totalScore: player.totalScore + (reward?.value ?? 0),
          };
          if (player.id === killerId) return { ...player, killsThisRound: player.killsThisRound + 1 };
          return player;
        }),
      };
      logs.unshift(logEntry(`🕯️ ${victim.name} lật [Martyr]: vẫn chết nhưng nhận 1 Honor token. House không bị lộ.`, 'HONOR', { phase: card.phase ?? undefined, actorId: victimId }));
      return nextState;
    }
  }

  nextState = {
    ...nextState,
    players: nextState.players.map((player) => {
      if (player.id === victimId) return { ...player, isAlive: false };
      if (player.id === killerId) return { ...player, killsThisRound: player.killsThisRound + 1 };
      return player;
    }),
  };
  logs.unshift(logEntry(`🗡️ ${killer.name} dùng [${card.nameVi}] hạ gục ${victim.name}. House của người chết vẫn bí mật.`, 'KILL', { phase: card.phase ?? undefined, actorId: killerId, targetId: victimId }));
  return nextState;
}

function compareHouseRanks(lotus: Player[], crane: Player[]): HouseType | 'DRAW' {
  const lotusRanks = lotus.map((player) => player.house?.rank ?? 99).sort((a, b) => a - b);
  const craneRanks = crane.map((player) => player.house?.rank ?? 99).sort((a, b) => a - b);
  const comparisons = Math.max(lotusRanks.length, craneRanks.length);
  for (let index = 0; index < comparisons; index += 1) {
    if (lotusRanks[index] === undefined) return 'CRANE';
    if (craneRanks[index] === undefined) return 'LOTUS';
    if (lotusRanks[index] < craneRanks[index]) return 'LOTUS';
    if (craneRanks[index] < lotusRanks[index]) return 'CRANE';
  }
  return 'DRAW';
}

export function evaluateRoundEnd(state: GameState): GameState {
  const alive = state.players.filter((player) => player.isAlive);
  const lotus = alive.filter((player) => player.house?.type === 'LOTUS');
  const crane = alive.filter((player) => player.house?.type === 'CRANE');
  let winningClan: HouseType | 'DRAW' = compareHouseRanks(lotus, crane);
  let players = state.players.map((player) => player.isAlive ? { ...player, revealedHouse: true } : player);
  const mastermindOwner = players.find((player) =>
    player.isAlive && player.selectedCards.some((card) =>
      card.effectType === 'MASTERMIND' &&
      !player.playedCardsThisPhase.some((played) => played.id === card.id)));

  const summaryLogs = [
    `TỔNG KẾT HIỆP ${state.currentRound}`,
    `Hoa Sen sống sót: ${lotus.map((player) => player.house?.rank).join(', ') || 'không có'}.`,
    `Chim Hạc sống sót: ${crane.map((player) => player.house?.rank).join(', ') || 'không có'}.`,
  ];

  if (mastermindOwner) {
    const mastermind = mastermindOwner.selectedCards.find((card) => card.effectType === 'MASTERMIND')!;
    players = players.map((player) => player.id === mastermindOwner.id
      ? { ...player, playedCardsThisPhase: [...player.playedCardsThisPhase, mastermind] }
      : player);
    winningClan = mastermindOwner.house?.type === 'RONIN' ? 'DRAW' : mastermindOwner.house?.type ?? 'DRAW';
    summaryLogs.push(`🧠 ${mastermindOwner.name} lật Mastermind và thay đổi kết quả House Reveal.`);
  }

  if (winningClan === 'LOTUS') summaryLogs.push('🏆 Gia tộc Hoa Sen thắng hiệp.');
  else if (winningClan === 'CRANE') summaryLogs.push('🏆 Gia tộc Chim Hạc thắng hiệp.');
  else summaryLogs.push('🤝 Hai House hòa; mọi người còn sống nhận Honor.');

  let honorDeck = [...state.honorDeck];
  players = players.map((player) => {
    const winsWithHouse = winningClan !== 'DRAW' && player.house?.type === winningClan;
    const earnsDrawReward = winningClan === 'DRAW' && player.isAlive;
    const earnsRoninReward = player.isAlive && player.house?.type === 'RONIN';
    if (!winsWithHouse && !earnsDrawReward && !earnsRoninReward) return player;
    const token = honorDeck.shift();
    if (!token) return player;
    return {
      ...player,
      honorTokens: [...player.honorTokens, token],
      totalScore: player.totalScore + token.value,
    };
  });

  const reachedThreshold = players.some((player) => player.totalScore >= 10);
  const highScore = Math.max(...players.map((player) => player.totalScore));
  const gameWinners = reachedThreshold
    ? players.filter((player) => player.totalScore === highScore).map((player) => player.id)
    : [];
  if (reachedThreshold) {
    summaryLogs.push(`🎖️ Trò chơi kết thúc ở mốc 10 điểm. Người thắng: ${players.filter((player) => gameWinners.includes(player.id)).map((player) => player.name).join(', ')}.`);
  }

  return {
    ...state,
    status: reachedThreshold ? 'GAME_OVER' : 'ROUND_SUMMARY',
    players,
    honorDeck,
    roundWinnerClan: winningClan,
    roundSummaryLogs: summaryLogs,
    gameWinners,
    actionLogs: [logEntry(summaryLogs.join(' '), 'HONOR', { phase: 'ROUND_END' }), ...state.actionLogs],
  };
}
