import { memo } from 'react';
import { motion } from 'framer-motion';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { useBrain } from '../store';
import type { HubData } from '../lib/brain';

/**
 * A cognitive-module hub: larger core with an animated ring. Clicking it
 * expands/collapses the module's neuron layer.
 */
function HubNodeInner({ id, data }: NodeProps<HubData>) {
  const activation = useBrain((s) => s.activations[id] ?? 0);
  const expanded = useBrain((s) => s.expanded[data.module]);
  const toggle = useBrain((s) => s.toggleModule);

  return (
    <div
      style={{ position: 'relative', cursor: 'pointer' }}
      onClick={() => toggle(data.module)}
      title={`${data.label} — click to ${expanded ? 'collapse' : 'expand'} layer`}
    >
      <motion.div
        animate={{ scale: 1 + activation * 0.45 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: `radial-gradient(circle, #fff 0%, ${data.color} 40%, ${data.color}22 78%)`,
          boxShadow: `0 0 ${10 + activation * 40}px ${2 + activation * 12}px ${data.color}${
            activation > 0.05 ? '99' : '33'
          }`,
        }}
      />
      {/* pulsing outer ring while active */}
      <motion.div
        animate={{
          scale: activation > 0.1 ? [1, 1.9] : 1,
          opacity: activation > 0.1 ? [0.7, 0] : 0,
        }}
        transition={{ duration: 1.1, repeat: activation > 0.1 ? Infinity : 0, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
          border: `1.5px solid ${data.color}`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-2)',
          whiteSpace: 'nowrap',
          textShadow: '0 0 8px rgba(0,0,0,0.9)',
        }}
      >
        <span style={{ color: data.color, marginRight: 5 }}>●</span>
        {data.label}
        <span style={{ marginLeft: 5, color: 'var(--ink-3)' }}>{expanded ? '▾' : '▸'}</span>
      </div>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

export const HubNode = memo(HubNodeInner);
