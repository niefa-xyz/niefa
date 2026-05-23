// NIEFA Agent File System API
// GET    /api/niefa/fs?agent=&path=   — list (dir) or read (file)
// POST   /api/niefa/fs               — write file { agent, path, content }
// DELETE /api/niefa/fs?agent=&path=  — delete file or directory

import { NextRequest, NextResponse } from 'next/server'
import { listFiles, readFile, writeFile, deleteFile, agentStorageInfo } from '@/app/lib/agentfs'

export async function GET(req: NextRequest) {
  const agent = req.nextUrl.searchParams.get('agent')
  const filePath = req.nextUrl.searchParams.get('path') ?? '/'
  const info = req.nextUrl.searchParams.get('info')

  if (!agent) return NextResponse.json({ error: 'agent is required' }, { status: 400 })

  try {
    if (info) {
      return NextResponse.json(agentStorageInfo(agent))
    }
    // If path ends with / or is root, list directory
    if (filePath === '/' || filePath.endsWith('/')) {
      return NextResponse.json({ agent, path: filePath, entries: listFiles(agent, filePath) })
    }
    // Otherwise try to read as file; fall back to listing if it's a directory
    try {
      return NextResponse.json(readFile(agent, filePath))
    } catch {
      return NextResponse.json({ agent, path: filePath, entries: listFiles(agent, filePath) })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { agent, path: filePath, content } = await req.json()
    if (!agent || !filePath || content === undefined) {
      return NextResponse.json({ error: 'agent, path, and content are required' }, { status: 400 })
    }
    const entry = writeFile(agent, filePath, content)
    return NextResponse.json(entry, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.includes('quota') ? 413 : 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const agent = req.nextUrl.searchParams.get('agent')
  const filePath = req.nextUrl.searchParams.get('path')

  if (!agent || !filePath) {
    return NextResponse.json({ error: 'agent and path are required' }, { status: 400 })
  }

  try {
    const deleted = deleteFile(agent, filePath)
    return NextResponse.json({ deleted, agent, path: filePath })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
