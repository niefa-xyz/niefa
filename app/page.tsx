'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

type AgentStatus = 'initializing' | 'running' | 'thinking' | 'completed' | 'stopped'
type AgentMode = 'live' | 'sim'

interface Agent {
  id: string
  name: string
  goal: string
  status: AgentStatus
  tasks: { text: string; done: boolean }[]
  tools: string[]
  mode: AgentMode
  jobId?: string
  threadId?: string
  bankrResponse?: string
}

interface LogEntry { time: string; type: string; msg: string }
interface WalletState {
  loading: boolean
  configured: boolean
  address?: string
  totalValue?: number
  tokens?: Array<{ symbol: string; balance: string; usdValue?: number; chain?: string }>
  error?: string
}
interface TokenLaunch {
  name: string
  symbol: string
  description: string
  launching: boolean
  result?: { tokenAddress: string; poolAddress?: string; txHash?: string; chain?: string }
  error?: string
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const ASCII_LOGO = `███╗   ██╗██╗███████╗███████╗ █████╗
████╗  ██║██║██╔════╝██╔════╝██╔══██╗
██╔██╗ ██║██║█████╗  █████╗  ███████║
██║╚██╗██║██║██╔══╝  ██╔══╝  ██╔══██║
██║ ╚████║██║███████╗██║     ██║  ██║
╚═╝  ╚═══╝╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝`

const BOOT_LINES = [
  '[BOOT] Initializing NIEFA Runtime v3.0.0...',
  '[BOOT] Loading neural interference engine... OK',
  '[BOOT] Connecting to agent orchestration layer... OK',
  '[BOOT] Mounting sandbox environments... OK',
  '[BOOT] Starting agent lifecycle manager... OK',
  '[BOOT] All systems operational. Welcome to NIEFA.',
]

const FEATURES = [
  { icon: '[AG]', title: 'Autonomous Agents', desc: 'Deploy AI agents that think, plan, and execute tasks independently using cutting-edge language models.' },
  { icon: '[TL]', title: 'Tool Integration', desc: 'Agents can browse the web, run code, manage files, and connect to external APIs to accomplish any goal.' },
  { icon: '[AR]', title: 'Adaptive Reasoning', desc: 'Chain-of-thought reasoning lets agents break complex goals into sub-tasks and self-correct along the way.' },
  { icon: '[RS]', title: 'Real-Time Streaming', desc: 'Watch your agent think and act in real time with live streaming of every decision and action.' },
  { icon: '[SC]', title: 'Safe & Controllable', desc: 'Set budgets, approval gates, and sandbox limits. You stay in control while the agent works autonomously.' },
  { icon: '[OS]', title: 'Open Source', desc: 'Fully open-source under a permissive license. Self-host, customize, and contribute to the ecosystem.' },
]

const TEMPLATES = [
  {
    ascii: `  ┌──────────────┐
  │  ╔═══╗       │
  │  ║ ▓ ║ ~~~~  │
  │  ╚═══╝  ||   │
  │    ╔════╝    │
  │    ║  data   │
  └────╨─────────┘`,
    title: 'Research Analyst',
    cmd: 'niefa --template research',
    desc: 'Gather data from multiple sources, synthesize findings, and produce structured reports.',
    tag: 'research',
    defaultGoal: 'Research the latest advancements in large language models and write a comprehensive report',
  },
  {
    ascii: `  ┌──────────────┐
  │  < / >       │
  │  ┌─────┐     │
  │  │fn() {│    │
  │  │  ok; │    │
  │  └──}───┘    │
  │  ▓▓▓▓▓▓▓▓▓  │
  └──────────────┘`,
    title: 'Code Assistant',
    cmd: 'niefa --template code',
    desc: 'Write, debug, and refactor code across any language with full project context awareness.',
    tag: 'dev',
    defaultGoal: 'Build a full-stack task management app with React frontend and Node.js backend',
  },
  {
    ascii: `  ┌──────────────┐
  │  ┌─────────┐ │
  │  │ Title   │ │
  │  │─────────│ │
  │  │ ¶ ¶ ¶ ¶ │ │
  │  │ ¶ ¶ ¶ ¶ │ │
  │  └─────────┘ │
  └──────────────┘`,
    title: 'Content Creator',
    cmd: 'niefa --template content',
    desc: 'Generate blog posts, social media content, and marketing copy tailored to your brand voice.',
    tag: 'marketing',
    defaultGoal: 'Write a series of blog posts about AI agent architectures and their real-world applications',
  },
  {
    ascii: `  ┌──────────────┐
  │  ╭──╮  ╭──╮ │
  │  │██│  │░░│ │
  │  │██│  │░░│ │
  │  ╰──╯  ╰──╯ │
  │  ─────────── │
  │  ═══════════ │
  └──────────────┘`,
    title: 'Data Miner',
    cmd: 'niefa --template datamine',
    desc: 'Scrape, clean, and analyze web data to extract actionable insights and trends.',
    tag: 'analytics',
    defaultGoal: 'Scrape and analyze trending GitHub repositories to identify emerging tech patterns',
  },
  {
    ascii: `  ┌──────────────┐
  │  ◆ Phase 1   │
  │  ├─→ ◆ P2    │
  │  │   ├─→ ◆   │
  │  │   └─→ ◆   │
  │  └─→ ◆ Done  │
  │    ✓ ✓ ✓ ✓   │
  └──────────────┘`,
    title: 'Project Planner',
    cmd: 'niefa --template planner',
    desc: 'Break down objectives into actionable roadmaps with timelines, dependencies, and milestones.',
    tag: 'productivity',
    defaultGoal: 'Create a detailed project plan for launching a new SaaS product in 3 months',
  },
  {
    ascii: `  ┌──────────────┐
  │   (•‿•)      │
  │  /│    Hi!   │
  │  / │  How    │
  │    │  can I  │
  │   / \\  help? │
  └──────────────┘`,
    title: 'Customer Support',
    cmd: 'niefa --template support',
    desc: 'Handle inquiries, resolve issues, and escalate complex cases with human-like conversation.',
    tag: 'support',
    defaultGoal: 'Set up automated customer support responses for common SaaS onboarding questions',
  },
  {
    ascii: `  ┌──────────────┐
  │  ╔═══╗  $$$ │
  │  ║ B ║━━━▶  │
  │  ╚═══╝ x402 │
  │  ┌──┐ ┌──┐  │
  │  │↑↓│ │ ¤│  │
  │  └──┘ └──┘  │
  └──────────────┘`,
    title: 'Onchain Trader',
    cmd: 'niefa --template onchain --bankr',
    desc: 'Spin up a Bankr wallet, trade and custody crypto, and settle service calls via native x402 stablecoin rails.',
    tag: 'onchain',
    defaultGoal: 'Provision a Bankr wallet, monitor ETH/USDC pairs, and execute swaps when spreads exceed 2%',
  },
  {
    ascii: `  ┌──────────────┐
  │    ╭───╮  ⚡ │
  │    │TKN│     │
  │    ╰─┬─╯     │
  │   [launch]   │
  │   ░░▓▓▓▓░░   │
  │   fees → $$  │
  └──────────────┘`,
    title: 'Token Launcher',
    cmd: 'niefa --template token --bankr-api',
    desc: 'Use the Bankr Partnership API to launch tokens, bootstrap liquidity, and capture fees and attention.',
    tag: 'launch',
    defaultGoal: 'Use the Bankr Partnership API to spin up an agent wallet and launch a token to bootstrap fees',
  },
]

const STEPS = [
  { num: '01', title: 'Define Your Goal', desc: 'Describe what you want to achieve in natural language — no code required.', icon: '>>' },
  { num: '02', title: 'Agent Plans', desc: 'The agent analyzes your goal and creates a step-by-step execution plan.', icon: '::' },
  { num: '03', title: 'Autonomous Execution', desc: 'The agent executes each task, using tools and adapting in real time.', icon: '##' },
  { num: '04', title: 'Deliver Results', desc: 'Receive polished outputs with full transparency into the agent\'s reasoning.', icon: '**' },
]

const TECH_BADGES = ['Next.js', 'FastAPI', 'LangChain', 'OpenClaude', 'MIMO', 'Bankr', 'x402', 'Tailwind', 'Docker', 'TypeScript']

const BANKR_CAPABILITIES = [
  {
    tag: '[PA]',
    title: 'Partnership API',
    desc: 'Spin up Bankr wallets and accounts for businesses or sub-agents you create. They can pay for inference via Bankr’s LLM gateway, launch tokens to generate fees and attention, and trade or custody crypto programmatically.',
    docs: 'https://docs.bankr.bot/',
    docsLabel: 'docs.bankr.bot',
  },
  {
    tag: '[BW]',
    title: 'Bankr Wallet & Skill',
    desc: 'Mount the Bankr skill directly into your agent runtime to interact with onchain infra — sign transactions, manage balances, and execute trades without external glue code.',
    docs: 'https://skills.bankr.bot/',
    docsLabel: 'skills.bankr.bot',
  },
  {
    tag: '[X4]',
    title: 'x402 Payments',
    desc: 'Expose paid x402 endpoints via Bankr’s x402 cloud, or use the Bankr wallet’s native x402 integration to settle service calls in stablecoins with zero ceremony.',
    docs: 'https://docs.bankr.bot/',
    docsLabel: 'docs.bankr.bot',
  },
  {
    tag: '[FS]',
    title: 'Agent File System',
    desc: 'A web-based sandboxed file system dedicated to your agent — read, write, and persist artifacts across runs without standing up your own storage stack.',
    docs: 'https://docs.bankr.bot/',
    docsLabel: 'docs.bankr.bot',
  },
]


const TASK_SEQUENCES: Record<string, string[]> = {
  research: [
    'Initializing research context and query expansion...',
    'Searching academic databases (arXiv, Semantic Scholar, PubMed)...',
    'Parsing and extracting key findings from top results...',
    'Cross-referencing citations and validating sources...',
    'Synthesizing findings into structured summary...',
    'Generating trend analysis and visualization data...',
    'Compiling final report with citations and methodology...',
  ],
  code: [
    'Analyzing project structure and dependencies...',
    'Reading existing codebase for context awareness...',
    'Planning architecture and component structure...',
    'Generating core module implementations...',
    'Writing unit tests and integration tests...',
    'Running linter and type checker...',
    'Building and verifying compilation...',
  ],
  content: [
    'Researching target audience and brand voice...',
    'Analyzing competitor content strategies...',
    'Generating content outline and key messaging...',
    'Writing draft copy with SEO optimization...',
    'Running readability and engagement analysis...',
    'A/B testing headline variations...',
    'Finalizing and formatting for publication...',
  ],
  datamine: [
    'Identifying data sources and access patterns...',
    'Setting up scraping pipelines and rate limits...',
    'Extracting raw data from target endpoints...',
    'Cleaning and normalizing dataset...',
    'Running statistical analysis and anomaly detection...',
    'Generating insight summaries and charts...',
    'Exporting structured dataset and report...',
  ],
  planner: [
    'Parsing goal and breaking into sub-tasks...',
    'Allocating resources and initializing tools...',
    'Executing primary task sequence...',
    'Processing intermediate results...',
    'Validating output quality and correctness...',
    'Optimizing and refining deliverables...',
    'Packaging final output with metadata...',
  ],
  support: [
    'Analyzing customer inquiry patterns...',
    'Loading knowledge base and FAQ corpus...',
    'Generating contextual response templates...',
    'Running sentiment analysis on query...',
    'Matching against resolved case history...',
    'Drafting personalized response...',
    'Queueing for human review if needed...',
  ],
  onchain: [
    'Provisioning Bankr wallet via Partnership API...',
    'Loading onchain market data for target pairs...',
    'Authorizing x402 stablecoin payment rails...',
    'Computing optimal swap routes and slippage...',
    'Executing onchain trades through Bankr skill...',
    'Settling positions and recording PnL to Agent FS...',
    'Streaming portfolio snapshot to dashboard...',
  ],
  launch: [
    'Requesting Bankr Partnership API credentials...',
    'Spinning up dedicated agent wallet and treasury...',
    'Configuring token parameters and fee schedule...',
    'Broadcasting token launch transaction...',
    'Bootstrapping liquidity and attention via Bankr...',
    'Monitoring fee accrual and onchain activity...',
    'Reporting earnings to Agent FS for audit trail...',
  ],
}

const TOOLS_LIST = ['Web Search', 'Code Exec', 'File Manager', 'API Client', 'Browser', 'Bankr Wallet', 'x402', 'Agent FS']

// ─── Hooks ─────────────────────────────────────────────────────────────────────

function useTypewriter(texts: string[], speed = 40) {
  const [display, setDisplay] = useState('')
  const idxRef = useRef(0)
  const charRef = useRef(0)
  const deletingRef = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const current = texts[idxRef.current]
      if (deletingRef.current) {
        charRef.current--
        setDisplay(current.slice(0, charRef.current))
        if (charRef.current <= 0) {
          deletingRef.current = false
          idxRef.current = (idxRef.current + 1) % texts.length
        }
      } else {
        charRef.current++
        setDisplay(current.slice(0, charRef.current))
        if (charRef.current >= current.length) {
          deletingRef.current = true
        }
      }
    }, deletingRef.current ? speed / 2 : speed)
    return () => clearInterval(interval)
  }, [texts, speed])

  return display
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        observer.unobserve(el)
      }
    }, { threshold })
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

