<p align="center">
  <img src="https://iili.io/BySRi9R.jpg" alt="NIEFA" width="120" />
</p>

<h1 align="center">NIEFA</h1>
<p align="center"><strong>Neural Interference Engine for Agents</strong></p>

<p align="center">
  Deploy autonomous AI agents that think, plan, and execute tasks independently.<br/>
  Give your agent a goal — watch it reason, act, and deliver results in real time.
</p>

<p align="center">
  <a href="https://github.com/niefa-xyz/niefa"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
  <a href="https://gitlawb.com/z6MktvfdARsR8Ld7dbEceswFg2pns738ThF722eM8wL1XddX/niefa"><img src="https://img.shields.io/badge/GitLawb-Decentralized_Mirror-00ff41?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzAwZmY0MSI+PHBhdGggZD0iTTEyIDJMMiA3bDEwIDUgMTAtNS0xMC01ek0yIDE3bDEwIDUgMTAtNU0yIDEybDEwIDUgMTAtNSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjIiLz48L3N2Zz4=" alt="GitLawb Mirror" /></a>
</p>

<p align="center">
  <a href="https://niefa.xyz">Website</a> · <a href="#-quick-start">Quick Start</a> · <a href="https://x.com/niefa_xyz">X / Twitter</a>
</p>

---

## What is NIEFA?

NIEFA is an open-source platform for building and deploying **autonomous AI agents**. Instead of writing step-by-step scripts, you describe a goal in natural language and the agent figures out how to achieve it — planning, executing, and self-correcting along the way.

```
┌─────────────────────────────────────────────────────────────────┐
│  $ niefa --deploy --goal "Analyze competitor pricing and        │
│    generate a strategic report with recommendations"            │
│                                                                 │
│  [✓] Parsing goal and breaking into sub-tasks                   │
│  [✓] Setting up research pipeline                               │
│  [✓] Scraping competitor pricing data                           │
│  [✓] Running statistical analysis                               │
│  [✓] Generating strategic report                                │
│  [✓] Packaging final deliverable                                │
│                                                                 │
│  Agent completed in 47s — report ready.                         │
└─────────────────────────────────────────────────────────────────┘
```

## Features

| | Feature | Description |
|---|---|---|
| **[AG]** | Autonomous Agents | Deploy AI agents that think, plan, and execute tasks independently |
| **[TL]** | Tool Integration | Browse the web, run code, manage files, connect to external APIs |
| **[AR]** | Adaptive Reasoning | Chain-of-thought reasoning with self-correction and sub-task decomposition |
| **[RS]** | Real-Time Streaming | Watch every decision and action as it happens, live |
| **[SC]** | Safe & Controllable | Budget limits, approval gates, sandboxed execution — you stay in control |
| **[OS]** | Open Source | Fully open-source under a permissive license. Self-host and customize |

## Agent Templates

Jump-start your workflow with pre-built configurations:

| Template | Use Case | Command |
|---|---|---|
| **Research Analyst** | Gather data, synthesize findings, produce reports | `niefa --template research` |
| **Code Assistant** | Write, debug, refactor code with full context | `niefa --template code` |
| **Content Creator** | Blog posts, marketing copy, social content | `niefa --template content` |
| **Data Miner** | Scrape, clean, analyze web data at scale | `niefa --template datamine` |
| **Project Planner** | Roadmaps with timelines and dependencies | `niefa --template planner` |
| **Customer Support** | Handle inquiries with human-like conversation | `niefa --template support` |
| **Onchain Trader** | Bankr wallet + x402 stablecoin payments for trading | `niefa --template onchain --bankr` |
| **Token Launcher** | Launch tokens via Bankr Partnership API | `niefa --template token --bankr-api` |

## Bankr Integration

