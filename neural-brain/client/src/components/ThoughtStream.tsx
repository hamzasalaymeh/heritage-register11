import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBrain } from '../store';
import { MODULE_MAP } from '../lib/brain';

/** Live reasoning trace: each cognitive step streams in token by token. */
export function ThoughtStream() {
  const steps = useBrain((s) => s.steps);
  const answer = useBrain((s) => s.answer);
  const answerConfidence = useBrain((s) => s.answerConfidence);
  const thinking = useBrain((s) => s.thinking);
  const error = useBrain((s) => s.error);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [steps, answer]);

  return (
    <div className="panel thought-stream">
      <div className="panel-title">
        Thought Stream
        {thinking && <span className="pulse-dot" aria-label="thinking" />}
      </div>
      <div ref={scrollRef} className="thought-scroll">
        {steps.length === 0 && !answer && !error && (
          <div className="panel-empty">
            Ask the brain something below — every reasoning step will fire here in real time.
          </div>
        )}
        <AnimatePresence initial={false}>
          {steps.map((step) => {
            const meta = MODULE_MAP.get(step.module);
            return (
              <motion.div
                key={step.id}
                className="thought-step"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                style={{ borderLeftColor: meta?.color }}
              >
                <div className="thought-head">
                  <span className="thought-module" style={{ color: meta?.color }}>
                    {meta?.label ?? step.module}
                  </span>
                  {step.confidence !== null && (
                    <span className="thought-conf">
                      {(step.confidence * 100).toFixed(0)}%
                      <i
                        className="conf-bar"
                        style={{ width: 34, ['--fill' as string]: `${step.confidence * 100}%` }}
                      />
                    </span>
                  )}
                </div>
                <div className="thought-text">
                  {step.text}
                  {!step.done && <span className="caret">▋</span>}
                </div>
                {step.done && step.targets.length > 0 && (
                  <div className="thought-targets">
                    →{' '}
                    {step.targets.map((t) => (
                      <span key={t} style={{ color: MODULE_MAP.get(t)?.color }}>
                        {MODULE_MAP.get(t)?.label ?? t}{' '}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {answer && (
          <motion.div
            className="answer-block"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="answer-head">
              Synthesis
              {answerConfidence !== null && (
                <span className="thought-conf">{(answerConfidence * 100).toFixed(0)}% confident</span>
              )}
            </div>
            <div className="answer-text">
              {answer}
              {thinking && <span className="caret">▋</span>}
            </div>
          </motion.div>
        )}
        {error && <div className="error-block">⚠ {error}</div>}
      </div>
    </div>
  );
}
