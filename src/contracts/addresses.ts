import type { Address } from 'viem';

export type DgameDeployment = {
  asset?: Address;
  onMarket?: Address;
  usingMockMarket?: boolean;
  characterProxy?: Address;
  merchantProxy?: Address;
  marketProxy?: Address;
  gachaPoolProxy?: Address;
};

export type DgameContractKey = keyof Omit<DgameDeployment, 'usingMockMarket'>;

const addressPattern = /^0x[a-fA-F0-9]{40}$/;

export function asOptionalAddress(value: string | undefined): Address | undefined {
  if (!value || !addressPattern.test(value)) {
    return undefined;
  }

  return value as Address;
}

function asOptionalBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value === 'true';
}

export const envDeployment: DgameDeployment = {
  asset: asOptionalAddress(process.env.NEXT_PUBLIC_DGAME_ASSET),
  onMarket: asOptionalAddress(process.env.NEXT_PUBLIC_DGAME_ON_MARKET),
  usingMockMarket: asOptionalBoolean(
    process.env.NEXT_PUBLIC_DGAME_USING_MOCK_MARKET,
  ),
  characterProxy: asOptionalAddress(
    process.env.NEXT_PUBLIC_DGAME_CHARACTER_PROXY,
  ),
  merchantProxy: asOptionalAddress(
    process.env.NEXT_PUBLIC_DGAME_MERCHANT_PROXY,
  ),
  marketProxy: asOptionalAddress(process.env.NEXT_PUBLIC_DGAME_MARKET_PROXY),
  gachaPoolProxy: asOptionalAddress(
    process.env.NEXT_PUBLIC_DGAME_GACHA_POOL_PROXY,
  ),
};

export function mergeDeployments(
  override: DgameDeployment | undefined,
): DgameDeployment {
  return {
    ...envDeployment,
    ...override,
  };
}

export function hasAddress(
  deployment: DgameDeployment,
  key: DgameContractKey,
): boolean {
  return Boolean(deployment[key]);
}

export function listMissingAddresses(
  deployment: DgameDeployment,
  keys: DgameContractKey[],
): DgameContractKey[] {
  return keys.filter((key) => !hasAddress(deployment, key));
}
