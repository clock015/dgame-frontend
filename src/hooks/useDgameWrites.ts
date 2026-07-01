import { useCallback } from 'react';
import type { Address, Hex } from 'viem';
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import {
  characterAbi,
  erc20Abi,
  gachaPoolAbi,
  marketAbi,
  merchantAbi,
  mockMarketAbi,
} from '../contracts/abis';
import type { DgameDeployment } from '../contracts/addresses';
import type {
  ClaimRewardViaMerchantParams,
  GachaRequestParams,
  MintCharacterParams,
  MockRechargeParams,
  OwnerTradeOutParams,
} from '../contracts/types';
import { useDgameDeployment } from './useDgameDeployment';

type WriteOptions = {
  deployment?: DgameDeployment;
};

const emptyData = '0x' satisfies Hex;

function requireAddress(address: Address | undefined, label: string): Address {
  if (!address) {
    throw new Error(`Missing ${label} address`);
  }

  return address;
}

export function useDgameTransactions(options: WriteOptions = {}) {
  const { address } = useAccount();
  const { deployment } = useDgameDeployment({ deployment: options.deployment });
  const write = useWriteContract();
  const receipt = useWaitForTransactionReceipt({
    hash: write.data,
    query: {
      enabled: Boolean(write.data),
    },
  });

  const approveAsset = useCallback(
    (spender: Address, amount: bigint) =>
      write.writeContract({
        address: requireAddress(deployment.asset, 'asset'),
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
      }),
    [deployment.asset, write],
  );

  const mintPlayer = useCallback(
    () =>
      write.writeContract({
        address: requireAddress(deployment.marketProxy, 'marketProxy'),
        abi: marketAbi,
        functionName: 'mint',
      }),
    [deployment.marketProxy, write],
  );

  const requestGacha = useCallback(
    (params: GachaRequestParams) =>
      write.writeContract({
        address: requireAddress(deployment.marketProxy, 'marketProxy'),
        abi: marketAbi,
        functionName: 'gacha',
        args: [
          requireAddress(deployment.gachaPoolProxy, 'gachaPoolProxy'),
          params.playerId,
          params.roundCount,
          params.characterId,
          params.rarity,
        ],
      }),
    [deployment.gachaPoolProxy, deployment.marketProxy, write],
  );

  const mintCharacter = useCallback(
    (params: MintCharacterParams) =>
      write.writeContract({
        address: requireAddress(deployment.characterProxy, 'characterProxy'),
        abi: characterAbi,
        functionName: 'mint',
        args: [params.attributes, params.characterCID, params.name],
      }),
    [deployment.characterProxy, write],
  );

  const commitGachaBatch = useCallback(
    () =>
      write.writeContract({
        address: requireAddress(deployment.gachaPoolProxy, 'gachaPoolProxy'),
        abi: gachaPoolAbi,
        functionName: 'commitBatch',
      }),
    [deployment.gachaPoolProxy, write],
  );

  const resolveGachaRoll = useCallback(
    (requestId: bigint) =>
      write.writeContract({
        address: requireAddress(deployment.gachaPoolProxy, 'gachaPoolProxy'),
        abi: gachaPoolAbi,
        functionName: 'resolveRoll',
        args: [requestId],
      }),
    [deployment.gachaPoolProxy, write],
  );

  const mockRechargePlayer = useCallback(
    (params: MockRechargeParams) => {
      if (!deployment.usingMockMarket) {
        throw new Error('Mock recharge is only available when usingMockMarket is true');
      }

      return write.writeContract({
        address: requireAddress(deployment.onMarket, 'onMarket'),
        abi: mockMarketAbi,
        functionName: 'trade',
        args: [
          params.buyer,
          requireAddress(deployment.merchantProxy, 'merchantProxy'),
          params.playerId,
          params.amount,
          params.data ?? emptyData,
        ],
      });
    },
    [
      deployment.merchantProxy,
      deployment.onMarket,
      deployment.usingMockMarket,
      write,
    ],
  );

  const mockRechargeConnectedPlayer = useCallback(
    (playerId: bigint, amount: bigint, data: Hex = emptyData) => {
      if (!address) {
        throw new Error('Connect a wallet before recharging');
      }

      return mockRechargePlayer({
        buyer: address,
        playerId,
        amount,
        data,
      });
    },
    [address, mockRechargePlayer],
  );

  const claimOwnerSales = useCallback(
    () =>
      write.writeContract({
        address: requireAddress(deployment.marketProxy, 'marketProxy'),
        abi: marketAbi,
        functionName: 'claim',
      }),
    [deployment.marketProxy, write],
  );

  const depositOwnerBalance = useCallback(
    (amount: bigint) =>
      write.writeContract({
        address: requireAddress(deployment.merchantProxy, 'merchantProxy'),
        abi: merchantAbi,
        functionName: 'depositOwnerBalance',
        args: [amount],
      }),
    [deployment.merchantProxy, write],
  );

  const registerMerchant = useCallback(
    (amount: bigint) =>
      write.writeContract({
        address: requireAddress(deployment.merchantProxy, 'merchantProxy'),
        abi: merchantAbi,
        functionName: 'register',
        args: [amount],
      }),
    [deployment.merchantProxy, write],
  );

  const ownerTradeOut = useCallback(
    (params: OwnerTradeOutParams) =>
      write.writeContract({
        address: requireAddress(deployment.merchantProxy, 'merchantProxy'),
        abi: merchantAbi,
        functionName: 'tradeOut',
        args: [
          params.buyer,
          params.merchant,
          params.rechargeTarget,
          params.amount,
          params.data ?? emptyData,
        ],
      }),
    [deployment.merchantProxy, write],
  );

  const claimRewardViaMerchant = useCallback(
    (params: ClaimRewardViaMerchantParams) =>
      write.writeContract({
        address: requireAddress(deployment.marketProxy, 'marketProxy'),
        abi: marketAbi,
        functionName: 'claimReward',
        args: [
          params.characterId,
          params.settlementMerchant,
          params.rechargeTarget,
          params.data ?? emptyData,
        ],
      }),
    [deployment.marketProxy, write],
  );

  return {
    hash: write.data,
    writeError: write.error,
    receipt,
    isPendingWallet: write.isPending,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    approveAsset,
    mintPlayer,
    mintCharacter,
    requestGacha,
    commitGachaBatch,
    resolveGachaRoll,
    mockRechargePlayer,
    mockRechargeConnectedPlayer,
    claimOwnerSales,
    depositOwnerBalance,
    registerMerchant,
    ownerTradeOut,
    claimRewardViaMerchant,
  };
}
