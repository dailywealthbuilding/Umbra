/**
 * UMBRA — VAULT SEEDER
 * Auto-pulls CC0 images from Pexels → Cloudinary → Supabase
 *
 * SETUP:
 *   1. Add PEXELS_API_KEY to your .env.local  (free at pexels.com/api)
 *   2. Run: node scripts/seed-vault.js
 *   3. Optional: node scripts/seed-vault.js --count=50
 *
 * REQUIREMENTS:
 *   npm install @supabase/supabase-js dotenv
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// ─── Env validation ──────────────────────────────────────────────────────────
const PEXELS_KEY    = process.env.PEXELS_API_KEY;
const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'umbra_unsigned';
const SB_URL        = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY        = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!PEXELS_KEY)    { console.error('[ERROR] Missing PEXELS_API_KEY in .env.local');          process.exit(1); }
if (!CLOUD_NAME)    { console.error('[ERROR] Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');      process.exit(1); }
if (!SB_URL)        { console.error('[ERROR] Missing NEXT_PUBLIC_SUPABASE_URL');               process.exit(1); }
if (!SB_KEY)        { console.error('[ERROR] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');          process.exit(1); }

const supabase = createClient(SB_URL, SB_KEY);

// ─── CLI args ────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const countArg   = args.find(a => a.startsWith('--count='));
const TARGET     = countArg ? parseInt(countArg.split('=')[1]) : 35;

// ─── Query catalogue ─────────────────────────────────────────────────────────
// Each entry = one Pexels search.
// count = how many photos to pull per query.
// Adjust to reach your TARGET total.

const QUERIES = [
  // ── Quiet Architecture ──────────────────────────────────────────────────
  {
    query    : 'brutalist concrete architecture shadow',
    aesthetic: 'Quiet Architecture',
    mood     : ['Still', 'Weight', 'Permanence'],
    region   : 'Europe',
    tier     : 'NOIR',
    count    : 2,
  },
  {
    query    : 'empty corridor dramatic perspective light',
    aesthetic: 'Quiet Architecture',
    mood     : ['Solitude', 'Geometry', 'Depth'],
    region   : 'Global',
    tier     : 'NOIR',
    count    : 2,
  },
  {
    query    : 'minimalist building facade geometric',
    aesthetic: 'Quiet Architecture',
    mood     : ['Restraint', 'Order', 'Silence'],
    region   : 'Global',
    tier     : 'NOIR',
    count    : 2,
  },

  // ── Sacred Geometry ─────────────────────────────────────────────────────
  {
    query    : 'mosque ceiling geometric pattern ornament',
    aesthetic: 'Sacred Geometry',
    mood     : ['Reverence', 'Pattern', 'Infinity'],
    region   : 'Middle East',
    tier     : 'NOIR',
    count    : 2,
  },
  {
    query    : 'cathedral dome symmetry dramatic light',
    aesthetic: 'Sacred Geometry',
    mood     : ['Reverence', 'Height', 'Light'],
    region   : 'Europe',
    tier     : 'PRESTIGE',
    count    : 2,
  },
  {
    query    : 'Islamic architecture ornament pattern Morocco',
    aesthetic: 'Sacred Geometry',
    mood     : ['Pattern', 'Craft', 'Infinity'],
    region   : 'North Africa',
    tier     : 'NOIR',
    count    : 2,
  },

  // ── Raw Documentary — Non-Western (Edict 007 compliance) ────────────────
  {
    query    : 'Lagos street market portrait Nigeria',
    aesthetic: 'Raw Documentary',
    mood     : ['Life', 'Energy', 'Truth'],
    region   : 'West Africa',
    tier     : 'NOIR',
    count    : 2,
  },
  {
    query    : 'Nairobi urban street documentary Kenya',
    aesthetic: 'Raw Documentary',
    mood     : ['Urban', 'Motion', 'Reality'],
    region   : 'East Africa',
    tier     : 'NOIR',
    count    : 2,
  },
  {
    query    : 'Cairo narrow alley dramatic light Egypt',
    aesthetic: 'Raw Documentary',
    mood     : ['History', 'Shadow', 'Labyrinth'],
    region   : 'North Africa',
    tier     : 'NOIR',
    count    : 2,
  },
  {
    query    : 'Havana crumbling architecture street Cuba',
    aesthetic: 'Raw Documentary',
    mood     : ['History', 'Decay', 'Colour'],
    region   : 'Caribbean',
    tier     : 'NOIR',
    count    : 2,
  },
  {
    query    : 'Tbilisi old town staircase Georgia',
    aesthetic: 'Quiet Architecture',
    mood     : ['History', 'Texture', 'Time'],
    region   : 'Caucasus',
    tier     : 'NOIR',
    count    : 2,
  },
  {
    query    : 'Mumbai monsoon street India dramatic',
    aesthetic: 'Raw Documentary',
    mood     : ['Rain', 'Chaos', 'Colour'],
    region   : 'South Asia',
    tier     : 'NOIR',
    count    : 1,
  },

  // ── Dark Luxury ──────────────────────────────────────────────────────────
  {
    query    : 'moody hotel interior candlelight dark',
    aesthetic: 'Dark Luxury',
    mood     : ['Intimacy', 'Warmth', 'Depth'],
    region   : 'Global',
    tier     : 'PRESTIGE',
    count    : 2,
  },
  {
    query    : 'dark velvet fabric texture rich',
    aesthetic: 'Dark Luxury',
    mood     : ['Touch', 'Richness', 'Restraint'],
    region   : 'Global',
    tier     : 'PRESTIGE',
    count    : 1,
  },
  {
    query    : 'Seoul night alley rain neon Korea',
    aesthetic: 'Dark Luxury',
    mood     : ['Night', 'Rain', 'Urban Myth'],
    region   : 'East Asia',
    tier     : 'PRESTIGE',
    count    : 2,
  },

  // ── Industrial Pastoral ──────────────────────────────────────────────────
  {
    query    : 'abandoned factory fog dramatic interior',
    aesthetic: 'Industrial Pastoral',
    mood     : ['Decay', 'Memory', 'Silence'],
    region   : 'Global',
    tier     : 'NOIR',
    count    : 2,
  },
  {
    query    : 'rusty metal texture abstract close up',
    aesthetic: 'Industrial Pastoral',
    mood     : ['Time', 'Erosion', 'Beauty'],
    region   : 'Global',
    tier     : 'NOIR',
    count    : 2,
  },

  // ── Ritual Space ────────────────────────────────────────────────────────
  {
    query    : 'Bali temple ritual sacred ceremony',
    aesthetic: 'Ritual Space',
    mood     : ['Sacred', 'Ancient', 'Ceremony'],
    region   : 'Southeast Asia',
    tier     : 'NOIR',
    count    : 2,
  },
  {
    query    : 'Kyoto temple morning mist Japan',
    aesthetic: 'Ritual Space',
    mood     : ['Stillness', 'Reverence', 'Dawn'],
    region   : 'East Asia',
    tier     : 'PRESTIGE',
    count    : 2,
  },

  // ── Atmospheric fillers ──────────────────────────────────────────────────
  {
    query    : 'dramatic portrait shadow moody cinematic',
    aesthetic: 'Raw Documentary',
    mood     : ['Humanity', 'Shadow', 'Presence'],
    region   : 'Global',
    tier     : 'NOIR',
    count    : 2,
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function bar(current, total, width = 20) {
  const filled = Math.round((current / total) * width);
  return `[${'█'.repeat(filled)}${'░'.repeat(width - filled)}]`;
}

// ─── Pexels fetch ─────────────────────────────────────────────────────────────
async function pexelsSearch(query, perPage = 2) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&size=large`;
  const res  = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.photos || [];
}

// ─── Cloudinary upload (from URL) ────────────────────────────────────────────
async function cloudinaryUpload(imageUrl) {
  const params = new URLSearchParams();
  params.append('file', imageUrl);
  params.append('upload_preset', UPLOAD_PRESET);
  params.append('folder', 'umbra');

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: params });
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'Cloudinary upload failed');

  return {
    url  : data.secure_url,
    thumb: data.secure_url.replace('/upload/', '/upload/w_400,q_80/'),
  };
}

// ─── Supabase insert ─────────────────────────────────────────────────────────
async function insertAsset(cloudUrl, thumbUrl, photo, cfg) {
  const title = photo.alt?.trim() || `${cfg.aesthetic} — ${photo.id}`;

  const { error } = await supabase.from('assets').insert({
    cloudinary_url : cloudUrl,
    thumbnail_url  : thumbUrl,
    title          : title.slice(0, 80),
    description    : `A study in ${cfg.aesthetic.toLowerCase()}. Source: Pexels / ${photo.photographer || 'Unknown'}.`,
    aesthetic_tags : [cfg.aesthetic],
    mood_tags      : cfg.mood,
    origin_region  : cfg.region,
    era            : '2020s',
    tier_required  : cfg.tier,
    is_active      : true,
  });

  if (error) throw error;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n');
  console.log('  ██╗   ██╗███╗   ███╗██████╗ ██████╗  █████╗ ');
  console.log('  ██║   ██║████╗ ████║██╔══██╗██╔══██╗██╔══██╗');
  console.log('  ██║   ██║██╔████╔██║██████╔╝██████╔╝███████║');
  console.log('  ██║   ██║██║╚██╔╝██║██╔══██╗██╔══██╗██╔══██║');
  console.log('  ╚██████╔╝██║ ╚═╝ ██║██████╔╝██║  ██║██║  ██║');
  console.log('   ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝');
  console.log('  VAULT SEEDER — Pexels → Cloudinary → Supabase');
  console.log('  ─────────────────────────────────────────────\n');
  console.log(`  Target: ${TARGET} assets\n`);

  let uploaded  = 0;
  let skipped   = 0;
  let errors    = 0;

  for (const cfg of QUERIES) {
    if (uploaded >= TARGET) break;

    const needed = Math.min(cfg.count, TARGET - uploaded);
    process.stdout.write(`  [FETCH]  "${cfg.query.slice(0, 50)}..." `);

    let photos;
    try {
      photos = await pexelsSearch(cfg.query, needed);
      console.log(`→ ${photos.length} result(s)`);
    } catch (e) {
      console.log(`→ FAILED (${e.message})`);
      errors++;
      await sleep(1000);
      continue;
    }

    for (const photo of photos) {
      const srcUrl = photo.src?.large2x || photo.src?.large || photo.src?.medium;
      if (!srcUrl) { skipped++; continue; }

      process.stdout.write(`    → [${bar(uploaded, TARGET)}] ${uploaded + 1}/${TARGET} uploading... `);

      try {
        const { url, thumb } = await cloudinaryUpload(srcUrl);
        await insertAsset(url, thumb, photo, cfg);
        uploaded++;
        console.log(`DONE  [${cfg.aesthetic} | ${cfg.region} | ${cfg.tier}]`);
      } catch (e) {
        errors++;
        console.log(`ERROR — ${e.message}`);
      }

      await sleep(900); // Respect rate limits
    }

    await sleep(400);
  }

  console.log('\n  ─────────────────────────────────────────────');
  console.log(`  SEEDING COMPLETE`);
  console.log(`  Uploaded : ${uploaded} assets`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Errors   : ${errors}`);
  console.log('  ─────────────────────────────────────────────');
  console.log('  The vault grows.\n');
}

run().catch(err => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
