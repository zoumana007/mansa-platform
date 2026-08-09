import { Inject, Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';

import { LedgerOutboxDispatcherService } from './ledger-outbox-dispatcher.service';
import {
  LEDGER_OUTBOX_PUBLISHER,
  LedgerOutboxPublisherBinding,
} from './ledger-outbox-publisher.provider';
import { LedgerOutboxWorker } from './ledger-outbox-worker';
import { loadRuntimeConfig } from './runtime-config';

@Injectable()
export class LedgerOutboxLifecycleService implements OnModuleInit, OnApplicationShutdown {
  private worker: LedgerOutboxWorker | null = null;

  public constructor(
    private readonly dispatcher: LedgerOutboxDispatcherService,
    @Inject(LEDGER_OUTBOX_PUBLISHER)
    private readonly publisherBinding: LedgerOutboxPublisherBinding,
  ) {}

  public onModuleInit(): void {
    const config = loadRuntimeConfig();
    if (!config.ledgerOutboxWorker.enabled) {
      return;
    }

    if (!this.publisherBinding.configured) {
      throw new Error(
        'LEDGER_OUTBOX_WORKER_ENABLED=true requires a configured ledger outbox publisher',
      );
    }

    this.worker = new LedgerOutboxWorker(this.dispatcher, this.publisherBinding.publisher, {
      intervalMs: config.ledgerOutboxWorker.intervalMs,
      limit: config.ledgerOutboxWorker.batchSize,
      leaseMs: config.ledgerOutboxWorker.leaseMs,
      maxAttempts: config.ledgerOutboxWorker.maxAttempts,
      baseRetryDelayMs: config.ledgerOutboxWorker.baseRetryDelayMs,
      maxRetryDelayMs: config.ledgerOutboxWorker.maxRetryDelayMs,
      jitterRatio: config.ledgerOutboxWorker.jitterRatio,
    });
    this.worker.start();
  }

  public onApplicationShutdown(): void {
    this.worker?.stop();
    this.worker = null;
  }

  public isStarted(): boolean {
    return this.worker?.isStarted() ?? false;
  }
}
