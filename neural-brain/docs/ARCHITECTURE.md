# Architecture

## System overview

```
┌────────────────────────────── client (React + Vite) ──────────────────────────────┐
│                                                                                    │
│  CommandBar ─► ws.think(prompt)                                                    │
│                                                                                    │
│  Zustand store ◄─ BrainEvent stream ◄──────────────┐                               │
│   ├─ activations (nodeId → 0..1, 10 Hz decay)      │                               │
│   ├─ moduleActivity (module → 0..1)                │                               │
│   ├─ steps / answer / confidence                   │        WebSocket /ws          │
│   ├─ pulses (agent hand-offs)                      │                               │
│   └─ heatHistory (sampled 2.5 Hz)                  │                               │
│                                                    │                               │
│  NeuralCanvas (React Flow, ~270 nodes)             │                               │
│  ThoughtStream · ConfidenceGauge · Heatmap (D3)    │                               │
│  AgentComms · MemoryPanel · ThreeBackground        │                               │
└────────────────────────────────────────────────────┼───────────────────────────────┘
                                                     │
┌────────────────────────────── server (Node + Express) ─────────────────────────────┐
│                                                    │                                │
│  BrainEngine.think(prompt)                         │                                │
│   1. MemoryStore.recall(prompt)  ──────────────────┤  memory_recall                 │
│   2. Claude stream (or simulator)                  │                                │
│        └─ StreamParser ────────────────────────────┤  step_start/step_token/step_end│
│   3. AgentBus.dispatch(step.targets) ──────────────┤  agent_message                 │
│   4. answer streaming ─────────────────────────────┤  answer_token/answer_end       │
│   5. MemoryStore.write(lesson) ────────────────────┤  memory_write                  │
│                                                                                     │
│  REST: /api/health /api/modules /api/memory /api/agents/log                         │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## The reasoning protocol

The engine does **not** post-process a finished response — it parses the live token
stream. A system prompt (`server/src/prompt.ts`) constrains Claude's output to:

```xml
<step module="goals" confidence="0.9" to="memory,planning">
Clarify what the user actually needs…
</step>
...5–9 steps...
<step module="learning" confidence="0.8">
REMEMBER: the user is planning a home lab on a budget.
</step>
<answer confidence="0.87">
Final answer in normal prose/markdown.
</answer>
```

`StreamParser` (`server/src/parser.ts`) is a small state machine (`idle → in_step →
idle → in_answer`) fed by raw text deltas from `client.messages.stream(...)`. It:

- fires `step_start` the instant an opening tag completes,
- forwards inner text as `step_token` events (holding back a few chars so a close tag
  split across deltas is never leaked),
- fires `step_end` with the parsed `confidence` and `to` targets,
- tolerates malformed attributes (unknown module → `logic`, bad confidence → `0.5`),
- closes any dangling step/answer at stream end (`finish()`).

**Why a tag protocol instead of tool use or structured outputs?** Token-level
streaming *inside* each step is the product: the UI needs partial step text to
animate typing and neuron firing per token. A JSON schema would only validate at
completion; tags parse incrementally with ~zero latency.

**Why no extended thinking?** The point of the app is externalized reasoning — the
steps *are* the visible thought process. Thinking would add pre-first-token latency
while producing content the UI never shows, so the request omits the `thinking`
parameter (valid on `claude-opus-4-8`).

## Wire protocol (WebSocket `/ws`)

Client → server: `{type:'think', prompt}` · `{type:'clear_memory'}`

Server → client (`BrainEvent`):

| Event | Payload | UI effect |
|---|---|---|
| `hello` | mode, model | status bar chips |
| `session_start` | sessionId, prompt, mode | reset panels, enter thinking state |
| `memory_recall` | memories[] | Memory cortex fires, recalled engrams glow |
| `step_start` | stepId, module | hub + ~45% of module neurons fire at full intensity |
| `step_token` | stepId, module, text | typing effect + stochastic micro-firing |
| `step_end` | text, confidence, targets | confidence chip, hand-off arrows |
| `agent_message` | from, to, content | traveling pulse edge between hubs + comms feed |
| `answer_token` / `answer_end` | text, confidence | synthesis block + gauge |
| `memory_write` | memory | Learning cortex fires, engram added |
| `session_end` / `error` | — | exit thinking state / error block |

Both sides share the same `BrainEvent` type (mirrored in `server/src/types.ts` and
`client/src/types.ts`) so the protocol is checked by the compiler at each end.

## Cognitive modules & agent communication

Ten modules act as agents. Each reasoning step declares which modules it hands off to
(`to="planning,risk"`); `AgentBus` converts those into directed `agent_message`s
carrying a summary of the step. The UI renders each as:

1. a temporary **pulse edge** between the two hubs (bright traveling packet, ~1.6 s), and
2. a row in the **Agent Communications** feed.

This makes the routing topology of a thought visible: different prompts genuinely
light up different pathways because Claude chooses the module sequence per problem.

## Long-term memory

`MemoryStore` persists JSON to `server/data/memory.json` (path configurable):

- **Write** — after each session the Learning step's `REMEMBER:` sentence (or a
  prompt+answer digest as fallback) is stored with keyword tags and the set of modules
  that participated.
- **Recall** — `score = keywordOverlap × (1 + ln(1 + strength)) × (0.5 + e^(-age/30d))`;
  the top 4 are injected into the next prompt's context.
- **Reinforcement** — every recall increments `strength`, so useful memories are
  progressively favored (a crude Hebbian rule: what fires together wires together).
- Capacity is capped at 200 engrams (FIFO eviction).

## Brain anatomy & animation model

`generateBrain()` builds a deterministic anatomy (seeded PRNG, stable across reloads):

- **10 hubs** on an ellipse, one per module, labeled — identity is never color-alone.
- **26 neurons per module** on a golden-angle spiral around each hub → 270 nodes total.
- **Synapses:** hub ring (cortex), long-range chords (association fibers), hub→neuron
  spokes, and random intra-module links → ~490 edges.

Animation is decoupled from graph structure for performance:

- Node/edge arrays are memoized and *never rebuilt during a thought*. React Flow only
  re-renders when a layer is expanded/collapsed or a pulse edge appears.
- Each `NeuronNode`/`HubNode`/`SignalEdge` subscribes to its own activation slice in
  Zustand, so a firing event re-renders only the touched components.
- A 100 ms heartbeat decays all activations (×0.9) and module activity (×0.93), and
  samples the heatmap every 4th tick while thinking.
- Signal packets are SVG `animateMotion` along the edge path (GPU-cheap), brightened
  by module activity; Framer Motion handles node glow/scale springs.

## Visualization & color decisions

- **Heatmap (D3)** encodes *magnitude* with a single sequential ramp
  (surface `#0b1526` → `#7ff3ff`), monotonic in lightness; module *identity* comes
  from the labeled rows. Cells have hover tooltips; a gradient legend anchors the scale.
- **Module palette** is categorical, assigned in fixed order, and was checked with the
  dataviz palette validator against the dark surface: chroma, contrast (all ≥ 3:1) and
  adjacent-pair CVD separation pass (worst adjacent ΔE 21.9 after reordering the ring).
  The colors intentionally sit brighter than the chart lightness band — they are neon
  *glow* identities on a near-black scene, not chart series fills — and every use is
  paired with a text label so identity never relies on color alone.
- **Text wears ink tokens** (`--ink-1/2/3`), never series colors.

## Scaling & extension points

| Want | Change |
|---|---|
| More neurons | `NEURONS_PER_MODULE` in `client/src/lib/brain.ts` (300+ nodes tested) |
| New cognitive module | add to `server/src/modules.ts` + `client/src/lib/brain.ts` (color, label) |
| Different model | `BRAIN_MODEL` in `server/.env` |
| Multi-turn conversations | keep a `messages[]` history per socket in `engine.ts` and append prior turns |
| Vector-based memory | swap `MemoryStore.recall` for an embedding index; the interface stays the same |
| Multiple users | the engine is stateless per call; add per-socket session IDs and a memory namespace |
