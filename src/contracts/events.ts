import { parseAbiItem } from 'viem';
import type { Hex } from 'viem';

export const gachaRequestedEvent = parseAbiItem(
  'event GachaRequested(uint256 indexed requestId, uint256 indexed batchId, uint256 playerId)',
);

type GachaRequestedLogLike = {
  args: {
    requestId?: bigint;
    batchId?: bigint;
    playerId?: bigint;
  };
  blockNumber: bigint;
  transactionHash: Hex;
};

export type GachaRequestEvent = {
  requestId: bigint;
  batchId: bigint;
  playerId: bigint;
  blockNumber: bigint;
  transactionHash: Hex;
};

export function toGachaRequestEvent(log: GachaRequestedLogLike): GachaRequestEvent {
  if (
    log.args.requestId === undefined ||
    log.args.batchId === undefined ||
    log.args.playerId === undefined
  ) {
    throw new Error('Malformed GachaRequested log');
  }

  return {
    requestId: log.args.requestId,
    batchId: log.args.batchId,
    playerId: log.args.playerId,
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
  };
}
