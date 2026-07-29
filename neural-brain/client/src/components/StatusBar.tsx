import { useBrain } from '../store';

/** Top HUD: connection, engine mode, model, live counters. */
export function StatusBar() {
  const connected = useBrain((s) => s.connected);
  const mode = useBrain((s) => s.mode);
  const model = useBrain((s) => s.model);
  const thinking = useBrain((s) => s.thinking);
  const steps = useBrain((s) => s.steps);
  const graph = useBrain((s) => s.graph);

  return (
    <header className="status-bar">
      <div className="brand">
        <span className="brand-glyph">◉</span> NEURAL BRAIN
        <span className="brand-sub">cognitive network v1.0</span>
      </div>
      <div className="status-items">
        <span className={`status-chip ${connected ? 'ok' : 'bad'}`}>
          {connected ? '● LINK ESTABLISHED' : '○ LINK DOWN'}
        </span>
        <span className="status-chip">
          {mode === 'claude' ? `⚡ ${model}` : mode === 'simulation' ? '◌ SIMULATION MODE' : '…'}
        </span>
        <span className="status-chip">{graph.nodes.length} neurons</span>
        <span className="status-chip">{graph.edges.length} synapses</span>
        <span className={`status-chip ${thinking ? 'thinking' : ''}`}>
          {thinking ? `⟳ REASONING · step ${steps.length}` : '◈ IDLE'}
        </span>
      </div>
    </header>
  );
}
