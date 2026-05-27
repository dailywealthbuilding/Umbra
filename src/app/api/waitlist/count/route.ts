import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
export async function GET() {
  const { count } = await sb.from('waitlist').select('*', { count: 'exact', head: true })
  return NextResponse.json({ count: count || 0 })
}
