'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const AFFINITIES = [
  { value: 'shadow_noir',       label: 'Shadow Noir — Dark. Cinematic. Absolute.' },
  { value: 'luminous_void',     label: 'Luminous Void — Minimal. Ethereal. Still.' },
  { value: 'ancient_futures',   label: 'Ancient Futures — History meets horizon.' },
  { value: 'brutalist_harmony', label: 'Brutalist Harmony — Raw form. Raw truth.' },
  { value: 'wabi_sabi',         label: 'Wabi-Sabi — Imperfect. Transient. Beautiful.' },
  { value: 'digital_sublime',   label: 'Digital Sublime — Code as art. Light as signal.' },
  { value: 'global_roots',      label: 'Global Roots — Every culture. Every terrain.' },
]

type Status = 'idle' | 'loading' | 'success' | 'error'

const STYLES = `
:root{
  --void:#050507;--gold:#c9a84c;--gold-bright:#f0d98a;--gold-dim:#8a6f33;
  --gold-ghost:rgba(201,168,76,0.06);--gold-glow:rgba(201,168,76,0.15);
  --text:#d4d4e0;--text-dim:#7a7a90;--text-ghost:#3a3a4a;--mist:#4a4a5a;
}

/* CURTAIN */
#curtain{
  position:fixed;inset:0;background:var(--void);
  z-index:9000;display:flex;align-items:center;justify-content:center;
  transition:opacity 1s ease 0.2s, visibility 1s ease 0.2s;
}
#curtain.lifted{opacity:0;visibility:hidden;pointer-events:none;}
.curtain-sigil{
  font-family:var(--font-cinzel),serif;font-size:clamp(60px,15vw,140px);
  font-weight:900;letter-spacing:0.1em;
  color:transparent;
  background:linear-gradient(165deg,var(--gold-dim),var(--gold),var(--gold-bright),var(--gold),var(--gold-dim));
  -webkit-background-clip:text;background-clip:text;
  opacity:0;animation:curtainReveal 1.2s cubic-bezier(.16,1,.3,1) forwards 0.3s;
}
@keyframes curtainReveal{
  0%{opacity:0;transform:scale(0.94) translateY(12px);filter:blur(12px)}
  100%{opacity:1;transform:scale(1) translateY(0);filter:blur(0)}
}

/* CURSOR */
#cursor{
  position:fixed;width:8px;height:8px;background:var(--gold);border-radius:50%;
  pointer-events:none;z-index:9999;transform:translate(-50%,-50%);
  transition:transform .15s ease,opacity .3s;mix-blend-mode:difference;
}
#cursor-ring{
  position:fixed;width:28px;height:28px;
  border:1px solid rgba(201,168,76,.4);border-radius:50%;
  pointer-events:none;z-index:9998;transform:translate(-50%,-50%);
  transition:all .35s cubic-bezier(.175,.885,.32,1.1);
}
.cursor-trail{
  position:fixed;width:5px;height:5px;background:var(--gold);border-radius:50%;
  pointer-events:none;z-index:9990;transform:translate(-50%,-50%);
}
@media(max-width:768px){#cursor,#cursor-ring,.cursor-trail{display:none}}

/* CANVAS */
#canvas{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:.8}

/* VIGNETTE */
.vignette{
  position:fixed;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse at center,transparent 40%,rgba(5,5,7,.75) 100%);
}

/* GRAIN */
body::after{
  content:'';position:fixed;inset:0;pointer-events:none;z-index:999;opacity:.022;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:200px;
}

/* NAV */
nav{
  position:fixed;top:0;left:0;right:0;z-index:100;padding:28px 60px;
  display:flex;justify-content:space-between;align-items:center;
  background:linear-gradient(to bottom,rgba(5,5,7,.8),transparent);
}
.nav-mark{
  font-family:var(--font-cinzel),serif;font-size:13px;font-weight:700;
  letter-spacing:8px;color:var(--gold);text-decoration:none;
  opacity:0;animation:fadeup .8s ease forwards 3.5s;
}
.nav-links{display:flex;gap:40px;opacity:0;animation:fadeup .8s ease forwards 3.7s;}
.nav-links a{
  font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:3px;
  text-transform:uppercase;color:var(--text-dim);text-decoration:none;transition:color .3s;
}
.nav-links a:hover{color:var(--gold)}

/* HERO */
.hero{
  position:relative;min-height:100vh;display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center;
  padding:120px 40px 80px;z-index:1;overflow:hidden;
}
.hero::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse 80% 60% at 50% 50%,rgba(201,168,76,.07) 0%,transparent 70%);
  pointer-events:none;
}
.hero-eyebrow{
  font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:7px;
  color:var(--gold-dim);text-transform:uppercase;margin-bottom:52px;
  opacity:0;animation:fadeup .9s ease forwards .4s;
  min-height:1.2em;
}
.hero-title{
  font-family:var(--font-cinzel),serif;font-size:clamp(100px,20vw,240px);
  font-weight:900;line-height:.88;letter-spacing:-2px;
  color:transparent;position:relative;z-index:2;
  background:linear-gradient(165deg,var(--gold-dim) 0%,var(--gold) 30%,var(--gold-bright) 50%,var(--gold) 70%,var(--gold-dim) 100%);
  -webkit-background-clip:text;background-clip:text;
  opacity:0;animation:titleReveal 1.6s cubic-bezier(.16,1,.3,1) forwards .8s;
  overflow:hidden;
}
.hero-title::after{
  content:'UMBRA';position:absolute;inset:0;
  background:linear-gradient(165deg,var(--gold-dim),var(--gold),var(--gold-bright),var(--gold),var(--gold-dim));
  -webkit-background-clip:text;background-clip:text;color:transparent;
  filter:blur(40px);opacity:.35;z-index:-1;
}
.hero-shimmer{
  position:absolute;top:0;left:-100%;width:60%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(240,217,138,0.25),transparent);
  transform:skewX(-20deg);
  animation:shimmerSweep 8s ease 3s infinite;
  pointer-events:none;
}
@keyframes shimmerSweep{
  0%{left:-100%}40%{left:200%}100%{left:200%}
}
.hero-sub{
  font-family:var(--font-display),serif;font-size:clamp(16px,2.2vw,22px);
  font-style:italic;color:var(--text-dim);letter-spacing:2px;
  margin-top:36px;max-width:520px;line-height:1.6;
  opacity:0;animation:fadeup .9s ease forwards 1.8s;
}
.hero-divider{
  width:1px;height:60px;
  background:linear-gradient(to bottom,transparent,var(--gold-dim),transparent);
  margin:52px auto 0;opacity:0;animation:fadeup .9s ease forwards 2.2s;
}
.scroll-hint{
  position:absolute;bottom:36px;left:50%;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:center;gap:10px;
  opacity:0;animation:fadeup .9s ease forwards 3s;
}
.scroll-hint span{
  font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:4px;
  text-transform:uppercase;color:var(--text-ghost);
}
.scroll-line{
  width:1px;height:40px;
  background:linear-gradient(to bottom,var(--gold-dim),transparent);
  animation:scrollpulse 2s ease infinite;
}

/* MANIFESTO */
.manifesto{position:relative;z-index:1;padding:160px 0;overflow:hidden}
.manifesto::before{
  content:'';position:absolute;left:50%;transform:translateX(-50%);
  top:0;width:1px;height:100%;
  background:linear-gradient(to bottom,transparent,rgba(201,168,76,.08),transparent);
}
.manifesto-inner{max-width:780px;margin:0 auto;padding:0 60px;}
.m-label{
  font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;
  text-transform:uppercase;color:var(--gold-dim);margin-bottom:56px;
  display:flex;align-items:center;gap:18px;
}
.m-label::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(201,168,76,.18),transparent)}
.m-line{
  margin-bottom:48px;opacity:0;transform:translateY(22px);
  transition:opacity .9s ease,transform .9s ease;
}
.m-line.visible{opacity:1;transform:translateY(0)}
.m-line h2{
  font-family:var(--font-cinzel),serif;font-size:clamp(22px,3.5vw,36px);
  font-weight:400;color:var(--text);line-height:1.2;margin-bottom:18px;letter-spacing:.5px;
}
.m-line h2 em{
  font-style:italic;color:var(--gold);
  font-family:var(--font-display),serif;font-size:1.15em;
}
.m-line p{font-size:clamp(15px,1.8vw,18px);color:var(--text-dim);line-height:2;font-weight:300}
.m-line p strong{color:var(--text);font-weight:400}
.m-divider{
  width:40px;height:1px;background:var(--gold-dim);margin:56px 0;
  opacity:0;transform:scaleX(0);transform-origin:left;
  transition:opacity .6s ease,transform .8s ease;
}
.m-divider.visible{opacity:1;transform:scaleX(1)}
.m-statement{
  font-family:var(--font-cinzel),serif;font-size:clamp(28px,4.5vw,52px);
  font-weight:700;line-height:1.15;color:transparent;
  background:linear-gradient(135deg,var(--gold-dim),var(--gold),var(--gold-bright),var(--gold));
  -webkit-background-clip:text;background-clip:text;letter-spacing:.5px;
  opacity:0;transform:translateY(22px);
  transition:opacity 1.1s ease,transform 1.1s ease;
}
.m-statement.visible{opacity:1;transform:translateY(0)}

/* THE EQUATION — Ashley's interstitial */
.equation{
  position:relative;z-index:1;
  min-height:100vh;display:flex;align-items:center;justify-content:center;
  text-align:center;padding:120px 60px;overflow:hidden;
}
.equation::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse 70% 50% at 50% 50%,rgba(201,168,76,.05) 0%,transparent 65%);
  pointer-events:none;
}
.equation-inner{max-width:900px;}
.equation-pre{
  font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;
  text-transform:uppercase;color:var(--gold-dim);margin-bottom:60px;
  opacity:0;transform:translateY(16px);
  transition:opacity .8s ease,transform .8s ease;
}
.equation-pre.visible{opacity:1;transform:translateY(0)}
.equation-line{
  font-family:var(--font-cinzel),serif;
  font-size:clamp(20px,4vw,46px);
  font-weight:400;color:var(--text-dim);
  line-height:1.5;letter-spacing:.5px;
  opacity:0;transform:translateY(20px);
  transition:opacity 1s ease,transform 1s ease;
}
.equation-line.visible{opacity:1;transform:translateY(0)}
.equation-line.gold{
  color:transparent;
  background:linear-gradient(90deg,var(--gold-dim),var(--gold-bright),var(--gold));
  -webkit-background-clip:text;background-clip:text;
  font-style:italic;font-size:clamp(22px,4.5vw,54px);
}
.equation-break{
  width:60px;height:1px;
  background:linear-gradient(to right,transparent,var(--gold-dim),transparent);
  margin:48px auto;
  opacity:0;transform:scaleX(0);transform-origin:center;
  transition:opacity .6s ease,transform .9s ease;
}
.equation-break.visible{opacity:1;transform:scaleX(1)}

/* PRINCIPLES */
.principles{
  position:relative;z-index:1;padding:0 0 160px;
  max-width:1100px;margin:0 auto;
  padding-left:60px;padding-right:60px;
}
.p-header{
  font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;
  text-transform:uppercase;color:var(--gold-dim);margin-bottom:80px;
  display:flex;align-items:center;gap:18px;
}
.p-header::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(201,168,76,.18),transparent)}
.p-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px}
.p-item{
  background:rgba(255,255,255,.018);border:1px solid rgba(255,255,255,.025);
  padding:40px 36px;position:relative;overflow:hidden;
  opacity:0;transform:translateY(20px);
  transition:opacity .8s ease,transform .8s ease,background .4s ease,border-color .4s ease;
}
.p-item.visible{opacity:1;transform:translateY(0)}
.p-item::before{
  content:'';position:absolute;left:0;top:0;bottom:0;width:2px;
  background:var(--gold);transform:scaleY(0);transform-origin:top;transition:transform .5s ease;
}
.p-item::after{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at 20% 50%,rgba(201,168,76,0) 0%,transparent 70%);
  transition:background .5s ease;pointer-events:none;
}
.p-item:hover::before{transform:scaleY(1)}
.p-item:hover::after{background:radial-gradient(ellipse at 20% 50%,rgba(201,168,76,0.04) 0%,transparent 70%)}
.p-item:hover{background:var(--gold-ghost);border-color:rgba(201,168,76,.08)}
.p-num{
  font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:3px;
  color:var(--gold-dim);margin-bottom:18px;
}
.p-title{
  font-family:var(--font-cinzel),serif;font-size:15px;font-weight:600;
  color:var(--text);margin-bottom:12px;letter-spacing:.4px;line-height:1.3;
}
.p-desc{font-size:14px;color:var(--text-dim);line-height:1.8;font-weight:300}

/* WAITLIST */
.waitlist{position:relative;z-index:1;padding:0 60px 200px;text-align:center}
.wl-inner{max-width:620px;margin:0 auto}
.wl-pre{
  font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;
  text-transform:uppercase;color:var(--gold-dim);margin-bottom:40px;
  opacity:0;transform:translateY(16px);transition:opacity .8s ease,transform .8s ease;
}
.wl-pre.visible{opacity:1;transform:translateY(0)}
.wl-count{
  font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:4px;
  color:rgba(201,168,76,0.45);margin-bottom:28px;
  opacity:0;transform:translateY(12px);transition:opacity .8s ease .2s,transform .8s ease .2s;
}
.wl-count.visible{opacity:1;transform:translateY(0)}
.wl-title{
  font-family:var(--font-cinzel),serif;font-size:clamp(30px,5vw,58px);
  font-weight:700;color:var(--text);line-height:1.1;margin-bottom:20px;
  opacity:0;transform:translateY(16px);
  transition:opacity .9s ease .1s,transform .9s ease .1s;
}
.wl-title.visible{opacity:1;transform:translateY(0)}
.wl-title span{color:var(--gold)}
.wl-sub{
  font-family:var(--font-display),serif;font-style:italic;
  font-size:clamp(15px,1.8vw,19px);color:var(--text-dim);line-height:1.8;margin-bottom:50px;
  opacity:0;transform:translateY(16px);
  transition:opacity .9s ease .2s,transform .9s ease .2s;
}
.wl-sub.visible{opacity:1;transform:translateY(0)}
.wl-fields{
  display:flex;flex-direction:column;gap:12px;
  max-width:500px;margin:0 auto 16px;
  opacity:0;transform:translateY(16px);
  transition:opacity .9s ease .3s,transform .9s ease .3s;
}
.wl-fields.visible{opacity:1;transform:translateY(0)}
.wl-input{
  width:100%;background:rgba(255,255,255,.025);
  border:1px solid rgba(201,168,76,.15);
  color:var(--text);font-family:var(--font-display),serif;
  font-size:16px;padding:16px 24px;outline:none;
  transition:border-color .3s,background .3s;letter-spacing:.5px;
}
.wl-input::placeholder{color:var(--mist);font-style:italic}
.wl-input:focus{border-color:rgba(201,168,76,.4);background:rgba(201,168,76,.03)}
.wl-select{
  width:100%;background:rgba(255,255,255,.025);
  border:1px solid rgba(201,168,76,.15);
  color:var(--text);font-family:var(--font-mono),monospace;
  font-size:11px;letter-spacing:2px;padding:16px 24px;outline:none;
  transition:border-color .3s,background .3s;-webkit-appearance:none;appearance:none;cursor:none;
}
.wl-select:focus{border-color:rgba(201,168,76,.4);background:rgba(201,168,76,.03)}
.wl-select option{background:#111;color:var(--text);}
.wl-row{display:flex;gap:0;}
.wl-btn{
  background:var(--gold);border:1px solid var(--gold);color:var(--void);
  font-family:var(--font-cinzel),serif;font-size:11px;font-weight:700;
  letter-spacing:4px;text-transform:uppercase;padding:16px 28px;cursor:none;
  transition:all .3s;white-space:nowrap;width:100%;margin-top:4px;
}
.wl-btn:hover{background:var(--gold-bright);border-color:var(--gold-bright)}
.wl-btn:active{transform:scale(.98)}
.wl-btn:disabled{opacity:.4;cursor:not-allowed;pointer-events:none}
.wl-note{
  font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:2px;
  color:var(--text-ghost);
  opacity:0;transform:translateY(16px);
  transition:opacity .9s ease .4s,transform .9s ease .4s;
}
.wl-note.visible{opacity:1;transform:translateY(0)}
.wl-success{
  display:none;padding:40px;border:1px solid rgba(201,168,76,.15);
  background:var(--gold-ghost);
}
.wl-success.show{display:block}
.wl-success-num{
  font-family:var(--font-cinzel),serif;font-size:clamp(60px,10vw,100px);
  font-weight:900;color:var(--gold);line-height:1;margin-bottom:16px;
}
.wl-success-line{
  font-family:var(--font-display),serif;font-style:italic;
  font-size:20px;color:var(--text-dim);line-height:1.7;
}
.wl-error{
  font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:2px;
  color:rgba(220,80,80,.6);margin-top:8px;
}

/* ORIGIN */
.origin{
  position:relative;z-index:1;
  border-top:1px solid rgba(201,168,76,.06);
  padding:120px 60px;text-align:center;overflow:hidden;
}
.origin::before{
  content:'';position:absolute;
  width:600px;height:400px;top:50%;left:50%;
  transform:translate(-50%,-50%);border-radius:50%;
  background:radial-gradient(ellipse,rgba(201,168,76,0.04) 0%,transparent 65%);
  animation:originPulse 6s ease-in-out infinite;pointer-events:none;
}
@keyframes originPulse{
  0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(1)}
  50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}
}
.origin-text{
  font-family:var(--font-display),serif;font-style:italic;
  font-size:clamp(14px,1.6vw,17px);color:var(--text-ghost);
  letter-spacing:1px;line-height:2.4;
  opacity:0;transform:translateY(12px);
  transition:opacity .9s ease,transform .9s ease;
  position:relative;z-index:1;
}
.origin-text.visible{opacity:1;transform:translateY(0)}
.origin-text strong{color:rgba(201,168,76,0.6);font-style:normal;font-weight:400}
.origin-sig{
  font-family:var(--font-cinzel),serif;font-size:11px;letter-spacing:5px;
  color:var(--gold-dim);margin-top:28px;
  opacity:0;transform:translateY(12px);
  transition:opacity .9s ease .2s,transform .9s ease .2s;
  position:relative;z-index:1;
}
.origin-sig.visible{opacity:1;transform:translateY(0)}

/* FOOTER */
footer{
  position:relative;z-index:1;
  border-top:1px solid rgba(255,255,255,.025);
  padding:40px 60px;display:flex;justify-content:space-between;align-items:center;
}
.footer-mark{font-family:var(--font-cinzel),serif;font-size:11px;letter-spacing:6px;color:var(--gold-dim)}
.footer-note{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:3px;color:var(--text-ghost);text-transform:uppercase}

/* ANIMATIONS */
@keyframes fadeup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes titleReveal{
  0%{opacity:0;transform:scale(.96) translateY(16px);filter:blur(8px)}
  100%{opacity:1;transform:scale(1) translateY(0);filter:blur(0)}
}
@keyframes scrollpulse{
  0%,100%{opacity:.4;transform:scaleY(1)}50%{opacity:1;transform:scaleY(1.2)}
}

/* RESPONSIVE */
@media(max-width:768px){
  nav{padding:24px 28px}
  .manifesto-inner,.principles,.waitlist,.origin{padding-left:28px;padding-right:28px}
  .p-grid{grid-template-columns:1fr}
  footer{flex-direction:column;gap:16px;text-align:center;padding:32px 28px}
  .wl-row{flex-direction:column}
}
`