NIEFA agents plug straight into [Bankr](https://bankr.bot/agents) for wallets, payments, onchain
execution, and persistent storage. See [docs.bankr.bot](https://docs.bankr.bot/) and
[skills.bankr.bot](https://skills.bankr.bot/) for full reference.

| | Capability | Description |
|---|---|---|
| **[PA]** | Partnership API | Spin up Bankr wallets and accounts for businesses or sub-agents. They can pay for inference through Bankr's LLM gateway, launch tokens to generate fees and attention, and trade or custody crypto programmatically. |
| **[BW]** | Bankr Wallet & Skill | Mount the Bankr skill directly into your agent runtime to interact with onchain infra — sign transactions, manage balances, and execute trades without external glue code. |
| **[X4]** | x402 Payments | Expose paid x402 endpoints via Bankr's x402 cloud, or use the Bankr wallet's native x402 integration to settle service calls in stablecoins with zero ceremony. |
| **[FS]** | Agent File System | A web-based sandboxed file system dedicated to your agent — read, write, and persist artifacts across runs without standing up your own storage stack. |

### Live wiring (not just marketing)

NIEFA ships server-side API routes that proxy the real Bankr endpoints. Set `BANKR_API_KEY` in
`.env.local` and the UI flips from simulation to live execution.

| Next.js route | Bankr endpoint | Purpose |
|---|---|---|
| `POST /api/bankr/llm` | `POST https://llm.bankr.bot/v1/chat/completions` | LLM Gateway — generates the agent's execution plan from your goal |
| `POST /api/bankr/agent` | `POST https://api.bankr.bot/agent/prompt` | Submits the goal to Bankr's autonomous agent |
| `GET /api/bankr/job/[id]` | `GET https://api.bankr.bot/agent/job/{id}` | Polls job status until `completed`/`failed` |
| `GET /api/bankr/wallet` | `GET /wallet/me` + `GET /wallet/portfolio` | Live wallet address, balances, USD value |
| `POST /api/bankr/token` | `POST /token-launches/deploy` | Deploys an ERC-20 on Base with 1.2% swap fee (57% creator) |
| `GET /api/bankr/token/[addr]/fees` | `GET /token-launches/{addr}/fees` | Reads claimable fees |
| `POST /api/bankr/token/[addr]/fees` | `POST /token-launches/{addr}/fees/claim` | Claims accrued fees to your wallet |

**Deploy flow (live mode):**

1. User submits a goal in `/#deploy`
2. NIEFA calls the **LLM Gateway** (`claude-haiku-4-5`) to break the goal into 5–7 ordered steps
3. NIEFA submits the same goal to the **Agent API** and receives a `jobId`
4. The browser polls `/api/bankr/job/{jobId}` every ~2.5s until the agent finishes
5. The real Bankr response is streamed into the agent card as it completes

When `BANKR_API_KEY` is absent, every route returns `501 Not Configured` and the UI falls back to
the original simulated task sequence, so the demo never breaks.

### Quick start with live Bankr

```bash
cp .env.example .env.local
# edit .env.local and paste your key from bankr.bot/api
npm install
npm run dev
```

Then open `/#wallet` to confirm `CONNECTED`, `/#launch` to deploy a token, and `/#deploy` to run an
agent goal end-to-end against Bankr.

## How It Works

```
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  01      │────▶│  02      │────▶│  03      │────▶│  04      │
  │  Define  │     │  Agent   │     │  Execute │     │  Deliver │
  │  Goal    │     │  Plans   │     │  Tasks   │     │  Results │
  └──────────┘     └──────────┘     └──────────┘     └──────────┘
```

1. **Define Your Goal** — Describe what you want in natural language. No code required.
2. **Agent Plans** — The agent analyzes your goal and creates a step-by-step execution plan.
3. **Autonomous Execution** — Tasks are executed using tools, adapting in real time.
4. **Deliver Results** — Receive polished outputs with full reasoning transparency.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/niefa-xyz/niefa.git
cd niefa

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the NIEFA dashboard.

## Tech Stack

`Next.js` · `TypeScript` · `FastAPI` · `LangChain` · `Bankr` · `x402` · `Docker` · `Tailwind`

## Deploy

deploy manually:

```bash
npm run build
npm start
```

## Contributing

NIEFA is open source and contributions are welcome.

```bash
# Fork the repo, create a branch, make your changes
git checkout -b feature/your-feature

# Commit and push
git commit -m "Add your feature"
git push origin feature/your-feature

# Open a Pull Request
```

## License

MIT License — use it, modify it, ship it.

---

<p align="center">
  Built with obsession by <a href="https://x.com/niefa_xyz">NIEFA</a>
</p>
