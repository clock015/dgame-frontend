import type { Address, Hex } from 'viem';

export type PlayerId = bigint;
export type CharacterId = bigint;
export type RequestId = bigint;
export type TokenAmount = bigint;

export type PlayerBalance = {
  gameToken: bigint;
  exchangeToken: bigint;
  freeExchangeToken: bigint;
};

export type PlayerPurchase = {
  purchaseCount: bigint;
  spent: bigint;
};

export type CharacterMetadata = {
  attributes: bigint;
  characterCID: string;
  name: string;
};

export type CharacterTokenInfo = {
  score: bigint;
  level: number;
  number: bigint;
};

export type GachaRoll = {
  status: number;
  rarity: number;
  characterRarity: number;
  playerId: bigint;
  characterId: bigint;
  roundCount: bigint;
  batchId: bigint;
};

export type GachaBatch = {
  lastRequestBlock: bigint;
  randao: bigint;
  committed: boolean;
};

export type GachaRollStatus = 'unknown' | 'requested' | 'resolved';

export type GachaRollSummary = {
  requestId: RequestId;
  status: GachaRollStatus;
  rawStatus: number;
  playerId: bigint;
  characterId: bigint;
  batchId: bigint;
};

export type MockRechargeParams = {
  buyer: Address;
  playerId: PlayerId;
  amount: TokenAmount;
  data?: Hex;
};

export type GachaRequestParams = {
  playerId: PlayerId;
  roundCount: bigint;
  characterId: CharacterId;
  rarity: number;
};


export type MintCharacterParams = {
  attributes: bigint;
  characterCID: string;
  name: string;
};
export type ClaimRewardViaMerchantParams = {
  characterId: CharacterId;
  settlementMerchant: Address;
  rechargeTarget: bigint;
  data?: Hex;
};

export type OwnerTradeOutParams = {
  buyer: Address;
  merchant: Address;
  rechargeTarget: bigint;
  amount: TokenAmount;
  data?: Hex;
};
