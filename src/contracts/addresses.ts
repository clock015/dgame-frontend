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

export function asOptionalBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value === 'true';
}

function firstDefined(...values: Array<string | undefined>) {
  return values.find((value) => value !== undefined && value !== '');
}

export function deploymentFromEnv(env: NodeJS.ProcessEnv): DgameDeployment {
  return {
    asset: asOptionalAddress(
      firstDefined(env.NEXT_PUBLIC_DGAME_ASSET, env.ASSET_ADDRESS),
    ),
    onMarket: asOptionalAddress(
      firstDefined(env.NEXT_PUBLIC_DGAME_ON_MARKET, env.ONMARKET_ADDRESS),
    ),
    usingMockMarket: asOptionalBoolean(
      firstDefined(
        env.NEXT_PUBLIC_DGAME_USING_MOCK_MARKET,
        env.ONMARKET_USING_MOCK,
      ),
    ),
    characterProxy: asOptionalAddress(
      firstDefined(env.NEXT_PUBLIC_DGAME_CHARACTER_PROXY, env.CHARACTER_PROXY),
    ),
    merchantProxy: asOptionalAddress(
      firstDefined(
        env.NEXT_PUBLIC_DGAME_MERCHANT_PROXY,
        env.CHARACTER_MARKET_MERCHANT_PROXY,
      ),
    ),
    marketProxy: asOptionalAddress(
      firstDefined(env.NEXT_PUBLIC_DGAME_MARKET_PROXY, env.MARKET_PROXY),
    ),
    gachaPoolProxy: asOptionalAddress(
      firstDefined(env.NEXT_PUBLIC_DGAME_GACHA_POOL_PROXY, env.GACHA_POOL_PROXY),
    ),
  };
}

export const envDeployment: DgameDeployment = deploymentFromEnv(process.env);

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
