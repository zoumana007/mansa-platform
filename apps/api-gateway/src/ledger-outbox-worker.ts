import {
  LedgerOutboxDispatcherService,
  LedgerOutboxDispatchOptions,
  LedgerOutboxDispatchResult,
  LedgerOutboxPublisher,
} from './ledger-outbox-dispatcher.service';

export interface LedgerOutboxWorkerOptions extends LedgerOutboxDispatchOptions {
  intervalMs?: number;
}

export interface LedgerOutboxWorkerTimer {
  setInterval(callback: () => void, intervalMs: number): unknown;
  clearInterval(handle: unknown): void;
}

const DEFAULT_INTERVAL_MS = 1_000;
const MIN_INTERVAL_MS = 100;

const normalizeInterval = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value) || value < MIN_INTERVAL_MS) {
    return DEFAULT_INTERVAL_MS;
  }
  return Math.floor(value);
};

const systemTimer: LedgerOutboxWorkerTimer = {
  setInterval(callback, intervalMs) {
    return globalThis.setInterval(callback, intervalMs);
  },
  clearInterval(handle) {
    globalThis.clearInterval(handle as ReturnType<typeof setInterval>);
  },
};

export class LedgerOutboxWorker {
  private timerHandle: unknown | null = null;
  private running = false;

  public constructor(
    private readonly dispatcher: LedgerOutboxDispatcherService,
    private readonly publisher: LedgerOutboxPublisher,
    private readonly options: LedgerOutboxWorkerOptions = {},
    private readonly timer: LedgerOutboxWorkerTimer = systemTimer,
  ) {}

  public isStarted(): boolean {
    return this.timerHandle !== null;
  }

  public isRunning(): boolean {
    return this.running;
  }

  public start(): void {
    if (this.timerHandle !== null) {
      return;
    }

    const intervalMs = normalizeInterval(this.options.intervalMs);
    this.timerHandle = this.timer.setInterval(() => {
      void this.runOnce();
    }, intervalMs);
  }

  public stop(): void {
    if (this.timerHandle === null) {
      return;
    }

    this.timer.clearInterval(this.timerHandle);
    this.timerHandle = null;
  }

  public async runOnce(): Promise<LedgerOutboxDispatchResult | null> {
    if (this.running) {
      return null;
    }

    this.running = true;
    try {
      const { intervalMs: _intervalMs, ...dispatchOptions } = this.options;
      return await this.dispatcher.dispatchBatch(this.publisher, dispatchOptions);
    } finally {
      this.running = false;
    }
  }
}
