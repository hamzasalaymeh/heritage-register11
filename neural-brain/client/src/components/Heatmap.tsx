import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useBrain } from '../store';
import { MODULES } from '../lib/brain';
import type { ModuleId } from '../types';

const W = 316;
const ROW_H = 14;
const LABEL_W = 86;
const H = MODULES.length * ROW_H;
const LEGEND_H = 26;

/**
 * Activation heatmap — modules × time. Magnitude uses a single sequential
 * cyan ramp (surface → bright) rather than per-module hues: color encodes
 * *how active*, the labeled rows encode *which module*.
 */
export function Heatmap() {
  const history = useBrain((s) => s.heatHistory);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  // Sequential ramp: chart surface → bright cyan (validated against #060913).
  const ramp = useMemo(
    () => d3.scaleSequential(d3.interpolateLab('#0b1526', '#7ff3ff')).domain([0, 1]),
    [],
  );

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    if (history.length === 0) return;

    const cols = history.length;
    const cellW = (W - LABEL_W) / Math.max(cols, 1);

    const g = svg.append('g');

    // Row labels (identity via text + module dot, never color-alone)
    for (let r = 0; r < MODULES.length; r++) {
      const m = MODULES[r];
      const label = g
        .append('text')
        .attr('x', LABEL_W - 8)
        .attr('y', r * ROW_H + ROW_H / 2 + 3.5)
        .attr('text-anchor', 'end')
        .attr('font-size', 9)
        .attr('font-family', "'JetBrains Mono', monospace")
        .attr('fill', 'var(--ink-3)');
      label.text(m.label.toUpperCase());
      g.append('circle')
        .attr('cx', 6)
        .attr('cy', r * ROW_H + ROW_H / 2)
        .attr('r', 2.5)
        .attr('fill', m.color);
    }

    // Cells
    for (let c = 0; c < cols; c++) {
      const sample = history[c];
      for (let r = 0; r < MODULES.length; r++) {
        const id = MODULES[r].id as ModuleId;
        const v = sample.values[id] ?? 0;
        g.append('rect')
          .attr('x', LABEL_W + c * cellW)
          .attr('y', r * ROW_H + 1)
          .attr('width', Math.max(cellW - 1, 1))
          .attr('height', ROW_H - 2)
          .attr('rx', 1.5)
          .attr('fill', ramp(v))
          .on('mousemove', (ev: MouseEvent) => {
            const secondsAgo = Math.round((Date.now() - sample.t) / 1000);
            setTip({
              x: ev.offsetX,
              y: ev.offsetY,
              text: `${MODULES[r].label} · ${(v * 100).toFixed(0)}% · ${secondsAgo}s ago`,
            });
          })
          .on('mouseleave', () => setTip(null));
      }
    }

    // Gradient legend (min → max)
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'heat-grad');
    for (let i = 0; i <= 10; i++) {
      grad
        .append('stop')
        .attr('offset', `${i * 10}%`)
        .attr('stop-color', ramp(i / 10));
    }
    const ly = H + 10;
    svg
      .append('rect')
      .attr('x', LABEL_W)
      .attr('y', ly)
      .attr('width', W - LABEL_W)
      .attr('height', 6)
      .attr('rx', 3)
      .attr('fill', 'url(#heat-grad)');
    svg
      .append('text')
      .attr('x', LABEL_W)
      .attr('y', ly + 16)
      .attr('font-size', 8.5)
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('fill', 'var(--ink-3)')
      .text('idle');
    svg
      .append('text')
      .attr('x', W)
      .attr('y', ly + 16)
      .attr('text-anchor', 'end')
      .attr('font-size', 8.5)
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('fill', 'var(--ink-3)')
      .text('max activation');
  }, [history, ramp]);

  return (
    <div className="panel">
      <div className="panel-title">Activation Heatmap</div>
      <div style={{ position: 'relative' }}>
        <svg ref={svgRef} width={W} height={H + LEGEND_H} style={{ display: 'block' }} />
        {history.length === 0 && (
          <div className="panel-empty">activity appears here while the brain thinks</div>
        )}
        {tip && (
          <div
            className="tooltip"
            style={{ left: Math.min(tip.x + 10, W - 150), top: tip.y - 28 }}
          >
            {tip.text}
          </div>
        )}
      </div>
    </div>
  );
}