export default function ManifestoPage() {
  const [curtainLifted, setCurtainLifted] = useState(false)
  const [eyebrow, setEyebrow]             = useState('')
  const [form, setForm]                   = useState({ email: '', aesthetic_affinity: '' })
  const [status, setStatus]               = useState<Status>('idle')
  const [position, setPos]                = useState<number | null>(null)
  const [wlCount, setWlCount]             = useState<number | null>(null)
  const [errMsg, setErr]                  = useState('')
  const canvasRef                         = useRef<HTMLCanvasElement>(null)

  const EYEBROW_TEXT = 'A world. Not a platform.'

  // Curtain lift
  useEffect(() => {
    const t = setTimeout(() => setCurtainLifted(true), 2000)
    return () => clearTimeout(t)
  }, [])

  // Typewriter eyebrow
  useEffect(() => {
    if (!curtainLifted) return
    let i = 0
    const interval = setInterval(() => {
      setEyebrow(EYEBROW_TEXT.slice(0, i + 1))
      i++
      if (i >= EYEBROW_TEXT.length) clearInterval(interval)
    }, 55)
    return () => clearInterval(interval)
  }, [curtainLifted])

  // Fetch waitlist count
  useEffect(() => {
    fetch('/api/waitlist/count').then(r => r.json()).then(d => {
      if (d.count !== undefined) setWlCount(d.count)
    }).catch(() => {})
  }, [])

  // Cursor + Particles + Scroll reveals
  useEffect(() => {
    if (!curtainLifted) return
    const cursor    = document.getElementById('cursor')
    const ring      = document.getElementById('cursor-ring')
    const trails    = Array.from(document.querySelectorAll('.cursor-trail')) as HTMLElement[]
    let mx = 0, my = 0, rx = 0, ry = 0
    const trailPositions = trails.map(() => ({ x: 0, y: 0 }))

    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    document.addEventListener('mousemove', onMove)

    let ringFrame: number
    const animRing = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12
      if (cursor) { cursor.style.left = mx + 'px'; cursor.style.top = my + 'px' }
      if (ring)   { ring.style.left = rx + 'px';   ring.style.top = ry + 'px' }
      // Trail
      let prevX = mx, prevY = my
      trails.forEach((t, i) => {
        const tp = trailPositions[i]
        tp.x += (prevX - tp.x) * (0.18 - i * 0.025)
        tp.y += (prevY - tp.y) * (0.18 - i * 0.025)
        t.style.left   = tp.x + 'px'
        t.style.top    = tp.y + 'px'
        t.style.opacity = String(0.35 - i * 0.06)
        prevX = tp.x; prevY = tp.y
      })
      ringFrame = requestAnimationFrame(animRing)
    }
    ringFrame = requestAnimationFrame(animRing)

    document.querySelectorAll<HTMLElement>('a,button,.p-item').forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (cursor) cursor.style.transform = 'translate(-50%,-50%) scale(2.5)'
        if (ring) { ring.style.transform = 'translate(-50%,-50%) scale(1.5)'; ring.style.borderColor = 'rgba(201,168,76,.7)' }
      })
      el.addEventListener('mouseleave', () => {
        if (cursor) cursor.style.transform = 'translate(-50%,-50%) scale(1)'
        if (ring) { ring.style.transform = 'translate(-50%,-50%) scale(1)'; ring.style.borderColor = 'rgba(201,168,76,.4)' }
      })
    })

    // Particles with constellation lines
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)

    class Particle {
      x=0; y=0; size=0; speedY=0; speedX=0
      opacity=0; targetOpacity=0; life=0; maxLife=0
      constructor() { this.reset(true) }
      reset(init: boolean) {
        this.x = Math.random() * W
        this.y = init ? Math.random() * H : H + 10
        this.size = Math.random() * 1.8 + 0.4
        this.speedY = -(Math.random() * 0.4 + 0.15)
        this.speedX = (Math.random() - 0.5) * 0.2
        this.opacity = 0
        this.targetOpacity = Math.random() * 0.45 + 0.08
        this.life = 0
        this.maxLife = Math.random() * 400 + 200
      }
      update() {
        this.x += this.speedX; this.y += this.speedY; this.life++
        if (this.life < 60) this.opacity = (this.life / 60) * this.targetOpacity
        else if (this.life > this.maxLife - 60) this.opacity = ((this.maxLife - this.life) / 60) * this.targetOpacity
        if (this.life >= this.maxLife || this.y < -10) this.reset(false)
      }
      draw() {
        ctx!.save(); ctx!.globalAlpha = this.opacity
        ctx!.fillStyle = '#c9a84c'; ctx!.shadowColor = '#c9a84c'; ctx!.shadowBlur = 8
        ctx!.beginPath(); ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx!.fill()
        ctx!.restore()
      }
    }

    const particles: Particle[] = []
    for (let i = 0; i < 80; i++) particles.push(new Particle())

    let animId: number
    const animP = () => {
      ctx.clearRect(0, 0, W, H)
      // Constellation lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.08
            ctx.beginPath()
            ctx.strokeStyle = `rgba(201,168,76,${alpha})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
      particles.forEach(p => { p.update(); p.draw() })
      animId = requestAnimationFrame(animP)
    }
    animId = requestAnimationFrame(animP)

    // Scroll reveals
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) (e.target as HTMLElement).classList.add('visible') })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })

    document.querySelectorAll(
      '.m-line,.m-divider,.m-statement,.p-item,.wl-pre,.wl-count,.wl-title,.wl-sub,.wl-fields,.wl-note,.origin-text,.origin-sig,.equation-pre,.equation-line,.equation-break'
    ).forEach(el => obs.observe(el))

    document.querySelectorAll<HTMLElement>('.p-item').forEach((el, i) => {
      el.style.transitionDelay = (i * 0.1) + 's'
    })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(ringFrame)
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      obs.disconnect()
    }
  }, [curtainLifted])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!form.email || !form.aesthetic_affinity || status === 'loading') return
    setStatus('loading'); setErr('')
    try {
      const res  = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, aesthetic_affinity: form.aesthetic_affinity }),
      })
      const data = await res.json()
      if (res.status === 409) { setStatus('success'); setPos(data.position); return }
      if (!res.ok) throw new Error(data.error || 'The shadow rejected this entry.')
      setStatus('success'); setPos(data.position)
    } catch (err: unknown) {
      setStatus('error')
      setErr(err instanceof Error ? err.message : 'An error occurred.')
    }
  }, [form, status])

  const canSubmit = form.email && form.aesthetic_affinity && status !== 'loading'


  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Curtain */}
      <div id="curtain" className={curtainLifted ? 'lifted' : ''}>
        <div className="curtain-sigil">UMBRA</div>
      </div>

      {/* Cursor */}
      <div id="cursor" />
      <div id="cursor-ring" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="cursor-trail" style={{ width: 5 - i, height: 5 - i, opacity: 0 }} />
      ))}

      <div className="vignette" />
      <canvas ref={canvasRef} id="canvas" />

      <nav>
        <a href="#" className="nav-mark">UMBRA</a>
        <div className="nav-links">
          <a href="#manifesto">Manifesto</a>
          <a href="#waitlist">Enter</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-eyebrow">{eyebrow}</div>
        <h1 className="hero-title">
          UMBRA
          <span className="hero-shimmer" />
        </h1>
        <p className="hero-sub">The world&apos;s most complete aesthetic visual content ecosystem. Coming.</p>
        <div className="hero-divider" />
        <div className="scroll-hint">
          <span>Descend</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="manifesto" id="manifesto">
        <div className="manifesto-inner">
          <div className="m-label">The Manifesto</div>

          <div className="m-line">
            <h2>Every stock platform that exists today solves the same problem <em>the same way.</em></h2>
            <p>&quot;Here is content. Search it. Download it. Bye.&quot; That is not a platform. That is a hard drive with a search bar wearing a subscription fee.</p>
          </div>

          <div className="m-divider" />

          <div className="m-line">
            <h2>UMBRA is <em>different</em> in a way that cannot be copied.</h2>
            <p>Not because of features. Because of philosophy. <strong>The platform has a point of view.</strong> It holds that point of view deliberately. It changes it publicly, when it must, and never secretly. You don&apos;t use UMBRA. You enter it.</p>
          </div>

          <div className="m-divider" />

          <div className="m-line">
            <h2>You type a mood. <em>The world transforms.</em></h2>
            <p>Not a filter. Not a tag search. The interface becomes the mood. The particles shift. The color breathes. The ambient score changes. The content that surfaces wasn&apos;t selected by an algorithm optimized for time-on-site. It was summoned by intelligence optimized for <strong>aesthetic truth.</strong></p>
          </div>

          <div className="m-divider" />

          <div className="m-line">
            <h2>The library has a conscience. <em>Governed by aesthetic law.</em></h2>
            <p>Every asset that enters UMBRA is interrogated. Not for likes, not for keywords, not for SEO. For <strong>quality.</strong> For specificity of vision. For the honest question: does this thing earn its place? If the answer is no — it does not pass. The floor does not descend.</p>
          </div>

          <div className="m-divider" />

          <div className="m-line">
            <h2>The world is the source. <em>Not the West. Not defaults.</em></h2>
            <p>Nairobi. Seoul. Buenos Aires. Tbilisi. Lagos. Medina. Patagonia. Bali. Montreal. <strong>Mwiki at dawn.</strong> These are not diversity features. They are the core product.</p>
          </div>

          <div className="m-divider" />

          <div className="m-line">
            <h2>UMBRA earns attention. <em>It never demands it.</em></h2>
            <p>No push notifications. No re-engagement emails. No dark patterns. No &quot;we miss you.&quot; Users leave and return on their own terms. When they return, the platform has new things worth finding. <strong>The confidence to not chase is itself the brand.</strong></p>
          </div>

          <div className="m-divider" />

          <div className="m-statement">
            What is limited is respected.<br />
            What is rare is real.<br />
            What is beautiful — belongs.
          </div>

          <div className="m-divider" />

          <div className="m-line">
            <h2>There is a Sovereign.</h2>
            <p>One person oversees everything. An AI governs the library — sorting, tagging, scheduling, broadcasting. The Sovereign approves or overrides. The AI serves the vision. It does not replace it. <strong>This is not automation. This is architecture.</strong></p>
          </div>
        </div>
      </section>

      {/* THE EQUATION — Ashley's interstitial */}
      <section className="equation">
        <div className="equation-inner">
          <div className="equation-pre">The Equation</div>
          <p className="equation-line">Every platform optimizes for your attention.</p>
          <div className="equation-break" />
          <p className="equation-line gold">UMBRA optimizes for your discernment.</p>
          <div className="equation-break" />
          <p className="equation-line" style={{ fontSize: 'clamp(14px,2vw,22px)', color: 'var(--text-ghost)' }}>
            These are not the same thing.
          </p>
        </div>
      </section>

      {/* THE LAW */}
      <section className="principles">
        <div className="p-header">The Law</div>
        <div className="p-grid">
          {[
            { n: '01', t: 'Quality Is the Only Filter That Matters', d: 'Not popularity. Not recency. Not engagement score. If an asset is beautiful, it belongs. If it is not, it does not. The floor never descends.' },
            { n: '02', t: 'Scarcity Is Respect', d: 'When something is limited, its value is acknowledged. When something expires, it meant something while it lasted. These are not marketing tricks. They are a position on what beauty deserves.' },
            { n: '03', t: 'The AI Serves the Vision, Not the Metrics', d: 'Optimized for aesthetic coherence and platform health — not engagement metrics, time-on-site, or click-through rates. A platform optimized for engagement becomes addictive and hollow. A platform optimized for aesthetic health becomes essential.' },
            { n: '04', t: 'User Data Is Not a Product', d: 'Behavioral data exists to improve the platform experience. It is never sold. Never shared. Never used to serve advertising. God Analytics exists to serve curation — not to monetize what it learns about you.' },
            { n: '05', t: 'The Platform Speaks Precisely or Not at All', d: 'Every word published — every description, every broadcast, every error message — is written to the same standard as the content it surrounds. Silence is preferable to the wrong words.' },
            { n: '06', t: 'The World Is Not an Afterthought', d: 'UMBRA was built in Mwiki, Kasarani, Nairobi, Kenya. It serves the world. These facts are in permanent productive tension — and that tension is what makes the curation honest.' },
          ].map(item => (
            <div key={item.n} className="p-item">
              <div className="p-num">{item.n}</div>
              <div className="p-title">{item.t}</div>
              <div className="p-desc">{item.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WAITLIST */}
      <section className="waitlist" id="waitlist">
        <div className="wl-inner">
          <div className="wl-pre">The Shadow Opens</div>
          {wlCount !== null && (
            <div className="wl-count">{wlCount} {wlCount === 1 ? 'soul' : 'souls'} already in the shadow</div>
          )}
          <h2 className="wl-title">Enter <span>Before</span> the World Knows</h2>
          <p className="wl-sub">The first 100 subscribers enter at a locked-in price — forever. Their names go on the Founding Wall. Their access never expires. Founding membership is never offered again.</p>

          {status === 'success' ? (
            <div className="wl-success show">
              <div className="wl-success-num">{position !== null ? `#${String(position).padStart(3,'0')}` : '#—'}</div>
              <div className="wl-success-line">You are in the shadow.<br />We will call you when the door opens.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="wl-fields visible">
                <div className="wl-row">
                  <input
                    className="wl-input"
                    type="email"
                    placeholder="Your email address..."
                    autoComplete="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    required
                    style={{ flex: 1 }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <select
                    className="wl-select"
                    value={form.aesthetic_affinity}
                    onChange={e => set('aesthetic_affinity', e.target.value)}
                    required
                  >
                    <option value="" disabled>Your aesthetic affinity —</option>
                    {AFFINITIES.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span style={{ position:'absolute',right:16,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'rgba(201,168,76,0.45)',fontSize:11 }}>▾</span>
                </div>
                {status === 'error' && <p className="wl-error">{errMsg}</p>}
                <button className="wl-btn" type="submit" disabled={!canSubmit}>
                  {status === 'loading' ? '...' : 'Enter the Shadow'}
                </button>
              </div>
            </form>
          )}

          <p className="wl-note">No notifications. No marketing. One email — when it opens.</p>
        </div>
      </section>

      {/* ORIGIN */}
      <section className="origin">
        <p className="origin-text">
          Built from a bottom bunk in <strong>Mwiki, Kasarani, Nairobi, Kenya.</strong><br />
          On a Lenovo Chromebook and a Huawei Y9a.<br />
          With zero budget and a complete absence of permission.<br /><br />
          This is what happens when someone who was never supposed to build something like this<br />
          decides to build it anyway.
        </p>
        <div className="origin-sig">REY TEMPEST &nbsp;&middot;&nbsp; TEMPEST GROUP &nbsp;&middot;&nbsp; NAIROBI, KENYA</div>
      </section>

      <footer>
        <div className="footer-mark">UMBRA</div>
        <div className="footer-note">&copy; 2026 Tempest Group &nbsp;&middot;&nbsp; All rights reserved</div>
      </footer>
    </>
  )
}
