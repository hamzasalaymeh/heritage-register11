import { useMemo } from 'react';
import ReactFlow, { Background, BackgroundVariant, type Edge, type Node } from 'reactflow';
import 'reactflow/dist/style.css';
import { useBrain } from '../store';
import { hubId } from '../lib/brain';
import { NeuronNode } from './NeuronNode';
import { HubNode } from './HubNode';
import { SignalEdge } from './SignalEdge';

const nodeTypes = { neuron: NeuronNode, hub: HubNode };
const edgeTypes = { signal: SignalEdge };

/**
 * The living brain: a React Flow scene of ~270 nodes (10 cognitive hubs +
 * 260 neurons) wired with glowing synapses. Node/edge geometry is static;
 * all animation is driven by activation state inside the custom components,
 * so React Flow never has to re-layout during a thought.
 */
export function NeuralCanvas() {
  const graph = useBrain((s) => s.graph);
  const expanded = useBrain((s) => s.expanded);
  const pulses = useBrain((s) => s.pulses);

  const nodes: Node[] = useMemo(
    () =>
      graph.nodes.map((n) =>
        n.type === 'neuron' && !expanded[(n.data as { module: keyof typeof expanded }).module]
          ? { ...n, hidden: true }
          : n,
      ),
    [graph.nodes, expanded],
  );

  const edges: Edge[] = useMemo(() => {
    const base = graph.edges.filter((e) => {
      const d = e.data as { module: keyof typeof expanded; kind: string };
      return d.kind === 'ring' || d.kind === 'chord' || expanded[d.module];
    });
    const pulseEdges: Edge[] = pulses.map((p) => ({
      id: `pulse-${p.id}`,
      source: hubId(p.from),
      target: hubId(p.to),
      type: 'signal',
      data: { module: p.from, kind: 'pulse' },
    }));
    return [...base, ...pulseEdges];
  }, [graph.edges, expanded, pulses]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.3}
      maxZoom={2.5}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      proOptions={{ hideAttribution: true }}
      style={{ background: 'transparent' }}
    >
      <Background variant={BackgroundVariant.Dots} gap={42} size={1} color="#182238" />
    </ReactFlow>
  );
}
