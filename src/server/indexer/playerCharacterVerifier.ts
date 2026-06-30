import { createPublicClient, http } from 'viem';
import { foundry } from 'viem/chains';

import { characterAbi, marketAbi } from '../../contracts/abis';
import { deploymentFromEnv } from '../../contracts/addresses';
import type { CharacterMetadata, CharacterTokenInfo, PlayerPurchase } from '../../contracts/types';
import type {
  PlayerCharacterHolding,
  SyncPlayerCharacterInput,
  SyncPlayerCharacterResult,
} from './types';

const numericIdPattern = /^\d+$/;
const txHashPattern = /^0x[a-fA-F0-9]{64}$/;

function rpcUrl() {
  return (
    process.env.DGAME_RPC_URL ||
    process.env.NEXT_PUBLIC_DGAME_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    'http://127.0.0.1:8545'
  );
}

function createIndexerClient() {
  return createPublicClient({
    chain: foundry,
    transport: http(rpcUrl()),
  });
}

function assertNumericId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !numericIdPattern.test(value)) {
    throw new Error(`${field} must be a non-negative integer string`);
  }

  return BigInt(value).toString();
}

function normalizeTransactionHash(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string' || !txHashPattern.test(value)) {
    throw new Error('transactionHash must be a transaction hash');
  }

  return value;
}

function toPlayerPurchase(value: unknown): PlayerPurchase {
  if (Array.isArray(value)) {
    const [purchaseCount, spent] = value as [bigint, bigint];
    return { purchaseCount, spent };
  }

  const purchase = value as { purchaseCount: bigint; spent: bigint };
  return {
    purchaseCount: purchase.purchaseCount,
    spent: purchase.spent,
  };
}

function toCharacterMetadata(value: unknown): CharacterMetadata {
  if (Array.isArray(value)) {
    const [attributes, characterCID] = value as [bigint, string];
    return { attributes, characterCID };
  }

  const metadata = value as { attributes: bigint; characterCID: string };
  return {
    attributes: metadata.attributes,
    characterCID: metadata.characterCID,
  };
}

function toCharacterTokenInfo(value: unknown): CharacterTokenInfo {
  if (Array.isArray(value)) {
    const [score, level, number] = value as [bigint, number, bigint];
    return { score, level, number };
  }

  const tokenInfo = value as { score: bigint; level: number; number: bigint };
  return {
    score: tokenInfo.score,
    level: tokenInfo.level,
    number: tokenInfo.number,
  };
}

export function parseSyncPlayerCharacterInput(body: unknown): SyncPlayerCharacterInput {
  const input = body as Record<string, unknown>;

  return {
    playerId: assertNumericId(input.playerId, 'playerId'),
    characterId: assertNumericId(input.characterId, 'characterId'),
    transactionHash: normalizeTransactionHash(input.transactionHash),
  };
}

export function parsePlayerIdQuery(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return assertNumericId(raw, 'playerId');
}

export async function verifyPlayerCharacterHolding(
  input: SyncPlayerCharacterInput,
): Promise<SyncPlayerCharacterResult> {
  const deployment = deploymentFromEnv(process.env);

  if (!deployment.marketProxy || !deployment.characterProxy) {
    throw new Error('Missing marketProxy or characterProxy deployment address');
  }

  const client = createIndexerClient();
  const playerId = BigInt(input.playerId);
  const characterId = BigInt(input.characterId);

  const [blockNumber, purchaseValue] = await Promise.all([
    client.getBlockNumber(),
    client.readContract({
      address: deployment.marketProxy,
      abi: marketAbi,
      functionName: 'getPlayerPurchase',
      args: [playerId, characterId],
    }),
  ]);

  const purchase = toPlayerPurchase(purchaseValue);

  if (purchase.purchaseCount === 0n && purchase.spent === 0n) {
    return { removed: true };
  }

  const [metadataValue, tokenInfoValue, rewardBalanceValue] = await Promise.all([
    client.readContract({
      address: deployment.characterProxy,
      abi: characterAbi,
      functionName: 'getCharacter',
      args: [characterId],
    }),
    client.readContract({
      address: deployment.characterProxy,
      abi: characterAbi,
      functionName: 'getTokenInfo',
      args: [characterId],
    }),
    client.readContract({
      address: deployment.marketProxy,
      abi: marketAbi,
      functionName: 'characterBalance',
      args: [characterId],
    }),
  ]);

  const metadata = toCharacterMetadata(metadataValue);
  const tokenInfo = toCharacterTokenInfo(tokenInfoValue);

  const holding: PlayerCharacterHolding = {
    playerId: input.playerId,
    characterId: input.characterId,
    purchaseCount: purchase.purchaseCount.toString(),
    spent: purchase.spent.toString(),
    characterCID: metadata.characterCID,
    level: tokenInfo.level,
    score: tokenInfo.score.toString(),
    rewardBalance: (rewardBalanceValue as bigint).toString(),
    updatedAt: new Date().toISOString(),
    verifiedBlockNumber: blockNumber.toString(),
    transactionHash: input.transactionHash,
  };

  return { holding, removed: false };
}

