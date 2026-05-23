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
  response?: string
}

interface LogEntry { time: string; type: 'info' | 'warn' | 'err'; msg: string }

// ─── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: '[AG]', title: 'Autonomous Agents', desc: 'Define a goal in natural language. Agents plan, decide, and act without scripting every step.' },
  { icon: '[RZ]', title: 'Adaptive Reasoning', desc: 'Chain-of-thought decomposition with self-correction. Sub-tasks adapt to feedback in real time.' },
  { icon: '[TL]', title: 'Tool Use', desc: 'Web search, code execution, file I/O, HTTP clients — agents pick the right tool for the job.' },
  { icon: '[ST]', title: 'Live Streaming', desc: 'Every decision and action streamed to the dashboard. No black-box execution.' },
  { icon: '[SF]', title: 'Safe & Controllable', desc: 'Budget limits, approval gates, sandboxed runtimes. You stay in the loop.' },
  { icon: '[OS]', title: 'Open Source', desc: 'Permissive license. Self-host the runtime, fork the engine, ship your own variants.' },
]

const TEMPLATES = [
  { title: 'Research Analyst', cmd: 'niefa --template research', desc: 'Gather sources, synthesize findings, produce structured reports with citations.', tag: 'research', defaultGoal: 'Research the latest advancements in large language models and produce a structured summary' },
  { title: 'Code Assistant', cmd: 'niefa --template code', desc: 'Read, write, debug code across any stack with full project context.', tag: 'dev', defaultGoal: 'Build a task management app with React frontend and Node.js backend' },
  { title: 'Content Creator', cmd: 'niefa --template content', desc: 'Blog posts, social copy, marketing content tuned to your voice.', tag: 'marketing', defaultGoal: 'Write a series of blog posts on autonomous agent architectures' },
  { title: 'Data Miner', cmd: 'niefa --template datamine', desc: 'Scrape, clean, analyze web data at scale. Extract trends and signals.', tag: 'analytics', defaultGoal: 'Scrape trending GitHub repositories and identify emerging tech patterns' },
  { title: 'Project Planner', cmd: 'niefa --template planner', desc: 'Break objectives into roadmaps with milestones, dependencies, timelines.', tag: 'productivity', defaultGoal: 'Create a 3-month launch plan for a new SaaS product' },
  { title: 'Customer Support', cmd: 'niefa --template support', desc: 'Triage inquiries, resolve common issues, escalate edge cases with context.', tag: 'support', defaultGoal: 'Set up automated support replies for common SaaS onboarding questions' },
]

const TASK_SEQUENCES: Record<string, string[]> = {
  research: ['Expanding research context...', 'Querying source corpora...', 'Extracting key findings...', 'Cross-referencing citations...', 'Synthesizing summary...', 'Compiling final report...'],
  dev: ['Analyzing project structure...', 'Reading existing context...', 'Drafting architecture...', 'Generating modules...', 'Writing tests...', 'Verifying build...'],
  marketing: ['Profiling audience and brand voice...', 'Analyzing competitor positioning...', 'Outlining content arc...', 'Drafting copy with SEO...', 'Running readability pass...', 'Finalizing for publication...'],
  analytics: ['Identifying data sources...', 'Configuring scrapers...', 'Extracting raw data...', 'Cleaning and normalizing...', 'Running statistical analysis...', 'Exporting dataset and report...'],
  productivity: ['Parsing goal into sub-tasks...', 'Allocating resources...', 'Sequencing execution...', 'Validating intermediate output...', 'Refining deliverables...', 'Packaging final result...'],
  support: ['Loading knowledge base...', 'Indexing FAQ corpus...', 'Generating response templates...', 'Running sentiment analysis...', 'Matching prior cases...', 'Drafting personalized reply...'],
}

const TOOLS_LIST = ['Web Search', 'Code Exec', 'File I/O', 'HTTP Client', 'Browser', 'x402', 'Agent FS']

const TECH_BADGES = ['Next.js', 'TypeScript', 'FastAPI', 'LangChain', 'x402', 'Tailwind', 'Docker', 'JetBrains Mono']

