import React, { useState, useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { Header } from './components/Header';
import { LobbyView } from './components/LobbyView';
import { DraftingView } from './components/DraftingView';
import { ExecutionView } from './components/ExecutionView';
import { RoundSummaryView } from './components/RoundSummaryView';
import { PassAndPlayCover } from './components/PassAndPlayCover';
import { GameRulesModal } from './components/GameRulesModal';
import { GameState, GameMode, Player } from './types/game';
import {
  initializeNewGame,
  startRound,
  handleDraftPick,
  executeCardAction,
} from './utils/gameEngine';
import { AVATARS, BOT_NAMES } from './data/cards';

const SESSION_STORAGE_KEY = 'night-of-the-ninja-session-v1';

interface PersistedSession {
  gameState: GameState | null;
  myPlayerId: string | null;
  gameMode: GameMode;
}

function loadPersistedSession(): PersistedSession | null {
  try {
    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
    return rawSession ? (JSON.parse(rawSession) as PersistedSession) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [initialSession] = useState(loadPersistedSession);
  const [gameState, setGameState] = useState<GameState | null>(
    initialSession?.gameState ?? null
  );
  const [myPlayerId, setMyPlayerId] = useState<string | null>(
    initialSession?.myPlayerId ?? null
  );
  const [gameMode, setGameMode] = useState<GameMode>(
    initialSession?.gameMode ?? 'SOLO_BOTS'
  );
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [showPassCover, setShowPassCover] = useState(
    initialSession?.gameState?.gameMode === 'PASS_AND_PLAY' &&
      initialSession.gameState.status !== 'LOBBY' &&
      initialSession.gameState.status !== 'ROUND_SUMMARY' &&
      initialSession.gameState.status !== 'GAME_OVER'
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ gameState, myPlayerId, gameMode })
      );
    } catch {
      // The game remains usable when storage is unavailable.
    }
  }, [gameState, myPlayerId, gameMode]);

  // SSE Real-time sync for ONLINE_ROOM
  useEffect(() => {
    if (!gameState || gameState.gameMode !== 'ONLINE_ROOM' || !gameState.roomCode) return;

    const eventSource = new EventSource(
      `/api/rooms/${gameState.roomCode}/stream?playerId=${encodeURIComponent(myPlayerId || '')}`
    );

    eventSource.onmessage = (event) => {
      try {
        const updatedRoom: GameState = JSON.parse(event.data);
        setGameState(updatedRoom);
        setActionError(null);
      } catch (err) {
        console.error('SSE JSON error:', err);
      }
    };

    eventSource.onerror = () => {
      setActionError('Mất kết nối với phòng. Trò chơi đang tự thử kết nối lại…');
    };

    return () => {
      eventSource.close();
    };
  }, [gameState?.roomCode, gameState?.gameMode, myPlayerId]);

  // Handle Room Creation
  const handleCreateRoom = async (hostName: string, mode: GameMode) => {
    setPendingAction('CREATE');
    setActionError(null);
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể tạo phòng.');
      if (data.state) {
        setGameState(data.state);
        setMyPlayerId(data.state.players[0].id);
        setGameMode(mode);
      }
    } catch (err) {
      if (mode === 'ONLINE_ROOM') {
        setActionError(
          err instanceof Error ? err.message : 'Không thể tạo phòng trực tuyến.'
        );
        return;
      }

      // Local modes can continue without the room server.
      const host: Player = {
        id: `host-${Date.now()}`,
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

      const initialPlayers = [host];
      if (mode === 'SOLO_BOTS') {
        for (let i = 0; i < 4; i++) {
          initialPlayers.push({
            id: `bot-${i}-${Date.now()}`,
            name: BOT_NAMES[i],
            avatar: AVATARS[i + 1],
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

      let room = initializeNewGame(initialPlayers, mode);
      if (mode === 'SOLO_BOTS') room = startRound(room, 1);
      setGameState(room);
      setMyPlayerId(host.id);
      setGameMode(mode);
    } finally {
      setPendingAction(null);
    }
  };

  // Handle Join Room
  const handleJoinRoom = async (roomCode: string, name: string) => {
    setPendingAction('JOIN');
    setActionError(null);
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerName: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể tham gia phòng.');
      setGameState(data.state);
      setMyPlayerId(data.playerId);
      setGameMode(data.state.gameMode);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Không thể tham gia phòng. Vui lòng kiểm tra lại mã phòng.'
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleAddLocalPlayer = (playerName: string) => {
    if (!gameState || gameState.gameMode !== 'PASS_AND_PLAY') return;
    const trimmedName = playerName.trim();
    if (!trimmedName || gameState.players.length >= 11) return;

    const newPlayer: Player = {
      id: `player-local-${Date.now()}`,
      name: trimmedName,
      avatar: AVATARS[gameState.players.length % AVATARS.length],
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

    setGameState({ ...gameState, players: [...gameState.players, newPlayer] });
  };

  // Handle Add AI Bot
  const handleAddBot = async () => {
    if (!gameState) return;
    if (gameState.gameMode === 'ONLINE_ROOM') {
      try {
        const res = await fetch('/api/rooms/add-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: gameState.roomCode, playerId: myPlayerId }),
        });
        const data = await res.json();
        if (data.state) setGameState(data.state);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Local mode add bot
      const botIdx = gameState.players.filter((p) => p.isBot).length;
      const newBot: Player = {
        id: `bot-${Date.now()}`,
        name: BOT_NAMES[botIdx % BOT_NAMES.length],
        avatar: AVATARS[(gameState.players.length + 1) % AVATARS.length],
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
      setGameState({
        ...gameState,
        players: [...gameState.players, newBot],
      });
    }
  };

  // Handle Remove Bot
  const handleRemoveBot = async (botId: string) => {
    if (!gameState) return;
    if (gameState.gameMode === 'ONLINE_ROOM') {
      try {
        const res = await fetch('/api/rooms/remove-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: gameState.roomCode, botId, playerId: myPlayerId }),
        });
        const data = await res.json();
        if (data.state) setGameState(data.state);
      } catch (e) {
        console.error(e);
      }
    } else {
      setGameState({
        ...gameState,
        players: gameState.players.filter((p) => p.id !== botId),
      });
    }
  };

  // Handle Start Match
  const handleStartGame = async () => {
    if (!gameState) return;
    setPendingAction('START');
    setActionError(null);
    if (gameState.gameMode === 'ONLINE_ROOM') {
      try {
        const res = await fetch('/api/rooms/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: gameState.roomCode, playerId: myPlayerId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không thể bắt đầu trận đấu.');
        if (data.state) setGameState(data.state);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : 'Không thể bắt đầu trận đấu.'
        );
      } finally {
        setPendingAction(null);
      }
    } else {
      const started = startRound(gameState, 1);
      setGameState(started);
      if (gameState.gameMode === 'PASS_AND_PLAY') setShowPassCover(true);
      setPendingAction(null);
    }
  };

  // Handle Draft Pick Action
  const handlePickCard = async (cardId: string) => {
    if (!gameState || !myPlayerId || pendingAction) return;

    const actorId =
      gameState.gameMode === 'PASS_AND_PLAY'
        ? gameState.passAndPlayCurrentPlayerId
        : myPlayerId;
    if (!actorId) return;
    setPendingAction('PICK');

    if (gameState.gameMode === 'ONLINE_ROOM') {
      try {
        const res = await fetch('/api/rooms/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: gameState.roomCode,
            actionType: 'DRAFT',
            playerId: actorId,
            cardId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không thể chọn lá bài.');
        if (data.state) setGameState(data.state);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Không thể chọn lá bài.');
      } finally {
        setPendingAction(null);
      }
    } else {
      const nextState = handleDraftPick(gameState, actorId, cardId);
      setGameState(nextState);

      // Handle Pass & Play screen cover if active
      if (gameState.gameMode === 'PASS_AND_PLAY') {
        setShowPassCover(true);
      }
      setPendingAction(null);
    }
  };

  // Handle Execution Action
  const handleExecuteCardAction = async (
    cardId: string,
    targetId?: string,
    secondTargetId?: string
  ) => {
    if (!gameState || !myPlayerId || pendingAction) return;

    const actorId =
      gameState.gameMode === 'PASS_AND_PLAY'
        ? gameState.passAndPlayCurrentPlayerId
        : myPlayerId;
    if (!actorId) return;
    setPendingAction('EXECUTE');

    if (gameState.gameMode === 'ONLINE_ROOM') {
      try {
        const res = await fetch('/api/rooms/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: gameState.roomCode,
            actionType: 'EXECUTE_CARD',
            playerId: actorId,
            cardId,
            targetId,
            secondTargetId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không thể thực hiện kỹ năng.');
        if (data.state) setGameState(data.state);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : 'Không thể thực hiện kỹ năng.'
        );
      } finally {
        setPendingAction(null);
      }
    } else {
      const nextState = executeCardAction(
        gameState,
        actorId,
        cardId,
        targetId,
        secondTargetId
      );
      setGameState(nextState);
      if (
        gameState.gameMode === 'PASS_AND_PLAY' &&
        nextState.status === 'EXECUTION' &&
        nextState.passAndPlayCurrentPlayerId !== actorId
      ) {
        setShowPassCover(true);
      }
      setPendingAction(null);
    }
  };

  // Handle Next Round
  const handleNextRound = async () => {
    if (!gameState) return;

    if (gameState.gameMode === 'ONLINE_ROOM') {
      try {
        const res = await fetch('/api/rooms/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: gameState.roomCode,
            actionType: 'NEXT_ROUND',
            playerId: myPlayerId,
          }),
        });
        const data = await res.json();
        if (data.state) setGameState(data.state);
      } catch (e) {
        console.error(e);
      }
    } else {
      if (gameState.currentRound < gameState.maxRounds) {
        const nextState = startRound(gameState, gameState.currentRound + 1);
        setGameState(nextState);
        if (gameState.gameMode === 'PASS_AND_PLAY') setShowPassCover(true);
      } else {
        setGameState({ ...gameState, status: 'GAME_OVER' });
      }
    }
  };

  const handleReturnLobby = () => {
    const isActiveMatch =
      gameState &&
      gameState.status !== 'LOBBY' &&
      gameState.status !== 'GAME_OVER';

    if (
      isActiveMatch &&
      !window.confirm('Rời trận hiện tại? Tiến trình chưa hoàn tất sẽ bị mất.')
    ) {
      return;
    }

    localStorage.removeItem(SESSION_STORAGE_KEY);
    setGameState(null);
    setMyPlayerId(null);
    setShowPassCover(false);
    setActionError(null);
  };

  const activePlayerId =
    gameState?.gameMode === 'PASS_AND_PLAY'
      ? gameState.passAndPlayCurrentPlayerId
      : myPlayerId;
  const currentHumanPlayer =
    gameState?.players.find((p) => p.id === activePlayerId) || gameState?.players[0];

  return (
    <MotionConfig reducedMotion="user">
    <div className="app-shell">
      {/* Header */}
      <Header
        roomCode={gameState?.roomCode}
        currentRound={gameState?.currentRound}
        maxRounds={gameState?.maxRounds}
        gameMode={gameState?.gameMode}
        onOpenRules={() => setIsRulesOpen(true)}
        onReturnLobby={handleReturnLobby}
      />

      {/* Main Game Screen View Routing */}
      <main className="game-main">
        {actionError ? (
          <div role="alert" className="toast toast-error">
            {actionError}
          </div>
        ) : null}
        {!gameState || gameState.status === 'LOBBY' ? (
          <LobbyView
            roomCode={gameState?.roomCode}
            gameMode={gameState?.gameMode ?? gameMode}
            players={gameState?.players || []}
            isHost={currentHumanPlayer?.isHost ?? true}
            isBusy={pendingAction !== null}
            onSetGameMode={(mode) => setGameMode(mode)}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onAddLocalPlayer={handleAddLocalPlayer}
            onAddBot={handleAddBot}
            onRemoveBot={handleRemoveBot}
            onStartGame={handleStartGame}
          />
        ) : gameState.status === 'DRAFTING' ? (
          <DraftingView
            gameState={gameState}
            currentPlayer={currentHumanPlayer!}
            onPickCard={handlePickCard}
          />
        ) : gameState.status === 'EXECUTION' ? (
          <ExecutionView
            gameState={gameState}
            currentPlayer={currentHumanPlayer!}
            onExecuteCardAction={handleExecuteCardAction}
          />
        ) : (
          <RoundSummaryView
            gameState={gameState}
            onNextRound={handleNextRound}
            onReturnLobby={handleReturnLobby}
          />
        )}
      </main>

      {/* Pass and Play Screen Cover */}
      {showPassCover && currentHumanPlayer && (
        <PassAndPlayCover
          currentPlayer={currentHumanPlayer}
          onReveal={() => setShowPassCover(false)}
        />
      )}

      {/* Game Rules Modal */}
      <GameRulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
    </MotionConfig>
  );
}
