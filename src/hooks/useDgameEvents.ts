import { useQuery } from '@tanstack/react-query';
import { useBlockNumber, usePublicClient } from 'wagmi';

import type { DgameDeployment } from '../contracts/addresses';
import {
  type GachaRequestEvent,
  gachaRequestedEvent,
  toGachaRequestEvent,
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

const defaultBlockLookback = 500n;

function getFromBlock(currentBlock: bigint, blockLookback: bigint) {
  return currentBlock > blockLookback ? currentBlock - blockLookback : 0n;
}

export function usePlayerGachaRequests({
  blockLookback = defaultBlockLookback,
  deployment: deploymentOverride,
  enabled = true,
  playerId,
}: UsePlayerGachaRequestsOptions) {
  const client = usePublicClient();
  const { deployment } = useDgameDeployment({ deployment: deploymentOverride });
  const blockNumber = useBlockNumber({
    query: {
      enabled: enabled && Boolean(client),
    },
  });

  return useQuery({
    enabled:
      enabled &&
      Boolean(client) &&
      Boolean(deployment.gachaPoolProxy) &&
      playerId !== undefined &&
      blockNumber.data !== undefined,
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
      if (!client || !deployment.gachaPoolProxy || playerId === undefined || blockNumber.data === undefined) {
        return [] satisfies GachaRequestEvent[];
      }

      const logs = await client.getLogs({
        address: deployment.gachaPoolProxy,
        event: gachaRequestedEvent,
        fromBlock: getFromBlock(blockNumber.data, blockLookback),
        toBlock: blockNumber.data,
      });

      return logs
        .map((log) => toGachaRequestEvent(log))
        .filter((event) => event.playerId === playerId)
        .sort((left, right) => Number(right.blockNumber - left.blockNumber));
    },
  });
}

