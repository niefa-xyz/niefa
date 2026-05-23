import { NextRequest, NextResponse } from 'next/server'
import { launchToken } from '@/app/lib/bankr'

export async function POST(req: NextRequest) {
  try {
    const { name, symbol, description } = await req.json()
    if (!name || !symbol) {
      return NextResponse.json({ error: 'name and symbol are required' }, { status: 400 })
    }
    const result = await launchToken({ name, symbol, description })
    return NextResponse.json(result)
  } catch (err: any) {
    const status = err.message?.includes('not configured') ? 501 : 502
    return NextResponse.json({ error: err.message }, { status })
  }
}
