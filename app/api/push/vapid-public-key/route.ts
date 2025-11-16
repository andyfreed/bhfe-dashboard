// API route to get VAPID public key for client-side subscription

import { NextResponse } from 'next/server'
import { getVapidPublicKey } from '@/lib/push'

export async function GET() {
  const publicKey = getVapidPublicKey()
  
  if (!publicKey) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
  }

  return NextResponse.json({ publicKey })
}

