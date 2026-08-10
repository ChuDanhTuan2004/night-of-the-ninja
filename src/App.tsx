import React, { useState, useEffect } from 'react';
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

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('SOLO_BOTS');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [showPassCover, setShowPassCover] = useState(false);

  // SSE Real-time sync for ONLINE_ROOM
  useEffect(() => {
    if (!gameState || gameState.gameMode !== 'ONLINE_ROOM' || !gameState.roomCode) return;

    const eventSource = new EventSource(`/api/rooms/${gameState.roomCode}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const updatedRoom: GameState = JSON.parse(event.data);
        setGameState(updatedRoom);
      } catch (err) {
        console.error('SSE JSON error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [gameState?.roomCode, gameState?.gameMode]);

  // Handle Room Creation
  const handleCreateRoom = async (hostName: string, mode: GameMode) => {
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName, mode }),
      });
      const data = await res.json();
      if (data.state) {
        setGameState(data.state);
        setMyPlayerId(data.state.players[0].id);
      }
    } catch (err) {
      // Fallback local engine if API error
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

      const room = initializeNewGame(initialPlayers, mode);
      setGameState(room);
      setMyPlayerId(host.id);
    }
  };

  // Handle Join Room
  const handleJoinRoom = async (roomCode: string, name: string) => {
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerName: name }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setGameState(data.state);
      setMyPlayerId(data.playerId);
    } catch (err) {
      alert('Không thể tham gia phòng! Vui lòng kiểm tra lại mã phòng.');
    }
  };

  // Handle Add AI Bot
  const handleAddBot = async () => {
    if (!gameState) return;
    if (gameState.gameMode === 'ONLINE_ROOM') {
      try {
        const res = await fetch('/api/rooms/add-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: gameState.roomCode }),
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
          body: JSON.stringify({ roomCode: gameState.roomCode, botId }),
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
    if (gameState.gameMode === 'ONLINE_ROOM') {
      try {
        const res = await fetch('/api/rooms/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: gameState.roomCode }),
        });
        const data = await res.json();
        if (data.state) setGameState(data.state);
      } catch (e) {
        console.error(e);
      }
    } else {
      const started = startRound(gameState, 1);
      setGameState(started);
    }
  };

  // Handle Draft Pick Action
  const handlePickCard = async (cardId: string) => {
    if (!gameState || !myPlayerId) return;

    if (gameState.gameMode === 'ONLINE_ROOM') {
      try {
        const res = await fetch('/api/rooms/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: gameState.roomCode,
            actionType: 'DRAFT',
            playerId: myPlayerId,
            cardId,
          }),
        });
        const data = await res.json();
        if (data.state) setGameState(data.state);
      } catch (e) {
        console.error(e);
      }
    } else {
      const nextState = handleDraftPick(gameState, myPlayerId, cardId);
      setGameState(nextState);

      // Handle Pass & Play screen cover if active
      if (gameState.gameMode === 'PASS_AND_PLAY') {
        setShowPassCover(true);
      }
    }
  };

  // Handle Execution Action
  const handleExecuteCardAction = async (
    cardId: string,
    targetId?: string,
    secondTargetId?: string
  ) => {
    if (!gameState || !myPlayerId) return;

    if (gameState.gameMode === 'ONLINE_ROOM') {
      try {
        const res = await fetch('/api/rooms/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: gameState.roomCode,
            actionType: 'EXECUTE_CARD',
            playerId: myPlayerId,
            cardId,
            targetId,
            secondTargetId,
          }),
        });
        const data = await res.json();
        if (data.state) setGameState(data.state);
      } catch (e) {
        console.error(e);
      }
    } else {
      const nextState = executeCardAction(
        gameState,
        myPlayerId,
        cardId,
        targetId,
        secondTargetId
      );
      setGameState(nextState);
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
      } else {
        setGameState({ ...gameState, status: 'GAME_OVER' });
      }
    }
  };

  const currentHumanPlayer =
    gameState?.players.find((p) => p.id === myPlayerId) || gameState?.players[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col justify-between">
      {/* Header */}
      <Header
        roomCode={gameState?.roomCode}
        currentRound={gameState?.currentRound}
        maxRounds={gameState?.maxRounds}
        gameMode={gameState?.gameMode}
        onOpenRules={() => setIsRulesOpen(true)}
        onReturnLobby={() => setGameState(null)}
      />

      {/* Main Game Screen View Routing */}
      <main className="flex-1 container mx-auto px-2 py-4">
        {!gameState || gameState.status === 'LOBBY' ? (
          <LobbyView
            roomCode={gameState?.roomCode}
            gameMode={gameMode}
            players={gameState?.players || []}
            isHost={currentHumanPlayer?.isHost ?? true}
            onSetGameMode={(mode) => setGameMode(mode)}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
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
            onReturnLobby={() => setGameState(null)}
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
  );
}
