<p align="center">
  <img src="https://iili.io/BySRi9R.jpg" alt="NIEFA" width="96" />
</p>

<h1 align="center">NIEFA</h1>

<p align="center">
  <strong>Neural Interference Engine for Agents</strong><br/>
  <sub>Open-source autonomous agent runtime · Goal in → reasoning, action, results out</sub>
</p>

<p align="center">
  <a href="https://github.com/niefa-xyz/niefa/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square" alt="MIT License" /></a>
  <a href="https://github.com/niefa-xyz/niefa/stargazers"><img src="https://img.shields.io/github/stars/niefa-xyz/niefa?style=flat-square&color=f59e0b" alt="Stars" /></a>
  <a href="https://github.com/niefa-xyz/niefa/commits/main"><img src="https://img.shields.io/github/last-commit/niefa-xyz/niefa?style=flat-square&color=22c55e" alt="Last Commit" /></a>
  <a href="https://niefa.xyz"><img src="https://img.shields.io/badge/live-niefa.xyz-4ade80?style=flat-square" alt="Live Demo" /></a>
  <a href="https://bankr.bot/agents"><img src="https://img.shields.io/badge/Bankr-agent_registry-f59e0b?style=flat-square" alt="Bankr Agents" /></a>
</p>

<p align="center">
  <a href="https://niefa.xyz">Website</a> &nbsp;·&nbsp;
  <a href="#-quick-start">Quick Start</a> &nbsp;·&nbsp;
  <a href="#-api-reference">API Reference</a> &nbsp;·&nbsp;
  <a href="https://x.com/niefa_xyz">X / Twitter</a>
</p>

---

## What is NIEFA?

NIEFA is an **open-source neural orchestration runtime** for autonomous AI agents. Describe an objective in plain language — NIEFA breaks it into an ordered execution plan, dispatches it to a live agent, streams real-time progress, and returns results. No scaffolding required.

```
  goal ──▶  plan ──▶  execute ──▶  deliver
   │          │           │           │
"Find top   [1] research  browse +   structured
 Python     [2] compare   scrape +   report with
 ORMs and   [3] benchmark analyze    benchmarks
 benchmark  [4] report    write      + source
 them"      [5] package              links
```

It ships with two NIEFA-native primitives — **x402 paid endpoints** and a **per-agent file system** — built directly into the Next.js runtime with zero external dependencies.

---

## Features

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NIEFA CAPABILITIES                                                     │
├──────────────────────────────┬──────────────────────────────────────────┤
│  Autonomous Agent Runtime    │  Goal → plan → execute → results         │
│  LLM Plan Generation         │  claude-haiku-4-5 via Bankr Gateway      │
│  Real-Time Streaming         │  Live progress, logs, reasoning traces   │
│  x402 Paid Endpoints         │  USDC micropayments, no wallet SDK       │
│  Agent File System           │  Sandboxed per-agent storage, 10 MB      │
│  Graceful Degradation        │  Sim mode when no API key is present     │
│  Open Source · MIT           │  Self-host, fork, extend, own it         │
└──────────────────────────────┴──────────────────────────────────────────┘
```

---

## Architecture

```
  Browser / Client
       │
       ▼
  ┌────────────────────────────────────────────────┐
  │  Next.js 15 App Router                         │
  │                                                │
  │  /api/bankr/llm    ──▶  Bankr LLM Gateway      │
  │  /api/bankr/agent  ──▶  Bankr Agent API        │
  │  /api/bankr/job    ──▶  Bankr Job Polling      │
  │                                                │
  │  /api/niefa/x402   ──▶  x402 Registry (local) │
  │  /api/niefa/fs     ──▶  Agent File System      │
  └────────────────────────────────────────────────┘
       │                         │
       ▼                         ▼
  data/x402-*.json         data/afs/{agentId}/
  (endpoint registry)      (sandboxed storage)
```

---

## 🚀 Quick Start

```bash
git clone https://github.com/niefa-xyz/niefa.git
cd niefa
cp .env.example .env.local
```

Edit `.env.local`:

```env
BANKR_API_KEY=bk_...   # from bankr.bot/api — optional, enables live execution
```

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → navigate to `/#deploy` to run an agent goal end-to-end.

> **No API key?** NIEFA falls back to a simulated task sequence automatically — the demo always works.

---

## Deploy Flow

When `BANKR_API_KEY` is set, the `/#deploy` panel executes a live agent:

```
1. User submits goal
        │
        ▼
2. POST /api/bankr/llm
   └── claude-haiku-4-5 generates a 5–7 step execution plan
        │
        ▼
3. POST /api/bankr/agent
   └── submits goal to Bankr Agent API → returns jobId
        │
        ▼
4. GET /api/bankr/job/{jobId}  (polls every 2.5s)
   └── streams status until completed / failed
        │
        ▼
5. Result rendered in agent card with full reasoning trace
```

---

## x402 Paid Endpoints

