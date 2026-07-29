import { useBrain } from '../store';
import type { BrainEvent } from '../types';

let socket: WebSocket | null = null;
let retryDelay = 500;

function wsUrl(): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws`;
}

/** Connects (and auto-reconnects) the brain WebSocket, feeding events into the store. */
export function connectBrain() {
  const ws = new WebSocket(wsUrl());
  socket = ws;

  ws.onopen = () => {
    retryDelay = 500;
    useBrain.getState().setConnected(true);
  };
  ws.onmessage = (ev) => {
    try {
      const event = JSON.parse(ev.data) as BrainEvent;
      useBrain.getState().handleEvent(event);
    } catch {
      // ignore malformed frames
    }
  };
  ws.onclose = () => {
    useBrain.getState().setConnected(false);
    setTimeout(connectBrain, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 8000);
  };
  ws.onerror = () => ws.close();
}

export function think(prompt: string) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'think', prompt }));
  }
}

/** Clears the server-side conversational context (multi-turn history). */
export function newThread() {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'new_session' }));
    useBrain.getState().resetConversation();
  }
}

export async function fetchMemories() {
  try {
    const res = await fetch('/api/memory');
    if (res.ok) useBrain.getState().setMemories(await res.json());
  } catch {
    // server not up yet — the WS reconnect loop will bring things back
  }
}

export async function clearMemories() {
  await fetch('/api/memory', { method: 'DELETE' });
  useBrain.getState().setMemories([]);
}