const SERVICES = [
  {
    tag: '[x402]',
    title: 'x402 Paid Endpoints',
    desc: 'Register protected API endpoints with USDC pricing. NIEFA serves the 402 challenge, collects payment proof, and gates resource access — HTTP-native, stablecoin-settled.',
    code: (
      <>
        <span className="verb">POST</span> <span className="pth">/api/niefa/x402</span> <span className="cmt">// register</span>{'\n'}
        <span className="verb">POST</span> <span className="pth">/api/niefa/x402</span> <span className="cmt">// pay & access</span>{'\n'}
        <span className="cmt"># returns 402 with on-chain payment</span>{'\n'}
        <span className="cmt"># details — USDC on Base</span>
      </>
    ),
  },
  {
    tag: '[afs]',
    title: 'Agent File System',
    desc: 'Per-agent sandboxed storage. Every agent gets isolated read/write/list/delete operations on its own namespace with quota enforcement and path-traversal protection.',
    code: (
      <>
        <span className="verb">GET</span>    <span className="pth">/api/niefa/fs?agent=&path=</span>{'\n'}
        <span className="verb">POST</span>   <span className="pth">/api/niefa/fs</span> <span className="cmt">// write</span>{'\n'}
        <span className="verb">DELETE</span> <span className="pth">/api/niefa/fs?agent=&path=</span>{'\n'}
        <span className="cmt"># 1 MB/file · 10 MB/agent · sandboxed</span>
      </>
    ),
  },
]

const STEPS = [
  { num: '01', title: 'Define Your Goal', desc: 'Describe the outcome in natural language. No DSL, no flow diagrams.' },
  { num: '02', title: 'Agent Plans', desc: 'NIEFA breaks the goal into ordered steps using its planning model.' },
  { num: '03', title: 'Autonomous Execution', desc: 'Steps execute with tools. The agent self-corrects on errors and feedback.' },
  { num: '04', title: 'Deliver Results', desc: 'Final output streams to the dashboard with full reasoning transcript.' },
]

// ─── Hooks ─────────────────────────────────────────────────────────────────────

function useTypewriter(texts: string[], speed = 50) {
  const [display, setDisplay] = useState('')
  const idxRef = useRef(0)
  const charRef = useRef(0)
  const deletingRef = useRef(false)

  useEffect(() => {
    const tick = () => {
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
          setTimeout(() => { deletingRef.current = true }, 1400)
        }
      }
    }
    const interval = setInterval(tick, speed)
    return () => clearInterval(interval)
  }, [texts, speed])

  return display
}

function useInView(threshold = 0.12) {
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

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, inView } = useInView()
  return (
    <section ref={ref} id={id} className={`${className} reveal ${inView ? 'visible' : ''}`}>
      {children}
    </section>
  )
}

// ─── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }
  return <button className="copy-btn" onClick={onCopy}>{copied ? '[copied]' : '[copy]'}</button>
}

// ─── Agent card ────────────────────────────────────────────────────────────────

