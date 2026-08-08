import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { InternalServiceGuard } from './internal-service.guard';
import { LedgerReadService } from './ledger-read.service';
import { validateLedgerWriteRequest } from './ledger-write.validation';
import { LedgerWriteService } from './ledger-write.service';

const parseDate = (value: string | undefined, field: string): Date | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${field} must be a valid ISO-8601 date-time.`);
  }
  return date;
};

const parseLimit = (value: string | undefined): number => {
  if (value === undefined) {
    return 50;
  }

  if (!/^\d+$/.test(value)) {
    throw new BadRequestException('limit must be an integer between 1 and 100.');
  }

  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException('limit must be an integer between 1 and 100.');
  }
  return limit;
};

@UseGuards(InternalServiceGuard)
@Controller({ path: 'internal/ledger', version: '1' })
export class LedgerController {
  public constructor(
    private readonly ledgerReadService: LedgerReadService,
    private readonly ledgerWriteService: LedgerWriteService,
  ) {}

  @Post('transactions')
  public async postTransaction(@Body() body: unknown) {
    const validation = validateLedgerWriteRequest(body);
    if (!validation.valid || validation.value === undefined) {
      throw new BadRequestException({
        message: 'Ledger write request is invalid.',
        errors: validation.errors,
      });
    }

    return this.ledgerWriteService.post(validation.value);
  }

  @Get('transactions/:transactionId')
  public async getTransaction(
    @Param('transactionId', new ParseUUIDPipe({ version: '4' })) transactionId: string,
  ) {
    const transaction = await this.ledgerReadService.getTransaction(transactionId);
    if (transaction === null) {
      throw new NotFoundException('Ledger transaction not found.');
    }
    return transaction;
  }

  @Get('accounts/:accountId')
  public async getAccount(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
  ) {
    const account = await this.ledgerReadService.getAccount(accountId);
    if (account === null) {
      throw new NotFoundException('Ledger account not found.');
    }
    return account;
  }

  @Get('accounts/:accountId/balance')
  public async getBalance(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
  ) {
    const balance = await this.ledgerReadService.getBalance(accountId);
    if (balance === null) {
      throw new NotFoundException('Ledger balance not found.');
    }
    return balance;
  }

  @Get('accounts/:accountId/entries')
  public async listEntries(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedFrom = parseDate(from, 'from');
    const parsedTo = parseDate(to, 'to');
    if (parsedFrom !== undefined && parsedTo !== undefined && parsedFrom > parsedTo) {
      throw new BadRequestException('from must be earlier than or equal to to.');
    }

    try {
      return await this.ledgerReadService.listEntries({
        accountId,
        ...(parsedFrom === undefined ? {} : { from: parsedFrom }),
        ...(parsedTo === undefined ? {} : { to: parsedTo }),
        ...(cursor === undefined ? {} : { cursor }),
        limit: parseLimit(limit),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_LEDGER_CURSOR') {
        throw new BadRequestException('cursor is invalid.');
      }
      throw error;
    }
  }
}
