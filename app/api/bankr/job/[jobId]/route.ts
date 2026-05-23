import { NextRequest, NextResponse } from 'next/server'
import { getJobStatus } from '@/app/lib/bankr'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params
    const result = await getJobStatus(jobId)
    return NextResponse.json(result)
  } catch (err: any) {
    const status = err.message?.includes('not configured') ? 501 : 502
    return NextResponse.json({ error: err.message }, { status })
  }
}
