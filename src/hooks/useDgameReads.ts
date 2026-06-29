import { useMemo } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';

import {
  characterAbi,
  erc20Abi,
  gachaPoolAbi,
  marketAbi,
  merchantAbi,
} from '../contracts/abis';
import type { DgameDeployment } from '../contracts/addresses';
import type {
  CharacterMetadata,
  CharacterTokenInfo,
  GachaBatch,
  GachaRoll,
  PlayerBalance,
  PlayerPurchase,
} from '../contracts/types';
import { useDgameDeployment } from './useDgameDeployment';

type ReadOptions = {
  deployment?: DgameDeployment;
  enabled?: boolean;
};

function shouldRead(enabled: boolean | undefined, values: unknown[]) {
  return enabled !== false && values.every(Boolean);
}

export function usePlayerInfo(playerId: bigint | undefined, options: ReadOptions = {}) {
  const { deployment } = useDgameDeployment({ deployment: options.deployment });

  return useReadContract({
    address: deployment.marketProxy,
    abi: marketAbi,
    functionName: 'playInfo',
    args: playerId === undefined ? undefined : [playerId],
    query: {
      enabled: shouldRead(options.enabled, [deployment.marketProxy, playerId]),
      select: (value) => {
        const [gameToken, exchangeToken, freeExchangeToken] = value as [
          bigint,
          bigint,
          bigint,
        ];

        return { gameToken, exchangeToken, freeExchangeToken } satisfies PlayerBalance;
      },
    },
  });
}

export function usePlayerPurchase(
  playerId: bigint | undefined,
  characterId: bigint | undefined,
  options: ReadOptions = {},
) {
  const { deployment } = useDgameDeployment({ deployment: options.deployment });

  return useReadContract({
    address: deployment.marketProxy,
    abi: marketAbi,
    functionName: 'getPlayerPurchase',
    args:
      playerId === undefined || characterId === undefined
        ? undefined
        : [playerId, characterId],
    query: {
      enabled: shouldRead(options.enabled, [
        deployment.marketProxy,
        playerId,
        characterId,
      ]),
      select: (value) => {
        const [purchaseCount, spent] = value as [bigint, bigint];

        return { purchaseCount, spent } satisfies PlayerPurchase;
      },
    },
  });
}

export function usePlayerOwner(
  playerId: bigint | undefined,
  options: ReadOptions = {},
) {
  const { deployment } = useDgameDeployment({ deployment: options.deployment });

  return useReadContract({
    address: deployment.marketProxy,
    abi: marketAbi,
    functionName: 'ownerOf',
    args: playerId === undefined ? undefined : [playerId],
    query: {
      enabled: shouldRead(options.enabled, [deployment.marketProxy, playerId]),
    },
  });
}

export function useConnectedPlayerOwnership(
  playerId: bigint | undefined,
  options: ReadOptions = {},
) {
  const { address } = useAccount();
  const owner = usePlayerOwner(playerId, options);

  const isOwner = useMemo(() => {
    if (!address || !owner.data || typeof owner.data !== 'string') {
      return false;
    }

    return owner.data.toLowerCase() === address.toLowerCase();
  }, [address, owner.data]);

  return {
    ...owner,
    connectedAddress: address,
    isOwner,
  };
}

