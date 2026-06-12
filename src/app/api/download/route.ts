import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const TIER_ORDER: Record<string, number> = {
  SHADOW: 0, NOIR: 1, PRESTIGE: 2, OBSIDIAN: 3,
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const assetId = searchParams.get('id')

  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })
  }

  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // ── 2. Fetch asset ─────────────────────────────────────────────────────────
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('id, title, cloudinary_url, tier_required, download_count')
    .eq('id', assetId)
    .single()

  if (assetError || !asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  // ── 3. Tier gate ──────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, is_sovereign')
    .eq('id', user.id)
    .single()

  const isSovereign  = profile?.is_sovereign === true
  const userTierStr  = (profile?.tier ?? 'SHADOW').toUpperCase()
  const userTierLvl  = TIER_ORDER[userTierStr] ?? 0
  const assetTierStr = (asset.tier_required ?? 'SHADOW').toUpperCase()
  const safeAsset    = TIER_ORDER[assetTierStr] !== undefined ? assetTierStr : 'SHADOW'
  const assetTierLvl = TIER_ORDER[safeAsset] ?? 0

  if (!isSovereign && userTierLvl < assetTierLvl) {
    return NextResponse.json({ error: 'Insufficient tier' }, { status: 403 })
  }

  // ── 4. Fetch file from Cloudinary ─────────────────────────────────────────
  let fileRes: Response
  try {
    fileRes = await fetch(asset.cloudinary_url, {
      headers: { 'User-Agent': 'UMBRA/1.0' },
    })
    if (!fileRes.ok) throw new Error(`Cloudinary fetch failed: ${fileRes.status}`)
  } catch (e) {
    console.error('[UMBRA download] Cloudinary fetch error:', e)
    return NextResponse.json({ error: 'File fetch failed' }, { status: 502 })
  }

  // ── 5. Increment download count (fire-and-forget, do not block) ────────────
  void supabase
    .from('assets')
    .update({ download_count: (asset.download_count ?? 0) + 1 })
    .eq('id', asset.id)

  // ── 6. Derive filename from URL ───────────────────────────────────────────
  const urlPath    = new URL(asset.cloudinary_url).pathname
  const rawName    = urlPath.split('/').pop() ?? 'umbra-asset'
  const ext        = rawName.includes('.') ? '' : '.jpg'
  const safeName   = asset.title
    ? asset.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) + ext
    : rawName

  // ── 7. Stream back with Content-Disposition: attachment ───────────────────
  const contentType = fileRes.headers.get('content-type') ?? 'application/octet-stream'
  const body        = fileRes.body

  if (!body) {
    return NextResponse.json({ error: 'Empty file body' }, { status: 502 })
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type':        contentType,
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control':       'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
