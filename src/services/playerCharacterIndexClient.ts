export type PlayerCharacterHoldingDto = {
  playerId: string;
  characterId: string;
  purchaseCount: string;
  spent: string;
  characterCID?: string;
  name?: string;
  level?: number;
  score?: string;
  rewardBalance?: string;
  updatedAt: string;
  verifiedBlockNumber: string;
  transactionHash?: string;
};

export type SyncPlayerCharacterHoldingRequest = {
  playerId: string;
  characterId: string;
  transactionHash?: string;
};

type HoldingsResponse = {
  holdings: PlayerCharacterHoldingDto[];
};

type SyncResponse = {
  holding?: PlayerCharacterHoldingDto;
  removed: boolean;
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Player character index request failed');
  }

  return data as T;
}

export async function fetchPlayerCharacterHoldings(playerId: string) {
  const response = await fetch(
    `/api/player-character-index?playerId=${encodeURIComponent(playerId)}`,
  );
  const data = await readJsonResponse<HoldingsResponse>(response);

  return data.holdings;
}

export async function syncPlayerCharacterHolding(
  request: SyncPlayerCharacterHoldingRequest,
) {
  const response = await fetch('/api/player-character-index', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return readJsonResponse<SyncResponse>(response);
}

export async function refreshPlayerCharacterHoldings(playerId: string) {
  const response = await fetch('/api/player-character-index', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'refreshPlayer', playerId }),
  });
  const data = await readJsonResponse<HoldingsResponse>(response);

  return data.holdings;
}
