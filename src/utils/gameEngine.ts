import {
  GameState,
  Player,
  HouseCard,
  GameMode,
  HouseType,
  NinjaCard,
  CardRank,
  ActionLogEntry,
} from '../types/game';
import {
  HOUSES,
  createInitialHonorDeck,
  createFullNinjaDeck,
  shuffleArray,
} from '../data/cards';

export function createHouseDeckForPlayerCount(count: number): HouseCard[] {
  const cards: HouseCard[] = [];
  let lotusCount = 2;
  let craneCount = 2;
  let roninCount = 0;

  if (count === 4) {
    lotusCount = 2;
    craneCount = 2;
  } else if (count === 5) {
    lotusCount = 2;
    craneCount = 2;
    roninCount = 1;
  } else if (count === 6) {
    lotusCount = 3;
    craneCount = 3;
  } else if (count === 7) {
    lotusCount = 3;
    craneCount = 3;
    roninCount = 1;
  } else if (count === 8) {
    lotusCount = 4;
    craneCount = 4;
  } else if (count === 9) {
    lotusCount = 4;
    craneCount = 4;
    roninCount = 1;
  } else if (count === 10) {
    lotusCount = 5;
    craneCount = 5;
  } else {
    // 11 or default
    lotusCount = 5;
    craneCount = 5;
    roninCount = 1;
  }

  for (let i = 0; i < lotusCount; i++) cards.push({ ...HOUSES.LOTUS });
  for (let i = 0; i < craneCount; i++) cards.push({ ...HOUSES.CRANE });
  for (let i = 0; i < roninCount; i++) cards.push({ ...HOUSES.RONIN });

  return shuffleArray(cards);
}

