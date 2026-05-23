// Server-side Bankr client — never import this from client components

const BANKR_API = 'https://api.bankr.bot'
const BANKR_LLM = 'https://llm.bankr.bot'

export function getBankrKey(): string {
  const key = process.env.BANKR_API_KEY
  if (!key) throw new Error('BANKR_API_KEY not configured')
  return key
}

async function bfetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BANKR_API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getBankrKey(),
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Bankr ${path} → ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ─── Agent API ────────────────────────────────────────────────────────────────

export interface AgentJobCreated {
  success: boolean
  jobId: string
  threadId: string
  status: string
  message: string
}

export interface AgentJobResult {
  success: boolean
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  prompt: string
  response?: string
  createdAt: string
  completedAt?: string
  processingTime?: number
}

export function submitAgentPrompt(
  prompt: string,
  opts: { threadId?: string; maxMode?: boolean } = {},
): Promise<AgentJobCreated> {
  return bfetch('/agent/prompt', {
    method: 'POST',
    body: JSON.stringify({ prompt, ...opts }),
  })
}

export function getJobStatus(jobId: string): Promise<AgentJobResult> {
  return bfetch(`/agent/job/${jobId}`)
}

// ─── Wallet API ───────────────────────────────────────────────────────────────

export interface WalletInfo {
  address?: string
  username?: string
  clubStatus?: string
  chains?: string[]
  [k: string]: unknown
}

export interface TokenBalance {
  symbol: string
  balance: string
  usdValue?: number
  chain?: string
}

export interface Portfolio {
  totalValue?: number
  tokens?: TokenBalance[]
  pnl?: number
  [k: string]: unknown
}

export const getWalletInfo = (): Promise<WalletInfo> => bfetch('/wallet/me')
export const getPortfolio = (): Promise<Portfolio> => bfetch('/wallet/portfolio')

// ─── Token Launching ──────────────────────────────────────────────────────────

export interface TokenLaunchParams {
  name: string
  symbol: string
  description?: string
}

export interface TokenLaunchResult {
  tokenAddress: string
  poolAddress?: string
  txHash?: string
  chain?: string
  [k: string]: unknown
}

export interface TokenFees {
  tokenAddress: string
  totalFees?: string
  claimableFees?: string
  [k: string]: unknown
}

export function launchToken(params: TokenLaunchParams): Promise<TokenLaunchResult> {
  return bfetch('/token-launches/deploy', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export function getTokenFees(address: string): Promise<TokenFees> {
  return bfetch(`/token-launches/${address}/fees`)
}

export function claimTokenFees(address: string): Promise<unknown> {
  return bfetch(`/token-launches/${address}/fees/claim`, { method: 'POST' })
}

// ─── LLM Gateway ─────────────────────────────────────────────────────────────

// Generates a step-by-step execution plan for an agent goal.
// Returns 5–7 task strings, or throws if the gateway is unavailable.
export async function generatePlan(goal: string): Promise<string[]> {
  const res = await fetch(`${BANKR_LLM}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getBankrKey(),
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'system',
          content:
            'You are NIEFA, a Neural Interference Engine for Agents. Given a user goal, respond ONLY with a JSON array of 5–7 short, specific action strings that an autonomous agent would execute to accomplish it. No explanation, no markdown — just the JSON array.',
        },
        { role: 'user', content: `Goal: ${goal}` },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`LLM Gateway ${res.status}: ${text}`)
  }

  const data: any = await res.json()
  const content: string = data.choices?.[0]?.message?.content ?? '[]'

  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
      return parsed
    }
  } catch {}

  // Fallback: treat each non-empty line as a step
  return content
    .split('\n')
    .map((l: string) => l.trim().replace(/^[-*\d.]+\s*/, ''))
    .filter(Boolean)
    .slice(0, 7)
}
