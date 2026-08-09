import { LedgerOutboxPublisher } from './ledger-outbox-dispatcher.service';

export const LEDGER_OUTBOX_PUBLISHER = Symbol('LEDGER_OUTBOX_PUBLISHER');

export interface LedgerOutboxPublisherBinding {
  configured: boolean;
  name: string;
  publisher: LedgerOutboxPublisher;
}

const unconfiguredPublisher: LedgerOutboxPublisher = {
  async publish(): Promise<void> {
    throw new Error('Ledger outbox publisher is not configured');
  },
};

export const UNCONFIGURED_LEDGER_OUTBOX_PUBLISHER: LedgerOutboxPublisherBinding = {
  configured: false,
  name: 'unconfigured',
  publisher: unconfiguredPublisher,
};
