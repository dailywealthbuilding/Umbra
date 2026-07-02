'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

type PreviewAsset = {
  id: string
  title: string | null
  cloudinary_url: string
  thumbnail_url: string | null
  asset_type: string | null
}

// ── CSS ──────────────────────────────────────────────────────────────────────
const STYLES = `
:root{--void:#030305;--g:#c9a84c;--gb:#f0d98a;--gd:#9a7a36;--t:#eeeef8;--td:#c4c4dc;--tg:#9898b4;--tm:#787890}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
::selection{background:rgba(201,168,76,.22);color:var(--gb)}
::-webkit-scrollbar{width:1px}::-webkit-scrollbar-track{background:var(--void)}::-webkit-scrollbar-thumb{background:var(--gd)}
html{scroll-behavior:smooth}
body{background:var(--void);color:var(--t);font-family:var(--font-display),Georgia,serif;overflow-x:hidden;cursor:none;-webkit-font-smoothing:antialiased}
@media(max-width:768px){body{cursor:auto}}

/* ── CURTAIN ── */
#curtain{position:fixed;inset:0;background:var(--void);z-index:9000;display:flex;align-items:center;justify-content:center;flex-direction:column;transition:opacity 1.2s ease .2s,visibility 1.2s ease .2s}
#curtain.up{opacity:0;visibility:hidden;pointer-events:none}
.boot-wrap{width:320px;margin-bottom:44px}
.bl{font-family:var(--font-mono),monospace;font-size:clamp(11px,1.3vw,13px);letter-spacing:.22em;color:rgba(201,168,76,0);text-transform:uppercase;line-height:2.4}
.bl.on{color:rgba(201,168,76,.45);transition:color .25s}
.bl.on.last{color:rgba(201,168,76,.8)}
.c-mark{font-family:var(--font-cinzel),serif;font-size:clamp(72px,14vw,140px);font-weight:900;letter-spacing:.08em;color:transparent;background:linear-gradient(165deg,#8a6f33,#c9a84c,#f0d98a,#c9a84c,#8a6f33);-webkit-background-clip:text;background-clip:text;opacity:0;transform:scale(.92)}
.c-mark.show{animation:cmReveal 1.2s cubic-bezier(.16,1,.3,1) forwards}
.c-sub{font-family:var(--font-mono),monospace;font-size:clamp(11px,1.3vw,13px);letter-spacing:.5em;color:rgba(201,168,76,.28);text-transform:uppercase;margin-top:14px;opacity:0}
.c-sub.show{animation:fadeup .5s ease .2s forwards}
@keyframes cmReveal{0%{opacity:0;transform:scale(.88);filter:blur(20px)}70%{opacity:1;filter:blur(0)}100%{opacity:1;transform:scale(1)}}

/* ── CURSOR ── */
#cursor{position:fixed;pointer-events:none;z-index:9999;width:0;height:0;transform:translate(-50%,-50%)}
.nx-ring{position:absolute;border-radius:50%;pointer-events:none}
.nx-r1{width:64px;height:64px;top:-32px;left:-32px;border:1px solid rgba(201,168,76,.12);transition:width .3s,height .3s,top .3s,left .3s,border-color .3s}
.nx-r2{width:40px;height:40px;top:-20px;left:-20px;animation:nx2spin 12s linear infinite}
.nx-r2-seg{position:absolute;width:100%;height:100%;border-radius:50%}
.nx-r2-seg::before,.nx-r2-seg::after{content:'';position:absolute;border-radius:50%}
.nx-r2-seg::before{width:100%;height:100%;border:1px solid transparent;border-top:1px solid rgba(201,168,76,.55);border-right:1px solid rgba(201,168,76,.18)}
.nx-r2-seg::after{width:60%;height:60%;top:20%;left:20%;border:1px solid transparent;border-bottom:1px solid rgba(201,168,76,.35);border-left:1px solid rgba(201,168,76,.12)}
.nx-r3{width:22px;height:22px;top:-11px;left:-11px;animation:nx3spinrev 6s linear infinite}
.nx-diamond{position:absolute;width:8px;height:8px;top:-4px;left:-4px;border:1px solid rgba(201,168,76,.6);transform:rotate(45deg);transition:width .3s,height .3s,top .3s,left .3s}
.nx-dot{position:absolute;width:4px;height:4px;top:-2px;left:-2px;border-radius:50%;background:var(--g);box-shadow:0 0 8px var(--g);animation:nxdot 2s ease infinite}
.nx-cross{position:absolute;top:-28px;left:-28px;width:56px;height:56px}
.nx-cross::before,.nx-cross::after{content:'';position:absolute;background:rgba(201,168,76,.2)}
.nx-cross::before{width:10px;height:1px;top:50%;left:0;transform:translateY(-50%)}
.nx-cross::after{width:1px;height:10px;left:50%;top:0;transform:translateX(-50%)}
@keyframes nx2spin{to{transform:rotate(360deg)}}
@keyframes nx3spinrev{to{transform:rotate(-360deg)}}
@keyframes nxdot{0%,100%{box-shadow:0 0 5px var(--g)}50%{box-shadow:0 0 14px var(--gb),0 0 32px rgba(240,217,138,.55)}}
body.hov .nx-r2{animation-duration:2s}
body.hov .nx-r1{width:36px;height:36px;top:-18px;left:-18px;border-color:rgba(201,168,76,.35)}
body.hov .nx-diamond{width:12px;height:12px;top:-6px;left:-6px;border-color:rgba(201,168,76,.9)}
#trail{position:fixed;inset:0;pointer-events:none;z-index:9990}
#ptcl{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.85}
.vignette{position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at center,transparent 30%,rgba(3,3,5,.88) 100%)}
body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.018;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:180px}
@media(max-width:768px){#cursor,#trail{display:none}}

/* ── NAV ── */
nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:22px 48px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(to bottom,rgba(3,3,5,.92),transparent)}
.n-mark{font-family:var(--font-cinzel),serif;font-size:clamp(13px,1.5vw,16px);font-weight:700;letter-spacing:8px;color:var(--g);text-decoration:none;opacity:0;animation:fadeup .8s ease forwards 3.6s}
.n-links{display:flex;gap:24px;align-items:center;opacity:0;animation:fadeup .8s ease forwards 3.8s}
.n-links a{font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,13px);letter-spacing:3px;text-transform:uppercase;color:var(--tg);text-decoration:none;transition:color .3s}
.n-links a:hover{color:var(--g)}
.n-cta{font-family:var(--font-cinzel),serif;font-size:clamp(11px,1.2vw,13px);letter-spacing:4px;text-transform:uppercase;color:var(--void);background:var(--g);border:none;padding:10px 20px;cursor:none;text-decoration:none;transition:background .3s;opacity:0;animation:fadeup .8s ease forwards 4s}
.n-cta:hover{background:var(--gb)}
.n-status{display:flex;align-items:center;gap:8px;font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,12px);letter-spacing:.25em;color:rgba(201,168,76,.38);opacity:0;animation:fadeup .8s ease forwards 4.1s}
.n-dot{width:6px;height:6px;border-radius:50%;background:rgba(80,220,80,.7);animation:blink2 2.5s ease infinite}

/* ── HERO ── */
.hero{position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 40px 100px;z-index:2;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 50%,rgba(201,168,76,.08) 0%,transparent 55%);pointer-events:none}
.hero-eyebrow{font-family:var(--font-mono),monospace;font-size:clamp(12px,1.4vw,15px);letter-spacing:7px;color:var(--gd);text-transform:uppercase;margin-bottom:40px;opacity:0;animation:fadeup .9s ease forwards .5s;min-height:1.4em}
.hero h1{font-family:var(--font-cinzel),serif;font-size:clamp(88px,18vw,220px);font-weight:900;line-height:.85;letter-spacing:-2px;color:transparent;background:linear-gradient(165deg,var(--gd) 0%,var(--g) 28%,var(--gb) 50%,var(--g) 72%,var(--gd) 100%);-webkit-background-clip:text;background-clip:text;opacity:0;animation:titleReveal 1.8s cubic-bezier(.16,1,.3,1) forwards 1s;overflow:hidden;position:relative}
.hero h1::after{content:'UMBRA';position:absolute;inset:0;background:inherit;-webkit-background-clip:text;background-clip:text;color:transparent;filter:blur(60px);opacity:.35;z-index:-1}
.hero-sub{font-family:var(--font-display),Georgia,serif;font-size:clamp(16px,2vw,22px);color:var(--td);letter-spacing:1px;margin-top:24px;max-width:580px;line-height:1.75;opacity:0;animation:fadeup .9s ease forwards 2.4s}
.hero-sub em{color:var(--g);font-style:italic}
.hero-ctas{display:flex;gap:12px;margin-top:44px;opacity:0;animation:fadeup .9s ease forwards 2.8s;flex-wrap:wrap;justify-content:center}
.btn-gold{font-family:var(--font-cinzel),serif;font-size:clamp(11px,1.2vw,13px);font-weight:700;letter-spacing:5px;text-transform:uppercase;color:var(--void);background:var(--g);border:none;padding:16px 34px;cursor:none;text-decoration:none;transition:background .3s;display:inline-block}
.btn-gold:hover{background:var(--gb)}
.btn-outline{font-family:var(--font-cinzel),serif;font-size:clamp(11px,1.2vw,13px);letter-spacing:5px;text-transform:uppercase;color:var(--g);background:transparent;border:1px solid rgba(201,168,76,.4);padding:15px 34px;cursor:none;text-decoration:none;transition:border-color .3s,color .3s;display:inline-block}
.btn-outline:hover{border-color:var(--g);color:var(--gb)}
.hero-rule{width:1px;height:44px;background:linear-gradient(to bottom,transparent,var(--gd),transparent);margin:56px auto 0;opacity:0;animation:fadeup .9s ease forwards 3.1s}

/* ── STATS STRIP ── */
.stats{position:relative;z-index:2;border-top:1px solid rgba(255,255,255,.025);border-bottom:1px solid rgba(255,255,255,.025);padding:44px 56px}
.stats::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(201,168,76,.03),transparent)}
.stats-inner{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.stat{text-align:center}
.stat-num{font-family:var(--font-cinzel),serif;font-size:clamp(28px,4vw,48px);font-weight:900;color:transparent;background:linear-gradient(165deg,var(--gd),var(--g),var(--gb));-webkit-background-clip:text;background-clip:text;line-height:1}
.stat-label{font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,13px);letter-spacing:.35em;text-transform:uppercase;color:var(--tg);margin-top:8px;line-height:1.6}

/* ── PREVIEW STRIP ── */
.preview{position:relative;z-index:2;padding:80px 0 80px}
.preview-hdr{padding:0 56px 36px;display:flex;align-items:center;gap:20px}
.preview-hdr-label{font-family:var(--font-cinzel),serif;font-size:clamp(12px,1.4vw,15px);letter-spacing:7px;color:var(--gd);text-transform:uppercase;white-space:nowrap}
.preview-hdr-line{flex:1;height:1px;background:linear-gradient(90deg,rgba(201,168,76,.18),transparent)}
.preview-hdr-link{font-family:var(--font-mono),monospace;font-size:clamp(11px,1.3vw,13px);letter-spacing:3px;color:rgba(201,168,76,.5);text-decoration:none;white-space:nowrap;text-transform:uppercase}
.preview-hdr-link:hover{color:var(--g)}
.preview-scroll{display:flex;gap:3px;padding:0 56px;overflow-x:auto;scrollbar-width:none}
.preview-scroll::-webkit-scrollbar{display:none}
.preview-item{flex-shrink:0;width:240px;height:320px;position:relative;overflow:hidden;cursor:none;text-decoration:none;display:block;background:#0a0a0f}
.preview-item img,.preview-item video{width:100%;height:100%;object-fit:cover;display:block;opacity:.88;transition:opacity .4s,transform .6s cubic-bezier(.16,1,.3,1)}
.preview-item:hover img,.preview-item:hover video{opacity:1;transform:scale(1.05)}
.preview-item-overlay{position:absolute;bottom:0;left:0;right:0;padding:24px 14px 12px;background:linear-gradient(transparent,rgba(3,3,5,.85));transform:translateY(100%);transition:transform .35s ease}
.preview-item:hover .preview-item-overlay{transform:translateY(0)}
.preview-item-title{font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,13px);letter-spacing:.15em;color:var(--td);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.preview-placeholder{width:240px;height:320px;flex-shrink:0;background:rgba(255,255,255,.015);border:1px solid rgba(255,255,255,.03);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
.preview-placeholder-line{width:40px;height:1px;background:rgba(201,168,76,.15)}
.preview-vid-badge{position:absolute;top:10px;left:10px;font-family:var(--font-mono),monospace;font-size:clamp(10px,1.1vw,11px);letter-spacing:3px;color:rgba(240,217,138,.85);background:rgba(3,3,5,.8);border:1px solid rgba(201,168,76,.25);padding:3px 8px;text-transform:uppercase;z-index:2}

/* ── HOW IT WORKS ── */
.how{position:relative;z-index:2;padding:80px 56px 100px;border-top:1px solid rgba(255,255,255,.025)}
.how::before{content:'';position:absolute;left:50%;transform:translateX(-50%);top:0;width:1px;height:100%;background:linear-gradient(to bottom,transparent,rgba(201,168,76,.06),transparent)}
.how-inner{max-width:1000px;margin:0 auto}
.sec-label{font-family:var(--font-mono),monospace;font-size:clamp(12px,1.3vw,14px);letter-spacing:6px;text-transform:uppercase;color:var(--gd);margin-bottom:48px;display:flex;align-items:center;gap:16px}
.sec-label::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(201,168,76,.18),transparent)}
.how-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
.how-step{padding:40px 32px;background:rgba(255,255,255,.012);border:1px solid rgba(255,255,255,.02);position:relative;overflow:hidden}
.how-step::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--g);transform:scaleY(0);transform-origin:top;transition:transform .4s}
.how-step:hover::before{transform:scaleY(1)}
.how-n{font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,13px);letter-spacing:5px;color:rgba(201,168,76,.4);margin-bottom:20px;text-transform:uppercase}
.how-t{font-family:var(--font-cinzel),serif;font-size:clamp(16px,1.9vw,20px);color:var(--t);margin-bottom:14px;letter-spacing:.3px;line-height:1.3}
.how-d{font-size:clamp(14px,1.6vw,16px);color:var(--td);line-height:2;font-weight:300}

/* ── SENSORY ENGINE ── */
.sensory{position:relative;z-index:2;padding:80px 56px 100px;overflow:hidden;border-top:1px solid rgba(255,255,255,.025)}
.sensory::before{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.12),transparent)}
.sensory-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.sense-txt h2{font-family:var(--font-cinzel),serif;font-size:clamp(22px,3.2vw,38px);font-weight:400;color:var(--t);line-height:1.2;margin-bottom:18px}
.sense-txt h2 em{color:var(--g);font-style:italic;font-family:var(--font-display),Georgia,serif}
.sense-txt p{font-size:clamp(14px,1.6vw,17px);color:var(--td);line-height:2.1;font-weight:300}
.sense-bullet{display:flex;gap:14px;margin-top:18px;align-items:flex-start}
.sb-n{width:22px;height:22px;flex-shrink:0;border:1px solid rgba(201,168,76,.2);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,12px);color:var(--gd)}
.sb-t{font-family:var(--font-mono),monospace;font-size:clamp(12px,1.3vw,14px);color:var(--tg);line-height:1.8;letter-spacing:.07em}
.demo-panel{border:1px solid rgba(201,168,76,.15);border-radius:2px;overflow:hidden}
.demo-bar{display:flex;align-items:center;gap:8px;padding:10px 16px;background:rgba(0,0,0,.6);border-bottom:1px solid rgba(255,255,255,.04)}
.db-dot{width:8px;height:8px;border-radius:50%}.db-dot.r{background:rgba(255,80,80,.5)}.db-dot.y{background:rgba(201,168,76,.5)}.db-dot.g{background:rgba(80,200,80,.35)}
.db-title{font-family:var(--font-mono),monospace;font-size:clamp(10px,1.1vw,12px);letter-spacing:.3em;color:var(--tg);margin-left:6px}
.demo-body{padding:24px 18px 18px;min-height:320px;position:relative;transition:background 1.4s}
.demo-row{display:flex;margin-bottom:18px;border:1px solid rgba(201,168,76,.18);transition:border-color .8s}
.dr-pre{padding:11px 13px;font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,13px);background:rgba(0,0,0,.3);border-right:1px solid rgba(255,255,255,.04)}
.dr-in{flex:1;background:transparent;border:none;outline:none;color:var(--t);font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,13px);letter-spacing:.06em;padding:11px 10px}
.dr-btn{padding:11px 16px;font-family:var(--font-cinzel),serif;font-size:clamp(10px,1.1vw,12px);letter-spacing:.35em;text-transform:uppercase;background:transparent;border:none;border-left:1px solid rgba(255,255,255,.04);cursor:none;transition:all .3s}
.dr-btn.scanning{animation:spulse2 .5s ease-in-out infinite}
.demo-status{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.ds-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.ds-txt{font-family:var(--font-mono),monospace;font-size:clamp(10px,1.1vw,12px);letter-spacing:.2em;color:var(--tg)}
.demo-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.demo-card{border-radius:2px;overflow:hidden;transform:translateY(10px);opacity:0;transition:opacity .5s,transform .5s}
.demo-card.show{transform:translateY(0);opacity:1}
.dc-img{height:72px;transition:background 1.4s}
.dc-info{padding:7px 9px;background:rgba(0,0,0,.55)}
.dc-ttl{font-family:var(--font-mono),monospace;font-size:clamp(10px,1.1vw,12px);letter-spacing:.1em;color:var(--td);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dc-cat{font-size:clamp(10px,1.1vw,11px);color:var(--tg);margin-top:2px;font-family:var(--font-mono),monospace}
.demo-foot{position:absolute;bottom:9px;right:12px;font-family:var(--font-mono),monospace;font-size:clamp(10px,1.1vw,11px);letter-spacing:.2em;color:rgba(201,168,76,.22)}

/* ── CATEGORIES ── */
.categories{position:relative;z-index:2;padding:80px 56px 100px;border-top:1px solid rgba(255,255,255,.025)}
.cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin-top:48px}
.cat-tile{position:relative;padding:36px 28px;overflow:hidden;cursor:none;border:1px solid rgba(255,255,255,.02);transition:border-color .4s}
.cat-tile:hover{border-color:rgba(201,168,76,.1)}
.cat-tile::before{content:'';position:absolute;inset:0;opacity:.7;transition:opacity .5s}
.cat-tile:hover::before{opacity:1}
.cat-tile-n{font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,13px);letter-spacing:5px;color:rgba(201,168,76,.4);margin-bottom:14px;text-transform:uppercase}
.cat-tile-t{font-family:var(--font-cinzel),serif;font-size:clamp(14px,1.7vw,18px);color:var(--t);margin-bottom:10px;letter-spacing:.3px;line-height:1.3;position:relative;z-index:1}
.cat-tile-d{font-size:clamp(13px,1.4vw,15px);color:var(--td);line-height:1.85;font-weight:300;position:relative;z-index:1}
.cat-tile-link{position:absolute;bottom:20px;right:20px;font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,13px);letter-spacing:3px;color:rgba(201,168,76,.35);text-decoration:none;text-transform:uppercase;transition:color .3s}
.cat-tile:hover .cat-tile-link{color:var(--g)}

/* ── PRICING ── */
.pricing{position:relative;z-index:2;padding:80px 56px 100px;border-top:1px solid rgba(255,255,255,.025)}
.pricing-inner{max-width:1100px;margin:0 auto}
.price-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:48px}
.price-card{padding:40px 32px;border:1px solid rgba(255,255,255,.03);background:rgba(255,255,255,.008);position:relative;transition:background .3s,border-color .3s}
.price-card:hover{background:rgba(255,255,255,.022)}
.price-card.feat{border-color:rgba(139,92,246,.3);background:rgba(139,92,246,.04)}
.price-badge{font-family:var(--font-cinzel),serif;font-size:clamp(13px,1.5vw,16px);letter-spacing:4px;color:var(--t);margin-bottom:8px;text-transform:uppercase}
.price-amt{font-family:var(--font-mono),monospace;font-size:clamp(36px,4vw,48px);color:var(--td);line-height:1;margin-bottom:4px}
.price-period{font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,13px);letter-spacing:.2em;color:var(--tm);margin-bottom:20px}
.price-tagline{font-family:var(--font-display),Georgia,serif;font-style:italic;font-size:clamp(14px,1.5vw,17px);color:var(--td);margin-bottom:28px;line-height:1.5}
.price-features{list-style:none;margin-bottom:32px}
.price-features li{font-family:var(--font-mono),monospace;font-size:clamp(12px,1.3vw,14px);letter-spacing:.1em;color:var(--tg);padding:8px 0;border-bottom:1px solid rgba(255,255,255,.025)}
.price-features li::before{content:'+ ';color:rgba(201,168,76,.35)}
.price-cta{display:block;text-align:center;font-family:var(--font-cinzel),serif;font-size:clamp(11px,1.2vw,13px);letter-spacing:4px;text-transform:uppercase;padding:15px 20px;border:1px solid rgba(201,168,76,.3);color:var(--g);text-decoration:none;transition:all .3s}
.price-cta:hover{background:rgba(201,168,76,.08);border-color:var(--g)}
.price-cta.feat-cta{background:rgba(139,92,246,.15);border-color:rgba(139,92,246,.5);color:rgba(180,160,255,.9)}
.price-cta.feat-cta:hover{background:rgba(139,92,246,.25)}
.price-corner{position:absolute;top:12px;right:14px;font-family:var(--font-mono),monospace;font-size:clamp(10px,1.1vw,11px);letter-spacing:.18em;color:rgba(201,168,76,.22)}
.price-trial-note{text-align:center;margin-top:36px;font-family:var(--font-display),Georgia,serif;font-style:italic;font-size:clamp(14px,1.6vw,17px);color:var(--tm)}
.price-trial-note a{color:rgba(201,168,76,.6);text-decoration:none}
.price-trial-note a:hover{color:var(--g)}

/* ── WAITLIST ── */
.waitlist{position:relative;z-index:2;padding:80px 56px 120px;text-align:center;border-top:1px solid rgba(255,255,255,.025)}
.wl-inner{max-width:520px;margin:0 auto}
.wl-count{font-family:var(--font-mono),monospace;font-size:clamp(12px,1.3vw,14px);letter-spacing:4px;color:rgba(201,168,76,.5);margin-bottom:20px}
.wl-h{font-family:var(--font-cinzel),serif;font-size:clamp(26px,4.5vw,48px);font-weight:700;color:var(--t);line-height:1.1;margin-bottom:14px}
.wl-h span{color:var(--g)}
.wl-sub{font-family:var(--font-display),Georgia,serif;font-style:italic;font-size:clamp(14px,1.7vw,18px);color:var(--td);line-height:1.9;margin-bottom:40px}
.wl-form{display:flex;flex-direction:column;gap:1px;max-width:460px;margin:0 auto}
.wl-in,.wl-sel{width:100%;background:rgba(255,255,255,.022);border:1px solid rgba(201,168,76,.14);border-bottom:none;color:var(--t);outline:none;transition:border-color .3s,background .3s}
.wl-in{font-family:var(--font-display),Georgia,serif;font-size:clamp(14px,1.6vw,16px);padding:15px 20px;letter-spacing:.5px}
.wl-in::placeholder{color:var(--tm);font-style:italic}
.wl-in:focus,.wl-sel:focus{border-color:rgba(201,168,76,.42);background:rgba(201,168,76,.03)}
.wl-sel{font-family:var(--font-mono),monospace;font-size:clamp(12px,1.3vw,14px);letter-spacing:.15em;padding:15px 20px;-webkit-appearance:none;appearance:none;cursor:none;color:var(--tm)}
.wl-sel.filled{color:var(--td)}
.wl-sel option{background:#111;color:var(--t)}
.wl-btn{width:100%;background:var(--g);border:1px solid var(--g);border-top:none;color:var(--void);font-family:var(--font-cinzel),serif;font-size:clamp(12px,1.4vw,15px);font-weight:700;letter-spacing:5px;text-transform:uppercase;padding:18px;cursor:none;transition:background .3s}
.wl-btn:hover{background:var(--gb)}
.wl-btn:disabled{opacity:.28;pointer-events:none}
.wl-note{font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,13px);letter-spacing:3px;color:var(--tg);margin-top:16px}
.wl-err{font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,13px);letter-spacing:2px;color:rgba(220,80,80,.7);margin-top:10px}
.wl-ok{padding:48px;border:1px solid rgba(201,168,76,.2);background:rgba(201,168,76,.04);position:relative;overflow:hidden;display:none}
.wl-ok.show{display:block}
.wl-ok-num{font-family:var(--font-cinzel),serif;font-size:clamp(56px,10vw,88px);font-weight:900;color:var(--g);line-height:1;margin-bottom:14px}
.wl-ok-line{font-family:var(--font-display),Georgia,serif;font-style:italic;font-size:clamp(16px,1.8vw,20px);color:var(--td);line-height:1.75}

/* ── ORIGIN / FOOTER ── */
.origin{position:relative;z-index:2;padding:80px 56px;text-align:center;border-top:1px solid rgba(201,168,76,.05)}
.origin-text{font-family:var(--font-display),Georgia,serif;font-style:italic;font-size:clamp(15px,1.8vw,20px);color:var(--tg);letter-spacing:1px;line-height:2.6}
.origin-text strong{color:rgba(201,168,76,.65);font-style:normal;font-weight:400}
.origin-sig{font-family:var(--font-cinzel),serif;font-size:clamp(11px,1.2vw,13px);letter-spacing:5px;color:var(--gd);margin-top:36px;display:block}
footer{position:relative;z-index:2;border-top:1px solid rgba(255,255,255,.02);padding:32px 56px;display:flex;justify-content:space-between;align-items:center}
.f-mark{font-family:var(--font-cinzel),serif;font-size:clamp(12px,1.4vw,15px);letter-spacing:6px;color:var(--gd)}
.f-links{display:flex;gap:22px}
.f-links a{font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,13px);letter-spacing:3px;text-transform:uppercase;color:var(--tg);text-decoration:none;transition:color .3s}
.f-links a:hover{color:var(--g)}
.f-note{font-family:var(--font-mono),monospace;font-size:clamp(11px,1.2vw,13px);letter-spacing:3px;color:rgba(255,255,255,.12);text-transform:uppercase}

/* ── ANIMATIONS ── */
@keyframes fadeup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes titleReveal{0%{opacity:0;transform:scale(.92) translateY(22px);filter:blur(16px)}100%{opacity:1;transform:scale(1) translateY(0);filter:blur(0)}}
@keyframes blink2{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes spulse2{0%,100%{opacity:1}50%{opacity:.3}}
.sr{opacity:0;transform:translateY(24px);transition:opacity .9s ease,transform .9s ease}
.sr.vis{opacity:1;transform:none}

/* ── RESPONSIVE ── */
@media(max-width:1000px){
  .sensory-inner{grid-template-columns:1fr;gap:48px}
  .cat-grid{grid-template-columns:repeat(2,1fr)}
  .price-grid{grid-template-columns:1fr}
  .how-steps{grid-template-columns:1fr}
  .stats-inner{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:768px){
  nav{padding:18px 24px}
  .n-status,.n-links a:not(:first-child){display:none}
  .how,.sensory,.categories,.pricing,.waitlist,.origin,.preview{padding-left:24px;padding-right:24px}
  .preview-scroll{padding:0 24px}
  .preview-hdr{padding:0 24px 28px}
  footer{flex-direction:column;gap:14px;text-align:center;padding:24px}
  .f-links{flex-wrap:wrap;justify-content:center}
  .stats{padding:36px 24px}
  .how-step{padding:28px 22px}
  .cat-tile{padding:26px 20px}
  .price-card{padding:30px 22px}
}
`