// ─── Section Wrapper ───────────────────────────────────────────────────────────

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, inView } = useInView(0.1)
  return (
    <section ref={ref} id={id} className={`${className} reveal ${inView ? 'visible' : ''}`}>
      {children}
    </section>
  )
}

// ─── Boot Sequence ─────────────────────────────────────────────────────────────

function BootSequence({ lines, speed = 30 }: { lines: string[]; speed?: number }) {
  const [displayed, setDisplayed] = useState<string[]>([])
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (lineIdx >= lines.length) { setDone(true); return }
    const line = lines[lineIdx]
    if (charIdx < line.length) {
      const t = setTimeout(() => {
        setDisplayed(prev => {
          const next = [...prev]
          next[lineIdx] = line.slice(0, charIdx + 1)
          return next
        })
        setCharIdx(c => c + 1)
      }, speed)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setLineIdx(i => i + 1)
        setCharIdx(0)
        setDisplayed(prev => [...prev, ''])
      }, 200)
      return () => clearTimeout(t)
    }
  }, [lineIdx, charIdx, lines, speed])

  return (
    <div>
      {displayed.map((line, i) => (
        <div key={i} className="term-line">
          <span className="term-prompt-char">&gt;</span> {line}
          {i === displayed.length - 1 && !done && <span className="term-cursor">&#9608;</span>}
        </div>
      ))}
      {!done && lineIdx < lines.length && displayed.length <= lineIdx && (
        <div className="term-line">
          <span className="term-prompt-char">&gt;</span>
          <span className="term-cursor">&#9608;</span>
        </div>
      )}
    </div>
  )
}

