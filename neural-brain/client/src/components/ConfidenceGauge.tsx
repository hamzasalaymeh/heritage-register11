import { motion } from 'framer-motion';
import { useBrain } from '../store';

/**
 * Decision-confidence gauge. Shows the final answer confidence when
 * available, otherwise a live average of completed step confidences.
 */
export function ConfidenceGauge() {
  const steps = useBrain((s) => s.steps);
  const answerConfidence = useBrain((s) => s.answerConfidence);
  const thinking = useBrain((s) => s.thinking);

  const stepConfs = steps.filter((s) => s.confidence !== null).map((s) => s.confidence!);
  const live = stepConfs.length ? stepConfs.reduce((a, b) => a + b, 0) / stepConfs.length : null;
  const value = answerConfidence ?? live;

  const R = 52;
  const CIRC = Math.PI * R; // semicircle
  const pct = value ?? 0;

  return (
    <div className="panel">
      <div className="panel-title">Decision Confidence</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg width={128} height={76} viewBox="0 0 128 76">
          <path
            d={`M 12 70 A ${R} ${R} 0 0 1 116 70`}
            fill="none"
            stroke="#182238"
            strokeWidth={9}
            strokeLinecap="round"
          />
          <motion.path
            d={`M 12 70 A ${R} ${R} 0 0 1 116 70`}
            fill="none"
            stroke={pct >= 0.75 ? '#34d399' : pct >= 0.5 ? '#fbbf24' : '#fb7185'}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            animate={{ strokeDashoffset: CIRC * (1 - pct) }}
            transition={{ type: 'spring', stiffness: 60, damping: 16 }}
            style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}
          />
        </svg>
        <div>
          <div className="gauge-value">{value === null ? '—' : `${(value * 100).toFixed(0)}%`}</div>
          <div className="gauge-label">
            {answerConfidence !== null
              ? 'final decision'
              : thinking
                ? 'live estimate'
                : 'awaiting input'}
          </div>
        </div>
      </div>
    </div>
  );
}
