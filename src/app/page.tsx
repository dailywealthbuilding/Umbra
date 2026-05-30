'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Gallery from "./components/Gallery"

const STYLES = `
:root {
  --void: #030305;
  --g:    #c9a84c;
  --gb:   #f0d98a;
  --gd:   #9a7a36;
  --gg:   rgba(201,168,76,.07);
  --t:    #eeeef8;
  --td:   #c4c4dc;
  --tg:   #9898b4;
  --tm:   #787890;
}
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0 }
::selection { background:rgba(201,168,76,.22); color:var(--gb) }
::-webkit-scrollbar { width:1px }
::-webkit-scrollbar-track { background:var(--void) }
::-webkit-scrollbar-thumb { background:var(--gd) }
html { scroll-behavior:smooth }
body { background:var(--void); color:var(--t); font-family:var(--font-display),serif; overflow-x:hidden; cursor:none; -webkit-font-smoothing:antialiased }
@media(max-width:768px){ body{ cursor:auto } }

/* ── CURTAIN ── */
#curtain { position:fixed; inset:0; background:var(--void); z-index:9000; display:flex; align-items:center; justify-content:center; flex-direction:column; transition:opacity 1.4s ease .3s, visibility 1.4s ease .3s }
#curtain.up { opacity:0; visibility:hidden; pointer-events:none }
.boot-wrap { width:320px; margin-bottom:48px }
.bl { font-family:var(--font-mono),monospace; font-size:9px; letter-spacing:.22em; color:rgba(201,168,76,0); text-transform:uppercase; line-height:2.4 }
.bl.on { color:rgba(201,168,76,.45); transition:color .25s }
.bl.on.last { color:rgba(201,168,76,.8) }
.c-mark { font-family:var(--font-cinzel),serif; font-size:clamp(72px,14vw,160px); font-weight:900; letter-spacing:.08em; color:transparent; background:linear-gradient(165deg,#8a6f33,#c9a84c,#f0d98a,#c9a84c,#8a6f33); -webkit-background-clip:text; background-clip:text; opacity:0; transform:scale(.92) }
.c-mark.show { animation:cmReveal 1.4s cubic-bezier(.16,1,.3,1) forwards }
.c-sub { font-family:var(--font-mono),monospace; font-size:8px; letter-spacing:.5em; color:rgba(201,168,76,.28); text-transform:uppercase; margin-top:16px; opacity:0 }
.c-sub.show { animation:fadeup .5s ease .2s forwards }
@keyframes cmReveal { 0%{opacity:0;transform:scale(.88);filter:blur(20px)} 70%{opacity:1;filter:blur(0)} 100%{opacity:1;transform:scale(1)} }

/* ── NEXUS CURSOR ── */
#cursor { position:fixed; pointer-events:none; z-index:9999; width:0; height:0; transform:translate(-50%,-50%) }
.nx-ring { position:absolute; border-radius:50%; pointer-events:none }
.nx-r1 { width:64px; height:64px; top:-32px; left:-32px; border:1px solid rgba(201,168,76,.12); transition:width .3s,height .3s,top .3s,left .3s,border-color .3s }
.nx-r2 { width:40px; height:40px; top:-20px; left:-20px; animation:nx2spin 12s linear infinite }
.nx-r2-seg { position:absolute; width:100%; height:100%; border-radius:50% }
.nx-r2-seg::before,.nx-r2-seg::after { content:''; position:absolute; border-radius:50% }
.nx-r2-seg::before { width:100%; height:100%; border:1px solid transparent; border-top:1px solid rgba(201,168,76,.55); border-right:1px solid rgba(201,168,76,.18) }
.nx-r2-seg::after { width:60%; height:60%; top:20%; left:20%; border:1px solid transparent; border-bottom:1px solid rgba(201,168,76,.35); border-left:1px solid rgba(201,168,76,.12) }
.nx-r3 { width:22px; height:22px; top:-11px; left:-11px; animation:nx3spinrev 6s linear infinite }
.nx-diamond { position:absolute; width:8px; height:8px; top:-4px; left:-4px; border:1px solid rgba(201,168,76,.6); transform:rotate(45deg); transition:width .3s,height .3s,top .3s,left .3s }
.nx-cross { position:absolute; top:-28px; left:-28px; width:56px; height:56px }
.nx-cross::before,.nx-cross::after { content:''; position:absolute; background:rgba(201,168,76,.2) }
.nx-cross::before { width:10px; height:1px; top:50%; left:0; transform:translateY(-50%) }
.nx-cross::after { width:1px; height:10px; left:50%; top:0; transform:translateX(-50%) }
.nx-dot { position:absolute; width:4px; height:4px; top:-2px; left:-2px; border-radius:50%; background:var(--g); box-shadow:0 0 8px var(--g),0 0 20px rgba(201,168,76,.4); animation:nxdotpulse 2s ease infinite }
@keyframes nx2spin { to{transform:rotate(360deg)} }
@keyframes nx3spinrev { to{transform:rotate(-360deg)} }
@keyframes nxdotpulse { 0%,100%{box-shadow:0 0 5px var(--g),0 0 12px rgba(201,168,76,.35)} 50%{box-shadow:0 0 14px var(--gb),0 0 32px rgba(240,217,138,.55),0 0 60px rgba(201,168,76,.12)} }
body.hov .nx-r2 { animation-duration:2s }
body.hov .nx-r1 { width:36px;height:36px;top:-18px;left:-18px;border-color:rgba(201,168,76,.35) }
body.hov .nx-diamond { width:12px;height:12px;top:-6px;left:-6px;border-color:rgba(201,168,76,.9) }
body.hov .nx-dot { box-shadow:0 0 14px var(--gb),0 0 36px rgba(240,217,138,.6) }
#trail { position:fixed; inset:0; pointer-events:none; z-index:9990 }
@media(max-width:768px){ #cursor,#trail{display:none} }

/* ── GRAIN + VIGNETTE ── */
#ptcl { position:fixed; inset:0; pointer-events:none; z-index:0; opacity:.85 }
.vignette { position:fixed; inset:0; pointer-events:none; z-index:0; background:radial-gradient(ellipse at center,transparent 30%,rgba(3,3,5,.88) 100%) }
body::after { content:''; position:fixed; inset:0; pointer-events:none; z-index:1; opacity:.018; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size:180px }

/* ── NAV ── */
nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:26px 56px; display:flex; justify-content:space-between; align-items:center; background:linear-gradient(to bottom,rgba(3,3,5,.92),transparent) }
.n-mark { font-family:var(--font-cinzel),serif; font-size:11px; font-weight:700; letter-spacing:8px; color:var(--g); text-decoration:none; opacity:0; animation:fadeup .8s ease forwards 4.2s }
.n-links { display:flex; gap:36px; opacity:0; animation:fadeup .8s ease forwards 4.4s }
.n-links a { font-family:var(--font-mono),monospace; font-size:8.5px; letter-spacing:3px; text-transform:uppercase; color:var(--tg); text-decoration:none; transition:color .3s }
.n-links a:hover { color:var(--g) }
.n-status { display:flex; align-items:center; gap:8px; font-family:var(--font-mono),monospace; font-size:8px; letter-spacing:.25em; color:rgba(201,168,76,.38); opacity:0; animation:fadeup .8s ease forwards 4.6s }
.n-dot { width:5px; height:5px; border-radius:50%; background:rgba(80,220,80,.7); box-shadow:0 0 8px rgba(80,220,80,.4); animation:blink2 2.5s ease infinite }

/* ── HERO ── */
.hero { position:relative; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:120px 40px 80px; z-index:2; overflow:hidden }
.hero::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 90% 70% at 50% 50%,rgba(201,168,76,.09) 0%,transparent 60%); pointer-events:none }
.scanlines { position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.014) 3px,rgba(0,0,0,.014) 4px) }
.hud-corner { position:absolute; width:48px; height:48px; opacity:0; animation:fadeup .5s ease forwards }
.hud-corner.tl { top:88px; left:56px; border-top:1px solid rgba(201,168,76,.3); border-left:1px solid rgba(201,168,76,.3); animation-delay:3.8s }
.hud-corner.tr { top:88px; right:56px; border-top:1px solid rgba(201,168,76,.3); border-right:1px solid rgba(201,168,76,.3); animation-delay:3.9s }
.hud-corner.bl { bottom:88px; left:56px; border-bottom:1px solid rgba(201,168,76,.3); border-left:1px solid rgba(201,168,76,.3); animation-delay:4s }
.hud-corner.br { bottom:88px; right:56px; border-bottom:1px solid rgba(201,168,76,.3); border-right:1px solid rgba(201,168,76,.3); animation-delay:4.1s }
.hud-label { position:absolute; font-family:var(--font-mono),monospace; font-size:7px; letter-spacing:.22em; color:rgba(201,168,76,.26); text-transform:uppercase; opacity:0; animation:fadeup .4s ease forwards 4.3s }
.hud-label.a { top:144px; left:56px } .hud-label.b { top:144px; right:56px; text-align:right } .hud-label.c { bottom:144px; left:56px }
.eyebrow { font-family:var(--font-mono),monospace; font-size:10px; letter-spacing:7px; color:var(--gd); text-transform:uppercase; margin-bottom:44px; opacity:0; animation:fadeup .9s ease forwards .5s; position:relative; z-index:3; min-height:1.5em }
.hero-wordmark { position:relative; z-index:3; overflow:visible }
h1.logo { font-family:var(--font-cinzel),serif; font-size:clamp(96px,20vw,240px); font-weight:900; line-height:.85; letter-spacing:-3px; color:transparent; background:linear-gradient(165deg,var(--gd) 0%,var(--g) 28%,var(--gb) 50%,var(--g) 72%,var(--gd) 100%); -webkit-background-clip:text; background-clip:text; opacity:0; animation:titleReveal 1.9s cubic-bezier(.16,1,.3,1) forwards 1s; overflow:hidden }
h1.logo::after { content:'UMBRA'; position:absolute; inset:0; background:inherit; -webkit-background-clip:text; background-clip:text; color:transparent; filter:blur(60px); opacity:.4; z-index:-1 }
.logo-shimmer { position:absolute; top:0; left:-120%; width:45%; height:100%; background:linear-gradient(90deg,transparent,rgba(240,217,138,.25),transparent); transform:skewX(-12deg); animation:shimmer 12s ease 3.2s infinite; pointer-events:none }
.hero-kicker { font-family:var(--font-display),serif; font-style:italic; font-size:clamp(16px,2.2vw,22px); color:var(--td); letter-spacing:1.5px; margin-top:28px; max-width:620px; line-height:1.7; opacity:0; animation:fadeup .9s ease forwards 2.6s; position:relative; z-index:3 }
.hero-tags { display:flex; gap:2px; align-items:center; margin-top:28px; opacity:0; animation:fadeup .9s ease forwards 2.2s; position:relative; z-index:3; flex-wrap:wrap; justify-content:center }
.htag { font-family:var(--font-mono),monospace; font-size:8px; letter-spacing:.38em; text-transform:uppercase; padding:7px 14px; border:1px solid rgba(255,255,255,.055); color:var(--tg) }
.htag.lit { color:rgba(201,168,76,.7); border-color:rgba(201,168,76,.18); background:rgba(201,168,76,.03) }
.hero-rule { width:1px; height:52px; background:linear-gradient(to bottom,transparent,var(--gd),transparent); margin:48px auto 0; opacity:0; animation:fadeup .9s ease forwards 3.1s }
.scroll-hint { position:absolute; bottom:32px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:8px; opacity:0; animation:fadeup .9s ease forwards 3.6s }
.scroll-hint span { font-family:var(--font-mono),monospace; font-size:7.5px; letter-spacing:5px; text-transform:uppercase; color:var(--tm) }
.scroll-line { width:1px; height:32px; background:linear-gradient(to bottom,var(--gd),transparent); animation:spulse 2s ease infinite }

/* ── STATS BAND ── */
.stats-band { position:relative; z-index:2; border-top:1px solid rgba(255,255,255,.025); border-bottom:1px solid rgba(255,255,255,.025); padding:48px 56px; overflow:hidden }
.stats-band::before { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(201,168,76,.03),transparent) }
.stats-inner { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); gap:32px }
.stat-item { text-align:center }
.stat-num { font-family:var(--font-cinzel),serif; font-size:clamp(32px,4vw,52px); font-weight:900; color:transparent; background:linear-gradient(165deg,var(--gd),var(--g),var(--gb)); -webkit-background-clip:text; background-clip:text; line-height:1 }
.stat-label { font-family:var(--font-mono),monospace; font-size:8px; letter-spacing:.35em; text-transform:uppercase; color:var(--tg); margin-top:10px }

/* ── SECTION SHARED ── */
.sec-label { font-family:var(--font-mono),monospace; font-size:9px; letter-spacing:6px; text-transform:uppercase; color:var(--gd); margin-bottom:56px; display:flex; align-items:center; gap:16px }
.sec-label::after { content:''; flex:1; height:1px; background:linear-gradient(to right,rgba(201,168,76,.18),transparent) }
.rule-x { width:40px; height:1px; background:var(--gd); margin:56px 0 }

/* ── SCROLLYTELLING BASE ── */
.sr { opacity:0; transform:translateY(28px); transition:opacity 1s ease, transform 1s ease }
.sr2 { opacity:0; transform:translateY(20px); transition:opacity .8s ease, transform .8s ease }
.sr3 { opacity:0; transform:translateX(-24px); transition:opacity .9s ease, transform .9s ease }
.sdv { opacity:0; transform:scaleX(0); transform-origin:left; transition:opacity .6s ease, transform .9s ease }
.sn { opacity:0; transition:opacity 1.2s ease }
.wr span { opacity:0; transform:translateY(12px); display:inline-block; transition:opacity .6s ease, transform .6s ease }
.sr.vis,.sr2.vis,.sr3.vis,.sn.vis { opacity:1; transform:none }
.sdv.vis { opacity:1; transform:scaleX(1) }
.wr.vis span { opacity:1; transform:none }

/* ── PROBLEM SECTION ── */
.problem { position:relative; z-index:2; padding:140px 56px; overflow:hidden }
.problem::before { content:''; position:absolute; left:50%; transform:translateX(-50%); top:0; width:1px; height:100%; background:linear-gradient(to bottom,transparent,rgba(201,168,76,.07),transparent) }
.problem-inner { max-width:820px; margin:0 auto }
.p-stmt { font-family:var(--font-cinzel),serif; font-size:clamp(22px,3.8vw,46px); font-weight:400; color:var(--t); line-height:1.2; margin-bottom:24px }
.p-stmt em { color:var(--g); font-style:italic; font-family:var(--font-display),serif }
.p-body { font-size:clamp(15px,1.8vw,18px); color:var(--td); line-height:2.15; font-weight:300 }
.p-body strong { color:var(--t); font-weight:400 }

/* ── SENSORY ENGINE ── */
.sensory { position:relative; z-index:2; padding:120px 56px 140px; overflow:hidden }
.sensory::before { content:''; position:absolute; left:0; right:0; top:0; height:1px; background:linear-gradient(90deg,transparent,rgba(201,168,76,.14),transparent) }
.sensory-inner { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center }
.sense-txt h2 { font-family:var(--font-cinzel),serif; font-size:clamp(24px,3.5vw,42px); font-weight:400; color:var(--t); line-height:1.2; margin-bottom:20px }
.sense-txt h2 em { color:var(--g); font-style:italic; font-family:var(--font-display),serif }
.sense-txt p { font-size:clamp(14px,1.6vw,17px); color:var(--td); line-height:2.1; font-weight:300 }
.sense-bullet { display:flex; gap:14px; margin-top:20px; align-items:flex-start }
.sb-n { width:22px; height:22px; flex-shrink:0; border:1px solid rgba(201,168,76,.2); display:flex; align-items:center; justify-content:center; font-family:var(--font-mono),monospace; font-size:8px; color:var(--gd); margin-top:1px }
.sb-t { font-family:var(--font-mono),monospace; font-size:11px; color:var(--tg); line-height:1.8; letter-spacing:.07em }
.demo-panel { border:1px solid rgba(201,168,76,.15); border-radius:2px; overflow:hidden; transition:border-color .8s }
.demo-bar { display:flex; align-items:center; gap:8px; padding:10px 16px; background:rgba(0,0,0,.6); border-bottom:1px solid rgba(255,255,255,.04) }
.db-dot { width:8px; height:8px; border-radius:50% } .db-dot.r{background:rgba(255,80,80,.5)} .db-dot.y{background:rgba(201,168,76,.5)} .db-dot.g{background:rgba(80,200,80,.35)}
.db-title { font-family:var(--font-mono),monospace; font-size:8px; letter-spacing:.3em; color:var(--tg); margin-left:6px }
.demo-body { padding:24px 18px 18px; min-height:340px; position:relative; transition:background 1.4s }
.demo-row { display:flex; margin-bottom:18px; border:1px solid rgba(201,168,76,.18); transition:border-color .8s }
.dr-pre { padding:11px 13px; font-family:var(--font-mono),monospace; font-size:11px; background:rgba(0,0,0,.3); border-right:1px solid rgba(255,255,255,.04) }
.dr-in { flex:1; background:transparent; border:none; outline:none; color:var(--t); font-family:var(--font-mono),monospace; font-size:11px; letter-spacing:.06em; padding:11px 10px }
.dr-btn { padding:11px 16px; font-family:var(--font-cinzel),serif; font-size:8px; letter-spacing:.35em; text-transform:uppercase; background:transparent; border:none; border-left:1px solid rgba(255,255,255,.04); cursor:none; transition:all .3s }
.dr-btn.scanning { animation:spulse2 .5s ease-in-out infinite }
.demo-status { display:flex; align-items:center; gap:10px; margin-bottom:14px }
.ds-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0 }
.ds-txt { font-family:var(--font-mono),monospace; font-size:8px; letter-spacing:.2em; color:var(--tg) }
.demo-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:6px }
.demo-card { border-radius:2px; overflow:hidden; transform:translateY(10px); opacity:0; transition:opacity .5s, transform .5s }
.demo-card.show { transform:translateY(0); opacity:1 }
.dc-img { height:72px; transition:background 1.4s }
.dc-info { padding:7px 9px; background:rgba(0,0,0,.55) }
.dc-ttl { font-family:var(--font-mono),monospace; font-size:7.5px; letter-spacing:.1em; color:var(--td); white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.dc-cat { font-size:7px; color:var(--tg); margin-top:2px; font-family:var(--font-mono),monospace }
.demo-foot { position:absolute; bottom:9px; right:12px; font-family:var(--font-mono),monospace; font-size:7px; letter-spacing:.2em; color:rgba(201,168,76,.22) }

/* ── GALLERY ── */
.gallery { position:relative; z-index:2; padding:80px 0 120px; overflow:hidden }
.gallery::before { content:''; position:absolute; left:0; right:0; top:0; height:1px; background:linear-gradient(90deg,transparent,rgba(201,168,76,.12),transparent) }
.gallery-hdr { padding:0 56px 60px; max-width:1200px; margin:0 auto }
.gallery-grid { display:grid; grid-template-columns:repeat(6,1fr); grid-template-rows:auto; gap:3px; padding:0 3px }
.gc { overflow:hidden; position:relative; cursor:none }
.gc::after { content:''; position:absolute; inset:0; background:rgba(3,3,5,.45); transition:opacity .4s }
.gc:hover::after { opacity:0 }
.gc img,.gc video { width:100%; height:100%; object-fit:cover; display:block; transition:transform .8s cubic-bezier(.16,1,.3,1), filter .5s }
.gc:hover img,.gc:hover video { transform:scale(1.05); filter:brightness(1.1) saturate(1.1) }
.gc .gc-meta { position:absolute; bottom:0; left:0; right:0; padding:18px 14px 12px; background:linear-gradient(to top,rgba(3,3,5,.85),transparent); transform:translateY(100%); transition:transform .4s ease; z-index:2 }
.gc:hover .gc-meta { transform:translateY(0) }
.gc-meta-t { font-family:var(--font-mono),monospace; font-size:7.5px; letter-spacing:.15em; color:var(--td) }
.gc-meta-c { font-size:7px; color:var(--tg); margin-top:3px; font-family:var(--font-mono),monospace }
/* grid slots */
.gc.s1 { grid-column:span 2; height:320px }
.gc.s2 { grid-column:span 1; height:320px }
.gc.s3 { grid-column:span 3; height:320px }
.gc.s4 { grid-column:span 1; height:260px }
.gc.s5 { grid-column:span 2; height:260px }
.gc.s6 { grid-column:span 2; height:260px }
.gc.s7 { grid-column:span 1; height:260px }
/* video strip */
.vid-strip { display:grid; grid-template-columns:repeat(3,1fr); gap:3px; margin-top:3px; padding:0 3px }
.vc { position:relative; overflow:hidden; height:200px }
.vc::after { content:''; position:absolute; inset:0; background:rgba(3,3,5,.35); transition:opacity .4s; pointer-events:none }
.vc:hover::after { opacity:0 }
.vc video { width:100%; height:100%; object-fit:cover; transition:transform .8s cubic-bezier(.16,1,.3,1) }
.vc:hover video { transform:scale(1.04) }
.vc-badge { position:absolute; top:12px; left:12px; font-family:var(--font-mono),monospace; font-size:7px; letter-spacing:.25em; color:rgba(201,168,76,.6); background:rgba(3,3,5,.7); padding:4px 8px; z-index:3; text-transform:uppercase }
.gc.loading,.vc.loading { background:rgba(255,255,255,.02) }
.gc.loading::before,.vc.loading::before { content:''; position:absolute; inset:0; background:linear-gradient(110deg,rgba(255,255,255,.02) 25%,rgba(201,168,76,.04) 50%,rgba(255,255,255,.02) 75%); background-size:200% 100%; animation:shimload 2s linear infinite; z-index:1 }
@keyframes shimload { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── MANIFESTO ── */
.manifesto { position:relative; z-index:2; padding:140px 0; overflow:hidden }
.manifesto::before { content:''; position:absolute; left:50%; transform:translateX(-50%); top:0; width:1px; height:100%; background:linear-gradient(to bottom,transparent,rgba(201,168,76,.07),transparent) }
.mfst-inner { max-width:800px; margin:0 auto; padding:0 56px }
.mfst-entry { margin-bottom:56px }
.mfst-entry h2 { font-family:var(--font-cinzel),serif; font-size:clamp(20px,3.2vw,36px); font-weight:400; color:var(--t); line-height:1.2; margin-bottom:18px }
.mfst-entry h2 em { color:var(--g); font-style:italic; font-family:var(--font-display),serif; font-size:1.1em }
.mfst-entry p { font-size:clamp(14px,1.7vw,17.5px); color:var(--td); line-height:2.2; font-weight:300 }
.mfst-entry p strong { color:var(--t); font-weight:400 }
.mfst-decree { font-family:var(--font-cinzel),serif; font-size:clamp(24px,4.5vw,52px); font-weight:700; line-height:1.2; color:transparent; background:linear-gradient(135deg,var(--gd),var(--g),var(--gb),var(--g)); -webkit-background-clip:text; background-clip:text }

/* ── ARCH + DNA ── */
.dual-section { position:relative; z-index:2; padding:80px 56px 120px; overflow:hidden }
.dual-section::before { content:''; position:absolute; left:0; right:0; top:0; height:1px; background:linear-gradient(90deg,transparent,rgba(201,168,76,.12),transparent) }
.dual-inner { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:start }
.dna-txt h2 { font-family:var(--font-cinzel),serif; font-size:clamp(22px,3vw,36px); font-weight:400; color:var(--t); line-height:1.25; margin-bottom:18px }
.dna-txt p { font-size:clamp(13px,1.5vw,16px); color:var(--td); line-height:2.1; font-weight:300 }
.dna-txt p+p { margin-top:12px }
.dna-dims { font-family:var(--font-mono),monospace; font-size:10.5px; color:var(--tg); line-height:2; letter-spacing:.1em; margin-top:20px }

/* ── PRINCIPLES ── */
.principles { position:relative; z-index:2; padding:0 56px 140px }
.law-inner { max-width:1100px; margin:0 auto }
.law-grid { display:grid; grid-template-columns:1fr 1fr; gap:2px; margin-top:60px }
.law-item { background:rgba(255,255,255,.012); border:1px solid rgba(255,255,255,.02); padding:38px 32px; position:relative; overflow:hidden; transition:background .4s, border-color .4s }
.law-item::before { content:''; position:absolute; left:0; top:0; bottom:0; width:2px; background:var(--g); transform:scaleY(0); transform-origin:top; transition:transform .4s }
.law-item:hover::before { transform:scaleY(1) }
.law-item:hover { background:var(--gg); border-color:rgba(201,168,76,.1) }
.law-n { font-family:var(--font-mono),monospace; font-size:10px; letter-spacing:3px; color:var(--gd); margin-bottom:14px }
.law-t { font-family:var(--font-cinzel),serif; font-size:14px; font-weight:600; color:var(--t); margin-bottom:10px; letter-spacing:.4px; line-height:1.3 }
.law-d { font-size:13.5px; color:var(--td); line-height:1.95; font-weight:300 }

/* ── TIERS ── */
.tiers { position:relative; z-index:2; padding:0 56px 140px }
.tiers-inner { max-width:1100px; margin:0 auto }
.tiers-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:2px; margin-top:60px }
.tier-card { padding:32px 24px; border:1px solid rgba(255,255,255,.03); background:rgba(255,255,255,.008); position:relative; transition:background .3s }
.tier-card:hover { background:rgba(255,255,255,.022) }
.tier-card.feat { border-color:rgba(201,168,76,.18); background:rgba(201,168,76,.025) }
.t-badge { font-family:var(--font-cinzel),serif; font-size:14px; letter-spacing:3px; color:var(--t); margin-bottom:10px }
.t-badge.g { color:var(--g) }
.t-price { font-family:var(--font-mono),monospace; font-size:22px; color:var(--td); margin-bottom:4px }
.t-price span { font-size:10px; letter-spacing:.2em; color:var(--tg) }
.t-note { font-family:var(--font-mono),monospace; font-size:8px; letter-spacing:.18em; color:rgba(201,168,76,.38); margin-bottom:20px }
.t-corner { position:absolute; top:12px; right:12px; font-family:var(--font-mono),monospace; font-size:7px; letter-spacing:.18em; color:rgba(201,168,76,.22) }
.t-feats { list-style:none }
.t-feats li { font-family:var(--font-mono),monospace; font-size:9px; letter-spacing:.1em; color:var(--tg); padding:5px 0; border-bottom:1px solid rgba(255,255,255,.03) }
.t-feats li::before { content:'— '; color:rgba(201,168,76,.3) }

/* ── WAITLIST ── */
.waitlist { position:relative; z-index:2; padding:0 56px 180px; text-align:center }
.wl-inner { max-width:580px; margin:0 auto }
.wl-count { font-family:var(--font-mono),monospace; font-size:10px; letter-spacing:4px; color:rgba(201,168,76,.5); margin-bottom:20px }
.wl-h { font-family:var(--font-cinzel),serif; font-size:clamp(28px,5vw,54px); font-weight:700; color:var(--t); line-height:1.1; margin-bottom:16px }
.wl-h span { color:var(--g) }
.wl-sub { font-family:var(--font-display),serif; font-style:italic; font-size:clamp(14px,1.8vw,18px); color:var(--td); line-height:1.9; margin-bottom:44px }
.wl-form { display:flex; flex-direction:column; gap:1px; max-width:480px; margin:0 auto }
.wl-in,.wl-sel { width:100%; background:rgba(255,255,255,.022); border:1px solid rgba(201,168,76,.14); border-bottom:none; color:var(--t); outline:none; transition:border-color .3s, background .3s }
.wl-in { font-family:var(--font-display),serif; font-size:15px; padding:14px 20px; letter-spacing:.5px }
.wl-in::placeholder { color:var(--tm); font-style:italic }
.wl-in:focus,.wl-sel:focus { border-color:rgba(201,168,76,.42); background:rgba(201,168,76,.03) }
.wl-sel { font-family:var(--font-mono),monospace; font-size:10px; letter-spacing:.15em; padding:14px 20px; -webkit-appearance:none; appearance:none; cursor:none; color:var(--tm) }
.wl-sel.filled { color:var(--td) }
.wl-sel option { background:#111; color:var(--t) }
.wl-btn { width:100%; background:var(--g); border:1px solid var(--g); border-top:none; color:var(--void); font-family:var(--font-cinzel),serif; font-size:11px; font-weight:700; letter-spacing:5px; text-transform:uppercase; padding:17px; cursor:none; transition:all .3s; position:relative; overflow:hidden }
.wl-btn::after { content:''; position:absolute; top:50%; left:-100%; width:100%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent); transform:translateY(-50%); transition:left .45s }
.wl-btn:hover { background:var(--gb); border-color:var(--gb) }
.wl-btn:hover::after { left:110% }
.wl-btn:disabled { opacity:.28; pointer-events:none }
.wl-note { font-family:var(--font-mono),monospace; font-size:9px; letter-spacing:3px; color:var(--tg); margin-top:18px }
.wl-err { font-family:var(--font-mono),monospace; font-size:9px; letter-spacing:2px; color:rgba(220,80,80,.7); margin-top:10px }
.wl-ok { padding:48px; border:1px solid rgba(201,168,76,.2); background:var(--gg); position:relative; overflow:hidden; display:none }
.wl-ok::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 50% 0%,rgba(201,168,76,.1),transparent 55%); pointer-events:none }
.wl-ok.show { display:block }
.wl-ok-num { font-family:var(--font-cinzel),serif; font-size:clamp(56px,10vw,96px); font-weight:900; color:var(--g); line-height:1; margin-bottom:14px; text-shadow:0 0 60px rgba(201,168,76,.3) }
.wl-ok-line { font-family:var(--font-display),serif; font-style:italic; font-size:19px; color:var(--td); line-height:1.75 }

/* ── ORIGIN ── */
.origin { position:relative; z-index:2; border-top:1px solid rgba(201,168,76,.05); padding:140px 56px; text-align:center; overflow:hidden }
.origin-glow { position:absolute; width:640px; height:400px; top:50%; left:50%; transform:translate(-50%,-50%); border-radius:50%; background:radial-gradient(ellipse,rgba(201,168,76,.06) 0%,transparent 60%); animation:oglow 8s ease-in-out infinite; pointer-events:none }
@keyframes oglow { 0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.25)} }
.origin-text { font-family:var(--font-display),serif; font-style:italic; font-size:clamp(16px,1.8vw,21px); color:var(--tg); letter-spacing:1px; line-height:2.7; position:relative; z-index:1 }
.origin-text strong { color:rgba(201,168,76,.75); font-style:normal; font-weight:400 }
.origin-sig { font-family:var(--font-cinzel),serif; font-size:11px; letter-spacing:5px; color:var(--gd); margin-top:48px; position:relative; z-index:1 }

/* ── FOOTER ── */
footer { position:relative; z-index:2; border-top:1px solid rgba(255,255,255,.02); padding:36px 56px; display:flex; justify-content:space-between; align-items:center }
.f-mark { font-family:var(--font-cinzel),serif; font-size:11px; letter-spacing:6px; color:var(--gd) }
.f-note { font-family:var(--font-mono),monospace; font-size:9px; letter-spacing:3px; color:var(--tg); text-transform:uppercase }

/* ── KEYFRAMES ── */
@keyframes fadeup { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes titleReveal { 0%{opacity:0;transform:scale(.92) translateY(22px);filter:blur(16px)} 100%{opacity:1;transform:scale(1) translateY(0);filter:blur(0)} }
@keyframes shimmer { 0%{left:-120%} 28%{left:200%} 100%{left:200%} }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes blink2 { 0%,100%{opacity:.45} 50%{opacity:1} }
@keyframes spulse { 0%,100%{opacity:.35;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(1.18)} }
@keyframes spulse2 { 0%,100%{opacity:1} 50%{opacity:.3} }

/* ── RESPONSIVE ── */
@media(max-width:1000px){ .sensory-inner,.dual-inner{grid-template-columns:1fr;gap:48px} .gallery-grid{grid-template-columns:repeat(3,1fr)} .gc.s1,.gc.s2,.gc.s3,.gc.s4,.gc.s5,.gc.s6,.gc.s7{grid-column:span 1;height:200px} .vid-strip{grid-template-columns:1fr 1fr} .tiers-grid{grid-template-columns:1fr 1fr} }
@media(max-width:768px){ nav{padding:20px 24px} .n-status{display:none} .problem,.manifesto,.sensory,.gallery,.dual-section,.principles,.tiers,.waitlist,.origin{padding-left:24px;padding-right:24px} .gallery-grid,.vid-strip{grid-template-columns:1fr 1fr} .law-grid,.tiers-grid{grid-template-columns:1fr} .stats-inner{grid-template-columns:repeat(2,1fr)} footer{flex-direction:column;gap:12px;text-align:center;padding:24px} .hud-corner,.hud-label{display:none} .demo-panel{display:none} }
`

