export type PlayerCharacterHolding = {
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

export type PlayerCharacterIndexSnapshot = {
  version: 1;
  holdings: Record<string, PlayerCharacterHolding>;
};

export type SyncPlayerCharacterInput = {
  playerId: string;
  characterId: string;
  transactionHash?: string;
};

export type SyncPlayerCharacterResult = {
  holding?: PlayerCharacterHolding;
  removed: boolean;
};
