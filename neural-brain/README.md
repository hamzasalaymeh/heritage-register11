# 🧠 Neural Brain — AI Cognitive Neural Network

A living-brain visualization of AI reasoning. Every request flows through ten cognitive
modules — **Logic, Planning, Memory, Creativity, Goals, Risk, Engineering, Finance,
Health, Learning** — and every reasoning step fires real neurons on screen, in real time.

The **Claude API** powers the reasoning engine; the UI renders **~270 animated
neurons** connected by glowing synapses, with live thought streaming, decision
confidence, an activation heatmap, agent-to-agent hand-offs, and long-term memory
that persists across restarts.

```
you type a prompt ──▶ Claude reasons in tagged cognitive steps ──▶ each step
fires a module's neurons ──▶ hand-offs pulse between modules ──▶ a lesson is
written to long-term memory ──▶ the final answer streams in with a confidence score
```

## Feature map

| Requirement | Where it lives |
|---|---|
| Hundreds of animated nodes + glowing edges | `client/src/lib/brain.ts`, `NeuralCanvas`, `NeuronNode`, `SignalEdge` (React Flow) |
| Real-time neuron activation per reasoning step | `server/src/parser.ts` → WebSocket → `client/src/store.ts` |
| Claude-powered reasoning engine | `server/src/engine.ts` (streams `claude-opus-4-8`) |
| Long-term / persistent memory | `server/src/memory.ts` + `embedding.ts` (vector recall via cosine similarity + Hebbian reinforcement) |
| Multi-turn conversations | per-connection history in `server/src/index.ts` → Claude context; “new thread” button in the UI |
| 10 cognitive modules | `server/src/modules.ts`, `client/src/lib/brain.ts` |
| Agent-to-agent communication | `server/src/agents.ts` → `AgentComms` panel + edge pulses |
| Decision confidence | per-step `confidence` attr + `ConfidenceGauge` |
| Activation heatmap | `client/src/components/Heatmap.tsx` (D3, sequential ramp) |
| Neural signal animations | `SignalEdge` (traveling light packets), Framer Motion glows |
| Expandable layers | click any module hub to collapse/expand its neuron layer |
| Real-time streaming | WebSocket protocol, token-level updates |
| 3D ambience | `ThreeBackground` (Three.js additive particle field) |

## Tech stack

**Client** — React 18 · TypeScript · Vite · React Flow (neural graph) · Framer Motion
(node/panel animation) · D3 (heatmap) · Three.js (particle background) · Zustand (state)

**Server** — Node.js · TypeScript · Express · `ws` · `@anthropic-ai/sdk`

## Quick start

**Prerequisites:** Node.js ≥ 20 and npm.

```bash
# 1. Install everything (root + server + client)
cd neural-brain
npm run setup

# 2. Configure the reasoning engine
cp server/.env.example server/.env
#    → edit server/.env and set ANTHROPIC_API_KEY=sk-ant-...
#    (skip this step to run in offline SIMULATION mode — the brain still animates)

# 3. Launch both server and client
npm run dev
```

Open **http://localhost:5173**, type a prompt in the command bar, and watch the
brain think.

| Script | What it does |
|---|---|
| `npm run setup` | installs root, server, and client dependencies |
| `npm run dev` | runs server (`:8787`) + client (`:5173`) together |
| `npm run build` | production build of both (server → `dist/`, client → `dist/`) |
| `npm run start` | runs the compiled server |
| `npm run typecheck` | strict TypeScript check of both packages |

### Step-by-step (manual) setup

```bash
cd neural-brain/server
npm install
cp .env.example .env          # add your ANTHROPIC_API_KEY
npm run dev                   # → http://localhost:8787

# in a second terminal
cd neural-brain/client
npm install
npm run dev                   # → http://localhost:5173 (proxies /ws and /api)
```

## Configuration (`server/.env`)

| Variable | Default | Meaning |
|---|---|---|
| `ANTHROPIC_API_KEY` | *(empty)* | Claude API key. Empty ⇒ offline simulation mode. |
| `BRAIN_MODEL` | `claude-opus-4-8` | Model behind the reasoning engine. |
| `PORT` | `8787` | Server port. |
| `MEMORY_FILE` | `./data/memory.json` | Long-term memory location. |