// ── DRIVE URLS ──
// IMPORTANT: Go to Google Drive → Right-click "Shadow Gallery" → Share → Anyone with link (Viewer)
// Then these URLs will work publicly. Format: https://drive.google.com/uc?export=view&id={ID}
const GD = (id: string) => `https://drive.google.com/uc?export=view&id=${id}`
const GDT = (id: string, w=1280) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`

// Gallery photos (selected highest quality)
const PHOTOS = [
  { id:'1RWq2dNH6vdjF0GJ8TVMKRw5LinmnIYBY', title:'Autumn Impermanence', cat:'Fine Art · Kyoto' },
  { id:'1IY5OOrFQVg2ZeJqk7DdNSVZgT8KBpqe5', title:'Still Frame Study', cat:'Documentary' },
  { id:'14H6hOpZVlGTvdmFTe68YTeiL8HJVC-e5', title:'Golden Hour Fragment', cat:'Nature · Global' },
  { id:'10Tzxs021QjZiHl8gcpLDovoxLhf7Yqiw', title:'Void Architecture III', cat:'Architecture' },
  { id:'1ySZ58y28COT_inQ7PrjQviM7nvH6z9l0', title:'Last Light On Stone', cat:'Architecture · Tbilisi' },
  { id:'1lLQ1ArUrf0ry9-KcrZVy8Vs4oYAejQ5f', title:'Rust Speaks', cat:'Still Life · Barcelona' },
  { id:'1GHCBZL2GS09eYYNlljxtBKph52K31-FR', title:'Picasso & The Peace', cat:'Cultural · Paris' },
  { id:'1d2V_DgvJ55E4z-GflKW1V2rIFbbTLiYm', title:'Signal & Noise', cat:'Abstract · Seoul' },
  { id:'1kk5DdaBxguorhfazyEWCfYdpqJTtOZBX', title:'Deep Urban Study', cat:'Street · Tokyo' },
  { id:'1pkxzvdaclf9jg8MEu7Tpmre6-p8icd9K', title:'Texture of Silence', cat:'Macro · Oslo' },
  { id:'1uLr-cxB7a6A-KyfiNFLauLx_46h_J544', title:'Ancient Futures II', cat:'Historical' },
  { id:'1CDrnDZae2zAPMluFg6vYp9jDOWfY3kGS', title:'Before The Hour', cat:'Documentary · Lagos' },
]

// Videos (largest = best quality)
const VIDEOS = [
  { id:'1jD4e771Ix-8Vqgy6djuka6eRlDse_0KC', label:'AESTHETIC · 001' },
  { id:'1hODlmnuiI_ieQTwoeKkWMEVaP_VTnnGo', label:'AESTHETIC · 002' },
  { id:'1KMGdtK7MxQYGh98rbJpBqMEcF33QLme3', label:'AESTHETIC · 003' },
  { id:'1aHaLgAKp5qjZOzHl6k8E3a471gknuAig', label:'AESTHETIC · 004' },
  { id:'11Y8ypbRTRpzTTh6EKIlX252MbFjVgwNX', label:'AESTHETIC · 005' },
  { id:'1Fkp8kEGiFZE25IRMmWL-PQQkNaJNiC3A', label:'AESTHETIC · 006' },
]

// Sensory moods
const MOODS = [
  { q:'silence before storm', bg:'linear-gradient(160deg,#020210,#080820)', acc:'rgba(70,80,220,.5)', dot:'#4850dc', status:'DEEP_INDIGO',
    cards:[{t:'The Hour Before Rain',c:'Fine Art · Tokyo',bg:'url(https://drive.google.com/thumbnail?id=10Tzxs021QjZiHl8gcpLDovoxLhf7Yqiw&sz=w400) center/cover no-repeat'},{t:'Void Architecture II',c:'Architecture · Oslo',bg:'url(https://drive.google.com/thumbnail?id=1d2V_DgvJ55E4z-GflKW1V2rIFbbTLiYm&sz=w400) center/cover no-repeat'},{t:'Static & Breath',c:'Abstract · Seoul',bg:'url(https://drive.google.com/thumbnail?id=1cZX0ONwiu-LxTANH3-5oRwspvzX3uA5T&sz=w400) center/cover no-repeat'}]},
  { q:'brutalist tokyo neon', bg:'linear-gradient(160deg,#0b020f,#180520)', acc:'rgba(180,40,220,.5)', dot:'#a030c8', status:'ULTRA_VIOLET',
    cards:[{t:'Shinjuku After Midnight',c:'Urban · Tokyo',bg:'url(https://drive.google.com/thumbnail?id=1uLr-cxB7a6A-KyfiNFLauLx_46h_J544&sz=w400) center/cover no-repeat'},{t:'Concrete Cathedral',c:'Architecture · Osaka',bg:'url(https://drive.google.com/thumbnail?id=1IY5OOrFQVg2ZeJqk7DdNSVZgT8KBpqe5&sz=w400) center/cover no-repeat'},{t:'Neon Entropy Vol.7',c:'Abstract · Kyoto',bg:'url(https://drive.google.com/thumbnail?id=1Ec3-kwgqbmYeE8Gvmq7jmxH5PO4nRfdw&sz=w400) center/cover no-repeat'}]},
  { q:'wabi-sabi golden dusk', bg:'linear-gradient(160deg,#0f0906,#1e1108)', acc:'rgba(201,168,76,.5)', dot:'#c9a84c', status:'AMBER_DUSK',
    cards:[{t:'Autumn Impermanence',c:'Nature · Kyoto',bg:'url(https://drive.google.com/thumbnail?id=1RWq2dNH6vdjF0GJ8TVMKRw5LinmnIYBY&sz=w400) center/cover no-repeat'},{t:'The Rust Speaks',c:'Still Life · Barcelona',bg:'url(https://drive.google.com/thumbnail?id=1SSOuHR17oe22ps0QF5xmTeNTTtN5zeNd&sz=w400) center/cover no-repeat'},{t:'Last Light on Stone',c:'Architecture · Tbilisi',bg:'url(https://drive.google.com/thumbnail?id=1JNLVebe-D2fiJCKRoqtBXGuYEG7VUac1&sz=w400) center/cover no-repeat'}]},
  { q:'ghost in the machine', bg:'linear-gradient(160deg,#020c10,#041622)', acc:'rgba(30,190,220,.45)', dot:'#1ebedd', status:'CYAN_GHOST',
    cards:[{t:'Signal & Noise III',c:'Digital Art · Global',bg:'url(https://drive.google.com/thumbnail?id=1GHCBZL2GS09eYYNlljxtBKph52K31-FR&sz=w400) center/cover no-repeat'},{t:'Synthetic Memory',c:'Concept · Seoul',bg:'url(https://drive.google.com/thumbnail?id=1-eIn-hi8zZRrOWC5Ejq-tjqVn44tTAhw&sz=w400) center/cover no-repeat'},{t:'Data as Elegy',c:'Mixed Media · Berlin',bg:'url(https://drive.google.com/thumbnail?id=1xMqFreZ2vqQj6bvdISqhUKO4iyrP_YcD&sz=w400) center/cover no-repeat'}]},
]

const AFFINITIES = [
  {value:'shadow_noir',    label:'Shadow Noir — Dark. Cinematic. Absolute.'},
  {value:'luminous_void',  label:'Luminous Void — Minimal. Ethereal. Still.'},
  {value:'ancient_futures',label:'Ancient Futures — History meets the horizon.'},
  {value:'brutalist',      label:'Brutalist Harmony — Raw form. Raw truth.'},
  {value:'wabi_sabi',      label:'Wabi-Sabi — Imperfect. Transient. Beautiful.'},
  {value:'digital_sublime',label:'Digital Sublime — Code as art. Light as signal.'},
  {value:'global_roots',   label:'Global Roots — Every culture. Every terrain.'},
]

const BOOT = [
  'UMBRA_OS .................. INIT',
  'AESTHETIC_ENGINE .......... LOADING',
  'GOD_ANALYTICS ............. LINK_OK',
  'SHADOW_LIBRARY ............ ONLINE',
  'SOVEREIGN_CORE ............ VERIFIED',
  'ENTERING_THE_DARK .........',
]

// ── SENSORY DEMO ──
function SensoryDemo() {
  const [mi,setMi]=useState(0)
  const [typed,setTyped]=useState('')
  const [phase,setPhase]=useState<'typing'|'hold'|'scanning'|'showing'|'fade'>('typing')
  const [cards,setCards]=useState([false,false,false])

  useEffect(()=>{
    const m=MOODS[mi]
    if(phase==='typing'){
      if(typed.length<m.q.length){const t=setTimeout(()=>setTyped(m.q.slice(0,typed.length+1)),65);return()=>clearTimeout(t)}
      else{const t=setTimeout(()=>setPhase('hold'),600);return()=>clearTimeout(t)}
    }
    if(phase==='hold'){const t=setTimeout(()=>setPhase('scanning'),400);return()=>clearTimeout(t)}
    if(phase==='scanning'){
      const t=setTimeout(()=>{setPhase('showing');setCards([false,false,false]);
        setTimeout(()=>setCards(c=>[true,c[1],c[2]]),80)
        setTimeout(()=>setCards(c=>[c[0],true,c[2]]),260)
        setTimeout(()=>setCards(c=>[c[0],c[1],true]),440)
      },1100);return()=>clearTimeout(t)}
    if(phase==='showing'){const t=setTimeout(()=>setPhase('fade'),2600);return()=>clearTimeout(t)}
    if(phase==='fade'){const t=setTimeout(()=>{setCards([false,false,false]);setTyped('');setMi(i=>(i+1)%MOODS.length);setPhase('typing')},900);return()=>clearTimeout(t)}
  },[phase,typed,mi])

  const m=MOODS[mi]
  return(
    <div className="demo-panel" style={{borderColor:m.acc}}>
      <div className="demo-bar">
        <div className="db-dot r"/><div className="db-dot y"/><div className="db-dot g"/>
        <span className="db-title">umbra://sensory_engine</span>
      </div>
      <div className="demo-body" style={{background:m.bg}}>
        <div className="demo-row" style={{borderColor:m.acc}}>
          <div className="dr-pre" style={{color:m.dot}}>&#9670;</div>
          <input className="dr-in" readOnly value={typed}/>
          {phase==='typing'&&typed.length<m.q.length&&<span className="blink" style={{padding:'11px 4px',color:m.dot,fontFamily:'monospace',fontSize:13}}>|</span>}
          <div className={`dr-btn${phase==='scanning'?' scanning':''}`} style={{color:m.dot,borderColor:m.acc}}>
            {phase==='scanning'?'SCAN':'ENTER'}
          </div>
        </div>
        <div className="demo-status">
          <div className="ds-dot" style={{background:m.dot,boxShadow:`0 0 6px ${m.dot}`}}/>
          <span className="ds-txt" style={{color:m.dot}}>
            {phase==='typing'?'AWAITING_QUERY'
              :phase==='scanning'?'SCANNING_LIBRARY...'
              :phase==='showing'?`MOOD:${m.status} // ${m.cards.length} RESULTS`
              :'CLEARING...'}
          </span>
        </div>
        <div className="demo-cards">
          {m.cards.map((c,i)=>(
            <div key={`${mi}-${i}`} className={`demo-card${cards[i]?' show':''}`} style={{transitionDelay:`${i*.12}s`}}>
              <div className="dc-img" style={{background:c.bg}}/>
              <div className="dc-info">
                <div className="dc-ttl">{c.t}</div>
                <div className="dc-cat">{c.c}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="demo-foot">AESTHETIC_SCORE: 0.97 &nbsp;·&nbsp; SENSORY_MATCH: HIGH</div>
      </div>
    </div>
  )
}

// ── ARCH DIAGRAM ──
function ArchDiagram(){
  return(
    <svg viewBox="0 0 820 580" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'auto',overflow:'visible'}}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0,2 L8,5 L0,8 Z" fill="rgba(201,168,76,.3)"/>
        </marker>
        <filter id="glow2"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {[[410,84,410,152],[410,222,170,292],[410,222,410,292],[410,222,650,292],[170,362,280,440],[410,362,410,440],[650,362,540,440]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(201,168,76,.14)" strokeWidth="1" strokeDasharray="5 4" markerEnd="url(#arr)"/>
      ))}
      {['M410,84 L410,152','M410,222 L170,292','M410,222 L410,292','M410,222 L650,292'].map((p,i)=>(
        <circle key={i} r="2.5" fill={`rgba(201,168,76,${.65-i*.07})`}>
          <animateMotion dur={`${1.8+i*.3}s`} repeatCount="indefinite" path={p}/>
        </circle>
      ))}
      {/* SOVEREIGN */}
      <rect x="270" y="24" width="280" height="60" rx="1" fill="rgba(201,168,76,.065)" stroke="rgba(201,168,76,.4)" strokeWidth="1" filter="url(#glow2)"/>
      <rect x="270" y="24" width="3" height="60" fill="rgba(201,168,76,.55)"/>
      <text x="410" y="48" textAnchor="middle" fill="#c9a84c" fontFamily="Cinzel,serif" fontSize="11" letterSpacing="4">SOVEREIGN</text>
      <text x="410" y="67" textAnchor="middle" fill="rgba(201,168,76,.5)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing="2">REY TEMPEST · TEMPEST GROUP</text>
      {/* AI SYSTEM */}
      <rect x="210" y="152" width="400" height="70" rx="1" fill="rgba(255,255,255,.015)" stroke="rgba(255,255,255,.045)" strokeWidth="1"/>
      <text x="410" y="177" textAnchor="middle" fill="#d0d0e0" fontFamily="Cinzel,serif" fontSize="10" letterSpacing="3">AI SOVEREIGN SYSTEM</text>
      <text x="410" y="194" textAnchor="middle" fill="rgba(160,160,190,.6)" fontFamily="Courier Prime,monospace" fontSize="7.5" letterSpacing="1.5">AESTHETIC ENGINE · GOD ANALYTICS · VISION CORE</text>
      <text x="410" y="210" textAnchor="middle" fill="rgba(201,168,76,.28)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="1.5">STATUS: ONLINE — NO EGO — NO FATIGUE — 24/7</text>
      {/* 3 modules */}
      {[{x:60,cx:170,t:'THE LIBRARY',s1:'Aesthetic assets · CC0 + licensed',s2:'No floor drop. Ever.'},{x:300,cx:410,t:'SIGNAL RADIO',s1:'Ambient broadcast · live · curated',s2:'Free at ACCESS tier'},{x:540,cx:650,t:'THE BLOCK',s1:'Limited auctions · expiry dates',s2:'Scarcity as design principle'}].map((m,i)=>(
        <g key={i}>
          <rect x={m.x} y="292" width="220" height="70" rx="1" fill="rgba(255,255,255,.013)" stroke="rgba(255,255,255,.035)" strokeWidth="1"/>
          <text x={m.cx} y="319" textAnchor="middle" fill="#c9a84c" fontFamily="Cinzel,serif" fontSize="9" letterSpacing="2.5">{m.t}</text>
          <text x={m.cx} y="337" textAnchor="middle" fill="rgba(160,160,190,.55)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="1.5">{m.s1}</text>
          <text x={m.cx} y="352" textAnchor="middle" fill="rgba(201,168,76,.28)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="1.5">{m.s2}</text>
        </g>
      ))}
      {/* THE WORLD */}
      <rect x="240" y="440" width="340" height="70" rx="1" fill="rgba(255,255,255,.01)" stroke="rgba(201,168,76,.1)" strokeWidth="1"/>
      <text x="410" y="467" textAnchor="middle" fill="rgba(201,168,76,.6)" fontFamily="Cinzel,serif" fontSize="10" letterSpacing="3">THE WORLD</text>
      <text x="410" y="484" textAnchor="middle" fill="rgba(160,160,190,.5)" fontFamily="Courier Prime,monospace" fontSize="7.5" letterSpacing="1.5">Users · Creators · Subscribers</text>
      <text x="410" y="500" textAnchor="middle" fill="rgba(201,168,76,.22)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="1.5">ACCESS · NOIR · PRESTIGE · OBSIDIAN</text>
    </svg>
  )
}

