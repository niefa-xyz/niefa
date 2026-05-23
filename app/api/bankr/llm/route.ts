import { NextRequest, NextResponse } from 'next/server'
import { generatePlan } from '@/app/lib/bankr'

export async function POST(req: NextRequest) {
  try {
    const { goal } = await req.json()
    if (!goal || typeof goal !== 'string') {
      return NextResponse.json({ error: 'goal is required' }, { status: 400 })
    }
    const plan = await generatePlan(goal)
    return NextResponse.json({ plan })
  } catch (err: any) {
    const status = err.message?.includes('not configured') ? 501 : 502
    return NextResponse.json({ error: err.message }, { status })
  }
}
