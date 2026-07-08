import { memo } from 'react';
import type { EdgeProps } from 'reactflow';
import { getBezierPath } from 'reactflow';
import { useBrain } from '../store';
import { moduleColor } from '../lib/brain';
import type { ModuleId } from '../types';

interface SignalData {
  module: ModuleId;
  kind: 'ring' | 'chord' | 'spoke' | 'synapse' | 'pulse';
}

/**
 * A glowing synapse. Base opacity is faint; when the source module is active
 * the edge brightens and a light packet travels along the path.
 */
function SignalEdgeInner(props: EdgeProps<SignalData>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const activity = useBrain((s) => (data ? s.moduleActivity[data.module] : 0));
  const color = data ? moduleColor(data.module) : '#22d3ee';
  const isPulse = data?.kind === 'pulse';
  const isBackbone = data?.kind === 'ring' || data?.kind === 'chord';

  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: isBackbone || isPulse ? 0.35 : 0.15,
  });

  const glow = isPulse ? 1 : activity;
  const baseOpacity = isBackbone ? 0.16 : 0.08;

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={isPulse ? 2 : isBackbone ? 1.4 : 0.8}
        opacity={baseOpacity + glow * 0.6}
        style={glow > 0.15 ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined}
      />
      {glow > 0.12 && (
        <circle r={isPulse ? 4 : 2.5} fill="#ffffff" opacity={Math.min(1, glow + 0.2)}>
          <animateMotion
            dur={isPulse ? '0.9s' : '1.6s'}
            repeatCount="indefinite"
            path={path}
          />
        </circle>
      )}
      {isPulse && (
        <circle r={7} fill="none" stroke={color} strokeWidth={1} opacity={0.5} key={id}>
          <animateMotion dur="0.9s" repeatCount="indefinite" path={path} />
        </circle>
      )}
    </g>
  );
}

export const SignalEdge = memo(SignalEdgeInner);