// ─── Log Viewer ────────────────────────────────────────────────────────────────

function LogViewer({ logs }: { logs: { time: string; type: string; msg: string }[] }) {
  return (
    <div className="log-viewer">
      {logs.map((log, i) => (
        <div key={i} className="log-line">
          <span className="log-time">{log.time}</span>
          <span className="log-type" style={{ color: log.type === 'info' ? 'var(--c-accent)' : log.type === 'warn' ? 'var(--c-amber)' : 'var(--c-cyan)' }}>{log.type}</span>
          <span className="log-msg">{log.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  const filled = Math.round(pct / 2.5)
  const empty = 40 - filled
  return (
    <span className="progress-bar">
      <span className="progress-filled">{'█'.repeat(filled)}</span>
      <span className="progress-empty">{'░'.repeat(empty)}</span>
      <span className="progress-pct">{pct}%</span>
    </span>
  )
}

// ─── Agent Card ────────────────────────────────────────────────────────────────

function AgentCard({ agent, onStop, onDelete }: {
  agent: Agent
  onStop: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const statusColors: Record<string, string> = {
    initializing: 'var(--c-amber)',
    running: 'var(--c-accent)',
    thinking: 'var(--c-amber)',
    completed: 'var(--c-text-dim)',
    stopped: 'var(--c-red)',
  }
  const doneCount = agent.tasks.filter(t => t.done).length
  const pct = agent.tasks.length > 0 ? Math.round((doneCount / agent.tasks.length) * 100) : 0

  return (
    <div className={`agent-card ${agent.status === 'running' || agent.status === 'thinking' ? 'agent-card--active' : ''}`}>
      <div className="agent-card__header" onClick={() => setExpanded(!expanded)}>
        <div className="agent-card__title-row">
          <span className="agent-card__status-dot" style={{ background: statusColors[agent.status], boxShadow: agent.status === 'running' || agent.status === 'thinking' ? `0 0 6px ${statusColors[agent.status]}` : 'none' }} />
          <span className="agent-card__name">{agent.name}</span>
          <span className="agent-card__id">id: {agent.id}</span>
        </div>
        <div className="agent-card__meta">
          <span className={`agent-card__mode agent-card__mode--${agent.mode}`}>{agent.mode === 'live' ? 'LIVE' : 'SIM'}</span>
          <span className="agent-card__status" style={{ color: statusColors[agent.status] }}>{agent.status.toUpperCase()}</span>
          <span className="agent-card__toggle">{expanded ? '[-]' : '[+]'}</span>
        </div>
      </div>

      <div className="agent-card__progress-row">
        <ProgressBar pct={pct} />
        <span className="agent-card__task-count">{doneCount}/{agent.tasks.length} tasks</span>
      </div>

      {expanded && (
        <div className="agent-card__expanded">
          <div className="agent-card__goal">
            <span className="agent-card__label">goal: </span>{agent.goal}
          </div>
          <div className="agent-card__tools-row">
            <span className="agent-card__label">tools: </span>
            {agent.tools.map(t => <span key={t} className="agent-card__tool">{t}</span>)}
          </div>
          <div className="task-list">
            {agent.tasks.map((task, i) => (
              <div key={i} className={`task ${task.done ? 'task--done' : i === doneCount && agent.status === 'thinking' ? 'task--thinking' : i === doneCount ? 'task--active' : ''}`}>
                <span className="task__icon">{task.done ? '[✓]' : i === doneCount && agent.status === 'thinking' ? '' : i === doneCount ? '[>]' : '[ ]'}</span>
                {i === doneCount && agent.status === 'thinking' ? (
                  <><span className="thinking-dots"><span /><span /><span /></span>{task.text}</>
                ) : task.text}
              </div>
            ))}
          </div>
          {agent.jobId && (
            <div className="agent-card__job"><span className="agent-card__label">bankr_job: </span><code>{agent.jobId}</code></div>
          )}
          {agent.bankrResponse && (
            <div className="agent-card__response">
              <span className="agent-card__label">response: </span>
              <pre>{agent.bankrResponse}</pre>
            </div>
          )}
          {(agent.status === 'running' || agent.status === 'thinking') && (
            <div className="agent-card__actions">
              <button className="agent-card__btn agent-card__btn--stop" onClick={onStop}>[STOP]</button>
              <button className="agent-card__btn agent-card__btn--delete" onClick={onDelete}>[DELETE]</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Copy Button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <button className="token__copy" onClick={handleCopy}>
      {copied ? '[copied]' : '[copy]'}
    </button>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [navScrolled, setNavScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [agentName, setAgentName] = useState('')
  const [agentGoal, setAgentGoal] = useState('')
  const [selectedTools, setSelectedTools] = useState<string[]>(['Web Search', 'Code Exec'])
  const [agents, setAgents] = useState<Agent[]>([])
  const [deployLogs, setDeployLogs] = useState<LogEntry[]>([])
  const [deploying, setDeploying] = useState(false)
  const deployRef = useRef<HTMLDivElement>(null)
  const [wallet, setWallet] = useState<WalletState>({ loading: true, configured: false })
  const [token, setToken] = useState<TokenLaunch>({ name: '', symbol: '', description: '', launching: false })

  const heroTexts = ['deploy --new --interactive', 'agents --spawn --goal "..."', 'tools --list --all']
  const heroTyped = useTypewriter(heroTexts, 50)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fetch wallet info on mount (gracefully handles missing API key)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/bankr/wallet')
        if (cancelled) return
        if (res.status === 501) {
          setWallet({ loading: false, configured: false })
          return
        }
        if (!res.ok) {
          setWallet({ loading: false, configured: true, error: `HTTP ${res.status}` })
          return
        }
        const { info, portfolio } = await res.json()
        setWallet({
          loading: false,
          configured: true,
          address: info?.address,
          totalValue: portfolio?.totalValue,
          tokens: portfolio?.tokens,
        })
      } catch (err: any) {
        if (!cancelled) setWallet({ loading: false, configured: true, error: err.message })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const launchTokenHandler = useCallback(async () => {
    if (!token.name.trim() || !token.symbol.trim()) return
    setToken((t) => ({ ...t, launching: true, error: undefined, result: undefined }))
    try {
      const res = await fetch('/api/bankr/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: token.name,
          symbol: token.symbol,
          description: token.description,
        }),
      })
      if (res.status === 501) {
        setToken((t) => ({
          ...t,
          launching: false,
          error: 'BANKR_API_KEY not configured. Set it in .env.local to launch real tokens.',
        }))
        return
      }
      const data = await res.json()
      if (!res.ok) {
        setToken((t) => ({ ...t, launching: false, error: data.error ?? `HTTP ${res.status}` }))
        return
      }
      setToken((t) => ({ ...t, launching: false, result: data }))
    } catch (err: any) {
      setToken((t) => ({ ...t, launching: false, error: err.message }))
    }
  }, [token.name, token.symbol, token.description])

  const toggleTool = (tool: string) => {
    setSelectedTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool])
  }

  const fillTemplate = (template: typeof TEMPLATES[0]) => {
    setAgentGoal(template.defaultGoal)
    deployRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const genId = () => Math.random().toString(36).slice(2, 7)

  const handleDeploy = useCallback(async () => {
    if (!agentGoal.trim()) return
    const id = genId()
    const name = agentName.trim() || `Agent-${id}`

    setDeploying(true)
    setDeployLogs([])

    const addLog = (type: string, msg: string) => {
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      setDeployLogs((prev) => [...prev, { time, type, msg }])
    }

    addLog('info', `Deploying agent '${name}' (id: ${id})`)
    addLog('info', `Goal: ${agentGoal}`)
    addLog('info', `Tools: ${selectedTools.join(', ')}`)

    // Step 1: ask Bankr LLM Gateway to generate an execution plan
    let taskTexts: string[] = []
    let mode: AgentMode = 'sim'

    try {
      addLog('info', '> Querying Bankr LLM Gateway for execution plan...')
      const planRes = await fetch('/api/bankr/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: agentGoal }),
      })
      if (planRes.ok) {
        const { plan } = await planRes.json()
        if (Array.isArray(plan) && plan.length > 0) {
          taskTexts = plan
          mode = 'live'
          addLog('info', `Plan generated via LLM Gateway — ${plan.length} steps`)
        }
      } else if (planRes.status === 501) {
        addLog('warn', 'BANKR_API_KEY not configured — running in simulation mode')
      } else {
        const { error } = await planRes.json().catch(() => ({ error: planRes.statusText }))
        addLog('warn', `LLM Gateway error: ${error} — falling back to template`)
      }
    } catch (err: any) {
      addLog('warn', `LLM Gateway unreachable: ${err.message} — falling back to template`)
    }

    // Fallback to static task sequence if planning failed
    if (taskTexts.length === 0) {
      const templateKey =
        TEMPLATES.find((t) => agentGoal.includes(t.defaultGoal.slice(0, 20)))?.tag || 'planner'
      taskTexts = TASK_SEQUENCES[templateKey] || TASK_SEQUENCES.planner
    }

    const newAgent: Agent = {
      id,
      name,
      goal: agentGoal,
      status: 'initializing',
      tasks: taskTexts.map((t) => ({ text: t, done: false })),
      tools: [...selectedTools],
      mode,
    }
    setAgents((prev) => [...prev, newAgent])

    // Step 2: submit to Bankr Agent API (only if live)
    let jobId: string | undefined
    let threadId: string | undefined

    if (mode === 'live') {
      try {
        addLog('info', '> Submitting goal to Bankr Agent API...')
        const agentRes = await fetch('/api/bankr/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `${agentGoal}\n\nAvailable tools: ${selectedTools.join(', ')}`,
          }),
        })
        if (agentRes.ok) {
          const data = await agentRes.json()
          jobId = data.jobId
          threadId = data.threadId
          addLog('info', `Agent queued. Bankr job: ${jobId}`)
          setAgents((prev) =>
            prev.map((a) => (a.id === id ? { ...a, jobId, threadId, status: 'running' } : a)),
          )
        } else {
          const { error } = await agentRes.json().catch(() => ({ error: agentRes.statusText }))
          addLog('warn', `Agent API error: ${error}`)
        }
      } catch (err: any) {
        addLog('warn', `Agent API unreachable: ${err.message}`)
      }
    }

    if (!jobId) {
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'running' } : a)))
    }

    // Step 3: visual task progression (always runs for UX)
    let taskIdx = 0
    const tick = () => {
      if (taskIdx >= taskTexts.length) {
        if (!jobId) {
          addLog('info', 'All tasks completed.')
          setAgents((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status: 'completed' } : a)),
          )
          setDeploying(false)
        }
        // if jobId is set, the poller below will close out
        return
      }
      setAgents((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a
          const tasks = [...a.tasks]
          if (taskIdx > 0) tasks[taskIdx - 1] = { ...tasks[taskIdx - 1], done: true }
          return { ...a, tasks, status: taskIdx % 3 === 1 ? 'thinking' : 'running' }
        }),
      )
      addLog(taskIdx % 3 === 1 ? 'warn' : 'info', taskTexts[taskIdx])
      taskIdx++
      setTimeout(tick, 1200 + Math.random() * 800)
    }
    setTimeout(tick, 500)

    // Step 4: poll Bankr job (only if live)
    if (jobId) {
      const startedAt = Date.now()
      const poll = async () => {
        if (Date.now() - startedAt > 5 * 60 * 1000) {
          addLog('warn', 'Bankr job poll timeout (5m). Stopping.')
          setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'stopped' } : a)))
          setDeploying(false)
          return
        }
        try {
          const res = await fetch(`/api/bankr/job/${jobId}`)
          if (!res.ok) {
            setTimeout(poll, 3000)
            return
          }
          const job = await res.json()
          if (job.status === 'completed') {
            addLog('info', '─'.repeat(40))
            addLog('info', 'BANKR AGENT RESPONSE:')
            const lines = String(job.response ?? '').split('\n').filter(Boolean)
            lines.forEach((l: string) => addLog('info', l))
            addLog('info', '─'.repeat(40))
            // mark all visual tasks done
            setAgents((prev) =>
              prev.map((a) =>
                a.id === id
                  ? {
                      ...a,
                      status: 'completed',
                      bankrResponse: job.response,
                      tasks: a.tasks.map((t) => ({ ...t, done: true })),
                    }
                  : a,
              ),
            )
            setDeploying(false)
          } else if (job.status === 'failed' || job.status === 'cancelled') {
            addLog('warn', `Bankr job ${job.status}: ${job.response ?? 'no detail'}`)
            setAgents((prev) =>
              prev.map((a) => (a.id === id ? { ...a, status: 'stopped' } : a)),
            )
            setDeploying(false)
          } else {
            setTimeout(poll, 2500)
          }
        } catch {
          setTimeout(poll, 3000)
        }
      }
      setTimeout(poll, 2500)
    }
  }, [agentName, agentGoal, selectedTools])

  const stopAgent = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'stopped' } : a))
  }

  const deleteAgent = (id: string) => {
    setAgents(prev => prev.filter(a => a.id !== id))
  }

  return (
    <>
      {/* ─── Nav ─── */}
      <nav className={`nav ${navScrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav__inner">
          <a href="#" className="nav__brand">
            <img src="/niefa-logo.jpg" alt="NIEFA" className="nav__logo" />
            NIEFA
          </a>
          <div className={`nav__links ${menuOpen ? 'nav__links--open' : ''}`}>
            <a href="#features" onClick={() => setMenuOpen(false)}>[features]</a>
            <a href="#templates" onClick={() => setMenuOpen(false)}>[templates]</a>
            <a href="#bankr" onClick={() => setMenuOpen(false)}>[bankr]</a>
            <a href="#wallet" onClick={() => setMenuOpen(false)}>[wallet]</a>
            <a href="#launch" onClick={() => setMenuOpen(false)}>[launch]</a>
            <a href="#deploy" onClick={() => setMenuOpen(false)}>[deploy]</a>
            <a href="#token" onClick={() => setMenuOpen(false)}>[$NIEFA]</a>
            <a href="#sources" onClick={() => setMenuOpen(false)}>[source]</a>
          </div>
          <button className={`nav__burger ${menuOpen ? 'nav__burger--open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="hero">
        <div className="hero__content">
          <pre className="hero__ascii-logo">{ASCII_LOGO}</pre>

          <div className="hero__boot">
            <BootSequence lines={BOOT_LINES} speed={25} />
          </div>

          <div className="hero__after-boot">
            <pre className="hero__banner">{`  ┌─────────────────────────────────────────────────────────────────────────────┐
  │  Neural Interference Engine for Agents — Deploy autonomous AI agents that  │
  │  think, plan, and execute tasks independently. Open source. Production     │
  │  ready. Your goal → agent execution → results.                             │
  └─────────────────────────────────────────────────────────────────────────────┘`}</pre>

            <p className="hero__sub">
              NIEFA — Neural Interference Engine for Agents. An open-source platform for building and deploying autonomous AI agents. Give your agent a goal and watch it think, plan, and execute — all in real time.
            </p>

            <div className="hero__prompt-line">
              <span className="term-prompt">niefa@system:~$</span>{' '}
              <span className="hero__cmd">{heroTyped}</span>
              <span className="term-cursor">&#9608;</span>
            </div>

            <div className="hero__actions">
              <a href="#deploy" className="btn btn--primary">[ Deploy an Agent ]</a>
              <a href="https://github.com/niefa-xyz/niefa" target="_blank" rel="noopener noreferrer" className="btn btn--outline btn--icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </a>
              <a href="https://gitlawb.com/z6MktvfdARsR8Ld7dbEceswFg2pns738ThF722eM8wL1XddX/niefa" target="_blank" rel="noopener noreferrer" className="btn btn--outline btn--icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/><path d="M12 2L2 7l10 5 10-5-10-5z" opacity="0.3"/><circle cx="12" cy="12" r="2"/></svg>
                GitLawb
              </a>
            </div>

          </div>
        </div>
      </section>


      {/* ─── Deploy Section ─── */}
      <Section id="deploy" className="deploy">
        <div className="deploy__wrap" ref={deployRef}>
          <div className="section-header">
            <span className="section-tag">[try_it_now]</span>
            <h2 className="section-heading">&gt; Deploy Your Agent_</h2>
            <p className="section-sub">Give your agent a name and a goal. It will autonomously plan and execute tasks to achieve it. This is a live simulation.</p>
          </div>

          <div className="deploy__card">
            <div className="deploy__field">
              <label className="deploy__label"><span className="deploy__label-key">agent_name:</span></label>
              <input className="deploy__input" placeholder="ResearchBot" value={agentName} onChange={e => setAgentName(e.target.value)} />
            </div>
            <div className="deploy__field">
              <label className="deploy__label"><span className="deploy__label-key">goal:</span></label>
              <textarea className="deploy__textarea" rows={3} placeholder="Describe what you want your agent to accomplish..." value={agentGoal} onChange={e => setAgentGoal(e.target.value)} />
            </div>
            <div className="deploy__field">
              <label className="deploy__label"><span className="deploy__label-key">tools:</span></label>
              <div className="deploy__tools">
                {TOOLS_LIST.map(tool => (
                  <button key={tool} className={`chip ${selectedTools.includes(tool) ? 'chip--active' : ''}`} onClick={() => toggleTool(tool)}>
                    {tool}
                  </button>
                ))}
              </div>
            </div>
            <button className="deploy__submit" onClick={handleDeploy} disabled={deploying || !agentGoal.trim()}>
              {deploying ? '[DEPLOYING...]' : '[DEPLOY AGENT]'}
            </button>
          </div>

          {deployLogs.length > 0 && (
            <div className="deploy__live-output">
              <div className="deploy__status-bar">
                <span className={`status-badge ${deploying ? 'status-badge--running' : 'status-badge--idle'}`}>
                  <span className="status-dot" />
                  {deploying ? 'RUNNING' : 'COMPLETE'}
                </span>
                <span>AGENTS: {agents.length}</span>
              </div>
              <LogViewer logs={deployLogs} />
            </div>
          )}

          {agents.length > 0 && (
            <div className="deploy__dashboard">
              <div className="dashboard__header">
                <span className="section-tag">[agent_dashboard]</span>
                <h3 className="dashboard__title">&gt; Deployed Agents_</h3>
              </div>
              <div className="dashboard__grid">
                {agents.map(agent => (
                  <AgentCard key={agent.id} agent={agent} onStop={() => stopAgent(agent.id)} onDelete={() => deleteAgent(agent.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ─── Features ─── */}
      <Section id="features" className="features">
        <div className="section-header">
          <span className="section-tag">[capabilities]</span>
          <h2 className="section-heading">&gt; Everything Your Agent Needs_</h2>
          <p className="section-sub">Powerful features that make autonomous agents practical, safe, and production-ready.</p>
        </div>
        <div className="features__grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <div className="feature-card__divider">{'─'.repeat(50)}</div>
              <p className="feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Templates ─── */}
      <Section id="templates" className="templates">
        <div className="section-header">
          <span className="section-tag">[quick_start]</span>
          <h2 className="section-heading">&gt; Agent Templates_</h2>
          <p className="section-sub">Jump-start your workflow with pre-built agent configurations. Click to auto-fill and deploy.</p>
        </div>
        <div className="templates__grid">
          {TEMPLATES.map((t, i) => (
            <div key={i} className="term-card term-card--clickable" onClick={() => fillTemplate(t)}>
              <div className="term-card__bar">
                <span className="term-card__dot term-card__dot--red" />
                <span className="term-card__dot term-card__dot--yellow" />
                <span className="term-card__dot term-card__dot--green" />
                <span className="term-card__name">agent_config.yaml</span>
              </div>
              <pre className="term-card__ascii">{t.ascii}</pre>
              <div className="term-card__body">
                <div className="term-card__cmd">
                  <span className="term-card__prompt">$</span> {t.cmd}
                </div>
                <p className="term-card__desc">{t.desc}</p>
                <span className="term-card__tag">{t.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Bankr Integration ─── */}
      <Section id="bankr" className="bankr">
        <div className="section-header">
          <span className="section-tag">[bankr_integration]</span>
          <h2 className="section-heading">&gt; Powered by Bankr_</h2>
          <p className="section-sub">NIEFA agents plug straight into Bankr for wallets, payments, onchain execution, and persistent storage — no glue code required.</p>
        </div>
        <div className="bankr__grid">
          {BANKR_CAPABILITIES.map((cap, i) => (
            <div key={i} className="bankr-card">
              <div className="bankr-card__head">
                <span className="bankr-card__tag">{cap.tag}</span>
                <h3 className="bankr-card__title">{cap.title}</h3>
              </div>
              <div className="bankr-card__divider">{'─'.repeat(60)}</div>
              <p className="bankr-card__desc">{cap.desc}</p>
              <a className="bankr-card__link" href={cap.docs} target="_blank" rel="noopener noreferrer">
                &gt; {cap.docsLabel}
              </a>
            </div>
          ))}
        </div>
        <div className="bankr__footer">
          <span className="bankr__footer-label">Explore agents:</span>
          <a className="bankr__footer-link" href="https://bankr.bot/agents" target="_blank" rel="noopener noreferrer">
            bankr.bot/agents
          </a>
        </div>
      </Section>

      {/* ─── Wallet Dashboard (real Bankr Wallet API) ─── */}
      <Section id="wallet" className="wallet-section">
        <div className="section-header">
          <span className="section-tag">[wallet_api]</span>
          <h2 className="section-heading">&gt; Agent Wallet_</h2>
          <p className="section-sub">Live wallet state pulled from <code>GET /wallet/me</code> and <code>GET /wallet/portfolio</code> via the Bankr Wallet API.</p>
        </div>
        <div className="wallet-panel">
          {wallet.loading ? (
            <div className="wallet-panel__row"><span className="wallet-panel__label">status:</span> <span className="thinking-dots"><span /><span /><span /></span> querying Bankr...</div>
          ) : !wallet.configured ? (
            <div className="wallet-panel__empty">
              <div className="wallet-panel__row"><span className="wallet-panel__label">status:</span> <span className="wallet-panel__warn">NOT CONFIGURED</span></div>
              <p>Set <code>BANKR_API_KEY</code> in <code>.env.local</code> to enable live wallet, agent execution, and token launching. See <a href="https://bankr.bot/api" target="_blank" rel="noopener noreferrer">bankr.bot/api</a>.</p>
              <pre className="wallet-panel__snippet">{`# .env.local
BANKR_API_KEY=bk_your_api_key_here`}</pre>
            </div>
          ) : wallet.error ? (
            <div className="wallet-panel__row"><span className="wallet-panel__label">error:</span> <span className="wallet-panel__warn">{wallet.error}</span></div>
          ) : (
            <>
              <div className="wallet-panel__row">
                <span className="wallet-panel__label">status:</span>
                <span className="wallet-panel__ok">CONNECTED</span>
              </div>
              {wallet.address && (
                <div className="wallet-panel__row">
                  <span className="wallet-panel__label">address:</span>
                  <code className="wallet-panel__addr">{wallet.address}</code>
                  <CopyButton text={wallet.address} />
                </div>
              )}
              {typeof wallet.totalValue === 'number' && (
                <div className="wallet-panel__row">
                  <span className="wallet-panel__label">portfolio_usd:</span>
                  <span className="wallet-panel__value">${wallet.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {wallet.tokens && wallet.tokens.length > 0 && (
                <div className="wallet-panel__tokens">
                  <div className="wallet-panel__label">tokens:</div>
                  <table className="wallet-panel__table">
                    <thead><tr><th>symbol</th><th>chain</th><th>balance</th><th>usd</th></tr></thead>
                    <tbody>
                      {wallet.tokens.slice(0, 10).map((t, i) => (
                        <tr key={i}>
                          <td>{t.symbol}</td>
                          <td>{t.chain ?? '—'}</td>
                          <td>{t.balance}</td>
                          <td>{typeof t.usdValue === 'number' ? `$${t.usdValue.toFixed(2)}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      {/* ─── Token Launcher (real Bankr Token Launching) ─── */}
      <Section id="launch" className="launch-section">
        <div className="section-header">
          <span className="section-tag">[token_launching]</span>
          <h2 className="section-heading">&gt; Launch a Token_</h2>
          <p className="section-sub">Deploy a token on Base via <code>POST /token-launches/deploy</code>. Earn 57% of the 1.2% swap fee. 100B fixed supply.</p>
        </div>
        <div className="deploy__card launch-card">
          <div className="deploy__field">
            <label className="deploy__label"><span className="deploy__label-key">name:</span></label>
            <input className="deploy__input" placeholder="My Agent Token" value={token.name} onChange={(e) => setToken({ ...token, name: e.target.value })} />
          </div>
          <div className="deploy__field">
            <label className="deploy__label"><span className="deploy__label-key">symbol:</span></label>
            <input className="deploy__input" placeholder="MAT" maxLength={10} value={token.symbol} onChange={(e) => setToken({ ...token, symbol: e.target.value.toUpperCase() })} />
          </div>
          <div className="deploy__field">
            <label className="deploy__label"><span className="deploy__label-key">description:</span></label>
            <textarea className="deploy__textarea" rows={2} placeholder="optional — what this token is for" value={token.description} onChange={(e) => setToken({ ...token, description: e.target.value })} />
          </div>
          <button className="deploy__submit" onClick={launchTokenHandler} disabled={token.launching || !token.name.trim() || !token.symbol.trim()}>
            {token.launching ? '[DEPLOYING TO BASE...]' : '[LAUNCH TOKEN]'}
          </button>
          {token.error && <div className="launch-card__error">{token.error}</div>}
          {token.result && (
            <div className="launch-card__result">
              <div className="wallet-panel__row"><span className="wallet-panel__label">deployed:</span> <span className="wallet-panel__ok">OK</span></div>
              <div className="wallet-panel__row">
                <span className="wallet-panel__label">token_address:</span>
                <code className="wallet-panel__addr">{token.result.tokenAddress}</code>
                <CopyButton text={token.result.tokenAddress} />
              </div>
              {token.result.txHash && (
                <div className="wallet-panel__row">
                  <span className="wallet-panel__label">tx:</span>
                  <code className="wallet-panel__addr">{token.result.txHash}</code>
                </div>
              )}
              <div className="wallet-panel__row">
                <span className="wallet-panel__label">chain:</span>
                <span>{token.result.chain ?? 'Base'}</span>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ─── How It Works ─── */}
      <Section className="how">
        <div className="section-header">
          <span className="section-tag">[process]</span>
          <h2 className="section-heading">&gt; How It Works_</h2>
          <p className="section-sub">From goal to result in four simple steps — no coding required.</p>
        </div>
        <div className="how__grid">
          {STEPS.map((s, i) => (
            <div key={i} className="step">
              <div className="step__head">
                <div className="step__num">{s.num}</div>
                <div className="step__line" />
              </div>
              <div className="step__icon">{s.icon}</div>
              <h3 className="step__title">{s.title}</h3>
              <p className="step__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Tech ─── */}
      <Section className="tech">
        <div className="section-header">
          <span className="section-tag">[built_with]</span>
          <h2 className="section-heading">&gt; Powered by_</h2>
        </div>
        <div className="tech__row">
          {TECH_BADGES.map(t => (
            <span key={t} className="tech-badge">[{t}]</span>
          ))}
        </div>
      </Section>

      {/* ─── Token ─── */}
      <Section id="token" className="token">
        <div className="section-header">
          <span className="section-tag">[$NIEFA]</span>
          <h2 className="section-heading">&gt; $NIEFA Token_</h2>
          <p className="section-sub">The native token powering the NIEFA ecosystem.</p>
        </div>
        <div className="token__card">
          <div className="token__header">
            <div className="token__symbol">$NIEFA</div>
            <span className="token__badge">ERC-20</span>
          </div>
          <div className="token__ca">
            <span className="token__ca-label">Contract Address:</span>
            <div className="token__ca-value">
              <code>0xe777f8da063c0252575f09e0f6475a0994f2bba3</code>
              <CopyButton text="0xe777f8da063c0252575f09e0f6475a0994f2bba3" />
            </div>
          </div>
          <div className="token__divider">{'─'.repeat(60)}</div>
          <div className="token__utility">
            <h3 className="token__utility-title">Utility</h3>
            <div className="token__utility-grid">
              <div className="token__utility-item">
                <span className="token__utility-icon">[AG]</span>
                <span className="token__utility-name">Agent Deployment</span>
                <span className="token__coming-soon">coming soon</span>
              </div>
              <div className="token__utility-item">
                <span className="token__utility-icon">[TL]</span>
                <span className="token__utility-name">Tool Marketplace</span>
                <span className="token__coming-soon">coming soon</span>
              </div>
              <div className="token__utility-item">
                <span className="token__utility-icon">[GV]</span>
                <span className="token__utility-name">Governance</span>
                <span className="token__coming-soon">coming soon</span>
              </div>
              <div className="token__utility-item">
                <span className="token__utility-icon">[ST]</span>
                <span className="token__utility-name">Staking</span>
                <span className="token__coming-soon">coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Source ─── */}
      <Section id="sources" className="sources">
        <div className="section-header">
          <span className="section-tag">[open_source]</span>
          <h2 className="section-heading">&gt; Source Code_</h2>
          <p className="section-sub">NIEFA is fully open source. Clone, fork, and contribute.</p>
        </div>
        <div className="sources__grid">
          <a href="https://github.com/niefa-xyz/niefa" target="_blank" rel="noopener noreferrer" className="source-card">
            <div className="source-card__icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </div>
            <div className="source-card__info">
              <span className="source-card__name">GitHub</span>
              <span className="source-card__repo">niefa-xyz/niefa</span>
            </div>
            <span className="source-card__arrow">&gt;</span>
          </a>
          <a href="https://gitlawb.com/z6MktvfdARsR8Ld7dbEceswFg2pns738ThF722eM8wL1XddX/niefa" target="_blank" rel="noopener noreferrer" className="source-card">
            <div className="source-card__icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <div className="source-card__info">
              <span className="source-card__name">GitLawb</span>
              <span className="source-card__repo">Decentralized Mirror</span>
            </div>
            <span className="source-card__arrow">&gt;</span>
          </a>
        </div>
        <div className="sources__clone">
          <span className="sources__clone-label">Clone:</span>
          <code className="sources__clone-cmd">git clone https://github.com/niefa-xyz/niefa.git</code>
        </div>
      </Section>

      {/* ─── CTA ─── */}
      <Section className="cta">
        <div className="cta__content">
          <pre className="cta__ascii">{ASCII_LOGO}</pre>
          <div className="cta__actions">
            <a href="#deploy" className="btn btn--primary">[ Get Started Free ]</a>
            <a href="https://github.com/niefa-xyz/niefa" target="_blank" rel="noopener noreferrer" className="btn btn--outline btn--icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
            <a href="https://gitlawb.com/z6MktvfdARsR8Ld7dbEceswFg2pns738ThF722eM8wL1XddX/niefa" target="_blank" rel="noopener noreferrer" className="btn btn--outline btn--icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/><path d="M12 2L2 7l10 5 10-5-10-5z" opacity="0.3"/><circle cx="12" cy="12" r="2"/></svg>
              GitLawb
            </a>
          </div>
        </div>
      </Section>

      {/* ─── Footer ─── */}
      <footer className="footer">
        <div className="footer__inner">
          <pre className="footer__ascii-art">{ASCII_LOGO}</pre>
          <div className="footer__grid">
            <div className="footer__col">
              <h4>[product]</h4>
              <ul>
                <li><a href="#features">&gt; Features</a></li>
                <li><a href="#templates">&gt; Templates</a></li>
                <li><a href="#deploy">&gt; Deploy</a></li>
              </ul>
            </div>
            <div className="footer__col">
              <h4>[community]</h4>
              <ul>
                <li><a href="https://x.com/niefa_xyz" target="_blank" rel="noopener noreferrer">&gt; X (Twitter)</a></li>
                <li><a href="https://github.com/niefa-xyz/niefa" target="_blank" rel="noopener noreferrer">&gt; GitHub</a></li>
                <li><a href="https://gitlawb.com/z6MktvfdARsR8Ld7dbEceswFg2pns738ThF722eM8wL1XddX/niefa" target="_blank" rel="noopener noreferrer">&gt; GitLawb</a></li>
              </ul>
            </div>
          </div>
          <div className="footer__bottom">
            <span>&copy; 2026 NIEFA. All rights reserved.</span>
            <a href="https://x.com/niefa_xyz" target="_blank" rel="noopener noreferrer" className="footer__x">[x.com]</a>
          </div>
        </div>
      </footer>
    </>
  )
}
