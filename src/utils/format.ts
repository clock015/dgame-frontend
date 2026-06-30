export function formatAddress(address: string | undefined, visible = 4) {
  if (!address) {
    return 'Not set';
  }

  return `${address.slice(0, visible + 2)}...${address.slice(-visible)}`;
}

export function formatInteger(value: bigint | number | undefined) {
  if (value === undefined) {
    return '-';
  }

  return value.toLocaleString();
}

export function formatTokenAmount(value: bigint | undefined, decimals = 6) {
  if (value === undefined) {
    return '-';
  }

  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;
  const fractionText = fraction
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '')
    .slice(0, 4);

  return fractionText ? `${whole}.${fractionText}` : whole.toString();
}

export function parsePositiveBigInt(value: string) {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }

  return BigInt(trimmed);
}

export function parseTokenUnits(value: string, decimals = 6) {
  const trimmed = value.trim();

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return undefined;
  }

  const [whole, fraction = ''] = trimmed.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);

  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(paddedFraction || '0');
}
