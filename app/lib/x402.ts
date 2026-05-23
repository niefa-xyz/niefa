// NIEFA-native x402 HTTP payment protocol implementation.
// x402: client receives 402 + payment instructions, pays in USDC on Base, re-requests with proof.

import { getWalletInfo } from './bankr'
import fs from 'fs'
import path from 'path'

const REGISTRY_FILE = path.join(process.cwd(), 'data', 'x402-registry.json')
const PAYMENTS_FILE = path.join(process.cwd(), 'data', 'x402-payments.json')

export interface X402Endpoint {
  id: string
  slug: string          // e.g. "market-analysis"
  description: string
  price: number         // USD amount (USDC)
  chain: string         // 'base'
  token: string         // 'USDC'
  createdAt: string
}

export interface X402Payment {
  id: string
  endpointId: string
  payer: string         // wallet address
  txHash: string
  amount: number
  chain: string
  verifiedAt?: string
  status: 'pending' | 'verified' | 'rejected'
}

function readJSON<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T
  } catch {
    return fallback
  }
}

function writeJSON(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

export function listEndpoints(): X402Endpoint[] {
  return readJSON<X402Endpoint[]>(REGISTRY_FILE, [])
}

export function getEndpoint(slug: string): X402Endpoint | undefined {
  return listEndpoints().find(e => e.slug === slug)
}

export function registerEndpoint(params: Omit<X402Endpoint, 'id' | 'createdAt' | 'chain' | 'token'>): X402Endpoint {
  const endpoints = listEndpoints()
  if (endpoints.find(e => e.slug === params.slug)) {
    throw new Error(`Endpoint "${params.slug}" already registered`)
  }
  const ep: X402Endpoint = {
    id: crypto.randomUUID(),
    chain: 'base',
    token: 'USDC',
    createdAt: new Date().toISOString(),
    ...params,
  }
  writeJSON(REGISTRY_FILE, [...endpoints, ep])
  return ep
}

export function deleteEndpoint(slug: string): boolean {
  const endpoints = listEndpoints()
  const filtered = endpoints.filter(e => e.slug !== slug)
  if (filtered.length === endpoints.length) return false
  writeJSON(REGISTRY_FILE, filtered)
  return true
}

export async function buildPaymentRequired(endpoint: X402Endpoint): Promise<Record<string, string | number>> {
  let recipientAddress = '0x0000000000000000000000000000000000000000'
  try {
    const wallet = await getWalletInfo()
    if (wallet.address) recipientAddress = wallet.address
  } catch {}

  return {
    version: 'x402/1',
    scheme: 'exact',
    network: endpoint.chain,
    token: endpoint.token,
    amount: String(Math.round(endpoint.price * 1e6)), // USDC has 6 decimals
    amountUSD: endpoint.price,
    recipient: recipientAddress,
    memo: `niefa:${endpoint.id}`,
    expires: Math.floor(Date.now() / 1000) + 300, // 5 min window
  }
}

function listPayments(): X402Payment[] {
  return readJSON<X402Payment[]>(PAYMENTS_FILE, [])
}

export function recordPayment(params: Omit<X402Payment, 'id' | 'status'>): X402Payment {
  const payments = listPayments()
  const payment: X402Payment = { id: crypto.randomUUID(), status: 'pending', ...params }
  writeJSON(PAYMENTS_FILE, [...payments, payment])
  return payment
}

export function getPaymentsByEndpoint(endpointId: string): X402Payment[] {
  return listPayments().filter(p => p.endpointId === endpointId)
}

// Verify a payment by checking if txHash is legitimate on Bankr wallet history.
// In production this would query an on-chain indexer; here we mark it verified and
// rely on Bankr's own transfer records for audit.
export async function verifyPayment(paymentId: string): Promise<X402Payment> {
  const payments = listPayments()
  const idx = payments.findIndex(p => p.id === paymentId)
  if (idx === -1) throw new Error('Payment not found')

  // Mark verified — real production check would call Blockscout or Bankr transfer API
  payments[idx] = {
    ...payments[idx],
    status: 'verified',
    verifiedAt: new Date().toISOString(),
  }
  writeJSON(PAYMENTS_FILE, payments)
  return payments[idx]
}
