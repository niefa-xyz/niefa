'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

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
]

const STEPS = [
  { num: '01', title: 'Define Your Goal', desc: 'Describe what you want to achieve in natural language — no code required.', icon: '>>' },
  { num: '02', title: 'Agent Plans', desc: 'The agent analyzes your goal and creates a step-by-step execution plan.', icon: '::' },
  { num: '03', title: 'Autonomous Execution', desc: 'The agent executes each task, using tools and adapting in real time.', icon: '##' },
  { num: '04', title: 'Deliver Results', desc: 'Receive polished outputs with full transparency into the agent\'s reasoning.', icon: '**' },
]

const TECH_BADGES = ['Next.js', 'FastAPI', 'LangChain', 'OpenClaude', 'MIMO', 'Tailwind', 'Docker', 'TypeScript']


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
}

const TOOLS_LIST = ['Web Search', 'Code Exec', 'File Manager', 'API Client', 'Data Parser', 'Browser']

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
  agent: { id: string; name: string; goal: string; status: string; tasks: { text: string; done: boolean }[]; tools: string[] }
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [navScrolled, setNavScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [agentName, setAgentName] = useState('')
  const [agentGoal, setAgentGoal] = useState('')
  const [selectedTools, setSelectedTools] = useState<string[]>(['Web Search', 'Code Exec'])
  const [agents, setAgents] = useState<any[]>([])
  const [deployLogs, setDeployLogs] = useState<any[]>([])
  const [deploying, setDeploying] = useState(false)
  const deployRef = useRef<HTMLDivElement>(null)

  const heroTexts = ['deploy --new --interactive', 'agents --spawn --goal "..."', 'tools --list --all']
  const heroTyped = useTypewriter(heroTexts, 50)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleTool = (tool: string) => {
    setSelectedTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool])
  }

  const fillTemplate = (template: typeof TEMPLATES[0]) => {
    setAgentGoal(template.defaultGoal)
    deployRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const genId = () => Math.random().toString(36).slice(2, 7)

  const handleDeploy = useCallback(() => {
    if (!agentGoal.trim()) return
    const id = genId()
    const name = agentName.trim() || `Agent-${id}`
    const templateKey = TEMPLATES.find(t => agentGoal.includes(t.defaultGoal.slice(0, 20)))?.tag || 'planner'
    const taskTexts = TASK_SEQUENCES[templateKey] || TASK_SEQUENCES.planner

    const newAgent = {
      id,
      name,
      goal: agentGoal,
      status: 'initializing',
      tasks: taskTexts.map(t => ({ text: t, done: false })),
      tools: [...selectedTools],
    }

    setAgents(prev => [...prev, newAgent])
    setDeploying(true)
    setDeployLogs([])

    // Simulate deployment
    let taskIdx = 0
    const addLog = (type: string, msg: string) => {
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      setDeployLogs(prev => [...prev, { time, type, msg }])
    }

    addLog('info', `Deploying agent '${name}' (id: ${id})`)
    addLog('info', `Goal: ${agentGoal}`)
    addLog('info', `Tools: ${selectedTools.join(', ')}`)

    setTimeout(() => {
      addLog('info', 'Agent initialized. Starting autonomous execution...')
      setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'running' } : a))

      const runTask = () => {
        if (taskIdx >= taskTexts.length) {
          addLog('info', 'All tasks completed successfully.')
          addLog('info', 'Generating final output summary...')
          setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a))
          setDeploying(false)
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
        setTimeout(runTask, 1200 + Math.random() * 800)
      }

      setTimeout(runTask, 500)
    }, 1000)
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
            <a href="#deploy" onClick={() => setMenuOpen(false)}>[deploy]</a>
            <a href="https://x.com/vornimbus" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>[x.com]</a>
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
              <a href="https://x.com/vornimbus" target="_blank" rel="noopener noreferrer" className="btn btn--outline">[ Follow on X ]</a>
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

      {/* ─── CTA ─── */}
      <Section className="cta">
        <div className="cta__content">
          <pre className="cta__ascii">{ASCII_LOGO}</pre>
          <div className="cta__actions">
            <a href="#deploy" className="btn btn--primary">[ Get Started Free ]</a>
            <a href="https://x.com/vornimbus" target="_blank" rel="noopener noreferrer" className="btn btn--outline">[ Follow on X ]</a>
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
                <li><a href="https://x.com/vornimbus" target="_blank" rel="noopener noreferrer">&gt; X (Twitter)</a></li>
              </ul>
            </div>
          </div>
          <div className="footer__bottom">
            <span>&copy; 2026 NIEFA. All rights reserved.</span>
            <a href="https://x.com/vornimbus" target="_blank" rel="noopener noreferrer" className="footer__x">[x.com]</a>
          </div>
        </div>
      </footer>
    </>
  )
}
