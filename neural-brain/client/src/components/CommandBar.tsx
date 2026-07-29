import { useState, type FormEvent } from 'react';
import { useBrain } from '../store';
import { newThread, think } from '../lib/ws';

const SUGGESTIONS = [
  'Design a savings plan to buy a house in 5 years',
  'How would you architect a real-time chat system?',
  'What habits improve focus without burning out?',
  'Should a startup build or buy its analytics stack?',
];

/** The brain's sensory input: type a prompt, watch it think. */
export function CommandBar() {
  const [value, setValue] = useState('');
  const thinking = useBrain((s) => s.thinking);
  const connected = useBrain((s) => s.connected);
  const turns = useBrain((s) => s.turns);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const prompt = value.trim();
    if (!prompt || thinking || !connected) return;
    think(prompt);
    setValue('');
  };

  return (
    <form className="command-bar" onSubmit={submit}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          connected
            ? thinking
              ? 'the brain is thinking…'
              : 'ask the brain anything — every thought becomes visible'
            : 'connecting to the brain…'
        }
        disabled={thinking || !connected}
        aria-label="Prompt"
      />
      <button type="submit" disabled={thinking || !connected || !value.trim()}>
        {thinking ? 'THINKING' : 'THINK'}
      </button>
      {turns > 0 && (
        <button
          type="button"
          className="new-thread-btn"
          onClick={newThread}
          disabled={thinking}
          title="Forget the current conversation context and start fresh (long-term memory is kept)"
        >
          ⟲ NEW THREAD · {turns} turn{turns > 1 ? 's' : ''}
        </button>
      )}
      {!thinking && (
        <div className="suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setValue(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
