import { useQuery } from '@tanstack/react-query';
import { useBlockNumber, usePublicClient } from 'wagmi';

import type { DgameDeployment } from '../contracts/addresses';
import {
  type GachaRequestEvent,
  type GachaResolvedEvent,
  gachaRequestedEvent,
  gachaResolvedEvent,
  toGachaRequestEvent,
  toGachaResolvedEvent,
} from '../contracts/events';
import { useDgameDeployment } from './useDgameDeployment';

type EventOptions = {
  deployment?: DgameDeployment;
  enabled?: boolean;
};

export type UsePlayerGachaRequestsOptions = EventOptions & {
  playerId?: bigint;
  blockLookback?: bigint;
};

export type UsePlayerGachaResolvedEventsOptions = EventOptions & {
  playerId?: bigint;
  blockLookback?: bigint;
};

const defaultBlockLookback = 500n;

function getFromBlock(currentBlock: bigint, blockLookback: bigint) {
  return currentBlock > blockLookback ? currentBlock - blockLookback : 0n;
}

function useCurrentBlock(enabled: boolean) {
  const client = usePublicClient();
  const blockNumber = useBlockNumber({
    watch: true,
    query: {
      enabled: enabled && Boolean(client),
    },
  });

  return { blockNumber, client };
}

export function usePlayerGachaRequests({
  blockLookback = defaultBlockLookback,
  deployment: deploymentOverride,
  enabled = true,
  playerId,
}: UsePlayerGachaRequestsOptions) {
  const { deployment } = useDgameDeployment({ deployment: deploymentOverride });
  const { blockNumber, client } = useCurrentBlock(enabled);

  return useQuery({
    enabled:
      enabled &&
      Boolean(client) &&
      Boolean(deployment.gachaPoolProxy) &&
      playerId !== undefined,
    queryKey: [
      'dgame',
      'events',
      'gachaRequested',
      deployment.gachaPoolProxy,
      playerId?.toString(),
      blockLookback.toString(),
      blockNumber.data?.toString(),
    ],
    queryFn: async () => {
      if (!client || !deployment.gachaPoolProxy || playerId === undefined) {
        return [] satisfies GachaRequestEvent[];
      }

      const currentBlock = await client.getBlockNumber();
      const logs = await client.getLogs({
        address: deployment.gachaPoolProxy,
        event: gachaRequestedEvent,
        args: { playerId },
        fromBlock: getFromBlock(currentBlock, blockLookback),
        toBlock: currentBlock,
      });

      return logs
        .map((log) => toGachaRequestEvent(log))
        .sort((left, right) => Number(right.blockNumber - left.blockNumber));
    },
  });
}

export function usePlayerGachaResolvedEvents({
  blockLookback = defaultBlockLookback,
  deployment: deploymentOverride,
  enabled = true,
  playerId,
}: UsePlayerGachaResolvedEventsOptions) {
  const { deployment } = useDgameDeployment({ deployment: deploymentOverride });
  const { blockNumber, client } = useCurrentBlock(enabled);

  return useQuery({
    enabled:
      enabled &&
      Boolean(client) &&
      Boolean(deployment.gachaPoolProxy) &&
      playerId !== undefined,
    queryKey: [
      'dgame',
      'events',
      'gachaResolved',
      deployment.gachaPoolProxy,
      playerId?.toString(),
      blockLookback.toString(),
      blockNumber.data?.toString(),
    ],
    queryFn: async () => {
      if (!client || !deployment.gachaPoolProxy || playerId === undefined) {
        return [] satisfies GachaResolvedEvent[];
      }

      const currentBlock = await client.getBlockNumber();
      const logs = await client.getLogs({
        address: deployment.gachaPoolProxy,
        event: gachaResolvedEvent,
        args: { playerId },
        fromBlock: getFromBlock(currentBlock, blockLookback),
        toBlock: currentBlock,
      });

      return logs
        .map((log) => toGachaResolvedEvent(log))
        .sort((left, right) => Number(right.blockNumber - left.blockNumber));
    },
  });
}