> The engine streams with `client.messages.stream(...)`. Extended thinking is
> deliberately left off: the reasoning is externalized in the visible step protocol,
> and skipping the thinking phase keeps first-token latency low so the brain lights
> up immediately.

## How it works

1. **Prompt → recall.** The server embeds the prompt (local hashed n-gram vectors),
   ranks long-term memories by cosine similarity × reinforcement strength × recency,
   and injects the best matches into Claude's context. Recalled memories glow green in
   the Memory panel and fire the Memory cortex.
2. **Streamed reasoning.** A system prompt makes Claude emit its reasoning as a
   protocol of tagged steps —
   `<step module="logic" confidence="0.85" to="planning,risk">…</step>` — which an
   incremental parser converts into `step_start` / `step_token` / `step_end` events
   *while the tokens are still streaming*.
3. **Neural activation.** Each event fires the module's hub and a stochastic subset of
   its neurons; activations decay at ~10 Hz, producing organic rise-and-fade dynamics.
4. **Agent hand-offs.** A step's `to="…"` targets become directed messages on the agent
   bus; the UI pulses a traveling light packet between the two module hubs and logs the
   hand-off in the Agent Communications feed.
5. **Synthesis + learning.** The `<answer confidence="…">` streams into the Thought
   Stream and drives the confidence gauge. The final Learning step's `REMEMBER:` lesson
   is persisted to disk — the brain genuinely knows more next session.
6. **Multi-turn context.** Each WebSocket connection keeps a conversation thread (last
   8 turns) that is replayed to Claude, so follow-up questions work naturally. The
   **⟲ NEW THREAD** button clears short-term context (long-term memory is kept).

Full details, wire protocol, and design decisions: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.
Production deployment (Render / Railway / Docker): **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

## Simulation mode

No API key? The server swaps in an offline simulator (`server/src/simulator.ts`) that
emits the exact same event protocol with plausible module paths and canned reasoning —
ideal for demos and UI development. The status bar shows `◌ SIMULATION MODE`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Status bar shows `LINK DOWN` | The server isn't running — start `npm --prefix server run dev` (the client auto-reconnects). |
| `SIMULATION MODE` when you expected Claude | `ANTHROPIC_API_KEY` isn't set in `server/.env`; restart the server after adding it. |
| `401 authentication_error` in the Thought Stream | Invalid/revoked API key. |
| `429 rate_limit_error` | You're rate-limited — wait and retry; the error is surfaced in the Thought Stream. |
| Port conflict on 8787/5173 | Change `PORT` in `server/.env` and the proxy targets in `client/vite.config.ts`. |
| Sluggish animation | Collapse a few module layers (click their hubs) or close other GPU-heavy tabs. |

## Project structure

```
neural-brain/
├── package.json               # workspace scripts (setup / dev / build)
├── server/
│   ├── src/
│   │   ├── index.ts           # Express + WebSocket entry
│   │   ├── engine.ts          # reasoning engine (Claude stream / simulator)
│   │   ├── parser.ts          # incremental <step>/<answer> stream parser
│   │   ├── prompt.ts          # system prompt + memory-grounded user message
│   │   ├── memory.ts          # persistent long-term memory store
│   │   ├── agents.ts          # agent-to-agent message bus
│   │   ├── simulator.ts       # offline fallback engine
│   │   ├── modules.ts         # cognitive module registry
│   │   └── types.ts           # wire protocol (BrainEvent)
│   └── .env.example
├── client/
│   └── src/
│       ├── App.tsx            # layout + activation heartbeat
│       ├── store.ts           # Zustand brain state (activations, steps, heat…)
│       ├── lib/brain.ts       # brain anatomy generator + module palette
│       ├── lib/ws.ts          # WebSocket client (auto-reconnect)
│       └── components/        # NeuralCanvas, NeuronNode, HubNode, SignalEdge,
│                              # ThoughtStream, Heatmap, ConfidenceGauge,
│                              # AgentComms, MemoryPanel, CommandBar, StatusBar,
│                              # ThreeBackground
└── docs/ARCHITECTURE.md
```
