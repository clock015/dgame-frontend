# AGENTS.md

Guidance for agents working in this repository.

## Project Identity

This repo is a RainbowKit starter frontend for Dgame. Treat it as an existing wallet-enabled Next.js app, not as a blank frontend project.

Current stack:

- Next.js
- React
- RainbowKit
- wagmi
- viem
- TypeScript

Keep RainbowKit wallet connection behavior intact unless the user explicitly asks to replace it.

## Important Paths

- `src/`: frontend app source.
- `src/wagmi.ts`: wagmi/RainbowKit chain and client configuration.
- `src/pages/`: Next.js pages.
- `abis/`: ABI files exported from the Solidity project.
- `docs/onmarket-frontend-integration.md`: primary contract-integration guide for the onMarket deployment.

Read `docs/onmarket-frontend-integration.md` before implementing contract calls.

## Contract Integration Model

The frontend should use implementation ABIs with proxy addresses.

Main contracts:

- `CharacterUUPS`: character/IP NFT contract.
- `CharacterMarketOnMarketUUPS`: main gameplay contract for player NFTs, balances, gacha, purchases, and claims.
- `CharacterMarketMerchantUUPS`: merchant adapter for onMarket routing, owner balance, registration, and trade callbacks.
- `GachaPoolUUPS`: gacha request, batch commit, and resolve contract.

The gameplay contract is not the direct payment entrypoint. Do not build frontend flows that call `CharacterMarketOnMarketUUPS.depositGameToken` directly. That method is merchant-only.

Recharge flow:

```text
User wallet
-> external onMarket.trade(...)
-> CharacterMarketMerchantUUPS.tradeIn(...)
-> CharacterMarketOnMarketUUPS.depositGameToken(playerId, amount)
```

For local mock deployments, the frontend may call the mock `onMarket.trade(...)` flow described in `docs/onmarket-frontend-integration.md`. For real deployments, follow the real external onMarket contract flow.

## Frontend Product Shape

Build the actual Dgame app surface, not a marketing landing page.

Prioritize these user workflows:

- Connect wallet.
- Load deployment addresses.
- Mint or select a player NFT.
- Read `playInfo(playerId)`.
- Recharge through onMarket/merchant flow.
- Request gacha.
- Commit and resolve gacha after a later block.
- Show character/IP reward balances.
- Support owner claim/register flows only in owner/admin views.

Keep UI state aligned with chain state. Prefer small contract hooks and typed helpers over scattering raw ABI calls across pages.

## ABI And Address Rules

- Keep ABI imports centralized when adding contract integration.
- Use proxy addresses from deployment files when available.
- If deployment files are not present in this repo, make the missing-address state explicit in the UI or config.
- The current ABI folder may not include ERC20 or external Market ABIs. Add a minimal ERC20 ABI or imported ABI before implementing approve/balance flows.
- Do not assume token decimals are 18. The local `MyERC20` described in the docs uses 6 decimals.

## Local Tooling Notes

This repo may appear under different names in context. The actual directory observed on this machine is:

```text
E:\_github\dgame-frontend
```

Some prior context may refer to:

```text
E:\_github\Dgame-front
```

Before running commands, confirm the real path with `Get-ChildItem E:\_github` or use the actual directory above.

PowerShell quoting can break regex commands that contain `|`, parentheses, or nested quotes. When inspecting JSON ABIs, prefer structured JSON parsing with `ConvertFrom-Json` over complex `rg` patterns.

Use `rg --files` for file discovery when possible. If a command fails because the working directory is invalid, retry with an explicit existing path instead of assuming the repository is missing.

## Change Discipline

- Keep docs-only requests under `docs/` unless the user asks for code changes.
- Keep contract integration changes scoped to frontend config, hooks, components, and ABI/address helpers.
- Do not modify ABI JSON manually unless the user asks for a frontend-local shim or a minimal interface ABI.
- Do not reinterpret the smart-contract payment direction. `tradeOut` initiates outgoing trade through the merchant/onMarket layer; `tradeIn` is the callback that receives settled value into Dgame logic.
- If tests or build cannot run because dependencies, network, or local chain services are unavailable, say so clearly in the final response.
