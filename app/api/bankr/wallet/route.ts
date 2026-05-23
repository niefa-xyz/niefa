import { NextResponse } from 'next/server'
import { getWalletInfo, getPortfolio } from '@/app/lib/bankr'

export async function GET() {
  try {
    const [info, portfolio] = await Promise.all([getWalletInfo(), getPortfolio()])
    return NextResponse.json({ info, portfolio })
  } catch (err: any) {
    const status = err.message?.includes('not configured') ? 501 : 502
    return NextResponse.json({ error: err.message }, { status })
  }
}
