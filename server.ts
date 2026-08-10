import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GameState, Player, GameMode } from './src/types/game';
import {
  initializeNewGame,
  startRound,
  handleDraftPick,
  executeCardAction,
  evaluateRoundEnd,
} from './src/utils/gameEngine';
import { BOT_NAMES, AVATARS } from './src/data/cards';

const app = express();
const PORT = Number(process.env.PORT) || 3003;

app.use(express.json());

// In-memory room store
const rooms = new Map<string, GameState>();
interface SseClient {
  response: express.Response;
  playerId?: string;
}
const sseClients = new Map<string, Set<SseClient>>();

function getStateForPlayer(room: GameState, playerId?: string): GameState {
  return {
    ...room,
    privateNotices: playerId
      ? { [playerId]: room.privateNotices?.[playerId] || [] }
      : {},
  };
}

function broadcastRoomUpdate(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const clients = sseClients.get(roomCode);
  if (clients) {
    for (const client of clients) {
      const data = `data: ${JSON.stringify(getStateForPlayer(room, client.playerId))}\n\n`;
      try {
        client.response.write(data);
      } catch (e) {
        // Handle broken pipe
      }
    }
  }
}

// --- API ENDPOINTS ---

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create Room
app.post('/api/rooms/create', (req, res) => {
  const { hostName, mode } = req.body as { hostName: string; mode: GameMode };
  if (mode !== 'SOLO_BOTS' && mode !== 'ONLINE_ROOM') {
    return res.status(400).json({ error: 'Chế độ chơi không hợp lệ.' });
  }
  const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();

  const hostPlayer: Player = {
    id: `player-host-${Date.now()}`,
    name: hostName || 'Trưởng Môn',
    avatar: '🥷',
    isBot: false,
    isHost: true,
    isReady: true,
    house: null,
    revealedHouse: false,
    isAlive: true,
    draftHand: [],
    selectedCards: [],
    playedCardsThisPhase: [],
    isProtected: false,
    retaliateOnDeath: false,
    honorTokens: [],
    totalScore: 0,
    killsThisRound: 0,
  };

  const initialPlayers = [hostPlayer];

  // If SOLO_BOTS mode, automatically pre-add 4 Bots (total 5 players)
  if (mode === 'SOLO_BOTS') {
    for (let i = 0; i < 4; i++) {
      const botName = BOT_NAMES[i % BOT_NAMES.length];
      const botAvatar = AVATARS[(i + 1) % AVATARS.length];
      initialPlayers.push({
        id: `bot-${i}-${Date.now()}`,
        name: botName,
        avatar: botAvatar,
        isBot: true,
        isHost: false,
        isReady: true,
        house: null,
        revealedHouse: false,
        isAlive: true,
        draftHand: [],
        selectedCards: [],
        playedCardsThisPhase: [],
        isProtected: false,
        retaliateOnDeath: false,
        honorTokens: [],
        totalScore: 0,
        killsThisRound: 0,
      });
    }
  }

  let room = initializeNewGame(initialPlayers, mode || 'ONLINE_ROOM');
  if (mode === 'SOLO_BOTS') {
    room = startRound(room, 1);
  }
  room.roomCode = roomCode;
  rooms.set(roomCode, room);

  res.json({ roomCode, state: getStateForPlayer(room, hostPlayer.id) });
});

