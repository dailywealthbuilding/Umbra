import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const AMOUNTS: Record<string, number> = { noir: 200000, prestige: 500000, obsidian: 1300000 }

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan } = await request.json()
    const planCodes: Record<string, string> = {
      noir:     process.env.PAYSTACK_NOIR_PLAN!,
      prestige: process.env.PAYSTACK_PRESTIGE_PLAN!,
      obsidian: process.env.PAYSTACK_OBSIDIAN_PLAN!,
    }
    const planCode = planCodes[plan]
    if (!planCode) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        amount: AMOUNTS[plan],
        plan: planCode,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/browse`,
        metadata: {
          user_id: user.id,
          plan_tier: plan,
          custom_fields: [
            { display_name: 'User ID', variable_name: 'user_id', value: user.id },
            { display_name: 'Plan', variable_name: 'plan_tier', value: plan },
          ],
        },
      }),
    })
    const data = await res.json()
    if (!data.status) return NextResponse.json({ error: data.message }, { status: 400 })
    return NextResponse.json({ access_code: data.data.access_code, reference: data.data.reference })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
