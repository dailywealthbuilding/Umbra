import { NextRequest, NextResponse } from 'next/server'

const PROMPT = `You are UMBRA's AI Archivist. UMBRA is a premium dark archive vault — a visual library of rare, high-aesthetic imagery from around the world.

Analyze this image deeply. Return ONLY valid JSON. No markdown. No preamble. No commentary.

{
  "title": "2-4 word poetic title. Evocative, not literal. Example: 'Harlem Exhales Dusk', 'Stones That Hold Rain'",
  "description": "One atmospheric sentence. Present tense. Max 120 characters. Should feel like a whisper.",
  "aesthetic_tags": ["1-3 values ONLY from this list: Dark Luxury, Quiet Architecture, Raw Documentary, Industrial Pastoral, Sacred Geometry, Neon Noir, Cinematic Decay, East African Light, Urban Pulse, Brutalist Memory, Mediterranean Texture, Wilderness Sublime, Sacred Ritual, Islamic Light, Nordic Silence"],
  "mood_tags": ["1-3 values ONLY from this list: Golden Hour, Blue Hour, Nocturnal, Dusk, Dawn, Electric, Silence, Sacred, Decay, Rain, Gold, Stone, Mist, Fire, Amber, Void"],
  "origin_region": "The most likely geographic region. Be specific. Examples: East Africa, North Africa, East Asia, Middle East, Caribbean, South America, Caucasus, Mediterranean, Scandinavia, West Africa",
  "era": "Decade the image feels like or was likely taken. Examples: 1970s, 1990s, 2000s, 2020s",
  "asset_type": "image",
  "tier_required": "One of: access (standard quality, broad appeal), noir (elevated, moody, intentional), prestige (exceptional composition or rarity), obsidian (museum-grade, culturally significant)"
}

Be honest. Tier obsidian is rare. Most images are access or noir.`

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'url', url },
              },
              {
                type: 'text',
                text: PROMPT,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: 'Anthropic API error', detail: err }, { status: 500 })
    }

    const data = await response.json()
    const rawText = data.content?.[0]?.text || ''

    // Strip any markdown fences if model wraps in ```json
    const clean = rawText.replace(/```json|```/g, '').trim()

    let metadata
    try {
      metadata = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'JSON parse failed', raw: rawText }, { status: 500 })
    }

    return NextResponse.json({ metadata })
  } catch (err) {
    return NextResponse.json({ error: 'Server error', detail: String(err) }, { status: 500 })
  }
}
