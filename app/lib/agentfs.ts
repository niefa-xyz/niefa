// NIEFA Agent File System — per-agent sandboxed storage.
// Each agent gets an isolated namespace under data/afs/{agentId}/

import fs from 'fs'
import path from 'path'

const AFS_ROOT = path.join(process.cwd(), 'data', 'afs')
const MAX_FILE_SIZE = 1024 * 1024     // 1 MB per file
const MAX_AGENT_QUOTA = 10 * 1024 * 1024  // 10 MB per agent

export interface AfsEntry {
  name: string
  path: string
  size: number
  modifiedAt: string
  isDir: boolean
}

export interface AfsReadResult {
  path: string
  content: string
  size: number
  modifiedAt: string
}

function agentRoot(agentId: string): string {
  // Sanitize agentId — allow alphanumeric, dash, underscore only
  const safe = agentId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
  return path.join(AFS_ROOT, safe)
}

function resolvePath(agentId: string, filePath: string): string {
  const root = agentRoot(agentId)
  // Strip leading slashes, normalize, then re-join under root
  const rel = path.normalize(filePath.replace(/^\/+/, ''))
  const abs = path.join(root, rel)
  // Guard against path traversal
  if (!abs.startsWith(root)) throw new Error('Path traversal not allowed')
  return abs
}

function agentUsage(agentId: string): number {
  const root = agentRoot(agentId)
  if (!fs.existsSync(root)) return 0
  let total = 0
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else total += fs.statSync(full).size
    }
  }
  walk(root)
  return total
}

export function listFiles(agentId: string, dirPath = '/'): AfsEntry[] {
  const abs = resolvePath(agentId, dirPath)
  if (!fs.existsSync(abs)) return []
  return fs.readdirSync(abs, { withFileTypes: true }).map(entry => {
    const full = path.join(abs, entry.name)
    const stat = fs.statSync(full)
    return {
      name: entry.name,
      path: `/${path.relative(agentRoot(agentId), full)}`,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      isDir: entry.isDirectory(),
    }
  })
}

export function readFile(agentId: string, filePath: string): AfsReadResult {
  const abs = resolvePath(agentId, filePath)
  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
    throw new Error(`File not found: ${filePath}`)
  }
  const stat = fs.statSync(abs)
  return {
    path: filePath,
    content: fs.readFileSync(abs, 'utf8'),
    size: stat.size,
    modifiedAt: stat.mtime.toISOString(),
  }
}

export function writeFile(agentId: string, filePath: string, content: string): AfsEntry {
  const abs = resolvePath(agentId, filePath)
  const size = Buffer.byteLength(content, 'utf8')

  if (size > MAX_FILE_SIZE) throw new Error(`File exceeds 1 MB limit`)

  const used = agentUsage(agentId)
  const existing = fs.existsSync(abs) ? fs.statSync(abs).size : 0
  if (used - existing + size > MAX_AGENT_QUOTA) throw new Error(`Agent storage quota (10 MB) exceeded`)

  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content, 'utf8')
  const stat = fs.statSync(abs)
  return {
    name: path.basename(abs),
    path: filePath,
    size: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    isDir: false,
  }
}

export function deleteFile(agentId: string, filePath: string): boolean {
  const abs = resolvePath(agentId, filePath)
  if (!fs.existsSync(abs)) return false
  fs.rmSync(abs, { recursive: true, force: true })
  return true
}

export function agentStorageInfo(agentId: string): { used: number; quota: number; usedMB: string } {
  const used = agentUsage(agentId)
  return {
    used,
    quota: MAX_AGENT_QUOTA,
    usedMB: (used / 1024 / 1024).toFixed(2),
  }
}
