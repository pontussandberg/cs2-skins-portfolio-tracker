import { EventEmitter } from "node:events";

export type AppEvent =
  | { type: "run.queued"; watchId: string; runId: string }
  | { type: "run.started"; watchId: string; runId: string }
  | { type: "run.finished"; watchId: string; runId: string; watchName: string; added: number; priceChanged: number; gone: number; baseline: boolean }
  | { type: "run.failed"; watchId: string; runId: string; error: string }
  | { type: "watches.changed" }
  | { type: "portfolio.changed" }
  | { type: "scheduler.suspended"; reason: string };

/** In-process event bus: worker -> SSE route. */
export class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  emit(event: AppEvent): void {
    this.emitter.emit("event", event);
  }

  subscribe(listener: (event: AppEvent) => void): () => void {
    this.emitter.on("event", listener);
    return () => this.emitter.off("event", listener);
  }
}
