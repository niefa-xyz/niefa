import { NextRequest, NextResponse } from 'next/server'
import { submitAgentPrompt } from '@/app/lib/bankr'

export async function POST(req: NextRequest) {
  try {
    const { prompt, threadId, maxMode } = await req.json()
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }
    const result = await submitAgentPrompt(prompt, { threadId, maxMode })
    return NextResponse.json(result)
  } catch (err: any) {
    const status = err.message?.includes('not configured') ? 501 : 502
    return NextResponse.json({ error: err.message }, { status })
  }
}
