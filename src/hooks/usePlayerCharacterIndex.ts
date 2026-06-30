import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchPlayerCharacterHoldings,
  syncPlayerCharacterHolding,
  type SyncPlayerCharacterHoldingRequest,
} from '../services/playerCharacterIndexClient';
import { parsePositiveBigInt } from '../utils/format';

export function playerCharacterHoldingsQueryKey(playerId: string | undefined) {
  return ['player-character-holdings', playerId] as const;
}

export function usePlayerCharacterHoldings(playerId: string) {
  const parsedPlayerId = parsePositiveBigInt(playerId);
  const normalizedPlayerId = parsedPlayerId?.toString();

  return useQuery({
    queryKey: playerCharacterHoldingsQueryKey(normalizedPlayerId),
    queryFn: () => fetchPlayerCharacterHoldings(normalizedPlayerId ?? '0'),
    enabled: normalizedPlayerId !== undefined,
  });
}

export function useSyncPlayerCharacterHolding() {
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