export function useCharacterInfo(
  characterId: bigint | undefined,
  options: ReadOptions = {},
) {
  const { deployment } = useDgameDeployment({ deployment: options.deployment });

  const result = useReadContracts({
    contracts:
      deployment.characterProxy && characterId !== undefined
        ? [
            {
              address: deployment.characterProxy,
              abi: characterAbi,
              functionName: 'getCharacter',
              args: [characterId],
            },
            {
              address: deployment.characterProxy,
              abi: characterAbi,
              functionName: 'getTokenInfo',
              args: [characterId],
            },
            {
              address: deployment.marketProxy,
              abi: marketAbi,
              functionName: 'characterBalance',
              args: [characterId],
            },
          ]
        : [],
    query: {
      enabled: shouldRead(options.enabled, [
        deployment.characterProxy,
        deployment.marketProxy,
        characterId,
      ]),
      select: (values) => {
        const characterResult = values[0];
        const tokenInfoResult = values[1];
        const balanceResult = values[2];

        const metadata =
          characterResult?.status === 'success'
            ? ({
                attributes: (characterResult.result as [bigint, string])[0],
                characterCID: (characterResult.result as [bigint, string])[1],
              } satisfies CharacterMetadata)
            : undefined;

        const tokenInfo =
          tokenInfoResult?.status === 'success'
            ? ({
                score: (tokenInfoResult.result as [bigint, number, bigint])[0],
                level: (tokenInfoResult.result as [bigint, number, bigint])[1],
                number: (tokenInfoResult.result as [bigint, number, bigint])[2],
              } satisfies CharacterTokenInfo)
            : undefined;

        const rewardBalance =
          balanceResult?.status === 'success'
            ? (balanceResult.result as bigint)
            : undefined;

        return {
          metadata,
          tokenInfo,
          rewardBalance,
          raw: values,
        };
      },
    },
  });

  return result;
}

export function useGachaRoll(
  requestId: bigint | undefined,
  options: ReadOptions = {},
) {
  const { deployment } = useDgameDeployment({ deployment: options.deployment });

  return useReadContract({
    address: deployment.gachaPoolProxy,
    abi: gachaPoolAbi,
    functionName: 'rolls',
    args: requestId === undefined ? undefined : [requestId],
    query: {
      enabled: shouldRead(options.enabled, [deployment.gachaPoolProxy, requestId]),
      select: (value) => {
        const [
          status,
          rarity,
          characterRarity,
          playerId,
          characterId,
          roundCount,
          batchId,
        ] = value as [number, number, number, bigint, bigint, bigint, bigint];

        return {
          status,
          rarity,
          characterRarity,
          playerId,
          characterId,
          roundCount,
          batchId,
        } satisfies GachaRoll;
      },
    },
  });
}

export function useGachaBatch(
  batchId: bigint | undefined,
  options: ReadOptions = {},
) {
  const { deployment } = useDgameDeployment({ deployment: options.deployment });

  return useReadContract({
    address: deployment.gachaPoolProxy,
    abi: gachaPoolAbi,
    functionName: 'batches',
    args: batchId === undefined ? undefined : [batchId],
    query: {
      enabled: shouldRead(options.enabled, [deployment.gachaPoolProxy, batchId]),
      select: (value) => {
        const [lastRequestBlock, randao, committed] = value as [
          bigint,
          bigint,
          boolean,
        ];

        return { lastRequestBlock, randao, committed } satisfies GachaBatch;
      },
    },
  });
}

export function useAssetBalance(options: ReadOptions = {}) {
  const { address } = useAccount();
  const { deployment } = useDgameDeployment({ deployment: options.deployment });

  return useReadContract({
    address: deployment.asset,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: shouldRead(options.enabled, [deployment.asset, address]),
    },
  });
}

export function useMerchantSummary(options: ReadOptions = {}) {
  const { deployment } = useDgameDeployment({ deployment: options.deployment });

  return useReadContracts({
    contracts: deployment.merchantProxy
      ? [
          {
            address: deployment.merchantProxy,
            abi: merchantAbi,
            functionName: 'ownerBalance',
          },
          {
            address: deployment.merchantProxy,
            abi: merchantAbi,
            functionName: 'business',
          },
          {
            address: deployment.merchantProxy,
            abi: merchantAbi,
            functionName: 'market',
          },
          {
            address: deployment.merchantProxy,
            abi: merchantAbi,
            functionName: 'underlying',
          },
        ]
      : [],
    query: {
      enabled: shouldRead(options.enabled, [deployment.merchantProxy]),
      select: (values) => ({
        ownerBalance:
          values[0]?.status === 'success'
            ? (values[0].result as bigint)
            : undefined,
        business:
          values[1]?.status === 'success'
            ? (values[1].result as string)
            : undefined,
        market:
          values[2]?.status === 'success'
            ? (values[2].result as string)
            : undefined,
        underlying:
          values[3]?.status === 'success'
            ? (values[3].result as string)
            : undefined,
        raw: values,
      }),
    },
  });
}

