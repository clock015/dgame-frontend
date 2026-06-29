import type { Abi } from 'viem';

import characterAbiJson from '../../abis/CharacterUUPS.json';
import gachaPoolAbiJson from '../../abis/GachaPoolUUPS.json';
import marketAbiJson from '../../abis/CharacterMarketOnMarketUUPS.json';
import merchantAbiJson from '../../abis/CharacterMarketMerchantUUPS.json';

export const characterAbi = characterAbiJson as Abi;
export const gachaPoolAbi = gachaPoolAbiJson as Abi;
export const marketAbi = marketAbiJson as Abi;
export const merchantAbi = merchantAbiJson as Abi;

export const erc20Abi = [
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const satisfies Abi;

export const mockMarketAbi = [
  {
    type: 'function',
    name: 'trade',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'buyer', type: 'address' },
      { name: 'merchant', type: 'address' },
      { name: 'rechargeTarget', type: 'uint160' },
      { name: 'amount', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [],
  },
] as const satisfies Abi;