// ── Boot sequence ─────────────────────────────────────────────────────────────
const BOOT = [
  'VAULT_ENGINE .............. INIT',
  'DARK_CONTENT_LIBRARY ...... LOADING',
  'SENSORY_SEARCH ............ ONLINE',
  'CC0_LICENSE ............... VERIFIED',
  'AESTHETIC_FILTER .......... ACTIVE',
  'ENTERING_THE_SHADOW .......',
]

// ── Sensory demo data ─────────────────────────────────────────────────────────
const MOODS = [
  { q:'2AM dark workspace', bg:'linear-gradient(160deg,#020210,#080820)', acc:'rgba(70,80,220,.5)', dot:'#4850dc', status:'DEEP_INDIGO',
    cards:[{t:'Void Architecture III',c:'Architecture',bg:'linear-gradient(135deg,#0a0a1a,#141430)'},{t:'Texture of Silence',c:'Macro',bg:'linear-gradient(135deg,#100818,#0a0412)'},{t:'Still Frame Study',c:'Documentary',bg:'linear-gradient(135deg,#060618,#0a0820)'}]},
  { q:'moody coffee morning', bg:'linear-gradient(160deg,#0f0906,#1e1108)', acc:'rgba(201,168,76,.5)', dot:'#c9a84c', status:'AMBER_DUSK',
    cards:[{t:'Autumn Impermanence',c:'Fine Art',bg:'linear-gradient(135deg,#1a0f06,#120a04)'},{t:'Rust Speaks',c:'Still Life',bg:'linear-gradient(135deg,#160c06,#100a08)'},{t:'Last Light On Stone',c:'Architecture',bg:'linear-gradient(135deg,#181006,#100c04)'}]},
  { q:'dark luxury interior', bg:'linear-gradient(160deg,#0b020f,#180520)', acc:'rgba(180,40,220,.5)', dot:'#a030c8', status:'ULTRA_VIOLET',
    cards:[{t:'Deep Urban Study',c:'Street',bg:'linear-gradient(135deg,#120818,#0e0614)'},{t:'Signal & Noise',c:'Abstract',bg:'linear-gradient(135deg,#0e0616,#120a18)'},{t:'Ancient Futures II',c:'Historical',bg:'linear-gradient(135deg,#100614,#0c0410)'}]},
  { q:'noir editorial portrait', bg:'linear-gradient(160deg,#020c10,#041622)', acc:'rgba(30,190,220,.45)', dot:'#1ebedd', status:'CYAN_GHOST',
    cards:[{t:'Golden Hour Fragment',c:'Nature',bg:'linear-gradient(135deg,#061014,#040c10)'},{t:'Contemplation',c:'Portrait',bg:'linear-gradient(135deg,#041012,#06141a)'},{t:'Before The Hour',c:'Documentary',bg:'linear-gradient(135deg,#06101a,#040c14)'}]},
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

const CATEGORIES = [
  { n:'01', t:'Dark Morning Routine', d:'Coffee. Candles. Quiet intention before the world wakes.', g:'linear-gradient(135deg,#1a0f08,#0d0804)', link:'/browse?q=dark+morning' },
  { n:'02', t:'Dark Workspace',       d:'Laptops. Desk setups. The productive hours after midnight.', g:'linear-gradient(135deg,#080c1a,#050810)', link:'/browse?q=dark+workspace' },
  { n:'03', t:'Dark Fashion',         d:'Black outfits. Jewelry. The visual language of luxury.', g:'linear-gradient(135deg,#150a1a,#0d0512)', link:'/browse?q=dark+fashion' },
  { n:'04', t:'Dark Interior',        d:'Moody rooms. Candlelit spaces. Architecture with soul.', g:'linear-gradient(135deg,#0a0a14,#070710)', link:'/browse?q=dark+interior' },
  { n:'05', t:'Dark Academia',        d:'Books. Journals. Low light and the scent of old paper.', g:'linear-gradient(135deg,#14100a,#0c0a06)', link:'/browse?q=dark+academia' },
  { n:'06', t:'Dark Food & Drink',    d:'Wine. Dark plates. The aesthetic of refined indulgence.', g:'linear-gradient(135deg,#140808,#0c0606)', link:'/browse?q=dark+food' },
  { n:'07', t:'Dark Self-Care',       d:'Baths. Candles. The ritual of the unhurried evening.', g:'linear-gradient(135deg,#0a1212,#060c0c)', link:'/browse?q=dark+selfcare' },
  { n:'08', t:'Dark Night Vibes',     d:'2AM. City windows. The hours that belong to creators.', g:'linear-gradient(135deg,#080a14,#060810)', link:'/browse?q=dark+night' },
]

// ── Sensory Demo ──────────────────────────────────────────────────────────────
function SensoryDemo() {
  const [mi,setMi]=useState(0)
  const [typed,setTyped]=useState('')
  const [phase,setPhase]=useState<'typing'|'hold'|'scanning'|'showing'|'fade'>('typing')
  const [cards,setCards]=useState([false,false,false])

  useEffect(()=>{
    const m=MOODS[mi]
    if(phase==='typing'){
      if(typed.length<m.q.length){const t=setTimeout(()=>setTyped(m.q.slice(0,typed.length+1)),70);return()=>clearTimeout(t)}
      else{const t=setTimeout(()=>setPhase('hold'),500);return()=>clearTimeout(t)}
    }
    if(phase==='hold'){const t=setTimeout(()=>setPhase('scanning'),400);return()=>clearTimeout(t)}
    if(phase==='scanning'){
      const t=setTimeout(()=>{setPhase('showing');setCards([false,false,false])
        setTimeout(()=>setCards(c=>[true,c[1],c[2]]),80)
        setTimeout(()=>setCards(c=>[c[0],true,c[2]]),260)
        setTimeout(()=>setCards(c=>[c[0],c[1],true]),440)
      },1000);return()=>clearTimeout(t)}
    if(phase==='showing'){const t=setTimeout(()=>setPhase('fade'),2800);return()=>clearTimeout(t)}
    if(phase==='fade'){const t=setTimeout(()=>{setCards([false,false,false]);setTyped('');setMi(i=>(i+1)%MOODS.length);setPhase('typing')},800);return()=>clearTimeout(t)}
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
          {phase==='typing'&&typed.length<m.q.length&&<span style={{padding:'11px 4px',color:m.dot,fontFamily:'monospace',fontSize:13}}>|</span>}
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
        <div className="demo-foot">AESTHETIC_SCORE: 0.97 &nbsp;&middot;&nbsp; SENSORY_MATCH: HIGH</div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type FStat = 'idle'|'loading'|'success'|'error'

export default function Page() {
  const [bootStep,     setBoot   ] = useState(-1)
  const [wmShow,       setWm     ] = useState(false)
  const [lifted,       setLifted ] = useState(false)
  const [eyebrow,      setEy     ] = useState('')
  const [previewAssets,setPreview] = useState<PreviewAsset[]>([])
  const [count,        setCount  ] = useState<number|null>(null)
  const [form,         setForm   ] = useState({name:'',email:'',aesthetic_affinity:''})
  const [fstat,        setFstat  ] = useState<FStat>('idle')
  const [pos,          setPos    ] = useState<number|null>(null)
  const [ferr,         setFerr   ] = useState('')
  const cursorRef = useRef<HTMLDivElement>(null)
  const ptclRef   = useRef<HTMLCanvasElement>(null)
  const trailRef  = useRef<HTMLCanvasElement>(null)

  const EY = 'Dark Luxury B-Roll. CC0 Licensed. Ready To Post.'

  useEffect(()=>{
    const ts:ReturnType<typeof setTimeout>[]=[]
    BOOT.forEach((_,i)=>ts.push(setTimeout(()=>setBoot(i),200+i*280)))
    ts.push(setTimeout(()=>setWm(true),200+BOOT.length*280))
    ts.push(setTimeout(()=>setLifted(true),200+BOOT.length*280+1200))
    return()=>ts.forEach(clearTimeout)
  },[])

  useEffect(()=>{
    if(!lifted)return
    let i=0
    const id=setInterval(()=>{setEy(EY.slice(0,i+1));i++;if(i>=EY.length)clearInterval(id)},38)
    return()=>clearInterval(id)
  },[lifted])

  // Fetch preview assets — includes asset_type for video detection
  useEffect(()=>{
    if(!lifted)return
    try {
      const sb = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      sb.from('assets')
        .select('id,title,cloudinary_url,thumbnail_url,asset_type')
        .order('created_at',{ascending:false})
        .limit(8)
        .then(({data})=>{ if(data) setPreview(data as PreviewAsset[]) })
    } catch(_) {}
  },[lifted])

  useEffect(()=>{
    let active=true
    const go=()=>{
      fetch('/api/waitlist/count').then(r=>r.json()).then(d=>{if(active&&d.count!==undefined)setCount(d.count)}).catch(()=>{})
    }
    go()
    const id=setInterval(go,45000)
    return()=>{active=false;clearInterval(id)}
  },[])

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
    const addH=()=>document.body.classList.add('hov')
    const rmH=()=>document.body.classList.remove('hov')
    document.querySelectorAll('a,button,input,select,.cat-tile,.price-card').forEach(el=>{el.addEventListener('mouseenter',addH);el.addEventListener('mouseleave',rmH)})
    class P{x=0;y=0;sz=0;vx=0;vy=0;o=0;to=0;life=0;max=0
      constructor(){this.reset(true)}
      reset(init:boolean){this.x=Math.random()*W;this.y=init?Math.random()*H:H+10;this.sz=Math.random()*1.5+.3;this.vy=-(Math.random()*.32+.1);this.vx=(Math.random()-.5)*.16;this.o=0;this.to=Math.random()*.32+.06;this.life=0;this.max=Math.random()*400+200}
      tick(){this.x+=this.vx;this.y+=this.vy;this.life++;if(this.life<60)this.o=(this.life/60)*this.to;else if(this.life>this.max-60)this.o=((this.max-this.life)/60)*this.to;if(this.life>=this.max||this.y<-10)this.reset(false)}
      draw(){pc.save();pc.globalAlpha=this.o;pc.fillStyle='#c9a84c';pc.shadowColor='#c9a84c';pc.shadowBlur=6;pc.beginPath();pc.arc(this.x,this.y,this.sz,0,Math.PI*2);pc.fill();pc.restore()}
    }
    const ps:P[]=Array.from({length:90},()=>new P())
    let aid=0,tid=0
    const animP=()=>{pc.clearRect(0,0,W,H);for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const dx=ps[i].x-ps[j].x,dy=ps[i].y-ps[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<100){pc.beginPath();pc.strokeStyle=`rgba(201,168,76,${(1-d/100)*.05})`;pc.lineWidth=.5;pc.moveTo(ps[i].x,ps[i].y);pc.lineTo(ps[j].x,ps[j].y);pc.stroke()}};ps.forEach(p=>{p.tick();p.draw()});aid=requestAnimationFrame(animP)}
    aid=requestAnimationFrame(animP)
    const animT=()=>{tc.clearRect(0,0,W,H);const now=Date.now();const fresh=pts.filter(p=>now-p.t<320);if(fresh.length>1){for(let i=1;i<fresh.length;i++){const age=(now-fresh[i].t)/320;tc.beginPath();tc.arc(fresh[i].x,fresh[i].y,(1-age)*4,0,Math.PI*2);tc.fillStyle=`rgba(201,168,76,${(1-age)*.4})`;tc.fill()}};tid=requestAnimationFrame(animT)}
    tid=requestAnimationFrame(animT)
    const obs=new IntersectionObserver(e=>{e.forEach(en=>{if(en.isIntersecting)(en.target as HTMLElement).classList.add('vis')})},{threshold:.08,rootMargin:'0px 0px -20px 0px'})
    document.querySelectorAll('.sr').forEach(el=>obs.observe(el))
    return()=>{document.removeEventListener('mousemove',mv);cancelAnimationFrame(aid);cancelAnimationFrame(tid);window.removeEventListener('resize',resize);obs.disconnect()}
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

  // Display URL for preview strip — images only (videos use src directly)
  const displayUrl=(a:PreviewAsset)=>{
    if(a.asset_type==='video') return '' // videos use cloudinary_url directly
    if(a.thumbnail_url) return a.thumbnail_url
    if(!a.cloudinary_url) return ''
    return a.cloudinary_url
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>

      {/* BOOT */}
      <div id="curtain" className={lifted?'up':''}>
        <div className="boot-wrap">
          {BOOT.map((line,i)=>(
            <div key={i} className={`bl${bootStep>=i?' on':''}${i===BOOT.length-1&&bootStep>=i?' last':''}`}>{line}</div>
          ))}
        </div>
        <div className={`c-mark${wmShow?' show':''}`}>UMBRA</div>
        <div className={`c-sub${wmShow?' show':''}`}>The shadow is already lit.</div>
      </div>

      {/* CURSOR */}
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
          <a href="/browse">Browse</a>
          <a href="#how">How It Works</a>
          <a href="#tiers">Access</a>
          <a href="#waitlist">Founding 100</a>
          <a href="/auth/login" style={{color:'rgba(201,168,76,.7)'}}>Sign In</a>
        </div>
        <Link href="/subscribe" className="n-cta">Start Trial — $5</Link>
        <div className="n-status"><div className="n-dot"/><span>VAULT ONLINE</span></div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-eyebrow">{eyebrow}</div>
        <div style={{position:'relative'}}>
          <h1>UMBRA</h1>
        </div>
        <p className="hero-sub">
          Stop settling for beige stock sites.<br/>
          <em>Dark luxury b-roll for creators who refuse to look generic.</em>
        </p>
        <div className="hero-ctas">
          <Link href="/browse" className="btn-gold">Browse the Vault</Link>
          <Link href="/subscribe" className="btn-outline">Start Trial — $5</Link>
        </div>
        <div className="hero-rule"/>
      </section>

      {/* STATS */}
      <div className="stats sr">
        <div className="stats-inner">
          {[
            {num:'CC0',     label:'Licensed\nPost Freely — No Attribution'},
            {num:'8',       label:'Aesthetic\nContent Categories'},
            {num:'Weekly',  label:'New Drops\nAlways Fresh'},
            {num:'0',       label:'Algorithmic\nCompromises'},
          ].map(s=>(
            <div key={s.num} className="stat">
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PREVIEW STRIP — video assets autoplay silently */}
      <section className="preview sr">
        <div className="preview-hdr">
          <span className="preview-hdr-label">Inside the Vault</span>
          <div className="preview-hdr-line"/>
          <Link href="/browse" className="preview-hdr-link">Browse All</Link>
        </div>
        <div className="preview-scroll">
          {previewAssets.length > 0
            ? previewAssets.map(a => (
                <Link key={a.id} href={`/asset/${a.id}`} className="preview-item">
                  {a.asset_type === 'video' ? (
                    /* VIDEO: autoplay muted — works on mobile too */
                    <video
                      src={a.cloudinary_url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={{width:'100%',height:'100%',objectFit:'cover',display:'block',opacity:.88}}
                    />
                  ) : displayUrl(a) ? (
                    <img src={displayUrl(a)} alt={a.title ?? ''} loading="lazy"/>
                  ) : (
                    <div style={{width:'100%',height:'100%',background:'rgba(255,255,255,.02)'}}/>
                  )}
                  {a.asset_type === 'video' && (
                    <div className="preview-vid-badge">VIDEO</div>
                  )}
                  <div className="preview-item-overlay">
                    <div className="preview-item-title">{a.title ?? 'Vault Asset'}</div>
                  </div>
                </Link>
              ))
            : Array.from({length:6}).map((_,i)=>(
                <div key={i} className="preview-placeholder">
                  <div className="preview-placeholder-line"/>
                  <span style={{fontFamily:'monospace',fontSize:11,letterSpacing:3,color:'rgba(201,168,76,.15)',textTransform:'uppercase'}}>Loading</span>
                  <div className="preview-placeholder-line"/>
                </div>
              ))
          }
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="how-inner">
          <div className="sec-label sr">How It Works</div>
          <div className="how-steps">
            {[
              {n:'01',t:'Browse the Vault',d:'Search by mood, not keywords. Type "moody 2AM workspace" and the library answers. Content curated for dark luxury aesthetics — not for algorithmic performance.'},
              {n:'02',t:'Download Instantly',d:'CC0 licensed. No attribution required. No forms to fill. Download HD and post anywhere — TikTok, Reels, YouTube, Pinterest. The file is yours, permanently.'},
              {n:'03',t:'Post and Stand Out',d:'Dark luxury content that looks nothing like generic stock. Your feed will look different. That is the point. UMBRA exists because the alternative is beige.'},
            ].map((s,i)=>(
              <div key={s.n} className="how-step sr" style={{transitionDelay:`${i*.12}s`}}>
                <div className="how-n">{s.n}</div>
                <div className="how-t">{s.t}</div>
                <div className="how-d">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SENSORY ENGINE */}
      <section className="sensory">
        <div className="sensory-inner">
          <div className="sense-txt sr">
            <div className="sec-label">The Sensory Engine</div>
            <h2>Type a mood.<br/><em>The vault responds.</em></h2>
            <p>Every other search engine finds words near your word. UMBRA finds the feeling behind it.</p>
            <p style={{marginTop:14}}>Type <strong style={{color:'var(--t)'}}>&#x201C;2AM dark workspace&#x201D;</strong> and the platform surfaces content that holds that exact atmospheric weight — not by tag, by resonance.</p>
            {[
              'SEARCH BY MOOD, TEXTURE, SENSATION — NOT KEYWORDS',
              'THE INTERFACE BREATHES THE AESTHETIC IN REAL TIME',
              'RESULTS CURATED FOR TRUTH — NOT ENGAGEMENT SCORE',
            ].map((txt,i)=>(
              <div key={i} className="sense-bullet" style={{marginTop:i===0?28:0}}>
                <div className="sb-n">0{i+1}</div>
                <div className="sb-t">{txt}</div>
              </div>
            ))}
          </div>
          <div className="sr" style={{transitionDelay:'.18s'}}><SensoryDemo/></div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="categories" id="categories">
        <div className="sec-label sr">What Is Inside</div>
        <div className="cat-grid">
          {CATEGORIES.map((c,i)=>(
            <div key={c.n} className="cat-tile sr" style={{transitionDelay:`${i*.07}s`,background:c.g+'40'}}>
              <div style={{position:'absolute',inset:0,background:c.g,opacity:.08}}/>
              <div className="cat-tile-n">{c.n}</div>
              <div className="cat-tile-t">{c.t}</div>
              <div className="cat-tile-d">{c.d}</div>
              <Link href={c.link} className="cat-tile-link">Explore</Link>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="tiers">
        <div className="pricing-inner">
          <div className="sec-label sr">Access Tiers</div>
          <div className="price-grid">
            {[
              {name:'NOIR',    amt:'$15', period:'/month',feat:false,corner:'ENTRY POINT',tag:'For creators who see in the dark.',
               feats:['30 CC0 downloads / month','Full sensory search engine','The Block auction access','Priority new arrivals','24hr early drop access'],
               cta:'Start with NOIR',href:'/subscribe'},
              {name:'PRESTIGE',amt:'$39', period:'/month',feat:true, corner:'MOST CHOSEN',tag:'Unlimited. No ceiling. No compromise.',
               feats:['Unlimited downloads','Ghost collections access','48hr early drop access','The Block early bidding','Aesthetic DNA report','Whisper Network'],
               cta:'Ascend to PRESTIGE',href:'/subscribe'},
              {name:'OBSIDIAN',amt:'$99', period:'/month',feat:false,corner:'INNER CIRCLE',tag:'Beyond the velvet rope.',
               feats:['Everything in PRESTIGE','Full API access','The Spice Route collection','Inner Circle dispatches','72hr early drop access','Analog Signal print'],
               cta:'Enter OBSIDIAN',href:'/subscribe'},
            ].map((t,i)=>(
              <div key={t.name} className={`price-card sr${t.feat?' feat':''}`} style={{transitionDelay:`${i*.1}s`}}>
                <div className="price-corner">{t.corner}</div>
                <div className="price-badge">{t.name}</div>
                <div className="price-amt">{t.amt}</div>
                <div className="price-period">{t.period}</div>
                <div className="price-tagline">{t.tag}</div>
                <ul className="price-features">
                  {t.feats.map(f=><li key={f}>{f}</li>)}
                </ul>
                <Link href={t.href} className={`price-cta${t.feat?' feat-cta':''}`}>{t.cta}</Link>
              </div>
            ))}
          </div>
          <p className="price-trial-note sr" style={{transitionDelay:'.35s'}}>
            Not ready to commit? <Link href="/subscribe">Try 7 days for $5</Link> — then choose your tier.
          </p>
        </div>
      </section>

      {/* WAITLIST */}
      <section className="waitlist" id="waitlist">
        <div className="wl-inner">
          <div className="sec-label sr" style={{justifyContent:'center'}}>The Shadow Opens</div>
          {count!==null&&<div className="wl-count sr">{count.toLocaleString()} {count===1?'soul':'souls'} already in the shadow</div>}
          <h2 className="wl-h sr">Enter <span>Before</span> the World Knows</h2>
          <p className="wl-sub sr" style={{transitionDelay:'.1s'}}>
            The first 100 subscribers enter at a locked-in price — forever.
            Their names go on the Founding Wall. Their access never expires.
          </p>
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
                  <span style={{position:'absolute',right:16,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'rgba(201,168,76,.4)',fontSize:14}}>&#9662;</span>
                </div>
                {fstat==='error'&&<p className="wl-err">{ferr}</p>}
                <button className="wl-btn" type="submit" disabled={!canSub}>{fstat==='loading'?'...':'Enter the Shadow'}</button>
              </div>
            </form>
          )}
          <p className="wl-note sr" style={{transitionDelay:'.4s'}}>No notifications. No marketing. One email — when it opens.</p>
        </div>
      </section>

      {/* ORIGIN */}
      <section className="origin">
        <p className="origin-text sr">
          One mind. <strong>Zero permission.</strong><br/>
          Built in the hours the world wasn&apos;t watching.<br/>
          <em>The right conditions were never coming. So the platform was built instead.</em>
        </p>
        <span className="origin-sig sr" style={{transitionDelay:'.15s'}}>REY TEMPEST &nbsp;&middot;&nbsp; TEMPEST GROUP &nbsp;&middot;&nbsp; 2026</span>
      </section>

      <footer>
        <div className="f-mark">UMBRA</div>
        <div className="f-links">
          <Link href="/browse">Vault</Link>
          <Link href="/subscribe">Access</Link>
          <Link href="/manifesto">Manifesto</Link>
          <Link href="/auth/login">Sign In</Link>
        </div>
        <div className="f-note">&copy; 2026 Tempest Group</div>
      </footer>
    </>
  )
}
