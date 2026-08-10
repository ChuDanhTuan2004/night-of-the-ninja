import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MotionConfig } from 'motion/react';
import { Header } from './components/Header';
import { LobbyView } from './components/LobbyView';
import { DraftingView } from './components/DraftingView';
import { ExecutionView } from './components/ExecutionView';
import { RoundSummaryView } from './components/RoundSummaryView';
import { GameRulesModal } from './components/GameRulesModal';
import { GameState, GameMode, Player, ShapeshifterInspection } from './types/game';
import {
  initializeNewGame,
  startRound,
  handleDraftPick,
  executeCardAction,
  inspectShapeshifterTargets,
} from './utils/gameEngine';
import { AVATARS, BOT_NAMES } from './data/cards';

const SESSION_STORAGE_KEY = 'night-of-the-ninja-session-v3';

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
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [privateResult, setPrivateResult] = useState<string | null>(null);
  const lastPrivateResultKey = useRef<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const clearCurrentSession = useCallback((message?: string) => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setGameState(null);
    setMyPlayerId(null);
    setPendingAction(null);
    setActionError(message ?? null);
    setPrivateResult(null);
    lastPrivateResultKey.current = null;
  }, []);

  useEffect(() => {
    try {
      if (!gameState && !myPlayerId) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return;
      }
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ gameState, myPlayerId, gameMode })
      );
    } catch {
      // The game remains usable when storage is unavailable.
    }
  }, [gameState, myPlayerId, gameMode]);

  // Secret card effects must be hard to miss, even if the engine advances phase
  // or opens the round summary immediately after resolving the action.
  useEffect(() => {
    if (!gameState || !myPlayerId) return;
    const notices = gameState.privateNotices?.[myPlayerId] ?? [];
    if (notices.length === 0) return;

    const noticeKey = `${gameState.currentRound}:${notices.join('\u241f')}`;
    if (lastPrivateResultKey.current === noticeKey) return;

    lastPrivateResultKey.current = noticeKey;
    setPrivateResult(notices[0]);
  }, [gameState?.currentRound, gameState?.privateNotices, myPlayerId]);

  // SSE Real-time sync for ONLINE_ROOM
  useEffect(() => {
    if (!gameState || gameState.gameMode !== 'ONLINE_ROOM' || !gameState.roomCode) return;

    const eventSource = new EventSource(
      `/api/rooms/${gameState.roomCode}/stream?playerId=${encodeURIComponent(myPlayerId || '')}`
    );
    let roomWasCancelled = false;

    eventSource.onmessage = (event) => {
      try {
        const updatedRoom: GameState = JSON.parse(event.data);
        setGameState(updatedRoom);
        setActionError(null);
      } catch (err) {
        console.error('SSE JSON error:', err);
      }
    };

    eventSource.addEventListener('room-cancelled', (event) => {
      roomWasCancelled = true;
      eventSource.close();
      try {
        const payload = JSON.parse((event as MessageEvent).data) as { message?: string };
        clearCurrentSession(payload.message || 'Chủ phòng đã hủy phòng.');
      } catch {
        clearCurrentSession('Chủ phòng đã hủy phòng.');
      }
    });

    eventSource.onerror = () => {
      if (roomWasCancelled) return;
      setActionError('Mất kết nối với phòng. Trò chơi đang tự thử kết nối lại…');
    };

    return () => {
      eventSource.close();
    };
  }, [gameState?.roomCode, gameState?.gameMode, myPlayerId, clearCurrentSession]);

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
        unknownCurrentHouse: false,
        isAlive: true,
        draftHand: [],
        selectedCards: [],
        playedCardsThisPhase: [],
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
            unknownCurrentHouse: false,
            isAlive: true,
            draftHand: [],
            selectedCards: [],
            playedCardsThisPhase: [],
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
        unknownCurrentHouse: false,
        isAlive: true,
        draftHand: [],
        selectedCards: [],
        playedCardsThisPhase: [],
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
      setPendingAction(null);
    }
  };

  // Handle Draft Pick Action
  const handlePickCard = async (cardId: string) => {
    if (!gameState || !myPlayerId || pendingAction) return;

    const actorId = myPlayerId;
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

      setPendingAction(null);
    }
  };

  // Handle Execution Action
  const handleExecuteCardAction = async (
    cardId: string,
    targetId?: string,
    secondTargetId?: string,
    decision?: string
  ) => {
    if (!gameState || !myPlayerId || pendingAction) return;

    const actorId = myPlayerId;
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
            decision,
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
        secondTargetId,
        decision
      );
      setGameState(nextState);
      setPendingAction(null);
    }
  };

  const handleInspectShapeshifterTargets = async (
    cardId: string,
    targetId: string,
    secondTargetId: string,
  ): Promise<ShapeshifterInspection> => {
    if (!gameState || !myPlayerId) throw new Error('Phiên chơi không còn hợp lệ.');

    if (gameState.gameMode === 'ONLINE_ROOM') {
      const res = await fetch('/api/rooms/inspect-shapeshifter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: gameState.roomCode,
          playerId: myPlayerId,
          cardId,
          targetId,
          secondTargetId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.inspection) {
        throw new Error(data.error || 'Không thể xem hai Role đã chọn.');
      }
      return data.inspection as ShapeshifterInspection;
    }

    const inspection = inspectShapeshifterTargets(
      gameState,
      myPlayerId,
      cardId,
      targetId,
      secondTargetId,
    );
    if (!inspection) throw new Error('Không thể xem hai Role đã chọn.');
    return inspection;
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
      const nextState = startRound(gameState, gameState.currentRound + 1);
      setGameState(nextState);
    }
  };

  const handleCancelRoom = async () => {
    if (!gameState || !myPlayerId || pendingAction) return;
    const currentPlayer = gameState.players.find((player) => player.id === myPlayerId);
    if (!currentPlayer?.isHost) return;

    const isOnlineRoom = gameState.gameMode === 'ONLINE_ROOM';
    const confirmation = isOnlineRoom
      ? 'Hủy phòng ngay bây giờ? Tất cả người chơi sẽ được đưa về phòng chờ.'
      : 'Kết thúc ván chơi với bot và trở về màn hình chính?';

    const executeCancel = async () => {
      if (!isOnlineRoom) {
        void fetch('/api/rooms/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: gameState.roomCode, playerId: myPlayerId }),
          keepalive: true,
        }).catch(() => {
          // A local bot game also works without the room server.
        });
        clearCurrentSession();
        return;
      }

      setPendingAction('CANCEL_ROOM');
      setActionError(null);
      try {
        const res = await fetch('/api/rooms/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: gameState.roomCode, playerId: myPlayerId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không thể hủy phòng.');
        clearCurrentSession();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Không thể hủy phòng.');
        setPendingAction(null);
      }
    };

    setConfirmDialog({
      message: confirmation,
      onConfirm: () => {
        setConfirmDialog(null);
        void executeCancel();
      },
    });
  };

  const handleReturnLobby = () => {
    const isActiveMatch =
      gameState &&
      gameState.status !== 'LOBBY' &&
      gameState.status !== 'GAME_OVER';

    if (isActiveMatch) {
      setConfirmDialog({
        message: 'Rời trận hiện tại? Tiến trình chưa hoàn tất sẽ bị mất.',
        onConfirm: () => {
          setConfirmDialog(null);
          clearCurrentSession();
        },
      });
      return;
    }

    clearCurrentSession();
  };

  const currentHumanPlayer =
    gameState?.players.find((p) => p.id === myPlayerId) || gameState?.players[0];
  const isCurrentUserHost = Boolean(
    gameState && myPlayerId && gameState.players.some((player) => player.id === myPlayerId && player.isHost)
  );

  return (
    <MotionConfig reducedMotion="user">
    <div className="app-shell">
      {/* Header */}
      <Header
        roomCode={gameState?.roomCode}
        currentRound={gameState?.currentRound}
        onOpenRules={() => setIsRulesOpen(true)}
        onReturnLobby={handleReturnLobby}
        canCancelRoom={isCurrentUserHost}
        isCancellingRoom={pendingAction === 'CANCEL_ROOM'}
        onCancelRoom={handleCancelRoom}
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
            onInspectShapeshifterTargets={handleInspectShapeshifterTargets}
          />
        ) : (
          <RoundSummaryView
            gameState={gameState}
            onNextRound={handleNextRound}
            onReturnLobby={handleReturnLobby}
          />
        )}
      </main>

      {/* Game Rules Modal */}
      <GameRulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {privateResult && (
        <div className="modal-overlay">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="private-result-title"
            className="bottom-sheet max-w-md text-center space-y-5"
          >
            <div className="space-y-2">
              <div className="text-4xl" aria-hidden="true">👁️</div>
              <div className="eyebrow">Chỉ mình bạn thấy thông tin này</div>
              <h2 id="private-result-title" className="phase-title">
                Kết quả bí mật
              </h2>
            </div>

            <div className="status-panel text-base text-white">
              {privateResult}
            </div>

            <button
              type="button"
              autoFocus
              onClick={() => setPrivateResult(null)}
              className="btn btn-primary btn-cta w-full"
            >
              Đã ghi nhớ
            </button>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="modal-overlay">
          <div
            role="dialog"
            aria-modal="true"
            className="bottom-sheet max-w-md text-center space-y-5"
          >
            <div className="space-y-2">
              <div className="text-4xl" aria-hidden="true">⚠️</div>
              <h2 className="phase-title">
                Xác nhận
              </h2>
              <p className="text-secondary text-sm leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="btn btn-secondary w-full"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                }}
                className="btn btn-primary w-full"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </MotionConfig>
  );
}
