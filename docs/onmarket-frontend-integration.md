# OnMarket Frontend Integration Guide

This document is for frontend agents and frontend engineers integrating the onMarket version of Dgame-core.

## What This System Is

The onMarket deployment is a UUPS proxy based gacha system with an external merchant/onMarket payment layer.

There are four main proxy contracts the frontend usually talks to:

- `CharacterUUPS`: ERC721 character/IP NFT contract. Characters have score, level, and level pools.
- `CharacterMarketOnMarketUUPS`: player NFT + gacha business contract. This is the main gameplay contract.
- `CharacterMarketMerchantUUPS`: merchant adapter contract connected to external onMarket. It handles payment routing, owner balance, registration, and trade callbacks.
- `GachaPoolUUPS`: batched randomness/request/resolve contract.

There is also an ERC20 asset contract, usually `MyERC20` on local dev or a real token address on deployed networks.

## Deployment Files

The onMarket deploy script writes:

- `deployments/onmarket-uups.latest.json`
- `deployments/onmarket-uups.latest.env`

Use `deployments/onmarket-uups.latest.json` as the frontend source of truth for contract addresses.

Important JSON fields:

```json
{
  "asset": "0x...",
  "onMarket": "0x...",
  "usingMockMarket": true,
  "characterProxy": "0x...",
  "merchantProxy": "0x...",
  "marketProxy": "0x...",
  "gachaPoolProxy": "0x..."
}
```

When `usingMockMarket` is `true`, the `onMarket` address is a local `MockMarket` used only for local testing. When `usingMockMarket` is `false`, `onMarket` is the real external Market contract.

## ABI Mapping

Use implementation ABIs with proxy addresses.

Minimum frontend ABI set:

| Address field | ABI file | Purpose |
| --- | --- | --- |
| `asset` | `MyERC20.json` or ERC20 ABI | approve, balanceOf, transfer |
| `characterProxy` | `CharacterUUPS.json` | mint/read character NFTs and level pools |
| `marketProxy` | `CharacterMarketOnMarketUUPS.json` | player mint, gacha, claim, claimReward, balances |
| `merchantProxy` | `CharacterMarketMerchantUUPS.json` | ownerBalance, depositOwnerBalance, register, tradeOut |
| `gachaPoolProxy` | `GachaPoolUUPS.json` | commitBatch, resolveRoll, request/batch reads |
| `onMarket` | `IMarket.json` or real Market ABI | external trade/register integration |

Useful interface ABIs:

- `ICharacterMarket.json`
- `ICharacterContract.json`
- `IGachaPool.json`
- `ILevelERC721.json`
- `IMerchantTradeIn.json`

## Main User Concepts

### Character NFT

A character is an IP/character token minted by `CharacterUUPS`.

Useful calls:

```solidity
character.mint(attributes, characterCID) returns (characterId)
character.getCharacter(characterId)
character.getTokenInfo(characterId) returns (score, level, number)
character.getTokenIn(level) returns (uint256[])
character.getTokenLengthIn(level)
```

Level starts at `1` after sales/score is initialized. The market initializes thresholds in token decimals.

### Player NFT

A player profile is an ERC721 minted by `CharacterMarketOnMarketUUPS`.

```solidity
market.mint() returns (playerId)
market.ownerOf(playerId)
```

Most gameplay calls require the caller to own or be approved for the player NFT.

### Player Balances

Read player balances from:

```solidity
market.playInfo(playerId)
```

Returns:

```solidity
gameToken
exchangeToken
freeExchangeToken
```

Meaning:

- `gameToken`: deposited gameplay balance used for gacha.
- `exchangeToken`: balance generated from gacha spending, used to buy characters.
- `freeExchangeToken`: fallback compensation from empty pools.

## Payment Architecture

The frontend should understand that the onMarket version does not deposit directly into the market contract.

Payment flow:

```text
User wallet
  -> external onMarket.trade(...)
  -> CharacterMarketMerchantUUPS.tradeIn(...)
  -> CharacterMarketOnMarketUUPS.depositGameToken(playerId, amount)
```

`CharacterMarketOnMarketUUPS.depositGameToken` can only be called by the merchant adapter contract.

For local mock deployments, the frontend can call `MockMarket.trade(...)` directly because the deploy script creates a mock `onMarket` contract.

For real deployments, the frontend must follow the real external onMarket contract flow.

## Local Mock Recharge Flow

Use this only when `usingMockMarket == true`.

1. Approve asset to the `onMarket` address:

```solidity
asset.approve(onMarketAddress, amount)
```

2. Call mock `onMarket.trade`:

```solidity
onMarket.trade(
  buyer,                 // usually user wallet
  merchantProxy,         // CharacterMarketMerchantUUPS proxy
  uint160(playerId),     // rechargeTarget encoded as playerId
  amount,
  "0x"
)
```

3. Read:

```solidity
market.playInfo(playerId)
```

Expected result: `gameToken` increases by `amount`.

## Gacha Flow

