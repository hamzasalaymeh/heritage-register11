import { AnimatePresence, motion } from 'framer-motion';
import { useBrain } from '../store';
import { MODULE_MAP } from '../lib/brain';

/** Agent-to-agent message feed: cognitive modules handing work to each other. */
export function AgentComms() {
  const messages = useBrain((s) => s.agentMessages);

  return (
    <div className="panel">
      <div className="panel-title">Agent Communications</div>
      <div className="comms-scroll">
        {messages.length === 0 && (
          <div className="panel-empty">module-to-module hand-offs will appear here</div>
        )}
        <AnimatePresence initial={false}>
          {messages.slice(0, 12).map((m) => {
            const from = MODULE_MAP.get(m.from);
            const to = MODULE_MAP.get(m.to);
            return (
              <motion.div
                key={m.id}
                className="comm-row"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="comm-route">
                  <span style={{ color: from?.color }}>{from?.label ?? m.from}</span>
                  <span className="comm-arrow">⟶</span>
                  <span style={{ color: to?.color }}>{to?.label ?? m.to}</span>
                </div>
                <div className="comm-content">{m.content}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
