import { memo } from 'react';
import { motion } from 'framer-motion';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { useBrain } from '../store';
import type { NeuronData } from '../lib/brain';

/** A single neuron: a soft glowing dot whose halo scales with activation. */
function NeuronNodeInner({ id, data }: NodeProps<NeuronData>) {
  const activation = useBrain((s) => s.activations[id] ?? 0);
  const size = 7 + activation * 9;
  return (
    <motion.div
      animate={{
        scale: 1 + activation * 0.9,
        opacity: 0.45 + activation * 0.55,
      }}
      transition={{ type: 'tween', duration: 0.18 }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, #fff 0%, ${data.color} 45%, transparent 75%)`,
        boxShadow:
          activation > 0.08
            ? `0 0 ${6 + activation * 26}px ${activation * 8}px ${data.color}66`
            : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </motion.div>
  );
}

export const NeuronNode = memo(NeuronNodeInner);
