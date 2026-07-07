import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { BrainEngine } from './engine.js';
import { MODULES } from './modules.js';
import type { BrainEvent, ClientMessage } from './types.js';

const PORT = Number(process.env.PORT ?? 8787);
const MODEL = process.env.BRAIN_MODEL ?? 'claude-opus-4-8';
const MEMORY_FILE = process.env.MEMORY_FILE ?? './data/memory.json';

const engine = new BrainEngine({
  apiKey: process.env.ANTHROPIC_API_KEY || undefined,
  model: MODEL,
  memoryFile: MEMORY_FILE,
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: engine.mode, model: MODEL });
});
app.get('/api/modules', (_req, res) => res.json(MODULES));
app.get('/api/memory', (_req, res) => res.json(engine.memory.all()));
app.delete('/api/memory', (_req, res) => {
  engine.memory.clear();
  res.json({ ok: true });
});
app.get('/api/agents/log', (_req, res) => res.json(engine.bus.history()));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  const send = (e: BrainEvent) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(e));
  };
  send({ type: 'hello', mode: engine.mode, model: MODEL });

  let session: AbortController | null = null;

  ws.on('message', async (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return send({ type: 'error', message: 'Invalid JSON message' });
    }

    if (msg.type === 'clear_memory') {
      engine.memory.clear();
      return;
    }

    if (msg.type === 'think') {
      const prompt = (msg.prompt ?? '').trim();
      if (!prompt) return send({ type: 'error', message: 'Empty prompt' });
      if (session) session.abort(); // one live session per socket
      session = new AbortController();
      await engine.think(prompt, send, session.signal);
      session = null;
    }
  });

  ws.on('close', () => session?.abort());
});

server.listen(PORT, () => {
  console.log(`🧠 neural-brain server on http://localhost:${PORT}`);
  console.log(`   mode: ${engine.mode}${engine.mode === 'simulation' ? ' (set ANTHROPIC_API_KEY in server/.env for live Claude reasoning)' : ` · model: ${MODEL}`}`);
});