1. Ensure player has `gameToken`.
2. Ensure at least one valid character exists for target rarity/pool.
3. User calls:

```solidity
market.gacha(
  gachaPoolProxy,
  playerId,
  roundCount,
  characterId,
  rarity
) returns (requestId)
```

4. Wait until a later block.
5. Anyone can call:

```solidity
gachaPool.commitBatch()
gachaPool.resolveRoll(requestId)
```

On local Anvil, mine one block before commit:

```bash
cast rpc anvil_mine 0x1 --rpc-url http://127.0.0.1:8545
```

After resolve, read:

```solidity
market.getPlayerPurchase(playerId, characterId)
market.playInfo(playerId)
```

## Owner Revenue Flow

Gacha and purchases create protocol owner revenue in:

```solidity
market.totalSales()
```

Owner claim does not directly transfer money out. It credits the merchant adapter's owner ledger:

```solidity
market.claim()
merchant.ownerBalance()
```

The owner can manually add cold-start funds:

```solidity
asset.approve(merchantProxy, amount)
merchant.depositOwnerBalance(amount)
merchant.ownerBalance()
```

The owner can spend internal owner balance for merchant registration:

```solidity
merchant.register(amount)
```

This spends `ownerBalance`, not arbitrary funds belonging to users/IP owners.

The owner can also use owner balance through:

```solidity
merchant.tradeOut(buyer, settlementMerchant, rechargeTarget, amount, data)
```

If `msg.sender == owner`, `tradeOut` spends from `ownerBalance`.

## IP / Character Owner Reward Flow

Each character has an accumulated reward balance:

```solidity
market.characterBalance(characterId)
```

The authorized character owner can claim through custom onMarket settlement routing:

```solidity
market.claimReward(
  characterId,
  settlementMerchant,
  rechargeTarget,
  data
)
```

The protocol fixes `buyer` and `amount` internally:

- `buyer` is the merchant adapter address.
- `amount` is the recorded `characterBalance(characterId)`.

The IP owner controls only:

- `settlementMerchant`
- `rechargeTarget`
- `data`

This lets the IP owner route their settlement without changing the amount or protocol buyer identity.

## Useful Read Calls

```solidity
market.playInfo(playerId)
market.getPlayerPurchase(playerId, characterId)
market.characterBalance(characterId)
market.totalSales()
market.isGachaPool(pool)

merchant.ownerBalance()
merchant.business()
merchant.market()
merchant.underlying()

pool.currentBatchId()
pool.nextRequestId()
pool.rolls(requestId)
pool.batches(batchId)

character.getTokenInfo(characterId)
character.getTokenIn(level)
character.getTokenLengthIn(level)
```

## Important Units

The default local token `MyERC20` uses 6 decimals.

Common script defaults:

```text
DEPOSIT_AMOUNT=1000000000   // 1000 tokens with 6 decimals
ROUND_COUNT=10
RARITY=1
```

For rarity 1, the current gacha fee is `1_000_000` per pull with 6 decimals.

## Common Local Commands

Deploy local onMarket mock version:

```bash
forge script script/DeployOnMarketUUPS.s.sol:DeployOnMarketUUPS \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

Request gacha:

```bash
INTERACTION_ACTION=request forge script script/InteractOnMarketUUPS.s.sol:InteractOnMarketUUPS \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

Mine one block:

```bash
cast rpc anvil_mine 0x1 --rpc-url http://127.0.0.1:8545
```

Resolve:

```bash
INTERACTION_ACTION=resolve forge script script/InteractOnMarketUUPS.s.sol:InteractOnMarketUUPS \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

Check status:

```bash
INTERACTION_ACTION=status forge script script/InteractOnMarketUUPS.s.sol:InteractOnMarketUUPS \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

Owner claim and register:

```bash
INTERACTION_ACTION=ownerClaim forge script script/InteractOnMarketUUPS.s.sol:InteractOnMarketUUPS \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast

INTERACTION_ACTION=ownerRegister OWNER_REGISTER_AMOUNT=100000000 forge script script/InteractOnMarketUUPS.s.sol:InteractOnMarketUUPS \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

Owner cold-start deposit:

```bash
INTERACTION_ACTION=ownerDeposit OWNER_DEPOSIT_AMOUNT=100000000 forge script script/InteractOnMarketUUPS.s.sol:InteractOnMarketUUPS \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

## Frontend Implementation Notes

- Always use proxy addresses with implementation ABIs.
- Do not call `market.depositGameToken` from the frontend; it is merchant-only.
- For local mock mode, call `onMarket.trade` to recharge a player.
- For real onMarket mode, follow the real onMarket app's trade flow.
- Gacha request and resolve are separate transactions and must happen in different blocks.
- `market.claim()` credits `merchant.ownerBalance`; it does not send ERC20 directly to the owner.
- `merchant.register(amount)` spends owner ledger balance.
- IP reward claim uses `market.claimReward(...)`, not direct ERC20 transfer.