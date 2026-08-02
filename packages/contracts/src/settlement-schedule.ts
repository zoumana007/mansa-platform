export const SETTLEMENT_FREQUENCIES = [
  'INSTANT',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'MANUAL',
] as const;

export const SETTLEMENT_SCHEDULE_STATUSES = ['ACTIVE', 'PAUSED', 'DISABLED'] as const;

export type SettlementFrequency = (typeof SETTLEMENT_FREQUENCIES)[number];
export type SettlementScheduleStatus = (typeof SETTLEMENT_SCHEDULE_STATUSES)[number];

export interface SettlementSchedule {
  readonly scheduleId: string;
  readonly merchantId: string;
  readonly frequency: SettlementFrequency;
  readonly timezone: string;
  readonly cutoffHourUtc?: number;
  readonly dayOfWeek?: number;
  readonly dayOfMonth?: number;
  readonly minimumAmountMinor: number;
  readonly currency: string;
  readonly status: SettlementScheduleStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateSettlementScheduleCommand {
  readonly scheduleId: string;
  readonly merchantId: string;
  readonly frequency: SettlementFrequency;
  readonly timezone: string;
  readonly cutoffHourUtc?: number;
  readonly dayOfWeek?: number;
  readonly dayOfMonth?: number;
  readonly minimumAmountMinor?: number;
  readonly currency: string;
  readonly createdAt: string;
}

export interface UpdateSettlementScheduleCommand {
  readonly frequency?: SettlementFrequency;
  readonly timezone?: string;
  readonly cutoffHourUtc?: number;
  readonly dayOfWeek?: number;
  readonly dayOfMonth?: number;
  readonly minimumAmountMinor?: number;
  readonly status?: SettlementScheduleStatus;
  readonly updatedAt: string;
}

function assertSafeIntegerInRange(value: number, min: number, max: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be a safe integer between ${min} and ${max}`);
  }
}

function validateScheduleShape(schedule: {
  readonly frequency: SettlementFrequency;
  readonly cutoffHourUtc?: number;
  readonly dayOfWeek?: number;
  readonly dayOfMonth?: number;
}): void {
  if (schedule.cutoffHourUtc !== undefined) {
    assertSafeIntegerInRange(schedule.cutoffHourUtc, 0, 23, 'cutoffHourUtc');
  }
  if (schedule.frequency === 'WEEKLY') {
    if (schedule.dayOfWeek === undefined) throw new Error('dayOfWeek is required for weekly schedules');
    assertSafeIntegerInRange(schedule.dayOfWeek, 1, 7, 'dayOfWeek');
  } else if (schedule.dayOfWeek !== undefined) {
    throw new Error('dayOfWeek is only allowed for weekly schedules');
  }
  if (schedule.frequency === 'MONTHLY') {
    if (schedule.dayOfMonth === undefined) throw new Error('dayOfMonth is required for monthly schedules');
    assertSafeIntegerInRange(schedule.dayOfMonth, 1, 28, 'dayOfMonth');
  } else if (schedule.dayOfMonth !== undefined) {
    throw new Error('dayOfMonth is only allowed for monthly schedules');
  }
}

export function isSettlementFrequency(value: string): value is SettlementFrequency {
  return SETTLEMENT_FREQUENCIES.includes(value as SettlementFrequency);
}

export function isSettlementScheduleStatus(value: string): value is SettlementScheduleStatus {
  return SETTLEMENT_SCHEDULE_STATUSES.includes(value as SettlementScheduleStatus);
}

export function createSettlementSchedule(
  command: CreateSettlementScheduleCommand,
): SettlementSchedule {
  if (!command.scheduleId || !command.merchantId) {
    throw new Error('scheduleId and merchantId are required');
  }
  if (!command.timezone.trim()) throw new Error('timezone is required');

  const minimumAmountMinor = command.minimumAmountMinor ?? 0;
  if (!Number.isSafeInteger(minimumAmountMinor) || minimumAmountMinor < 0) {
    throw new Error('minimumAmountMinor must be a non-negative safe integer');
  }

  const currency = command.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('currency must be a three-letter code');
  validateScheduleShape(command);

  return {
    ...command,
    timezone: command.timezone.trim(),
    minimumAmountMinor,
    currency,
    status: 'ACTIVE',
    updatedAt: command.createdAt,
  };
}

export function updateSettlementSchedule(
  current: SettlementSchedule,
  command: UpdateSettlementScheduleCommand,
): SettlementSchedule {
  const next: SettlementSchedule = {
    ...current,
    ...command,
    timezone: command.timezone?.trim() || current.timezone,
    updatedAt: command.updatedAt,
  };
  if (!next.timezone) throw new Error('timezone is required');
  if (!Number.isSafeInteger(next.minimumAmountMinor) || next.minimumAmountMinor < 0) {
    throw new Error('minimumAmountMinor must be a non-negative safe integer');
  }
  validateScheduleShape(next);
  return next;
}
