import { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useBrain } from './store';
import { connectBrain, fetchMemories } from './lib/ws';
import { ThreeBackground } from './components/ThreeBackground';
import { NeuralCanvas } from './components/NeuralCanvas';
import { StatusBar } from './components/StatusBar';
import { ThoughtStream } from './components/ThoughtStream';
import { ConfidenceGauge } from './components/ConfidenceGauge';
import { Heatmap } from './components/Heatmap';
import { AgentComms } from './components/AgentComms';
import { MemoryPanel } from './components/MemoryPanel';
import { CommandBar } from './components/CommandBar';

export default function App() {
  useEffect(() => {
    connectBrain();
    void fetchMemories();
  }, []);

  // Heartbeat: decays activations (~10 Hz) and samples the heatmap (~2.5 Hz).
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      const thinking = useBrain.getState().thinking;
      useBrain.getState().tick(thinking && n % 4 === 0);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="app">
      <ThreeBackground />
      <StatusBar />
      <main className="layout">
        <aside className="left-col">
          <ThoughtStream />
        </aside>
        <section className="canvas-wrap">
          <ReactFlowProvider>
            <NeuralCanvas />
          </ReactFlowProvider>
        </section>
        <aside className="right-col">
          <ConfidenceGauge />
          <Heatmap />
          <AgentComms />
          <MemoryPanel />
        </aside>
      </main>
      <CommandBar />
    </div>
  );
}
