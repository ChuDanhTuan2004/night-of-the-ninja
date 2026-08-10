import { GameState } from '../src/types/game';

async function runTest() {
  const serverUrl = 'http://localhost:3003';
  
  console.log('1. Creating room...');
  const createRes = await fetch(`${serverUrl}/api/rooms/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostName: 'HostPlayer', mode: 'ONLINE_ROOM' }),
  });
  
  if (!createRes.ok) {
    throw new Error(`Failed to create room: ${await createRes.text()}`);
  }
  
  const createData = (await createRes.json()) as { roomCode: string; state: GameState };
  const roomCode = createData.roomCode;
  const hostPlayerId = createData.state.players[0].id;
  console.log(`Room created successfully. Code: ${roomCode}, Host Player ID: ${hostPlayerId}`);

  console.log('2. Joining as second player...');
  const joinRes = await fetch(`${serverUrl}/api/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode, playerName: 'GuestPlayer' }),
  });

  if (!joinRes.ok) {
    throw new Error(`Failed to join room: ${await joinRes.text()}`);
  }

  const joinData = (await joinRes.json()) as { playerId: string; state: GameState };
  const guestPlayerId = joinData.playerId;
  console.log(`Guest joined successfully. Guest Player ID: ${guestPlayerId}`);

  console.log('3. Connecting guest to SSE stream...');
  const controller = new AbortController();
  const sseUrl = `${serverUrl}/api/rooms/${roomCode}/stream?playerId=${encodeURIComponent(guestPlayerId)}`;
  
  const ssePromise = new Promise<void>((resolve, reject) => {
    fetch(sseUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.body) {
          reject(new Error('No response body for SSE stream'));
          return;
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              console.log('SSE connection closed by server.');
              resolve();
              break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('event: kicked')) {
                console.log('🎉 SUCCESS: Received event "kicked" from server!');
                resolve();
                return;
              }
            }
          }
        } catch (err) {
          reject(err);
        }
      })
      .catch(reject);
  });

  // Wait a moment for SSE connection to establish on the server
  await new Promise((r) => setTimeout(r, 1000));

  console.log('4. Host kicking guest...');
  const kickRes = await fetch(`${serverUrl}/api/rooms/kick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode, playerId: hostPlayerId, targetPlayerId: guestPlayerId }),
  });

  if (!kickRes.ok) {
    throw new Error(`Failed to kick player: ${await kickRes.text()}`);
  }

  const kickData = (await kickRes.json()) as { state: GameState };
  console.log('Host kick API call completed successfully.');
  
  const guestStillInRoom = kickData.state.players.some((p) => p.id === guestPlayerId);
  if (guestStillInRoom) {
    throw new Error('Verification failed: Guest player is still in the room players list!');
  }
  console.log('Verification success: Guest player is no longer in the room players list.');

  console.log('5. Waiting for guest SSE to receive kicked event...');
  await Promise.race([
    ssePromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: guest did not receive kicked event')), 3000)),
  ]);

  controller.abort();
  console.log('All tests passed successfully!');
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
