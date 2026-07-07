import { randomUUID } from 'node:crypto';
import { isModuleId } from './modules.js';
import type { ModuleId, ReasoningStep } from './types.js';

export interface ParserCallbacks {
  onStepStart(stepId: string, module: ModuleId): void;
  onStepToken(stepId: string, module: ModuleId, text: string): void;
  onStepEnd(step: ReasoningStep): void;
  onAnswerToken(text: string): void;
  onAnswerEnd(text: string, confidence: number): void;
}

type State = 'idle' | 'in_step' | 'in_answer';

/**
 * Incremental parser for the <step>/<answer> reasoning protocol. Fed raw text
 * deltas from the Claude stream, it fires callbacks the moment tags open,
 * tokens arrive, and tags close — enabling real-time neural animation.
 */
export class StreamParser {
  private buffer = '';
  private state: State = 'idle';
  private stepId = '';
  private module: ModuleId = 'logic';
  private confidence = 0.5;
  private targets: ModuleId[] = [];
  private content = '';
  private answer = '';
  private answerConfidence = 0.5;

  constructor(private cb: ParserCallbacks) {}

  push(delta: string) {
    this.buffer += delta;
    this.drain();
  }

  /** Flush at end of stream: closes any dangling step/answer. */
  finish() {
    this.drain();
    if (this.state === 'in_step') {
      this.content += this.buffer;
      this.buffer = '';
      this.endStep();
    } else if (this.state === 'in_answer') {
      this.answer += this.buffer;
      this.buffer = '';
      this.cb.onAnswerEnd(this.answer.trim(), this.answerConfidence);
      this.state = 'idle';
    }
  }

  private drain() {
    // Loop until no more complete structures can be consumed.
    for (;;) {
      if (this.state === 'idle') {
        const open = this.buffer.match(/<(step|answer)\b([^>]*)>/);
        if (!open || open.index === undefined) {
          // Keep a small tail in case a tag is split across deltas.
          if (this.buffer.length > 256) this.buffer = this.buffer.slice(-256);
          return;
        }
        const attrs = open[2];
        this.buffer = this.buffer.slice(open.index + open[0].length);
        if (open[1] === 'step') {
          this.stepId = randomUUID();
          this.module = this.parseModule(attrs);
          this.confidence = this.parseConfidence(attrs);
          this.targets = this.parseTargets(attrs);
          this.content = '';
          this.state = 'in_step';
          this.cb.onStepStart(this.stepId, this.module);
        } else {
          this.answer = '';
          this.answerConfidence = this.parseConfidence(attrs);
          this.state = 'in_answer';
        }
      } else if (this.state === 'in_step') {
        const close = this.buffer.indexOf('</step>');
        if (close >= 0) {
          const chunk = this.buffer.slice(0, close);
          this.emitStepText(chunk);
          this.buffer = this.buffer.slice(close + '</step>'.length);
          this.endStep();
        } else {
          this.emitSafely((t) => this.emitStepText(t), '</step>'.length);
          return;
        }
      } else {
        const close = this.buffer.indexOf('</answer>');
        if (close >= 0) {
          const chunk = this.buffer.slice(0, close);
          this.answer += chunk;
          this.cb.onAnswerToken(chunk);
          this.buffer = this.buffer.slice(close + '</answer>'.length);
          this.cb.onAnswerEnd(this.answer.trim(), this.answerConfidence);
          this.state = 'idle';
        } else {
          this.emitSafely((t) => {
            this.answer += t;
            this.cb.onAnswerToken(t);
          }, '</answer>'.length);
          return;
        }
      }
    }
  }

  /** Emit buffered text except a tail that could be the start of a close tag. */
  private emitSafely(emit: (text: string) => void, tailLen: number) {
    const safe = this.buffer.length - tailLen;
    if (safe > 0) {
      emit(this.buffer.slice(0, safe));
      this.buffer = this.buffer.slice(safe);
    }
  }

  private emitStepText(text: string) {
    if (text.length === 0) return;
    this.content += text;
    this.cb.onStepToken(this.stepId, this.module, text);
  }

  private endStep() {
    this.cb.onStepEnd({
      id: this.stepId,
      module: this.module,
      text: this.content.trim(),
      confidence: this.confidence,
      targets: this.targets,
    });
    this.state = 'idle';
  }

  private parseModule(attrs: string): ModuleId {
    const m = attrs.match(/module="([^"]+)"/);
    return m && isModuleId(m[1]) ? m[1] : 'logic';
  }

  private parseConfidence(attrs: string): number {
    const m = attrs.match(/confidence="([\d.]+)"/);
    const v = m ? Number(m[1]) : NaN;
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.5;
  }

  private parseTargets(attrs: string): ModuleId[] {
    const m = attrs.match(/to="([^"]+)"/);
    if (!m) return [];
    return m[1]
      .split(',')
      .map((s) => s.trim())
      .filter(isModuleId);
  }
}
