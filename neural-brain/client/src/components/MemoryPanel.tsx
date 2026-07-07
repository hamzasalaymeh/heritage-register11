import { useBrain } from '../store';
import { clearMemories } from '../lib/ws';
import { MODULE_MAP } from '../lib/brain';

/** Long-term memory: persisted lessons, plus what was recalled this session. */
export function MemoryPanel() {
  const memories = useBrain((s) => s.memories);
  const recalled = useBrain((s) => s.recalled);
  const recalledIds = new Set(recalled.map((r) => r.id));

  return (
    <div className="panel">
      <div className="panel-title">
        Long-Term Memory
        <span className="panel-meta">{memories.length} engrams</span>
        {memories.length > 0 && (
          <button className="ghost-btn" onClick={() => void clearMemories()} title="Erase all memories">
            wipe
          </button>
        )}
      </div>
      <div className="memory-scroll">
        {memories.length === 0 && (
          <div className="panel-empty">
            the brain remembers a lesson from every conversation — persisted across restarts
          </div>
        )}
        {memories.slice(0, 20).map((m) => (
          <div key={m.id} className={`memory-row${recalledIds.has(m.id) ? ' recalled' : ''}`}>
            <div className="memory-text">{m.text}</div>
            <div className="memory-meta">
              {recalledIds.has(m.id) && <span className="recall-badge">recalled</span>}
              <span>×{m.strength}</span>
              <span>{new Date(m.createdAt).toLocaleDateString()}</span>
              {m.modules.slice(0, 3).map((id) => (
                <span key={id} style={{ color: MODULE_MAP.get(id)?.color }}>
                  {MODULE_MAP.get(id)?.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
