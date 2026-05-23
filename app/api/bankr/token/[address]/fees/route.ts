import { NextRequest, NextResponse } from 'next/server'
import { getTokenFees, claimTokenFees } from '@/app/lib/bankr'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await params
    const result = await getTokenFees(address)
    return NextResponse.json(result)
  } catch (err: any) {
    const status = err.message?.includes('not configured') ? 501 : 502
    return NextResponse.json({ error: err.message }, { status })
  }
}

export async function POST(
  _: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await params
    const result = await claimTokenFees(address)
    return NextResponse.json(result)
  } catch (err: any) {
    const status = err.message?.includes('not configured') ? 501 : 502
    return NextResponse.json({ error: err.message }, { status })
  }
}
