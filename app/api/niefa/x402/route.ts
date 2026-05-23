// NIEFA x402 paid endpoint registry
// GET  /api/niefa/x402          — list registered endpoints
// POST /api/niefa/x402          — register a new paid endpoint
// DELETE /api/niefa/x402?slug=  — remove an endpoint

import { NextRequest, NextResponse } from 'next/server'
import { listEndpoints, registerEndpoint, deleteEndpoint, buildPaymentRequired, getEndpoint, recordPayment, verifyPayment } from '@/app/lib/x402'

export async function GET() {
  return NextResponse.json(listEndpoints())
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    // Register a new endpoint
    if (!action || action === 'register') {
      const { slug, description, price } = body
      if (!slug || !price) {
        return NextResponse.json({ error: 'slug and price are required' }, { status: 400 })
      }
      const ep = registerEndpoint({ slug, description: description ?? slug, price: Number(price) })
      return NextResponse.json(ep, { status: 201 })
    }

    // Request payment details for a protected endpoint
    if (action === 'request') {
      const { slug } = body
      const ep = getEndpoint(slug)
      if (!ep) return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
      const paymentDetails = await buildPaymentRequired(ep)
      return NextResponse.json(
        { error: 'Payment required', endpoint: ep, payment: paymentDetails },
        {
          status: 402,
          headers: {
            'X-Payment-Required': JSON.stringify(paymentDetails),
            'X-Payment-Version': 'x402/1',
          },
        },
      )
    }

    // Submit payment proof and get resource
    if (action === 'pay') {
      const { slug, txHash, payer, amount } = body
      const ep = getEndpoint(slug)
      if (!ep) return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
      if (!txHash || !payer) {
        return NextResponse.json({ error: 'txHash and payer are required' }, { status: 400 })
      }
      const payment = recordPayment({
        endpointId: ep.id,
        payer,
        txHash,
        amount: Number(amount ?? ep.price),
        chain: ep.chain,
      })
      const verified = await verifyPayment(payment.id)
      return NextResponse.json({
        success: true,
        payment: verified,
        message: `Access granted to ${ep.slug}`,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  const deleted = deleteEndpoint(slug)
  return NextResponse.json({ deleted })
}
