import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-paystack-signature') ?? ''
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(body).digest('hex')
  if (hash !== signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  const event = JSON.parse(body)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  if (event.event === 'charge.success') {
    const meta = event.data?.metadata
    const userId = meta?.user_id
    const tier   = meta?.plan_tier
    if (userId && tier) {
      await supabase.from('profiles').update({ tier }).eq('id', userId)
      const { data: existing } = await supabase.from('subscriptions').select('id').eq('user_id', userId).single()
      if (existing) {
        await supabase.from('subscriptions').update({ tier, status: 'active' }).eq('user_id', userId)
      } else {
        await supabase.from('subscriptions').insert({ user_id: userId, tier, status: 'active', current_period_start: new Date().toISOString() })
      }
    }
  }

  if (event.event === 'subscription.disable') {
    const email = event.data?.customer?.email
    if (email) {
      const { data: { users } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
      const found = users.find((u: { email?: string }) => u.email === email)
      if (found?.id) {
        await supabase.from('profiles').update({ tier: 'SHADOW' }).eq('id', found.id)
        await supabase.from('subscriptions').update({ tier: 'SHADOW', status: 'cancelled' }).eq('user_id', found.id)
      }
    }
  }

  return NextResponse.json({ received: true })
}