function AgentCard({ agent, onStop, onDelete }: { agent: Agent; onStop: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const statusColors: Record<AgentStatus, string> = {
    initializing: 'var(--amber2)',
    running: 'var(--green2)',
    thinking: 'var(--amber2)',
    completed: 'var(--t3)',
    stopped: 'var(--red)',
  }
  const doneCount = agent.tasks.filter(t => t.done).length
  const pct = agent.tasks.length > 0 ? Math.round((doneCount / agent.tasks.length) * 100) : 0
  const isActive = agent.status === 'running' || agent.status === 'thinking'

  return (
    <div className={`agent ${isActive ? 'agent--active' : ''}`}>
      <div className="agent__head" onClick={() => setExpanded(!expanded)}>
        <div className="agent__title">
          <span
            className="agent__status-dot"
            style={{
              background: statusColors[agent.status],
              boxShadow: isActive ? `0 0 6px ${statusColors[agent.status]}` : 'none',
            }}
          />
          <span>{agent.name}</span>
          <span className="agent__id">id: {agent.id}</span>
        </div>
        <div className="agent__meta">
          <span className={`agent__mode agent__mode--${agent.mode}`}>{agent.mode === 'live' ? 'LIVE' : 'SIM'}</span>
          <span style={{ color: statusColors[agent.status] }}>{agent.status.toUpperCase()}</span>
          <span className="agent__toggle">{expanded ? '[-]' : '[+]'}</span>
        </div>
      </div>

      <div className="agent__progress">
        <div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${pct}%` }} /></div>
        <span>{doneCount}/{agent.tasks.length} · {pct}%</span>
      </div>

      {expanded && (
        <div className="agent__expand">
          <div className="agent__goal"><span className="lbl">goal:</span>{agent.goal}</div>
          <div className="agent__tools">
            <span className="lbl">tools:</span>
            {agent.tools.map(t => <span key={t} className="tool">{t}</span>)}
          </div>
          <div className="task-list">
            {agent.tasks.map((task, i) => {
              const isCurrent = i === doneCount
              const isThinking = isCurrent && agent.status === 'thinking'
              return (
                <div
                  key={i}
                  className={`task ${task.done ? 'task--done' : isCurrent ? 'task--active' : ''}`}
                >
                  <span className="task__icon">
                    {task.done ? '[✓]' : isThinking ? '' : isCurrent ? '[>]' : '[ ]'}
                  </span>
                  {isThinking && (
                    <span className="thinking-dots"><span /><span /><span /></span>
                  )}
                  {task.text}
                </div>
              )
            })}
          </div>
          {agent.jobId && (
            <div className="agent__job"><span className="lbl">job_id:</span><code>{agent.jobId}</code></div>
          )}
          {agent.response && (
            <div className="agent__resp">
              <span className="lbl">response:</span>
              <pre>{agent.response}</pre>
            </div>
          )}
          {isActive && (
            <div className="agent__actions">
              <button className="agent__btn agent__btn--stop" onClick={onStop}>[STOP]</button>
              <button className="agent__btn agent__btn--del" onClick={onDelete}>[DELETE]</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [agentName, setAgentName] = useState('')
  const [agentGoal, setAgentGoal] = useState('')
  const [selectedTools, setSelectedTools] = useState<string[]>(['Web Search', 'Code Exec'])
  const [agents, setAgents] = useState<Agent[]>([])
  const [deployLogs, setDeployLogs] = useState<LogEntry[]>([])
  const [deploying, setDeploying] = useState(false)
  const deployRef = useRef<HTMLDivElement>(null)

  const heroTyped = useTypewriter([
    'deploy --goal "research GPT-5 capabilities"',
    'spawn --template code --interactive',
    'agents --list --status running',
    'tools --available',
  ], 55)

  const toggleTool = (t: string) =>
    setSelectedTools(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])

  const fillTemplate = (t: typeof TEMPLATES[0]) => {
    setAgentGoal(t.defaultGoal)
    deployRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const genId = () => Math.random().toString(36).slice(2, 7)

  const handleDeploy = useCallback(async () => {
    if (!agentGoal.trim()) return
    const id = genId()
    const name = agentName.trim() || `Agent-${id}`

    setDeploying(true)
    setDeployLogs([])

    const addLog = (type: LogEntry['type'], msg: string) => {
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      setDeployLogs(prev => [...prev, { time, type, msg }])
    }

    addLog('info', `Spawning agent '${name}' (id: ${id})`)
    addLog('info', `goal: ${agentGoal}`)
    addLog('info', `tools: ${selectedTools.join(', ')}`)

    let taskTexts: string[] = []
    let mode: AgentMode = 'sim'

    try {
      addLog('info', '> Requesting execution plan from LLM gateway...')
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
          addLog('info', `plan ready — ${plan.length} steps`)
        }
      } else if (planRes.status === 501) {
        addLog('warn', 'LLM gateway not configured — running in simulation mode')
      } else {
        addLog('warn', `LLM gateway error ${planRes.status} — falling back to template`)
      }
    } catch (err: any) {
      addLog('warn', `LLM gateway unreachable: ${err.message} — falling back to template`)
    }

    if (taskTexts.length === 0) {
      const key = TEMPLATES.find(t => agentGoal.includes(t.defaultGoal.slice(0, 18)))?.tag || 'productivity'
      taskTexts = TASK_SEQUENCES[key] ?? TASK_SEQUENCES.productivity
    }

    const newAgent: Agent = {
      id, name, goal: agentGoal, status: 'initializing',
      tasks: taskTexts.map(text => ({ text, done: false })),
      tools: [...selectedTools],
      mode,
    }
    setAgents(prev => [...prev, newAgent])

    let jobId: string | undefined
    if (mode === 'live') {
      try {
        addLog('info', '> Submitting to agent runtime...')
        const res = await fetch('/api/bankr/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: `${agentGoal}\n\nAvailable tools: ${selectedTools.join(', ')}` }),
        })
        if (res.ok) {
          const data = await res.json()
          jobId = data.jobId
          addLog('info', `agent queued — job: ${jobId}`)
          setAgents(prev => prev.map(a => a.id === id ? { ...a, jobId, threadId: data.threadId, status: 'running' } : a))
        } else {
          addLog('warn', `runtime error ${res.status}`)
        }
      } catch (err: any) {
        addLog('warn', `runtime unreachable: ${err.message}`)
      }
    }

    if (!jobId) {
      setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'running' } : a))
    }

    // Visual task progression
    let taskIdx = 0
    const tick = () => {
      if (taskIdx >= taskTexts.length) {
        if (!jobId) {
          addLog('info', 'all tasks completed.')
          setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a))
          setDeploying(false)
        }
        return
      }
      setAgents(prev => prev.map(a => {
        if (a.id !== id) return a
        const tasks = [...a.tasks]
        if (taskIdx > 0) tasks[taskIdx - 1] = { ...tasks[taskIdx - 1], done: true }
        return { ...a, tasks, status: taskIdx % 3 === 1 ? 'thinking' : 'running' }
      }))
      addLog(taskIdx % 3 === 1 ? 'warn' : 'info', taskTexts[taskIdx])
      taskIdx++
      setTimeout(tick, 1200 + Math.random() * 800)
    }
    setTimeout(tick, 500)

    // Poll job (live mode)
    if (jobId) {
      const startedAt = Date.now()
      const poll = async () => {
        if (Date.now() - startedAt > 5 * 60 * 1000) {
          addLog('warn', 'poll timeout (5m). stopping.')
          setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'stopped' } : a))
          setDeploying(false)
          return
        }
        try {
          const res = await fetch(`/api/bankr/job/${jobId}`)
          if (!res.ok) { setTimeout(poll, 3000); return }
          const job = await res.json()
          if (job.status === 'completed') {
            addLog('info', '─ AGENT RESPONSE ─')
            String(job.response ?? '').split('\n').filter(Boolean).forEach((l: string) => addLog('info', l))
            setAgents(prev => prev.map(a => a.id === id ? {
              ...a, status: 'completed', response: job.response,
              tasks: a.tasks.map(t => ({ ...t, done: true })),
            } : a))
            setDeploying(false)
          } else if (job.status === 'failed' || job.status === 'cancelled') {
            addLog('warn', `job ${job.status}: ${job.response ?? 'no detail'}`)
            setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'stopped' } : a))
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

  const stopAgent = (id: string) => setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'stopped' } : a))
  const deleteAgent = (id: string) => setAgents(prev => prev.filter(a => a.id !== id))

  return (
    <>
      {/* ─── Nav ─── */}
      <nav className="nav">
        <div className="nav__inner">
          <a href="#" className="nav__brand">
            <img src="/niefa-logo.jpg" alt="NIEFA" />
            NIEFA
          </a>
          <div className={`nav__links ${menuOpen ? 'nav__links--open' : ''}`}>
            <a href="#features" onClick={() => setMenuOpen(false)}>features</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>how it works</a>
            <a href="#templates" onClick={() => setMenuOpen(false)}>templates</a>
            <a href="#services" onClick={() => setMenuOpen(false)}>infra</a>
            <a href="#token" onClick={() => setMenuOpen(false)}>$NIEFA</a>
            <a href="#deploy" className="nav__cta" onClick={() => setMenuOpen(false)}>deploy →</a>
          </div>
          <button className="nav__burger" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="hero grid-bg">
        <div className="hero__orb hero__orb--1" />
        <div className="hero__orb hero__orb--2" />
        <div className="hero__inner">
          <div>
            <div className="hero__eyebrow">
              <span className="pulse" />
              <span>v3.0 · neural orchestration runtime</span>
            </div>
            <h1 className="hero__h1">
              <span className="grad-green">Neural</span> <span className="myth">Interference</span><br />
              <span>Engine for Agents.</span>
            </h1>
            <p className="hero__sub">
              NIEFA is an open-source runtime for autonomous AI agents. Describe a goal — the engine plans, executes, and adapts. Real reasoning. Real tool use. No black boxes.
            </p>
            <div className="hero__actions">
              <a href="#deploy" className="btn btn--primary">Deploy an Agent →</a>
              <a href="https://github.com/niefa-xyz/niefa" target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </a>
            </div>
            <div className="hero__terminal">
              <span className="prompt">niefa@runtime:~$</span>
              <span>{heroTyped}</span>
              <span className="hero__cursor">▊</span>
            </div>
          </div>

          {/* Neural visual */}
          <div className="hero__visual" aria-hidden="true">
            <div className="neural-ring" />
            <div className="neural-ring neural-ring--2" />
            <div className="neural-ring neural-ring--3" />
            <svg viewBox="0 0 400 400" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <defs>
                <radialGradient id="hub" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Edges */}
              {[
                [200, 200, 80, 60], [200, 200, 320, 80], [200, 200, 340, 220],
                [200, 200, 280, 340], [200, 200, 120, 320], [200, 200, 60, 200],
                [80, 60, 320, 80], [320, 80, 340, 220], [340, 220, 280, 340],
                [280, 340, 120, 320], [120, 320, 60, 200], [60, 200, 80, 60],
              ].map(([x1, y1, x2, y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#22c55e" strokeWidth="0.8" opacity="0.35" strokeLinecap="round" />
              ))}
              {/* Hub */}
              <circle cx="200" cy="200" r="48" fill="url(#hub)" />
              <circle cx="200" cy="200" r="10" fill="#040806" stroke="#22c55e" strokeWidth="1.4" />
              <circle cx="200" cy="200" r="4" fill="#4ade80" />
              {/* Outer nodes */}
              {[[80, 60], [320, 80], [340, 220], [280, 340], [120, 320], [60, 200]].map(([cx, cy], i) => (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="6" fill="#040806" stroke="#22c55e" strokeWidth="1.3" />
                  <circle cx={cx} cy={cy} r="2.5" fill="#22c55e" />
                </g>
              ))}
            </svg>
            <span className="neural-label" style={{ top: '8%', left: '50%', transform: 'translateX(-50%)' }}>// runtime</span>
            <span className="neural-label" style={{ top: '50%', right: '0%', animationDelay: '1.5s' }}>// reason</span>
            <span className="neural-label" style={{ bottom: '8%', left: '50%', transform: 'translateX(-50%)', animationDelay: '3s' }}>// execute</span>
            <span className="neural-label" style={{ top: '50%', left: '0%', animationDelay: '4.5s' }}>// adapt</span>
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─── */}
      <div className="stats-strip">
        <div className="stats-strip__inner">
          <div className="stat"><span className="stat__num grad-green">6</span><span className="stat__lbl">core capabilities</span></div>
          <div className="stat"><span className="stat__num grad-amber">10ms</span><span className="stat__lbl">stream latency</span></div>
          <div className="stat"><span className="stat__num grad-green">∞</span><span className="stat__lbl">parallel agents</span></div>
          <div className="stat"><span className="stat__num grad-amber">MIT</span><span className="stat__lbl">open source</span></div>
        </div>
      </div>
      <div className="greek-key" />

      {/* ─── Features ─── */}
      <Section id="features">
        <div className="section-header">
          <span className="section-tag">capabilities</span>
          <h2>What the engine does.</h2>
          <p>Six primitives that turn a one-line goal into a working result.</p>
        </div>
        <div className="features__grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feat-card">
              <div className="feat-card__icon">{f.icon}</div>
              <h3 className="feat-card__title">{f.title}</h3>
              <p className="feat-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── How It Works ─── */}
      <Section id="how" className="section-bg-alt">
        <div className="section-header">
          <span className="section-tag">process</span>
          <h2>From goal to result, in four moves.</h2>
          <p>No DSL. No flow editor. Just a sentence and a deploy button.</p>
        </div>
        <div className="how__grid">
          {STEPS.map((s, i) => (
            <div key={i} className="step">
              <div className="step__num">{s.num}</div>
              <h3 className="step__title">{s.title}</h3>
              <p className="step__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Deploy ─── */}
      <Section id="deploy">
        <div className="section-header">
          <span className="section-tag">try it now</span>
          <h2>Deploy your agent.</h2>
          <p>Name it. Give it a goal. Pick its tools. Watch it run.</p>
        </div>
        <div className="deploy__inner" ref={deployRef}>
          <div className="deploy-card">
            <div className="deploy-card__bar">
              <span className="dot r" /><span className="dot y" /><span className="dot g" />
              <span className="name">agent_config.yaml</span>
            </div>
            <div className="deploy-card__field">
              <label className="deploy-card__label"><span className="k">agent_name</span></label>
              <input className="deploy-card__input" placeholder="ResearchBot" value={agentName} onChange={e => setAgentName(e.target.value)} />
            </div>
            <div className="deploy-card__field">
              <label className="deploy-card__label"><span className="k">goal</span></label>
              <textarea className="deploy-card__textarea" placeholder="Describe what you want your agent to accomplish..." value={agentGoal} onChange={e => setAgentGoal(e.target.value)} />
            </div>
            <div className="deploy-card__field">
              <label className="deploy-card__label"><span className="k">tools</span></label>
              <div className="chip-row">
                {TOOLS_LIST.map(t => (
                  <button key={t} className={`chip ${selectedTools.includes(t) ? 'chip--active' : ''}`} onClick={() => toggleTool(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button className="deploy-card__submit" onClick={handleDeploy} disabled={deploying || !agentGoal.trim()}>
              {deploying ? '[DEPLOYING...]' : '[DEPLOY AGENT →]'}
            </button>
          </div>

          {deployLogs.length > 0 && (
            <div className="console">
              <div className="console__bar">
                <span className={`status-pill ${deploying ? 'status-pill--running' : 'status-pill--idle'}`}>
                  <span className="dot" />
                  {deploying ? 'RUNNING' : 'COMPLETE'}
                </span>
                <span style={{ color: 'var(--t3)', fontSize: 11 }}>agents: {agents.length}</span>
              </div>
              {deployLogs.map((log, i) => (
                <div key={i} className="log-line">
                  <span className="t">{log.time}</span>
                  <span className={`lvl-${log.type}`}>{log.type.toUpperCase()}</span>
                  <span className="msg">{log.msg}</span>
                </div>
              ))}
            </div>
          )}

          {agents.length > 0 && (
            <div className="dashboard">
              <div className="dashboard__head">
                <span className="section-tag">dashboard</span>
                <h3>Deployed agents</h3>
              </div>
              <div className="agent-grid">
                {agents.map(a => (
                  <AgentCard key={a.id} agent={a} onStop={() => stopAgent(a.id)} onDelete={() => deleteAgent(a.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ─── Templates ─── */}
      <Section id="templates" className="section-bg-alt">
        <div className="section-header">
          <span className="section-tag">quick start</span>
          <h2>Agent templates.</h2>
          <p>Pre-built configurations. Click one to auto-fill the deploy form.</p>
        </div>
        <div className="tpl__grid">
          {TEMPLATES.map((t, i) => (
            <div key={i} className="tpl-card" onClick={() => fillTemplate(t)}>
              <div className="tpl-card__head">
                <h3 className="tpl-card__title">{t.title}</h3>
                <span className="tpl-card__tag">{t.tag}</span>
              </div>
              <div className="tpl-card__cmd">$ {t.cmd}</div>
              <p className="tpl-card__desc">{t.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Services (x402 + AFS) ─── */}
      <Section id="services">
        <div className="section-header">
          <span className="section-tag">infra primitives</span>
          <h2>Built-in agent infrastructure.</h2>
          <p>Two NIEFA-native systems agents can use out of the box — paid endpoints and persistent file storage.</p>
        </div>
        <div className="svc__grid">
          {SERVICES.map((s, i) => (
            <div key={i} className="svc-card">
              <div className="svc-card__head">
                <span className="svc-card__tag">{s.tag}</span>
                <h3 className="svc-card__title">{s.title}</h3>
              </div>
              <p className="svc-card__desc">{s.desc}</p>
              <pre className="svc-card__code">{s.code}</pre>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Tech ─── */}
      <Section className="section-bg-alt">
        <div className="section-header">
          <span className="section-tag">stack</span>
          <h2>Built with.</h2>
        </div>
        <div className="tech__row">
          {TECH_BADGES.map(t => <span key={t} className="tech-badge">{t}</span>)}
        </div>
      </Section>

      {/* ─── Token ─── */}
      <Section id="token">
        <div className="section-header">
          <span className="section-tag">$NIEFA</span>
          <h2>The native token.</h2>
          <p>Powering the NIEFA ecosystem — deployment credits, marketplace access, governance.</p>
        </div>
        <div className="token__wrap">
          <div className="token-card">
            <div className="token-card__head">
              <div className="token-card__sym grad-green">$NIEFA</div>
              <span className="badge badge--amber">ERC-20</span>
            </div>
            <div className="token-card__ca">
              <span className="token-card__ca-lbl">contract address</span>
              <div className="token-card__ca-val">
                <code>0xe777f8da063c0252575f09e0f6475a0994f2bba3</code>
                <CopyButton text="0xe777f8da063c0252575f09e0f6475a0994f2bba3" />
              </div>
            </div>
            <div className="token__utility">
              <div className="utility">
                <span className="utility__icon">[AG]</span>
                <span className="utility__name">Agent Credits</span>
                <span className="utility__soon">coming soon</span>
              </div>
              <div className="utility">
                <span className="utility__icon">[TL]</span>
                <span className="utility__name">Tool Marketplace</span>
                <span className="utility__soon">coming soon</span>
              </div>
              <div className="utility">
                <span className="utility__icon">[GV]</span>
                <span className="utility__name">Governance</span>
                <span className="utility__soon">coming soon</span>
              </div>
              <div className="utility">
                <span className="utility__icon">[ST]</span>
                <span className="utility__name">Staking</span>
                <span className="utility__soon">coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Source ─── */}
      <Section id="source" className="section-bg-alt">
        <div className="section-header">
          <span className="section-tag">open source</span>
          <h2>The whole engine, in the open.</h2>
          <p>Clone, fork, ship your own variant. MIT-licensed end to end.</p>
        </div>
        <div className="sources__grid">
          <a href="https://github.com/niefa-xyz/niefa" target="_blank" rel="noopener noreferrer" className="source-card">
            <div className="source-card__icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </div>
            <div className="source-card__info">
              <span className="source-card__name">GitHub</span>
              <span className="source-card__repo">niefa-xyz/niefa</span>
            </div>
            <span className="source-card__arrow">→</span>
          </a>
          <a href="https://gitlawb.com/z6MktvfdARsR8Ld7dbEceswFg2pns738ThF722eM8wL1XddX/niefa" target="_blank" rel="noopener noreferrer" className="source-card">
            <div className="source-card__icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <div className="source-card__info">
              <span className="source-card__name">GitLawb</span>
              <span className="source-card__repo">Decentralized mirror</span>
            </div>
            <span className="source-card__arrow">→</span>
          </a>
        </div>
        <div className="sources__clone">
          <span className="sources__clone-lbl">clone:</span>
          <code>git clone https://github.com/niefa-xyz/niefa.git</code>
        </div>
      </Section>

      {/* ─── CTA ─── */}
      <Section className="cta">
        <div className="cta__inner">
          <span className="section-tag" style={{ marginBottom: 16, display: 'inline-flex' }}>get started</span>
          <h2 className="cta__h">
            Your goal.<br />
            <span className="grad-green">An agent on it.</span>
          </h2>
          <p className="cta__p">No setup ceremony. No DSL. Spin up an autonomous agent in under a minute and watch it work.</p>
          <div className="cta__actions">
            <a href="#deploy" className="btn btn--primary">Deploy your first agent →</a>
            <a href="https://github.com/niefa-xyz/niefa" target="_blank" rel="noopener noreferrer" className="btn btn--ghost">Read the docs</a>
          </div>
        </div>
      </Section>

      {/* ─── Footer ─── */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__grid">
            <div>
              <a href="#" className="footer__brand">
                <img src="/niefa-logo.jpg" alt="NIEFA" />
                NIEFA
              </a>
              <p className="footer__tagline">
                Neural Interference Engine for Agents.<br />
                Open-source autonomous agent runtime.
              </p>
            </div>
            <div className="footer__col">
              <h4>product</h4>
              <ul>
                <li><a href="#features">features</a></li>
                <li><a href="#how">how it works</a></li>
                <li><a href="#templates">templates</a></li>
                <li><a href="#deploy">deploy</a></li>
                <li><a href="#token">$NIEFA</a></li>
              </ul>
            </div>
            <div className="footer__col">
              <h4>community</h4>
              <ul>
                <li><a href="https://x.com/niefa_xyz" target="_blank" rel="noopener noreferrer">x.com</a></li>
                <li><a href="https://github.com/niefa-xyz/niefa" target="_blank" rel="noopener noreferrer">github</a></li>
                <li><a href="https://gitlawb.com/z6MktvfdARsR8Ld7dbEceswFg2pns738ThF722eM8wL1XddX/niefa" target="_blank" rel="noopener noreferrer">gitlawb</a></li>
              </ul>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© 2026 NIEFA. MIT License.</span>
            <a href="https://x.com/niefa_xyz" target="_blank" rel="noopener noreferrer">@niefa_xyz</a>
          </div>
        </div>
      </footer>
    </>
  )
}