export function initializeNewGame(players: Player[], mode: GameMode): GameState {
  const honorDeck = createInitialHonorDeck();
  const ninjaDeck = createFullNinjaDeck();

  const state: GameState = {
    roomCode: Math.random().toString(36).substring(2, 7).toUpperCase(),
    status: 'LOBBY',
    gameMode: mode,
    currentRound: 1,
    maxRounds: 3,
    executionRank: 1,
    executionStep: 0,
    passAndPlayCurrentPlayerId: players[0]?.id || null,
    passAndPlayRevealed: false,
    players: players.map((p) => ({
      ...p,
      isAlive: true,
      revealedHouse: false,
      house: null,
      draftHand: [],
      selectedCards: [],
      playedCardsThisPhase: [],
      isProtected: false,
      retaliateOnDeath: false,
      honorTokens: [],
      totalScore: 0,
      killsThisRound: 0,
    })),
    honorDeck,
    ninjaDeck,
    roundWinnerClan: null,
    roundSummaryLogs: [],
    privateNotices: {},
    actionLogs: [
      {
        id: `log-init-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        messageVi: 'Trận đấu Night of the Ninja đã được khởi tạo!',
        type: 'INFO',
      },
    ],
  };

  return state;
}

function getNextPassAndPlayPlayerId(
  state: GameState,
  afterPlayerId: string
): string | null {
  const humanPlayers = state.players.filter((player) => !player.isBot);
  if (humanPlayers.length === 0) return null;

  const minimumPicked = Math.min(
    ...humanPlayers.map((player) => player.selectedCards.length)
  );
  const startIndex = humanPlayers.findIndex((player) => player.id === afterPlayerId);

  for (let offset = 1; offset <= humanPlayers.length; offset++) {
    const index = (Math.max(startIndex, 0) + offset) % humanPlayers.length;
    const candidate = humanPlayers[index];
    if (
      candidate.draftHand.length > 0 &&
      candidate.selectedCards.length === minimumPicked
    ) {
      return candidate.id;
    }
  }

  return humanPlayers[0]?.id || null;
}

export function startRound(state: GameState, roundNum: number): GameState {
  const houseDeck = createHouseDeckForPlayerCount(state.players.length);
  const ninjaDeck = createFullNinjaDeck();

  const updatedPlayers = state.players.map((player, idx) => ({
    ...player,
    isAlive: true,
    revealedHouse: false,
    house: houseDeck[idx] || HOUSES.LOTUS,
    draftHand: [],
    selectedCards: [],
    playedCardsThisPhase: [],
    isProtected: false,
    retaliateOnDeath: false,
    killsThisRound: 0,
  }));

  // Deal 3 Ninja cards to each player for Drafting
  let deckIdx = 0;
  for (let i = 0; i < 3; i++) {
    for (const player of updatedPlayers) {
      if (deckIdx < ninjaDeck.length) {
        player.draftHand.push(ninjaDeck[deckIdx++]);
      }
    }
  }

  const remainingNinjaDeck = ninjaDeck.slice(deckIdx);

  const newLog: ActionLogEntry = {
    id: `log-round-${roundNum}-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('vi-VN'),
    phase: 'ROUND_START',
    messageVi: `--- HIỆP ${roundNum} BẮT ĐẦU --- Thẻ Gia Tộc đã được phát bí mật!`,
    type: 'INFO',
  };

  const nextState: GameState = {
    ...state,
    status: 'DRAFTING',
    currentRound: roundNum,
    executionRank: 1,
    executionStep: 0,
    players: updatedPlayers,
    ninjaDeck: remainingNinjaDeck,
    roundWinnerClan: null,
    roundSummaryLogs: [],
    privateNotices: {},
    actionLogs: [newLog, ...state.actionLogs],
    passAndPlayCurrentPlayerId: updatedPlayers[0].id,
    passAndPlayRevealed: false,
  };

  // Auto pick for bots in initial drafting if any
  return processBotDraftingIfNeeded(nextState);
}

export function handleDraftPick(
  state: GameState,
  playerId: string,
  cardId: string
): GameState {
  let updatedPlayers = state.players.map((p) => {
    if (p.id !== playerId) return p;

    const card = p.draftHand.find((c) => c.id === cardId);
    if (!card) return p;

    return {
      ...p,
      selectedCards: [...p.selectedCards, card],
      draftHand: p.draftHand.filter((c) => c.id !== cardId),
    };
  });

  // Check if ALL players have picked 1 card in this draft turn
  const draftTurnPicks = updatedPlayers[0].selectedCards.length;
  const allPicked = updatedPlayers.every((p) => p.selectedCards.length === draftTurnPicks);

  if (allPicked) {
    if (draftTurnPicks < 3) {
      // Pass remaining hands to next player (Rotate draft hands)
      const hands = updatedPlayers.map((p) => p.draftHand);
      updatedPlayers = updatedPlayers.map((p, idx) => {
        // Round 1 & 3 pass left (idx + 1), Round 2 pass right (idx - 1)
        const isLeft = state.currentRound % 2 !== 0;
        const sourceIdx = isLeft
          ? (idx + updatedPlayers.length - 1) % updatedPlayers.length
          : (idx + 1) % updatedPlayers.length;

        return {
          ...p,
          draftHand: hands[sourceIdx],
        };
      });
    } else {
      // Drafting Complete! Move to Execution Phase!
      const logMsg: ActionLogEntry = {
        id: `log-draft-done-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        messageVi: 'Giai đoạn Tuyển Chọn kết thúc! Chuẩn bị bước vào Đêm Hành Động!',
        type: 'INFO',
      };

      const draftingDoneState: GameState = {
        ...state,
        status: 'EXECUTION',
        executionRank: 1,
        executionStep: 0,
        players: updatedPlayers,
        actionLogs: [logMsg, ...state.actionLogs],
      };

      return processNextExecutionStep(draftingDoneState);
    }
  }

  const newState: GameState = {
    ...state,
    players: updatedPlayers,
  };

  const processedState = processBotDraftingIfNeeded(newState);

  if (
    processedState.gameMode === 'PASS_AND_PLAY' &&
    processedState.status === 'DRAFTING'
  ) {
    return {
      ...processedState,
      passAndPlayCurrentPlayerId: getNextPassAndPlayPlayerId(
        processedState,
        playerId
      ),
      passAndPlayRevealed: false,
    };
  }

  return processedState;
}

export function processBotDraftingIfNeeded(state: GameState): GameState {
  if (state.status !== 'DRAFTING') return state;

  let currentState = { ...state };
  let hasBotPicked = false;

  for (const player of currentState.players) {
    if (player.isBot && player.draftHand.length > 0) {
      const maxPickedByAny = Math.max(...currentState.players.map((p) => p.selectedCards.length));
      if (player.selectedCards.length < maxPickedByAny || currentState.players.every(p => p.selectedCards.length === player.selectedCards.length)) {
        // Smart Bot Card Choice
        const chosenCard = chooseBotDraftCard(player, currentState);
        if (chosenCard) {
          hasBotPicked = true;
          currentState = handleDraftPick(currentState, player.id, chosenCard.id);
          if (currentState.status !== 'DRAFTING') break;
        }
      }
    }
  }

  return hasBotPicked && currentState.status === 'DRAFTING'
    ? processBotDraftingIfNeeded(currentState)
    : currentState;
}

function chooseBotDraftCard(bot: Player, state: GameState): NinjaCard | null {
  if (!bot.draftHand || bot.draftHand.length === 0) return null;

  // Bot strategy based on House
  // Rank 3 (Assassin) & Rank 4 (Guard) are highly valued
  const botHouse = bot.house?.type;
  
  // Prefer Rank 3 Assassin if hand has it
  const assassinCard = bot.draftHand.find((c) => c.rank === 3);
  if (assassinCard && Math.random() < 0.7) return assassinCard;

  // Prefer Rank 4 Guard if bot feels threatened
  const guardCard = bot.draftHand.find((c) => c.rank === 4);
  if (guardCard && Math.random() < 0.6) return guardCard;

  // Prefer Rank 1 Spy / Rank 2 Mystic
  const spyCard = bot.draftHand.find((c) => c.rank === 1 || c.rank === 2);
  if (spyCard) return spyCard;

  return bot.draftHand[0];
}

export function processNextExecutionStep(state: GameState): GameState {
  if (state.status !== 'EXECUTION') return state;

  // Find cards to execute for current rank (1 -> 2 -> 3 -> 4)
  const currentRank = state.executionRank;

  // Collect all unexecuted cards of currentRank belonging to ALIVE players
  const activeCardsToExecute: { player: Player; card: NinjaCard }[] = [];

  for (const player of state.players) {
    if (!player.isAlive) continue; // Dead players can't act unless Retaliation
    const cardsOfRank = player.selectedCards.filter(
      (c) => c.rank === currentRank && !player.playedCardsThisPhase.some((p) => p.id === c.id)
    );
    for (const card of cardsOfRank) {
      activeCardsToExecute.push({ player, card });
    }
  }

  if (activeCardsToExecute.length === 0) {
    // Move to next rank rank 1 -> 2 -> 3 -> 4
    if (currentRank < 4) {
      const nextRank = (currentRank + 1) as CardRank;
      const rankNameMap: Record<number, string> = {
        1: 'Do Thám',
        2: 'Thần Thông',
        3: 'Sát Thủ',
        4: 'Vệ Sĩ & Mẹo Thuật',
      };

      const phaseLog: ActionLogEntry = {
        id: `log-phase-${nextRank}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        phase: nextRank,
        messageVi: `>>> Chuyển sang Giai Đoạn Tốc Độ ${nextRank}: Ninja ${rankNameMap[nextRank]} <<<`,
        type: 'INFO',
      };

      return processNextExecutionStep({
        ...state,
        executionRank: nextRank,
        executionStep: 0,
        actionLogs: [phaseLog, ...state.actionLogs],
      });
    } else {
      // Execution Phase finished for all Ranks! Evaluate Round End!
      return evaluateRoundEnd(state);
    }
  }

  // Handle the first card in activeCardsToExecute queue
  const currentAction = activeCardsToExecute[0];
  const actor = currentAction.player;
  const card = currentAction.card;

  // If actor is Bot, resolve Bot action automatically!
  if (actor.isBot) {
    const targetPlayer = chooseBotTarget(actor, card, state);
    return executeCardAction(state, actor.id, card.id, targetPlayer?.id);
  }

  // If human, wait for user input or auto-prompt in UI.
  // Pass & Play must explicitly hand the device to the correct actor.
  if (state.gameMode === 'PASS_AND_PLAY') {
    return {
      ...state,
      passAndPlayCurrentPlayerId: actor.id,
      passAndPlayRevealed: false,
    };
  }

  return state;
}

export function executeCardAction(
  state: GameState,
  actorId: string,
  cardId: string,
  targetId?: string,
  secondTargetId?: string
): GameState {
  let logs: ActionLogEntry[] = [...state.actionLogs];

  const actor = state.players.find((p) => p.id === actorId);
  if (!actor || !actor.isAlive) return state;

  const card = actor.selectedCards.find((c) => c.id === cardId);
  if (!card) return state;

  const updatedPlayers = state.players.map((p) => {
    if (p.id === actorId) {
      return {
        ...p,
        playedCardsThisPhase: [...p.playedCardsThisPhase, card],
      };
    }
    return p;
  });

  const timestamp = new Date().toLocaleTimeString('vi-VN');
  let nextState: GameState = {
    ...state,
    players: updatedPlayers,
  };

  const addPrivateNotice = (message: string) => {
    const existingNotices = nextState.privateNotices?.[actorId] || [];
    nextState.privateNotices = {
      ...nextState.privateNotices,
      [actorId]: [message, ...existingNotices].slice(0, 5),
    };
  };

  const target = targetId ? updatedPlayers.find((p) => p.id === targetId) : null;
  const secondTarget = secondTargetId ? updatedPlayers.find((p) => p.id === secondTargetId) : null;

  // --- CARD EFFECT EXECUTION LOGIC ---
  switch (card.effectType) {
    case 'SPY_HOUSE': {
      if (target && target.house) {
        addPrivateNotice(
          `👁️ ${target.name} thuộc ${target.house.nameVi} ${target.house.icon}.`
        );
        logs.unshift({
          id: `log-act-${Date.now()}`,
          timestamp,
          phase: card.rank,
          actorId,
          targetId: target.id,
          messageVi: `${actor.name} dùng [${card.nameVi}] xem ngầm Thẻ Gia Tộc của ${target.name}.`,
          type: 'ACTION',
        });
      }
      break;
    }

    case 'SPY_DECK': {
      const previewCards = nextState.ninjaDeck.slice(0, 2);
      addPrivateNotice(
        previewCards.length > 0
          ? `🃏 Hai lá tiếp theo: ${previewCards.map((previewCard) => previewCard.nameVi).join(' và ')}.`
          : '🃏 Xấp bài không còn lá nào để xem.'
      );
      logs.unshift({
        id: `log-act-${Date.now()}`,
        timestamp,
        phase: card.rank,
        actorId,
        messageVi: `${actor.name} dùng [${card.nameVi}] xem ngầm 2 lá bài tiếp theo trong xấp bài Ninja.`,
        type: 'ACTION',
      });
      break;
    }

    case 'SPY_CLAN_CHECK': {
      if (target && target.house) {
        const isLotus = target.house.type === 'LOTUS';
        addPrivateNotice(
          `🔎 ${target.name} ${isLotus ? 'THUỘC' : 'KHÔNG THUỘC'} Gia Tộc Hoa Sen.`
        );
        logs.unshift({
          id: `log-act-${Date.now()}`,
          timestamp,
          phase: card.rank,
          actorId,
          targetId: target.id,
          messageVi: `${actor.name} dùng [${card.nameVi}] bí mật dò hỏi ${target.name}.`,
          type: 'ACTION',
        });
      }
      break;
    }

    case 'SWAP_HOUSE': {
      if (target && secondTarget && target.house && secondTarget.house) {
        const temp = target.house;
        nextState.players = nextState.players.map((p) => {
          if (p.id === target.id) return { ...p, house: secondTarget.house };
          if (p.id === secondTarget.id) return { ...p, house: temp };
          return p;
        });

        logs.unshift({
          id: `log-act-${Date.now()}`,
          timestamp,
          phase: card.rank,
          actorId,
          messageVi: `${actor.name} dùng [${card.nameVi}] tráo đổi bí mật Thẻ Gia Tộc giữa ${target.name} và ${secondTarget.name}!`,
          type: 'ACTION',
        });
      }
      break;
    }

    case 'FORCE_REVEAL': {
      if (target) {
        nextState.players = nextState.players.map((p) =>
          p.id === target.id ? { ...p, revealedHouse: true } : p
        );

        logs.unshift({
          id: `log-act-${Date.now()}`,
          timestamp,
          phase: card.rank,
          actorId,
          targetId: target.id,
          messageVi: `${actor.name} dùng [${card.nameVi}] công khai Gia Tộc của ${target.name}: [${target.house?.nameVi}]!`,
          type: 'REVEAL',
        });
      }
      break;
    }

    case 'IRON_GUARD': {
      nextState.players = nextState.players.map((p) =>
        p.id === actorId ? { ...p, isProtected: true } : p
      );

      logs.unshift({
        id: `log-act-${Date.now()}`,
        timestamp,
        phase: card.rank,
        actorId,
        messageVi: `${actor.name} kích hoạt [${card.nameVi}], lập một lá chắn thép vững chắc!`,
        type: 'DEFENSE',
      });
      break;
    }

    case 'SUBSTITUTION': {
      if (target) {
        nextState.players = nextState.players.map((p) =>
          p.id === actorId
            ? { ...p, isProtected: true, substituteTargetId: target.id }
            : p
        );

        logs.unshift({
          id: `log-act-${Date.now()}`,
          timestamp,
          phase: card.rank,
          actorId,
          targetId: target.id,
          messageVi: `${actor.name} dùng [${card.nameVi}], sẵn sàng chuyển dời đòn đánh sang ${target.name}!`,
          type: 'DEFENSE',
        });
      }
      break;
    }

    case 'RETALIATION': {
      nextState.players = nextState.players.map((p) =>
        p.id === actorId ? { ...p, retaliateOnDeath: true } : p
      );

      logs.unshift({
        id: `log-act-${Date.now()}`,
        timestamp,
        phase: card.rank,
        actorId,
        messageVi: `${actor.name} cài bẫy [${card.nameVi}]: Nếu gục ngã sẽ lôi kẻ ám sát chết cùng!`,
        type: 'DEFENSE',
      });
      break;
    }

    case 'ASSASSINATE':
    case 'TWIN_BLADES':
    case 'POISON_SHURIKEN': {
      if (target) {
        nextState = handleKillAttempt(nextState, actor, target, card, logs, timestamp);
      }
      break;
    }

    case 'HONOR_THIEF': {
      if (target && target.honorTokens.length > 0) {
        const stolenToken = target.honorTokens[0];
        nextState.players = nextState.players.map((p) => {
          if (p.id === target.id) {
            return {
              ...p,
              honorTokens: p.honorTokens.slice(1),
              totalScore: p.totalScore - stolenToken.value,
            };
          }
          if (p.id === actorId) {
            return {
              ...p,
              honorTokens: [...p.honorTokens, stolenToken],
              totalScore: p.totalScore + stolenToken.value,
            };
          }
          return p;
        });

        logs.unshift({
          id: `log-act-${Date.now()}`,
          timestamp,
          phase: card.rank,
          actorId,
          targetId: target.id,
          messageVi: `${actor.name} dùng [${card.nameVi}] cướp 1 Thẻ Danh Dự từ ${target.name}!`,
          type: 'HONOR',
        });
      }
      break;
    }
  }

  nextState.actionLogs = logs;
  return processNextExecutionStep(nextState);
}

function handleKillAttempt(
  state: GameState,
  killer: Player,
  victim: Player,
  card: NinjaCard,
  logs: ActionLogEntry[],
  timestamp: string
): GameState {
  let updatedState = { ...state };

  // Check if victim has Iron Guard / Protection / Substitution
  let actualVictim = victim;

  if (victim.substituteTargetId) {
    const subTarget = updatedState.players.find((p) => p.id === victim.substituteTargetId);
    if (subTarget && subTarget.isAlive) {
      logs.unshift({
        id: `log-sub-${Date.now()}`,
        timestamp,
        messageVi: `🛡️ ${victim.name} dùng [Độn Thổ] né đòn! Đòn ám sát của ${killer.name} bị chuyển sang ${subTarget.name}!`,
        type: 'DEFENSE',
      });
      actualVictim = subTarget;
    }
  }

  if (actualVictim.isProtected) {
    logs.unshift({
      id: `log-block-${Date.now()}`,
      timestamp,
      messageVi: `🛡️ ${actualVictim.name} giơ [Khiên Thép] đỡ toàn bộ đòn [${card.nameVi}] từ ${killer.name}! KHÔNG AI BỊ TIÊU DIỆT!`,
      type: 'DEFENSE',
    });
    return updatedState;
  }

  // Otherwise, actualVictim is KILLED!
  updatedState.players = updatedState.players.map((p) => {
    if (p.id === actualVictim.id) {
      return {
        ...p,
        isAlive: false,
        revealedHouse: true, // Reveal house when killed
      };
    }
    if (p.id === killer.id) {
      return {
        ...p,
        killsThisRound: p.killsThisRound + 1,
      };
    }
    return p;
  });

  logs.unshift({
    id: `log-kill-${Date.now()}`,
    timestamp,
    phase: card.rank,
    actorId: killer.id,
    targetId: actualVictim.id,
    messageVi: `🗡️ ${killer.name} xuất chiêu [${card.nameVi}] HẠ GỤC ${actualVictim.name}! Thân phận lộ diện: [${actualVictim.house?.nameVi}].`,
    type: 'KILL',
  });

  // Poison Shuriken bonus token
  if (card.effectType === 'POISON_SHURIKEN' && updatedState.honorDeck.length > 0) {
    const bonusToken = updatedState.honorDeck[0];
    updatedState.honorDeck = updatedState.honorDeck.slice(1);
    updatedState.players = updatedState.players.map((p) =>
      p.id === killer.id
        ? {
            ...p,
            honorTokens: [...p.honorTokens, bonusToken],
            totalScore: p.totalScore + bonusToken.value,
          }
        : p
    );

    logs.unshift({
      id: `log-poison-bonus-${Date.now()}`,
      timestamp,
      messageVi: `🎯 [Phi Tiêu Độc] hạ gục mục tiêu! ${killer.name} nhận thêm 1 Thẻ Danh Dự (+${bonusToken.value} điểm)!`,
      type: 'HONOR',
    });
  }

  // Retaliation trigger
  if (actualVictim.retaliateOnDeath) {
    logs.unshift({
      id: `log-retal-${Date.now()}`,
      timestamp,
      messageVi: `💥 ${actualVictim.name} kích hoạt [Trả Thù] trước khi nhắm mắt! Tiêu diệt kẻ ám sát ${killer.name}!`,
      type: 'KILL',
    });

    updatedState.players = updatedState.players.map((p) =>
      p.id === killer.id
        ? {
            ...p,
            isAlive: false,
            revealedHouse: true,
          }
        : p
    );
  }

  return updatedState;
}

export function evaluateRoundEnd(state: GameState): GameState {
  const survivingPlayers = state.players.filter((p) => p.isAlive);
  let summaryLogs: string[] = [];
  let winningClan: HouseType | 'DRAW' | null = null;

  // Count survivors by Clan
  const lotusSurvivors = survivingPlayers.filter((p) => p.house?.type === 'LOTUS');
  const craneSurvivors = survivingPlayers.filter((p) => p.house?.type === 'CRANE');
  const roninSurvivors = survivingPlayers.filter((p) => p.house?.type === 'RONIN');

  summaryLogs.push(`TỔNG KẾT HIỆP ${state.currentRound}:`);
  summaryLogs.push(`- Hoa Sen còn sống: ${lotusSurvivors.length} người.`);
  summaryLogs.push(`- Chim Hạc còn sống: ${craneSurvivors.length} người.`);
  summaryLogs.push(`- Lãng Khách còn sống: ${roninSurvivors.length} người.`);

  // Determine winning clan
  if (roninSurvivors.length > 0 && lotusSurvivors.length === 0 && craneSurvivors.length === 0) {
    winningClan = 'RONIN';
    summaryLogs.push(`🏆 Lãng Khách Ronin (${roninSurvivors.map((p) => p.name).join(', ')}) là người duy nhất sống sót và GIÀNH CHIẾN THẮNG HIP NÀY!`);
  } else if (lotusSurvivors.length > craneSurvivors.length) {
    winningClan = 'LOTUS';
    summaryLogs.push(`🏆 Gia Tộc Hoa Sen chiến thắng Hiệp ${state.currentRound}!`);
  } else if (craneSurvivors.length > lotusSurvivors.length) {
    winningClan = 'CRANE';
    summaryLogs.push(`🏆 Gia Tộc Chim Hạc chiến thắng Hiệp ${state.currentRound}!`);
  } else if (lotusSurvivors.length > 0 && lotusSurvivors.length === craneSurvivors.length) {
    winningClan = 'DRAW';
    summaryLogs.push(`🤝 Cả hai Gia Tộc Hoa Sen và Chim Hạc đều có số người sống sót bằng nhau!`);
  } else {
    summaryLogs.push(`💀 Không ai sống sót trong đêm hỗn chiến này!`);
  }

  // Distribute Honor Tokens
  let deck = [...state.honorDeck];
  const updatedPlayers = state.players.map((player) => {
    let earnedTokens: typeof deck = [];

    // Surviving members of winning clan get 1 token
    const isSurvivingWinner =
      player.isAlive &&
      ((winningClan === 'LOTUS' && player.house?.type === 'LOTUS') ||
        (winningClan === 'CRANE' && player.house?.type === 'CRANE') ||
        (winningClan === 'DRAW' && (player.house?.type === 'LOTUS' || player.house?.type === 'CRANE')));

    // Ronin sole survivor gets 2 tokens
    const isRoninWinner = winningClan === 'RONIN' && player.isAlive && player.house?.type === 'RONIN';

    let tokenCount = 0;
    if (isRoninWinner) tokenCount = 2;
    else if (isSurvivingWinner) tokenCount = 1;

    for (let i = 0; i < tokenCount; i++) {
      if (deck.length > 0) {
        earnedTokens.push(deck[0]);
        deck = deck.slice(1);
      }
    }

    const newScore = player.totalScore + earnedTokens.reduce((sum, t) => sum + t.value, 0);

    return {
      ...player,
      revealedHouse: true, // Reveal everyone's house at round summary
      honorTokens: [...player.honorTokens, ...earnedTokens],
      totalScore: newScore,
    };
  });

  const isGameOver = state.currentRound >= state.maxRounds;

  const roundEndLog: ActionLogEntry = {
    id: `log-round-end-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('vi-VN'),
    phase: 'ROUND_END',
    messageVi: summaryLogs.join(' '),
    type: 'HONOR',
  };

  return {
    ...state,
    status: isGameOver ? 'GAME_OVER' : 'ROUND_SUMMARY',
    players: updatedPlayers,
    honorDeck: deck,
    roundWinnerClan: winningClan,
    roundSummaryLogs: summaryLogs,
    actionLogs: [roundEndLog, ...state.actionLogs],
  };
}

function chooseBotTarget(bot: Player, card: NinjaCard, state: GameState): Player | undefined {
  const aliveOthers = state.players.filter((p) => p.isAlive && p.id !== bot.id);
  if (aliveOthers.length === 0) return undefined;

  // Bot attempts to target rival clan
  const botClan = bot.house?.type;
  const targetRival = aliveOthers.find((p) => p.house?.type !== botClan);

  return targetRival || aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
}
