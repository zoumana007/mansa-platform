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

export interface LedgerOutboxWorkerSnapshot {
  started: boolean;
  running: boolean;
  completedRuns: number;
  skippedRuns: number;
  failedRuns: number;
  lastStartedAt: Date | null;
  lastCompletedAt: Date | null;
  lastDurationMs: number | null;
  lastResult: LedgerOutboxDispatchResult | null;
  lastError: string | null;
}

const DEFAULT_INTERVAL_MS = 1_000;
const MIN_INTERVAL_MS = 100;
const MAX_ERROR_LENGTH = 500;

const normalizeInterval = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value) || value < MIN_INTERVAL_MS) {
    return DEFAULT_INTERVAL_MS;
  }
  return Math.floor(value);
};

const serializeError = (error: unknown): string => {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return text.slice(0, MAX_ERROR_LENGTH);
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
  private completedRuns = 0;
  private skippedRuns = 0;
  private failedRuns = 0;
  private lastStartedAt: Date | null = null;
  private lastCompletedAt: Date | null = null;
  private lastDurationMs: number | null = null;
  private lastResult: LedgerOutboxDispatchResult | null = null;
  private lastError: string | null = null;

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

  public getSnapshot(): LedgerOutboxWorkerSnapshot {
    return {
      started: this.isStarted(),
      running: this.running,
      completedRuns: this.completedRuns,
      skippedRuns: this.skippedRuns,
      failedRuns: this.failedRuns,
      lastStartedAt: this.lastStartedAt,
      lastCompletedAt: this.lastCompletedAt,
      lastDurationMs: this.lastDurationMs,
      lastResult: this.lastResult,
      lastError: this.lastError,
    };
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
      this.skippedRuns += 1;
      return null;
    }

    this.running = true;
    const startedAt = new Date();
    this.lastStartedAt = startedAt;
    try {
      const { intervalMs: _intervalMs, ...dispatchOptions } = this.options;
      const result = await this.dispatcher.dispatchBatch(this.publisher, dispatchOptions);
      this.completedRuns += 1;
      this.lastResult = result;
      this.lastError = null;
      return result;
    } catch (error) {
      this.failedRuns += 1;
      this.lastError = serializeError(error);
      throw error;
    } finally {
      const completedAt = new Date();
      this.lastCompletedAt = completedAt;
      this.lastDurationMs = Math.max(0, completedAt.getTime() - startedAt.getTime());
      this.running = false;
    }
  }
}
