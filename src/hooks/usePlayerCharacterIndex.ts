import { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchPlayerCharacterHoldings,
  refreshPlayerCharacterHoldings,
  syncPlayerCharacterHolding,
  type SyncPlayerCharacterHoldingRequest,
} from '../services/playerCharacterIndexClient';
import { parsePositiveBigInt } from '../utils/format';

export type PlayerCharacterSyncHint = SyncPlayerCharacterHoldingRequest & {
  sourceId: string;
};

export function playerCharacterHoldingsQueryKey(playerId: string | undefined) {
  return ['player-character-holdings', playerId] as const;
}

function normalizeId(value: string) {
  return parsePositiveBigInt(value)?.toString();
}

function useSyncMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SyncPlayerCharacterHoldingRequest) =>
      syncPlayerCharacterHolding(request),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: playerCharacterHoldingsQueryKey(variables.playerId),
      });
    },
  });
}

export function usePlayerCharacterHoldings(playerId: string) {
  const normalizedPlayerId = normalizeId(playerId);

  return useQuery({
    queryKey: playerCharacterHoldingsQueryKey(normalizedPlayerId),
    queryFn: () => fetchPlayerCharacterHoldings(normalizedPlayerId ?? '0'),
    enabled: normalizedPlayerId !== undefined,
  });
}

export function useSyncPlayerCharacterHolding() {
  return useSyncMutation();
}
export function useRefreshPlayerCharacterHoldings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playerId: string) => refreshPlayerCharacterHoldings(playerId),
    onSuccess: (_data, playerId) => {
      queryClient.invalidateQueries({
        queryKey: playerCharacterHoldingsQueryKey(playerId),
      });
    },
  });
}

export function useAutoSyncCurrentPlayerCharacter(
  playerId: string,
  characterId: string,
  refreshKey?: string,
) {
  const normalizedPlayerId = normalizeId(playerId);
  const normalizedCharacterId = normalizeId(characterId);
  const syncHolding = useSyncMutation();
  const lastSyncedKey = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!normalizedPlayerId || !normalizedCharacterId || syncHolding.isPending) {
      return;
    }

    const key = `${normalizedPlayerId}:${normalizedCharacterId}:${refreshKey ?? 'current'}`;
    if (lastSyncedKey.current === key) {
      return;
    }

    lastSyncedKey.current = key;
    syncHolding.mutate({
      playerId: normalizedPlayerId,
      characterId: normalizedCharacterId,
    });
  }, [normalizedCharacterId, normalizedPlayerId, refreshKey, syncHolding]);

  return syncHolding;
}
export function useAutoSyncPlayerCharacterHoldings(hints: PlayerCharacterSyncHint[]) {
  const syncHolding = useSyncMutation();
  const syncedKeys = useRef(new Set<string>());
  const stableHints = useMemo(
    () =>
      hints.filter((hint) => {
        return normalizeId(hint.playerId) !== undefined && normalizeId(hint.characterId) !== undefined;
      }),
    [hints],
  );

  useEffect(() => {
    if (syncHolding.isPending) {
      return;
    }

    const nextHint = stableHints.find((hint) => {
      const key = `${hint.sourceId}:${hint.playerId}:${hint.characterId}`;
      return !syncedKeys.current.has(key);
    });

    if (!nextHint) {
      return;
    }

    const key = `${nextHint.sourceId}:${nextHint.playerId}:${nextHint.characterId}`;
    syncedKeys.current.add(key);
    syncHolding.mutate({
      playerId: nextHint.playerId,
      characterId: nextHint.characterId,
      transactionHash: nextHint.transactionHash,
    });
  }, [stableHints, syncHolding]);

  return syncHolding;
}