// Join Room
app.post('/api/rooms/join', (req, res) => {
  const { roomCode, playerName } = req.body as { roomCode: string; playerName: string };
  const code = roomCode?.toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Không tìm thấy phòng chơi này!' });
  }

  if (room.status !== 'LOBBY') {
    return res.status(400).json({ error: 'Trận đấu trong phòng này đã bắt đầu!' });
  }

  if (room.players.length >= 11) {
    return res.status(400).json({ error: 'Phòng chơi đã đủ số lượng tối đa (11 người)!' });
  }

  const newPlayer: Player = {
    id: `player-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    name: playerName || `Ninja ${room.players.length + 1}`,
    avatar: AVATARS[room.players.length % AVATARS.length],
    isBot: false,
    isHost: false,
    isReady: true,
    house: null,
    revealedHouse: false,
    isAlive: true,
    draftHand: [],
    selectedCards: [],
    playedCardsThisPhase: [],
    isProtected: false,
    retaliateOnDeath: false,
    honorTokens: [],
    totalScore: 0,
    killsThisRound: 0,
  };

  room.players.push(newPlayer);
  rooms.set(code, room);
  broadcastRoomUpdate(code);

  res.json({ playerId: newPlayer.id, state: getStateForPlayer(room, newPlayer.id) });
});

// Add Bot to Room
app.post('/api/rooms/add-bot', (req, res) => {
  const { roomCode, playerId } = req.body as { roomCode: string; playerId?: string };
  const code = roomCode?.toUpperCase();
  const room = rooms.get(code);

  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });
  if (room.players.length >= 11) return res.status(400).json({ error: 'Phòng đã đầy (tối đa 11)' });

  const existingBots = room.players.filter((p) => p.isBot).length;
  const botName = BOT_NAMES[existingBots % BOT_NAMES.length];
  const botAvatar = AVATARS[(room.players.length + 2) % AVATARS.length];

  const botPlayer: Player = {
    id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    name: botName,
    avatar: botAvatar,
    isBot: true,
    isHost: false,
    isReady: true,
    house: null,
    revealedHouse: false,
    isAlive: true,
    draftHand: [],
    selectedCards: [],
    playedCardsThisPhase: [],
    isProtected: false,
    retaliateOnDeath: false,
    honorTokens: [],
    totalScore: 0,
    killsThisRound: 0,
  };

  room.players.push(botPlayer);
  rooms.set(code, room);
  broadcastRoomUpdate(code);

  res.json({ state: getStateForPlayer(room, playerId) });
});

// Remove Bot
app.post('/api/rooms/remove-bot', (req, res) => {
  const { roomCode, botId, playerId } = req.body as { roomCode: string; botId: string; playerId?: string };
  const code = roomCode?.toUpperCase();
  const room = rooms.get(code);

  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });

  room.players = room.players.filter((p) => !(p.isBot && p.id === botId));
  rooms.set(code, room);
  broadcastRoomUpdate(code);

  res.json({ state: getStateForPlayer(room, playerId) });
});

// Start Game
app.post('/api/rooms/start', (req, res) => {
  const { roomCode, playerId } = req.body as { roomCode: string; playerId?: string };
  const code = roomCode?.toUpperCase();
  const room = rooms.get(code);

  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });
  if (room.players.length < 4) {
    return res.status(400).json({ error: 'Cần ít nhất 4 người chơi (hoặc thêm AI Bot) để bắt đầu!' });
  }

  const startedState = startRound(room, 1);
  rooms.set(code, startedState);
  broadcastRoomUpdate(code);

  res.json({ state: getStateForPlayer(startedState, playerId) });
});

// Game Action
app.post('/api/rooms/action', (req, res) => {
  const { roomCode, actionType, playerId, cardId, targetId, secondTargetId } = req.body as {
    roomCode: string;
    actionType: 'DRAFT' | 'EXECUTE_CARD' | 'NEXT_ROUND';
    playerId: string;
    cardId?: string;
    targetId?: string;
    secondTargetId?: string;
  };

  const code = roomCode?.toUpperCase();
  let room = rooms.get(code);

  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });

  if (actionType === 'DRAFT' && cardId) {
    room = handleDraftPick(room, playerId, cardId);
  } else if (actionType === 'EXECUTE_CARD' && cardId) {
    room = executeCardAction(room, playerId, cardId, targetId, secondTargetId);
  } else if (actionType === 'NEXT_ROUND') {
    if (room.currentRound < room.maxRounds) {
      room = startRound(room, room.currentRound + 1);
    } else {
      room.status = 'GAME_OVER';
    }
  }

  rooms.set(code, room);
  broadcastRoomUpdate(code);

  res.json({ state: getStateForPlayer(room, playerId) });
});

// Get Room State
app.get('/api/rooms/:code/state', (req, res) => {
  const code = req.params.code?.toUpperCase();
  const playerId = typeof req.query.playerId === 'string' ? req.query.playerId : undefined;
  const room = rooms.get(code);
  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });
  res.json({ state: getStateForPlayer(room, playerId) });
});

// SSE Live Stream
app.get('/api/rooms/:code/stream', (req, res) => {
  const code = req.params.code?.toUpperCase();
  const playerId = typeof req.query.playerId === 'string' ? req.query.playerId : undefined;
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).send('Room not found');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!sseClients.has(code)) {
    sseClients.set(code, new Set());
  }
  const client: SseClient = { response: res, playerId };
  sseClients.get(code)!.add(client);

  // Send initial state immediately
  res.write(`data: ${JSON.stringify(getStateForPlayer(room, playerId))}\n\n`);

  req.on('close', () => {
    const clients = sseClients.get(code);
    if (clients) {
      clients.delete(client);
      if (clients.size === 0) {
        sseClients.delete(code);
      }
    }
  });
});

// --- SERVER & VITE SETUP ---
async function main() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Night of the Ninja server listening at http://localhost:${PORT}`);
  });
}

main();