type FStat = 'idle'|'loading'|'success'|'error'

export default function Page(){
  const [bootStep,setBoot]=useState(-1)
  const [wmShow,setWm]=useState(false)
  const [lifted,setLifted]=useState(false)
  const [eyebrow,setEy]=useState('')
  const [form,setForm]=useState({name:'',email:'',aesthetic_affinity:''})
  const [fstat,setFstat]=useState<FStat>('idle')
  const [pos,setPos]=useState<number|null>(null)
  const [count,setCount]=useState<number|null>(null)
  const [ferr,setFerr]=useState('')
  const cursorRef=useRef<HTMLDivElement>(null)
  const ptclRef=useRef<HTMLCanvasElement>(null)
  const trailRef=useRef<HTMLCanvasElement>(null)
  const statRefs=useRef<(HTMLElement|null)[]>([])
  const EY='The World\'s Aesthetic Intelligence. Not a Feed.'

  // Boot
  useEffect(()=>{
    const ts:ReturnType<typeof setTimeout>[]=[]
    BOOT.forEach((_,i)=>ts.push(setTimeout(()=>setBoot(i),260+i*320)))
    ts.push(setTimeout(()=>setWm(true),260+BOOT.length*320))
    ts.push(setTimeout(()=>setLifted(true),260+BOOT.length*320+1500))
    return()=>ts.forEach(clearTimeout)
  },[])

  // Typewriter
  useEffect(()=>{if(!lifted)return;
  const [wCount, setWCount] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{
    fetch('/api/waitlist/count').then(r=>r.json()).then(d=>setWCount(d.count||0)).catch(()=>{})
  },[])let i=0;
  const [wCount, setWCount] = useState(0)
  useEffect(()=>{
    fetch('/api/waitlist/count').then(r=>r.json()).then(d=>setWCount(d.count||0)).catch(()=>{})
  },[])const id=setInterval(()=>{setEy(EY.slice(0,i+1));i++;if(i>=EY.length)clearInterval(id)},40);return()=>clearInterval(id)},[lifted])

  // Count
  useEffect(()=>{fetch('/api/waitlist/count').then(r=>r.json()).then(d=>{if(d.count!==undefined)setCount(d.count)}).catch(()=>{})},[])

  // Cursor + particles + scrollytelling
  useEffect(()=>{
    if(!lifted)return
    const cursor=cursorRef.current
    const ptcl=ptclRef.current
    const trail=trailRef.current
    if(!cursor||!ptcl||!trail)return
    const pc=ptcl.getContext('2d')!
    const tc=trail.getContext('2d')!
    let W=0,H=0
    const resize=()=>{W=ptcl.width=trail.width=window.innerWidth;H=ptcl.height=trail.height=window.innerHeight}
    resize();window.addEventListener('resize',resize)
    let mx=0,my=0
    const pts:{x:number;y:number;t:number}[]=[]
    const mv=(e:MouseEvent)=>{mx=e.clientX;my=e.clientY;cursor.style.left=mx+'px';cursor.style.top=my+'px';pts.push({x:mx,y:my,t:Date.now()});if(pts.length>40)pts.shift()}
    document.addEventListener('mousemove',mv)
    const addHov=()=>document.body.classList.add('hov')
    const rmHov=()=>document.body.classList.remove('hov')
    document.querySelectorAll('a,button,input,select,.law-item,.tier-card,.gc,.vc').forEach(el=>{el.addEventListener('mouseenter',addHov);el.addEventListener('mouseleave',rmHov)})

    // Particles
    class P{x=0;y=0;sz=0;vx=0;vy=0;o=0;to=0;life=0;max=0
      constructor(){this.reset(true)}
      reset(init:boolean){this.x=Math.random()*W;this.y=init?Math.random()*H:H+10;this.sz=Math.random()*1.6+.3;this.vy=-(Math.random()*.36+.12);this.vx=(Math.random()-.5)*.18;this.o=0;this.to=Math.random()*.36+.06;this.life=0;this.max=Math.random()*450+200}
      tick(){this.x+=this.vx;this.y+=this.vy;this.life++;if(this.life<60)this.o=(this.life/60)*this.to;else if(this.life>this.max-60)this.o=((this.max-this.life)/60)*this.to;if(this.life>=this.max||this.y<-10)this.reset(false)}
      draw(){pc.save();pc.globalAlpha=this.o;pc.fillStyle='#c9a84c';pc.shadowColor='#c9a84c';pc.shadowBlur=7;pc.beginPath();pc.arc(this.x,this.y,this.sz,0,Math.PI*2);pc.fill();pc.restore()}
    }
    const ps:P[]=Array.from({length:100},()=>new P())

    // Connections
    let aid=0,tid=0
    const animP=()=>{
      pc.clearRect(0,0,W,H)
      for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const dx=ps[i].x-ps[j].x,dy=ps[i].y-ps[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<100){pc.beginPath();pc.strokeStyle=`rgba(201,168,76,${(1-d/100)*.055})`;pc.lineWidth=.5;pc.moveTo(ps[i].x,ps[i].y);pc.lineTo(ps[j].x,ps[j].y);pc.stroke()}}
      ps.forEach(p=>{p.tick();p.draw()})
      aid=requestAnimationFrame(animP)
    }
    aid=requestAnimationFrame(animP)

    // Trail
    const animT=()=>{
      tc.clearRect(0,0,W,H)
      const now=Date.now()
      const fresh=pts.filter(p=>now-p.t<350)
      if(fresh.length>1){
        for(let i=1;i<fresh.length;i++){
          const age=(now-fresh[i].t)/350
          tc.beginPath();tc.arc(fresh[i].x,fresh[i].y,(1-age)*5,0,Math.PI*2)
          tc.fillStyle=`rgba(201,168,76,${(1-age)*.45})`;tc.shadowBlur=12;tc.shadowColor='rgba(201,168,76,.3)';tc.fill()
        }
      }
      tid=requestAnimationFrame(animT)
    }
    tid=requestAnimationFrame(animT)

    // Scroll reveals
    const obs=new IntersectionObserver(e=>{e.forEach(en=>{if(en.isIntersecting){(en.target as HTMLElement).classList.add('vis');(en.target as HTMLElement).classList.add('visible')}})},{threshold:.08,rootMargin:'0px 0px -30px 0px'})
    document.querySelectorAll('.sr,.sr2,.sr3,.sdv,.sn,.wr').forEach(el=>obs.observe(el))
    document.querySelectorAll<HTMLElement>('.law-item').forEach((el,i)=>{el.style.transitionDelay=`${i*.07}s`})
    document.querySelectorAll<HTMLElement>('.tier-card').forEach((el,i)=>{el.style.transitionDelay=`${i*.1}s`})
    document.querySelectorAll<HTMLElement>('.gc').forEach((el,i)=>{el.style.transitionDelay=`${i*.06}s`})
    document.querySelectorAll<HTMLElement>('.vc').forEach((el,i)=>{el.style.transitionDelay=`${i*.08}s`})
    // Word reveal for .wr
    document.querySelectorAll('.wr').forEach(el=>{
      const txt=el.textContent||''
      el.innerHTML=txt.split(' ').map((w,i)=>`<span style="transition-delay:${.05+i*.04}s">${w} </span>`).join('')
    })

    // Stats counter
    const countUp=(el:HTMLElement,target:number,suffix:string='')=>{
      let cur=0;const step=target/60;const id=setInterval(()=>{cur+=step;if(cur>=target){cur=target;clearInterval(id)};el.textContent=Math.floor(cur).toLocaleString()+suffix},25)
    }
    const statObs=new IntersectionObserver(e=>{e.forEach(en=>{if(en.isIntersecting){const el=en.target as HTMLElement;const t=parseInt(el.getAttribute('data-target')||'0');const s=el.getAttribute('data-suffix')||'';countUp(el,t,s);statObs.unobserve(el)}})},{threshold:.3})
    document.querySelectorAll('.stat-num').forEach(el=>statObs.observe(el))

    return()=>{document.removeEventListener('mousemove',mv);cancelAnimationFrame(aid);cancelAnimationFrame(tid);window.removeEventListener('resize',resize);obs.disconnect();statObs.disconnect()}
  },[lifted])

  const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const submit=useCallback(async(e?:React.FormEvent)=>{
    if(e)e.preventDefault()
    if(!form.email||!form.aesthetic_affinity||fstat==='loading')return
    setFstat('loading');setFerr('')
    try{
      const r=await fetch('/api/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:form.name,email:form.email,aesthetic_affinity:form.aesthetic_affinity})})
      const d=await r.json()
      if(r.status===409){setFstat('success');setPos(d.position);return}
      if(!r.ok)throw new Error(d.error||'The shadow rejected this entry.')
      setFstat('success');setPos(d.position)
    }catch(e:unknown){setFstat('error');setFerr(e instanceof Error?e.message:'An error occurred.')}
  },[form,fstat])

  const canSub=form.email&&form.aesthetic_affinity&&fstat!=='loading'
  const SLOTS=[{s:'s1'},{s:'s2'},{s:'s3'},{s:'s4'},{s:'s5'},{s:'s6'},{s:'s7'},{s:'s1'}]

  return(
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>

      {/* BOOT CURTAIN */}
      <div id="curtain" className={lifted?'up':''}>
        <div className="boot-wrap">
          {BOOT.map((line,i)=>(
            <div key={i} className={`bl${bootStep>=i?' on':''}${i===BOOT.length-1&&bootStep>=i?' last':''}`}>{line}</div>
          ))}
        </div>
        <div className={`c-mark${wmShow?' show':''}`}>UMBRA</div>
        <div className={`c-sub${wmShow?' show':''}`}>Aesthetic Intelligence. Uncompromising.</div>
      </div>

      {/* NEXUS CURSOR */}
      <div id="cursor" ref={cursorRef}>
        <div className="nx-ring nx-r1"/>
        <div className="nx-ring nx-r2"><div className="nx-r2-seg"/></div>
        <div className="nx-ring nx-r3"/>
        <div className="nx-diamond"/>
        <div className="nx-cross"/>
        <div className="nx-dot"/>
      </div>
      <canvas ref={trailRef} id="trail"/>

      <div className="vignette"/>
      <canvas ref={ptclRef} id="ptcl"/>

      {/* NAV */}
      <nav>
        <a href="#" className="n-mark">UMBRA</a>
        <div className="n-links">
          <a href="#problem">Manifesto</a>
          <a href="#engine">Sensory Engine</a>
          <a href="#gallery">Gallery</a>
          <a href="#tiers">Access</a>
          <a href="#waitlist">Enter</a>
        </div>
        <div className="n-status"><div className="n-dot"/><span>SOVEREIGN ONLINE</span></div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="hero">
        <div className="scanlines"/>
        <div className="hud-corner tl"/><div className="hud-corner tr"/>
        <div className="hud-corner bl"/><div className="hud-corner br"/>
        <div className="hud-label a">AESTHETIC_ENGINE: ONLINE</div>
        <div className="hud-label b">SHADOW_LIBRARY: ACTIVE</div>
        <div className="hud-label c">SOVEREIGN: VERIFIED</div>
        <div className="eyebrow">{eyebrow}</div>
        <div className="hero-wordmark">
          <h1 className="logo">UMBRA</h1>
          <div className="logo-shimmer"/>
        </div>
        <div className="hero-tags">
          {['Dark','Luminous','Global','Uncompromising','Precise'].map((t,i)=>(
            <div key={t} className={`htag${i===0||i===2?'  lit':''}`}>{t}</div>
          ))}
        </div>
        <p className="hero-kicker">
          Not a platform. Not a feed. Not a library.<br/>
          <em>A world governed by a single aesthetic law.</em>
        </p>
        <div className="hero-rule"/>
        <div className="scroll-hint"><span>Descend</span><div className="scroll-line"/></div>
      </section>

      {/* ══ STATS BAND ══ */}
      <div className="stats-band sr">
        <div className="stats-inner">
          {[{t:'7',s:'AESTHETIC TERRITORIES',d:7,sx:''},{t:'72+',s:'SHADOW GALLERY ASSETS',d:72,sx:'+'},{t:String(wCount),s:'SHADOW MEMBERS',d:wCount,sx:''},{t:'0',s:'ALGORITHMIC COMPROMISES',d:0,sx:''}].map(item=>(
            <div key={item.s} className="stat-item">
              <div className="stat-num" data-target={item.d} data-suffix={item.sx}>{item.t}</div>
              <div className="stat-label">{item.s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ PROBLEM ══ */}
      <section className="problem" id="problem">
        <div className="problem-inner">
          <div className="sec-label sr2">The Indictment</div>
          {[
            {h:<>The internet was handed a mandate: <em>democratize beauty.</em></>,p:"It chose engagement instead. Engagement chose the algorithm. The algorithm chose whatever kept you scrolling longest. What survived twenty years of that decision was a billion assets optimized for nothing except surviving the feed. Beauty was not a casualty. It was a design choice — one made without you."},
            {h:<>The platforms that tried to build aesthetic layers <em>always sold them.</em></>,p:"The pressure always wins. The floor always drops. Except on platforms built around the refusal to let it. UMBRA's architecture is the refusal. Not a feature added on top. The entire structure."},
            {h:<>Seoul has light the West hasn't named yet. <em>This is core product.</em></>,p:"Tbilisi has geometry European schools will theorize in thirty years. Lagos has texture New York galleries will pay fortunes to reproduce in forty. The world does not orbit a default culture. UMBRA was built knowing this — sourcing everywhere with one honest bar, no dilution, no tokenism."},
          ].map((item,i)=>(
            <div key={i} className="mfst-entry sr" style={{transitionDelay:`${i*.15}s`}}>
              <h2 className="p-stmt">{item.h}</h2>
              <p className="p-body">{item.p}</p>
              {i<2&&<div className="rule-x sdv" style={{transitionDelay:`${i*.15+.2}s`}}/>}
            </div>
          ))}
        </div>
      </section>

      {/* ══ SENSORY ENGINE ══ */}
      <section className="sensory" id="engine">
        <div className="sensory-inner">
          <div className="sense-txt sr3">
            <div className="sec-label">The Sensory Engine</div>
            <h2>You type a frequency.<br/><em>The library answers it.</em></h2>
            <p>Every search engine alive works the same way: you type a word, it finds words near it, it calls this intelligence. UMBRA does not do this.</p>
            <p style={{marginTop:14}}>When you type <strong style={{color:'var(--t)'}}>&#x201C;silence before a storm&#x201D;</strong> — the interface becomes that atmospheric density. The particles shift frequency. What surfaces was not retrieved by keyword proximity. It was <strong style={{color:'var(--t)'}}>summoned by aesthetic resonance.</strong></p>
            <div className="sense-bullet" style={{marginTop:28}}>
              <div className="sb-n">01</div>
              <div className="sb-t">TYPE MOODS, TEXTURES, SENSATIONS — NOT KEYWORDS</div>
            </div>
            <div className="sense-bullet">
              <div className="sb-n">02</div>
              <div className="sb-t">THE INTERFACE BREATHES THE AESTHETIC IN REAL TIME</div>
            </div>
            <div className="sense-bullet">
              <div className="sb-n">03</div>
              <div className="sb-t">RESULTS CURATED FOR TRUTH — NOT ENGAGEMENT SCORE</div>
            </div>
          </div>
          <div className="sr" style={{transitionDelay:'.2s'}}><SensoryDemo/></div>
        </div>
      </section>

      {/* ══ GALLERY ══ */}
      
        {/* Gallery */}
        <Gallery />


      {/* ══ MANIFESTO ══ */}
      <section className="manifesto">
        <div className="mfst-inner">
          <div className="sec-label sr2">The Manifesto</div>
          {[
            {h:<>You cannot algorithm your way to <em>a point of view.</em></>,p:"Every platform that has tried to build a curated aesthetic layer has eventually sacrificed it for growth. The pressure always wins. The floor always drops. Except on platforms built around the refusal to let it. UMBRA's architecture is the refusal. Not a feature. The entire structure."},
            {h:<>The library is a conscience. <em>Not a warehouse.</em></>,p:"Every asset that enters UMBRA is interrogated — not for likes, not for reach, not for trending velocity. For one thing: does it earn its place? The answer is binary. Yes, it passes. No, it doesn't exist here. The interrogation never stops. The standard never negotiates."},
            {h:<>Scarcity is not a marketing trick. <em>It is a philosophical position.</em></>,p:"When The Block runs an auction, the asset expires. When it's gone, it's gone. This is not artificial urgency. This is the platform saying: what is limited is respected. What you could download infinitely, you never valued. What you almost missed, you remember."},
            {h:<>UMBRA earns your return. <em>It will not perform for it.</em></>,p:"There are no push notifications. No re-engagement campaigns. No streak mechanics. No dark patterns dressed as features. You leave. You come back when it serves you. The confidence to not chase is the brand itself. Platforms that beg for attention reveal they have nothing worth returning to."},
            {h:<>One mind holds the vision. <em>An AI holds the library.</em></>,p:"The AI curates: sorting, tagging, scheduling, broadcasting — without ego, without fatigue, without the temptation to compromise for traffic spikes. The Sovereign overrides when the vision demands it. This is not a startup optimizing for growth. This is a new kind of institution — one where the curation outlasts any single news cycle."},
          ].map((item,i)=>(
            <div key={i}>
              <div className="mfst-entry sr" style={{transitionDelay:`${i*.12}s`}}>
                <h2>{item.h}</h2>
                <p>{item.p}</p>
              </div>
              {i<4&&<div className="rule-x sdv" style={{transitionDelay:`${i*.12+.25}s`}}/>}
            </div>
          ))}
          <div className="mfst-decree sr" style={{marginTop:56,fontSize:'clamp(24px,4.5vw,52px)',fontWeight:700}}>
            What is limited is respected.<br/>
            What is rare is real.<br/>
            What is beautiful — belongs.
          </div>
        </div>
      </section>

      {/* ══ ARCH + DNA ══ */}
      <section className="dual-section">
        <div className="dual-inner">
          <div>
            <div className="sec-label sr2">System Architecture</div>
            <div className="sr" style={{transitionDelay:'.1s'}}><ArchDiagram/></div>
          </div>
          <div>
            <div className="sec-label sr2">Aesthetic Spectrum</div>
            <div className="dna-txt sr" style={{marginBottom:32}}>
              <h2>Seven dimensions.<br/>One standard.</h2>
              <p>UMBRA is not a flat archive. Seven distinct sensory territories — each with its own curatorial logic, visual language, and depth. No dimension outranks another.</p>
              <p className="dna-dims" style={{marginTop:16}}>
                SHADOW NOIR<br/>WABI-SABI<br/>GLOBAL ROOTS<br/>DIGITAL SUBLIME<br/>BRUTALIST HARMONY<br/>ANCIENT FUTURES<br/>LUMINOUS VOID
              </p>
            </div>
            <div className="sr" style={{transitionDelay:'.2s'}}>{/* DNAChart removed */}</div>
          </div>
        </div>
      </section>

      {/* ══ PRINCIPLES ══ */}
      <section className="principles">
        <div className="law-inner">
          <div className="sec-label sr2">The Law</div>
          <div className="law-grid">
            {[
              {n:'01',t:'Quality Is the Only Filter',d:'Not popularity. Not recency. Not engagement score. If an asset is beautiful, it belongs. If it is not, it does not. The floor never descends — not for traffic, not for growth, not for any external pressure.'},
              {n:'02',t:'Scarcity Is Respect',d:'When something is limited, its value is acknowledged. When something expires, it meant something while it lasted. These are not marketing tricks. They are a position on what beauty deserves.'},
              {n:'03',t:'The AI Serves the Vision',d:'Optimized for aesthetic coherence — not engagement metrics, time-on-site, or click rates. A platform optimized for engagement becomes addictive and hollow. Optimized for aesthetic health: it becomes essential.'},
              {n:'04',t:'Your Data Is Not a Product',d:'Behavioral data exists to improve your experience. It is never sold. Never shared. Never used to serve advertising. God Analytics serves curation — not a revenue model built on your attention.'},
              {n:'05',t:'Precision or Silence',d:'Every word published — every description, every broadcast, every error message — is written to the same standard as the content it surrounds. Silence is preferable to the wrong words. Always.'},
              {n:'06',t:'The World Is the Source',d:'UMBRA was built by a mind that refused institutional permission. It serves the entire world — not a default market, not a dominant culture. That tension is what makes the curation honest.'},
            ].map(item=>(
              <div key={item.n} className="law-item sr">
                <div className="law-n">{item.n}</div>
                <div className="law-t">{item.t}</div>
                <div className="law-d">{item.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TIERS ══ */}
      <section className="tiers" id="tiers">
        <div className="tiers-inner">
          <div className="sec-label sr2">Access Tiers</div>
          <div className="tiers-grid">
            {[
              {name:'ACCESS',price:'Free',note:'Forever free',feat:false,corner:'ENTRY',feats:['5 CC0 downloads / month','SIGNAL Radio broadcast','Sensory search (limited)','Community layer']},
              {name:'NOIR',price:'$15',note:'/month · regional pricing',feat:false,corner:'MOST POPULAR',feats:['30 CC0 downloads / month','Full sensory search engine','The Block auction access','Priority new arrivals']},
              {name:'PRESTIGE',price:'$39',note:'/month',feat:true,corner:'RECOMMENDED',feats:['Unlimited CC0 downloads','Full sensory engine + history','The Block early access','Advanced collection tools']},
              {name:'OBSIDIAN',price:'$99',note:'/month',feat:false,corner:'INNER CIRCLE',feats:['Everything in PRESTIGE','Direct API access','Inner Circle dispatches','Sovereign communications']},
            ].map((t,i)=>(
              <div key={t.name} className={`tier-card sr${t.feat?' feat':''}`} style={{transitionDelay:`${i*.1}s`}}>
                <div className="t-corner">{t.corner}</div>
                <div className={`t-badge${t.feat?' g':''}`}>{t.name}</div>
                <div className="t-price">{t.price}<span> {t.note}</span></div>
                <ul className="t-feats">{t.feats.map(f=><li key={f}>{f}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WAITLIST ══ */}
      <section className="waitlist" id="waitlist">
        <div className="wl-inner">
          <div className="sec-label sr2" style={{justifyContent:'center',textAlign:'left'}}>The Shadow Opens</div>
          {count!==null&&<div className="wl-count sr2">{count.toLocaleString()} {count===1?'soul':'souls'} already in the shadow</div>}
          <h2 className="wl-h sr">Enter <span>Before</span> the World Knows</h2>
          <p className="wl-sub sr" style={{transitionDelay:'.1s'}}>The first 100 subscribers enter at a locked-in price — forever. Their names go on the Founding Wall. Their access never expires.</p>
          {fstat==='success'?(
            <div className="wl-ok show">
              <div className="wl-ok-num">{pos!==null?`#${String(pos).padStart(3,'0')}`:'—'}</div>
              <div className="wl-ok-line">You are in the shadow.<br/>We will call you when the door opens.</div>
            </div>
          ):(
            <form onSubmit={submit}>
              <div className="wl-form sr" style={{transitionDelay:'.2s'}}>
                <input className="wl-in" type="text" placeholder="Your name..." value={form.name} onChange={e=>set('name',e.target.value)} autoComplete="name"/>
                <input className="wl-in" type="email" placeholder="Your email address..." value={form.email} onChange={e=>set('email',e.target.value)} autoComplete="email" required style={{borderTop:'none'}}/>
                <div style={{position:'relative'}}>
                  <select className={`wl-sel${form.aesthetic_affinity?' filled':''}`} value={form.aesthetic_affinity} onChange={e=>set('aesthetic_affinity',e.target.value)} required>
                    <option value="" disabled>Your aesthetic affinity —</option>
                    {AFFINITIES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <span style={{position:'absolute',right:16,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'rgba(201,168,76,.4)',fontSize:11}}>&#9662;</span>
                </div>
                {fstat==='error'&&<p className="wl-err">{ferr}</p>}
                <button className="wl-btn" type="submit" disabled={!canSub}>{fstat==='loading'?'...':'Enter the Shadow'}</button>
              </div>
            </form>
          )}
          <p className="wl-note sr" style={{transitionDelay:'.4s'}}>No notifications. No marketing. One email — when it opens.</p>
        </div>
      </section>

      {/* ══ ORIGIN ══ */}
      <section className="origin">
        <div className="origin-glow"/>
        <p className="origin-text sr">
          One mind.<br/>
          <strong>Zero permission.</strong><br/>
          Zero institutions. Zero inheritance. Zero map.<br/><br/>
          Built in the hours the world wasn&apos;t watching.<br/>
          From an idea that refused to wait for the right conditions.<br/><br/>
          <em>The right conditions were never coming.<br/>
          So the platform was built instead.</em>
        </p>
        <div className="origin-sig sr" style={{transitionDelay:'.2s'}}>REY TEMPEST &nbsp;&middot;&nbsp; TEMPEST GROUP</div>
      </section>

      <footer>
        <div className="f-mark">UMBRA</div>
        <div className="f-note">&copy; 2026 Tempest Group &nbsp;&middot;&nbsp; All rights reserved</div>
      </footer>
    </>
  )
}
