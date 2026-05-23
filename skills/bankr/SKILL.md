# Bankr Skill

Integrated into NIEFA from https://github.com/BankrBot/skills/tree/main/bankr

## Overview

Bankr is an AI-powered cryptocurrency trading platform. NIEFA connects to Bankr via:

- **LLM Gateway** (`https://llm.bankr.bot`) — multi-model inference (Claude, Gemini, GPT) billed per credit
- **Agent API** (`https://api.bankr.bot/agent/prompt`) — async AI agent for natural language crypto ops
- **Wallet API** (`https://api.bankr.bot/wallet/me`) — portfolio, balances, transfers
- **Token Launch API** (`https://api.bankr.bot/token-launches/deploy`) — ERC-20 on Base via Clanker

## Authentication

Set `BANKR_API_KEY` in `.env.local`. Get your key at https://bankr.bot/api  
API keys start with `bk_`.

## NIEFA Proxy Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/bankr/llm` | POST | Generate 5–7 step execution plan via LLM Gateway |
| `/api/bankr/agent` | POST | Submit goal to Bankr agent, receive jobId |
| `/api/bankr/job/[jobId]` | GET | Poll job status (pending / processing / completed / failed) |
| `/api/bankr/wallet` | GET | Combined wallet address + portfolio balances |
| `/api/bankr/token` | POST | Deploy ERC-20 token on Base |
| `/api/bankr/token/[address]/fees` | GET | Read claimable creator fees |
| `/api/bankr/token/[address]/fees` | POST | Claim accrued fees to your wallet |

## Usage (within NIEFA agents)

```typescript
// Generate a step plan
const { plan } = await fetch('/api/bankr/llm', {
  method: 'POST',
  body: JSON.stringify({ goal: 'Analyze ETH/USDC price trend' })
}).then(r => r.json())

// Run agent job
const { jobId } = await fetch('/api/bankr/agent', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'Buy $10 of ETH on Base' })
}).then(r => r.json())

// Poll until done
const result = await fetch(`/api/bankr/job/${jobId}`).then(r => r.json())
```

## Supported Operations (via Agent API)

- Token swaps, limit orders, DCA, stop-loss
- Portfolio review with PnL and NFT holdings
- Market research: prices, technicals, sentiment
- Leverage trading (Hyperliquid, Avantis)
- x402 paid endpoint discovery and payment

## Chains

Base · Ethereum · Polygon · Solana · Unichain · Arbitrum · BNB Chain

## Notes

- LLM credits are separate from wallet balance — top up at bankr.bot/api
- Default daily spend limit: $500 (configurable per key)
- All API calls are server-side only; key never exposed to browser