NIEFA ships a self-contained **x402 HTTP payment layer** — register any slug as a paid endpoint, receive USDC on Base, verify payment proof, grant access.

```bash
# Register a paid endpoint
curl -X POST http://localhost:3000/api/niefa/x402 \
  -H 'Content-Type: application/json' \
  -d '{"action":"register","slug":"my-report","price":"0.10"}'

# Client requests the endpoint (gets HTTP 402 + payment details)
curl -X POST http://localhost:3000/api/niefa/x402 \
  -d '{"action":"request","slug":"my-report"}'

# Client submits payment proof (tx hash on Base)
curl -X POST http://localhost:3000/api/niefa/x402 \
  -d '{"action":"pay","slug":"my-report","txHash":"0x...","payer":"0x..."}'

# List all registered endpoints
curl http://localhost:3000/api/niefa/x402

# Remove an endpoint
curl -X DELETE "http://localhost:3000/api/niefa/x402?slug=my-report"
```

The registry persists to `data/x402-registry.json`. Payment records are stored in `data/x402-payments.json`. No external service required.

---

## Agent File System

Per-agent sandboxed storage — read, write, list, and delete artifacts that persist across runs.

```bash
# Write a file
curl -X POST http://localhost:3000/api/niefa/fs \
  -H 'Content-Type: application/json' \
  -d '{"agent":"agent-01","path":"/output/report.md","content":"# Report\n..."}'

# Read a file
curl "http://localhost:3000/api/niefa/fs?agent=agent-01&path=/output/report.md"

# List directory
curl "http://localhost:3000/api/niefa/fs?agent=agent-01&path=/"

# Storage usage
curl "http://localhost:3000/api/niefa/fs?agent=agent-01&info=1"

# Delete
curl -X DELETE "http://localhost:3000/api/niefa/fs?agent=agent-01&path=/output/report.md"
```

Limits: **1 MB per file** · **10 MB per agent** · path traversal protected.

---

## 📖 API Reference

### Agent Execution

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/bankr/llm` | Generate execution plan via LLM Gateway |
| `POST` | `/api/bankr/agent` | Submit goal to Bankr Agent API |
| `GET`  | `/api/bankr/job/[id]` | Poll job status |

### x402 Paid Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET`    | `/api/niefa/x402` | List all registered endpoints |
| `POST`   | `/api/niefa/x402` `{action:"register", slug, price}` | Register paid endpoint |
| `POST`   | `/api/niefa/x402` `{action:"request", slug}` | Get 402 + payment details |
| `POST`   | `/api/niefa/x402` `{action:"pay", slug, txHash, payer}` | Submit payment proof |
| `DELETE` | `/api/niefa/x402?slug=` | Remove endpoint |

### Agent File System

| Method | Route | Description |
|--------|-------|-------------|
| `GET`    | `/api/niefa/fs?agent=&path=/` | List directory |
| `GET`    | `/api/niefa/fs?agent=&path=/file.txt` | Read file |
| `GET`    | `/api/niefa/fs?agent=&info=1` | Storage usage |
| `POST`   | `/api/niefa/fs` `{agent, path, content}` | Write file |
| `DELETE` | `/api/niefa/fs?agent=&path=` | Delete file or directory |

---

## Agent Templates

| Template | Goal |
|----------|------|
| **Research Analyst** | Gather data, synthesize findings, produce structured reports |
| **Code Assistant** | Write, debug, and refactor code with full context |
| **Content Creator** | Blog posts, marketing copy, social threads |
| **Data Miner** | Scrape, clean, and analyze web data at scale |
| **Project Planner** | Roadmaps with milestones and dependencies |
| **Customer Support** | Handle inquiries with human-like conversation |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| LLM | Bankr LLM Gateway (`claude-haiku-4-5`) |
| Agent | Bankr Agent API |
| Payments | x402 protocol (USDC on Base) |
| Storage | Local AFS (`data/afs/`) |
| Hosting | Vercel |

---

## Self-Host

```bash
npm run build
npm start
```

Or deploy to Vercel in one click — set `BANKR_API_KEY` in your project environment variables to enable live agent execution.

---

## Contributing

NIEFA is fully open-source and contributions are welcome.

```bash
git fork https://github.com/niefa-xyz/niefa.git
git checkout -b feature/your-feature
git commit -m "feat: describe your change"
git push origin feature/your-feature
# Open a Pull Request
```

Areas where help is appreciated: agent templates, x402 client libraries, AFS adapters (S3, R2), UI improvements.

---

## License

[MIT](./LICENSE) — use it, modify it, ship it.

---

<p align="center">
  <a href="https://niefa.xyz">niefa.xyz</a> &nbsp;·&nbsp;
  <a href="https://x.com/niefa_xyz">@niefa_xyz</a> &nbsp;·&nbsp;
  <a href="https://bankr.bot/agents">bankr.bot/agents</a>
</p>

<p align="center">
  <sub>Built with obsession · Open source · MIT</sub>
</p>
