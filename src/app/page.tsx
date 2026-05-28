'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const S = `
:root{
  --void:#040406;
  --gold:#c9a84c;--gold-b:#f0d98a;--gold-d:#9a7a36;
  --gg:rgba(201,168,76,.07);
  --t:#eeeef8;--td:#c4c4dc;--tg:#9898b4;--tm:#787890;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
::selection{background:rgba(201,168,76,.22);color:var(--gold)}
::-webkit-scrollbar{width:2px}::-webkit-scrollbar-track{background:var(--void)}::-webkit-scrollbar-thumb{background:var(--gold-d)}
html{scroll-behavior:smooth}
body{background:var(--void);color:var(--t);font-family:var(--font-display),serif;overflow-x:hidden;cursor:none;-webkit-font-smoothing:antialiased;}
@media(max-width:768px){body{cursor:auto}}

/* CURTAIN */
#cv{position:fixed;inset:0;background:var(--void);z-index:9000;display:flex;align-items:center;justify-content:center;flex-direction:column;transition:opacity 1.4s ease .3s,visibility 1.4s ease .3s;}
#cv.off{opacity:0;visibility:hidden;pointer-events:none;}
.bw{width:360px;margin-bottom:52px;}
.bl{font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:.22em;color:rgba(201,168,76,0);line-height:2.4;text-transform:uppercase;}
.bl.on{color:rgba(201,168,76,.45);transition:color .25s;}
.bl.last.on{color:rgba(201,168,76,.9);}
.cm{font-family:var(--font-cinzel),serif;font-size:clamp(60px,12vw,130px);font-weight:900;letter-spacing:.1em;color:transparent;background:linear-gradient(165deg,#9a7a36,#c9a84c,#f0d98a,#c9a84c,#9a7a36);-webkit-background-clip:text;background-clip:text;opacity:0;transform:scale(.92);}
.cm.on{animation:cmr 1.3s cubic-bezier(.16,1,.3,1) forwards;}
@keyframes cmr{to{opacity:1;transform:scale(1);filter:blur(0)}}
.cs{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:.45em;color:rgba(201,168,76,.3);text-transform:uppercase;margin-top:16px;opacity:0;}
.cs.on{animation:fu .5s ease .1s forwards;}

/* CURSOR — NEXUS RETICLE */
#nx{position:fixed;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);}
.nx-ring{position:absolute;width:60px;height:60px;top:-30px;left:-30px;border-radius:50%;border:1px solid rgba(201,168,76,.08);transition:all .4s cubic-bezier(.175,.885,.32,1.1);}
.nx-outer{position:absolute;width:40px;height:40px;top:-20px;left:-20px;animation:nxs 18s linear infinite;}
.nx-seg{position:absolute;width:100%;height:100%;}
.nx-seg::before{content:'';position:absolute;width:8px;height:1px;background:rgba(201,168,76,.55);top:50%;left:0;transform:translateY(-50%);}
.nx-seg::after{content:'';position:absolute;width:8px;height:1px;background:rgba(201,168,76,.55);top:50%;right:0;transform:translateY(-50%);}
.nx-seg:nth-child(2){transform:rotate(90deg)}
.nx-inner{position:absolute;width:24px;height:24px;top:-12px;left:-12px;animation:nxsr 6s linear infinite;}
.nx-arc{position:absolute;width:100%;height:100%;border-radius:50%;border:1px solid transparent;border-top:1px solid rgba(201,168,76,.4);border-right:1px solid rgba(201,168,76,.15);}
.nx-dot{position:absolute;width:5px;height:5px;top:-2.5px;left:-2.5px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px var(--gold),0 0 18px rgba(201,168,76,.5);animation:nxp 2.2s ease-in-out infinite;}
body.hov .nx-outer{animation-duration:2s;}
body.hov .nx-inner{animation-duration:1s;}
body.hov .nx-ring{width:36px;height:36px;top:-18px;left:-18px;border-color:rgba(201,168,76,.28);}
body.hov .nx-dot{box-shadow:0 0 12px var(--gold-b),0 0 30px rgba(240,217,138,.6);}
@keyframes nxs{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes nxsr{from{transform:rotate(0)}to{transform:rotate(-360deg)}}
@keyframes nxp{0%,100%{opacity:.7;box-shadow:0 0 5px var(--gold),0 0 12px rgba(201,168,76,.4)}50%{opacity:1;box-shadow:0 0 12px var(--gold-b),0 0 28px rgba(201,168,76,.6),0 0 50px rgba(201,168,76,.15)}}
#tc{position:fixed;inset:0;pointer-events:none;z-index:9990;}
@media(max-width:768px){#nx,#tc{display:none}}

/* CANVAS + GRAIN + VIG */
#pc{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.9}
.vig{position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at center,transparent 25%,rgba(4,4,6,.88) 100%);}
body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:997;opacity:.02;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:180px;}

/* PROGRESS BAR */
#pb{position:fixed;top:0;left:0;height:1px;background:linear-gradient(90deg,transparent,var(--gold),var(--gold-b));z-index:200;transition:width .1s linear;pointer-events:none;}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:24px 56px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(to bottom,rgba(4,4,6,.92),transparent);}
.nm{font-family:var(--font-cinzel),serif;font-size:13px;font-weight:700;letter-spacing:8px;color:var(--gold);text-decoration:none;opacity:0;animation:fu .8s ease forwards 4.5s;}
.nl{display:flex;gap:32px;opacity:0;animation:fu .8s ease forwards 4.7s;}
.nl a{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--tg);text-decoration:none;transition:color .3s;}
.nl a:hover{color:var(--gold)}
.np{display:flex;align-items:center;gap:8px;font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:.25em;color:rgba(201,168,76,.4);opacity:0;animation:fu .8s ease forwards 4.9s;}
.npd{width:5px;height:5px;border-radius:50%;background:rgba(80,220,80,.7);box-shadow:0 0 8px rgba(80,220,80,.4);animation:npda 2.5s ease-in-out infinite;}
@keyframes npda{0%,100%{opacity:.4}50%{opacity:1}}

/* HERO */
.hero{position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 40px 80px;z-index:1;overflow:hidden;}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 65% at 50% 50%,rgba(201,168,76,.09) 0%,transparent 60%);pointer-events:none;}
.hsc{position:absolute;inset:0;pointer-events:none;z-index:1;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.014) 3px,rgba(0,0,0,.014) 4px);}
.hf{position:absolute;inset:0;pointer-events:none;z-index:2;}
.hc{position:absolute;width:44px;height:44px;opacity:0;animation:fu .4s ease forwards;}
.hc.a{top:84px;left:56px;border-top:1px solid rgba(201,168,76,.3);border-left:1px solid rgba(201,168,76,.3);animation-delay:4s}
.hc.b{top:84px;right:56px;border-top:1px solid rgba(201,168,76,.3);border-right:1px solid rgba(201,168,76,.3);animation-delay:4.1s}
.hc.c{bottom:84px;left:56px;border-bottom:1px solid rgba(201,168,76,.3);border-left:1px solid rgba(201,168,76,.3);animation-delay:4.2s}
.hc.d{bottom:84px;right:56px;border-bottom:1px solid rgba(201,168,76,.3);border-right:1px solid rgba(201,168,76,.3);animation-delay:4.3s}
.ht{position:absolute;font-family:var(--font-mono),monospace;font-size:7.5px;letter-spacing:.2em;color:rgba(201,168,76,.25);text-transform:uppercase;opacity:0;animation:fu .4s ease forwards 4.5s;}
.ht.a{top:136px;left:56px}.ht.b{top:136px;right:56px;text-align:right}.ht.c{bottom:136px;left:56px}
.hey{font-family:var(--font-mono),monospace;font-size:11px;letter-spacing:6px;color:var(--gold-d);text-transform:uppercase;margin-bottom:44px;opacity:0;animation:fu .9s ease forwards .5s;min-height:1.5em;z-index:3;position:relative;}
.htw{position:relative;z-index:3;}
.ht1{font-family:var(--font-cinzel),serif;font-size:clamp(100px,20vw,240px);font-weight:900;line-height:.84;letter-spacing:-4px;color:transparent;background:linear-gradient(165deg,var(--gold-d) 0%,var(--gold) 26%,var(--gold-b) 50%,var(--gold) 74%,var(--gold-d) 100%);-webkit-background-clip:text;background-clip:text;opacity:0;animation:htr 1.9s cubic-bezier(.16,1,.3,1) forwards 1s;overflow:hidden;position:relative;}
.ht1::after{content:'UMBRA';position:absolute;inset:0;background:inherit;-webkit-background-clip:text;background-clip:text;color:transparent;filter:blur(60px);opacity:.5;z-index:-1;}
.hs{position:absolute;top:0;left:-120%;width:45%;height:100%;background:linear-gradient(90deg,transparent,rgba(240,217,138,.25),transparent);transform:skewX(-12deg);animation:sws 11s ease 3s infinite;pointer-events:none;z-index:4;}
@keyframes sws{0%{left:-120%}25%{left:200%}100%{left:200%}}
.hk{font-family:var(--font-display),serif;font-size:clamp(17px,2.2vw,24px);font-style:italic;color:var(--td);letter-spacing:1.5px;margin-top:28px;max-width:620px;line-height:1.6;opacity:0;animation:fu .9s ease forwards 2.7s;z-index:3;position:relative;}
.hdv{width:1px;height:52px;background:linear-gradient(to bottom,transparent,var(--gold-d),transparent);margin:44px auto 0;opacity:0;animation:fu .9s ease forwards 3.2s;}
.sh{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;opacity:0;animation:fu .9s ease forwards 3.7s;}
.sh span{font-family:var(--font-mono),monospace;font-size:8.5px;letter-spacing:5px;text-transform:uppercase;color:var(--tm);}
.sl{width:1px;height:34px;background:linear-gradient(to bottom,var(--gold-d),transparent);animation:slp 2s ease infinite;}
@keyframes slp{0%,100%{opacity:.35;transform:scaleY(1)}50%{opacity:1;transform:scaleY(1.2)}}

/* PROBLEM SECTION — SCROLLYTELLING */
.prob{position:relative;z-index:1;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:120px 56px;overflow:hidden;}
.prob::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 40%,rgba(201,168,76,.055) 0%,transparent 65%);pointer-events:none;}
.prob-inner{max-width:900px;text-align:center;}
.prob-kicker{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--gold-d);margin-bottom:56px;}
.prob-line{font-family:var(--font-cinzel),serif;font-size:clamp(28px,5vw,64px);font-weight:400;line-height:1.2;margin-bottom:24px;color:var(--t);}
.prob-line.dim{color:var(--td);}
.prob-line.muted{color:var(--tg);}
.prob-accent{font-family:var(--font-display),serif;font-style:italic;color:var(--gold);font-size:1.1em;}
.prob-break{width:60px;height:1px;background:linear-gradient(to right,transparent,var(--gold-d),transparent);margin:52px auto;}
.prob-gold{font-family:var(--font-cinzel),serif;font-size:clamp(22px,4vw,54px);font-weight:700;color:transparent;background:linear-gradient(90deg,var(--gold-d),var(--gold-b),var(--gold));-webkit-background-clip:text;background-clip:text;font-style:italic;line-height:1.3;}
.prob-small{font-family:var(--font-display),serif;font-style:italic;font-size:clamp(15px,1.8vw,20px);color:var(--tg);line-height:1.8;margin-top:20px;}

/* STATS BAND */
.stats{position:relative;z-index:1;padding:80px 56px;border-top:1px solid rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.04);overflow:hidden;}
.stats-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:2px;}
.stat-item{padding:40px 28px;border:1px solid rgba(255,255,255,.03);text-align:center;position:relative;overflow:hidden;}
.stat-item::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 100%,rgba(201,168,76,.04),transparent 60%);opacity:0;transition:opacity .4s;}
.stat-item:hover::before{opacity:1}
.stat-num{font-family:var(--font-cinzel),serif;font-size:clamp(40px,5vw,68px);font-weight:900;color:transparent;background:linear-gradient(165deg,var(--gold-d),var(--gold),var(--gold-b));-webkit-background-clip:text;background-clip:text;line-height:1;margin-bottom:10px;}
.stat-label{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--tg);}
.stat-note{font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:2px;color:var(--tm);margin-top:6px;}

/* SENSORY ENGINE */
.sense{position:relative;z-index:1;padding:120px 56px 140px;overflow:hidden;}
.sense::before{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.15),transparent);}
.sense-in{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;}
.s-label{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--gold-d);margin-bottom:28px;display:flex;align-items:center;gap:16px;}
.s-label::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(201,168,76,.2),transparent)}
.s-h2{font-family:var(--font-cinzel),serif;font-size:clamp(28px,3.5vw,44px);font-weight:400;color:var(--t);line-height:1.2;margin-bottom:22px;}
.s-h2 em{color:var(--gold);font-style:italic;font-family:var(--font-display),serif;}
.s-p{font-size:clamp(15px,1.6vw,18px);color:var(--td);line-height:2.1;font-weight:300;}
.s-p+.s-p{margin-top:14px}
.s-p strong{color:var(--t);font-weight:400;}
.sb{display:flex;align-items:flex-start;gap:14px;margin-top:20px;}
.sb-n{width:24px;height:24px;flex-shrink:0;border:1px solid rgba(201,168,76,.2);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono),monospace;font-size:8.5px;color:var(--gold-d);}
.sb-t{font-family:var(--font-mono),monospace;font-size:10.5px;color:var(--tg);line-height:1.8;letter-spacing:.06em;}

/* DEMO PANEL */
.dp{border:1px solid rgba(201,168,76,.15);border-radius:2px;overflow:hidden;transition:border-color .8s ease;}
.dpt{display:flex;align-items:center;gap:8px;padding:10px 16px;background:rgba(0,0,0,.65);border-bottom:1px solid rgba(255,255,255,.04);}
.dd{width:8px;height:8px;border-radius:50%;}
.dd.r{background:rgba(255,80,80,.5)}.dd.y{background:rgba(201,168,76,.5)}.dd.g{background:rgba(80,200,80,.35)}
.dt{font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:.3em;color:var(--tm);margin-left:6px;}
.db{padding:26px 20px 20px;min-height:340px;position:relative;transition:background 1.4s ease;}
.dsr{display:flex;margin-bottom:20px;border:1px solid rgba(201,168,76,.18);transition:border-color .8s ease;}
.dsp{padding:12px 13px;font-family:var(--font-mono),monospace;font-size:11px;background:rgba(0,0,0,.3);border-right:1px solid rgba(255,255,255,.04);}
.dsi{flex:1;background:transparent;border:none;outline:none;color:var(--t);font-family:var(--font-mono),monospace;font-size:11px;letter-spacing:.06em;padding:12px 10px;}
.dsb{padding:12px 16px;font-family:var(--font-cinzel),serif;font-size:8px;letter-spacing:.35em;text-transform:uppercase;background:transparent;border:none;border-left:1px solid rgba(255,255,255,.04);transition:all .3s;}
.dsb.sc{animation:sp .5s ease-in-out infinite;}
@keyframes sp{0%,100%{opacity:1}50%{opacity:.35}}
.dss{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
.dsd{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.dst{font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:.2em;color:var(--tm);}
.dcs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
.dc{border-radius:2px;overflow:hidden;transform:translateY(10px);opacity:0;transition:opacity .5s ease,transform .5s ease;}
.dc.show{transform:translateY(0);opacity:1;}
.dci{height:72px;transition:background 1.4s ease;}
.dcf{padding:7px 9px;background:rgba(0,0,0,.55);}
.dct{font-family:var(--font-mono),monospace;font-size:7.5px;letter-spacing:.1em;color:var(--td);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dcc{font-size:7px;color:var(--tg);margin-top:3px;font-family:var(--font-mono),monospace;}
.dftr{position:absolute;bottom:9px;right:12px;font-family:var(--font-mono),monospace;font-size:7px;letter-spacing:.2em;color:rgba(201,168,76,.25);}
.bl2{animation:bl2a 1s step-end infinite;}
@keyframes bl2a{0%,100%{opacity:1}50%{opacity:0}}

/* MANIFESTO */
.mf{position:relative;z-index:1;padding:140px 0;overflow:hidden;}
.mf::before{content:'';position:absolute;left:50%;transform:translateX(-50%);top:0;width:1px;height:100%;background:linear-gradient(to bottom,transparent,rgba(201,168,76,.07),transparent);}
.mf-in{max-width:800px;margin:0 auto;padding:0 56px;}
.ml-label{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--gold-d);margin-bottom:60px;display:flex;align-items:center;gap:18px;}
.ml-label::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(201,168,76,.18),transparent)}
.ml{margin-bottom:52px;}
.ml h2{font-family:var(--font-cinzel),serif;font-size:clamp(22px,3.4vw,38px);font-weight:400;color:var(--t);line-height:1.2;margin-bottom:20px;}
.ml h2 em{font-style:italic;color:var(--gold);font-family:var(--font-display),serif;font-size:1.1em;}
.ml p{font-size:clamp(15.5px,1.8vw,18.5px);color:var(--td);line-height:2.2;font-weight:300;}
.ml p strong{color:var(--t);font-weight:400}
.mdv{width:44px;height:1px;background:var(--gold-d);margin:56px 0;transform:scaleX(0);transform-origin:left;}
.mst{font-family:var(--font-cinzel),serif;font-size:clamp(28px,4.5vw,54px);font-weight:700;line-height:1.2;color:transparent;background:linear-gradient(135deg,var(--gold-d),var(--gold),var(--gold-b),var(--gold));-webkit-background-clip:text;background-clip:text;}

/* SCROLLYTELLING — WORD REVEAL */
.wr span{display:inline-block;opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s ease;}
.wr.vis span{opacity:1;transform:translateY(0);}

/* EQUATION */
.eq{position:relative;z-index:1;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 56px;overflow:hidden;}
.eq::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 50%,rgba(201,168,76,.07) 0%,transparent 60%);pointer-events:none;}
.eq-w{max-width:900px;}
.eq-pre{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--gold-d);margin-bottom:64px;}
.eq-l{font-family:var(--font-cinzel),serif;font-size:clamp(22px,4.2vw,52px);font-weight:400;color:var(--td);line-height:1.45;}
.eq-l.g{color:transparent;background:linear-gradient(90deg,var(--gold-d),var(--gold-b),var(--gold));-webkit-background-clip:text;background-clip:text;font-style:italic;}
.eq-b{width:60px;height:1px;background:linear-gradient(to right,transparent,var(--gold-d),transparent);margin:48px auto;}
.eq-sub{font-family:var(--font-display),serif;font-style:italic;font-size:clamp(14px,2vw,21px);color:var(--tg);line-height:1.8;margin-top:20px;}

/* GALLERY */
.gal{position:relative;z-index:1;padding:100px 56px 120px;overflow:hidden;}
.gal::before{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.12),transparent);}
.gal-in{max-width:1200px;margin:0 auto;}
.gal-grid{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:280px;gap:3px;margin-top:64px;}
.gal-card{position:relative;overflow:hidden;background:rgba(255,255,255,.02);}
.gal-card.portrait{grid-row:span 2;}
.gal-card.landscape{grid-column:span 1;}
.gal-placeholder{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;}
.gal-placeholder-icon{font-family:var(--font-cinzel),serif;font-size:11px;letter-spacing:4px;color:rgba(201,168,76,.2);text-transform:uppercase;}
.gal-placeholder-label{font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:3px;color:rgba(201,168,76,.15);text-transform:uppercase;}
.gal-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .8s ease,filter .8s ease;}
.gal-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .8s ease;}
.gal-card:hover .gal-img,.gal-card:hover .gal-vid{transform:scale(1.04);filter:brightness(1.05);}
.gal-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(4,4,6,.85) 0%,transparent 50%);pointer-events:none;opacity:0;transition:opacity .4s;}
.gal-card:hover .gal-overlay{opacity:1;}
.gal-info{position:absolute;bottom:0;left:0;right:0;padding:18px 20px;transform:translateY(8px);opacity:0;transition:all .4s ease;}
.gal-card:hover .gal-info{transform:translateY(0);opacity:1;}
.gal-t{font-family:var(--font-cinzel),serif;font-size:13px;letter-spacing:2px;color:var(--t);}
.gal-c{font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:3px;color:rgba(201,168,76,.65);margin-top:4px;text-transform:uppercase;}
.gal-grad-1{background:linear-gradient(145deg,#0a0a22,#14143a,#05051a);}
.gal-grad-2{background:linear-gradient(145deg,#0f0906,#1e1108,#0f0906);}
.gal-grad-3{background:linear-gradient(145deg,#020c10,#041622,#020c10);}
.gal-grad-4{background:linear-gradient(145deg,#0b020f,#180520,#0b020f);}
.gal-grad-5{background:linear-gradient(145deg,#0e0408,#1c0712,#0e0408);}
.gal-grad-6{background:linear-gradient(145deg,#070b12,#0e1220,#070b12);}

/* ARCH */
.arch{position:relative;z-index:1;padding:100px 56px 120px;overflow:hidden;}
.arch::before{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.12),transparent);}
.arch-in{max-width:920px;margin:0 auto;}

/* DNA */
.dna{position:relative;z-index:1;padding:80px 56px 120px;overflow:hidden;}
.dna-in{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;}
.dna-h2{font-family:var(--font-cinzel),serif;font-size:clamp(24px,3vw,40px);font-weight:400;color:var(--t);line-height:1.25;margin-bottom:20px;}
.dna-p{font-size:clamp(14px,1.6vw,17px);color:var(--td);line-height:2.1;font-weight:300;}
.dna-p+.dna-p{margin-top:14px}
.dna-tags{font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:.12em;color:var(--tg);line-height:2.2;margin-top:18px;}

/* LAW */
.law{position:relative;z-index:1;padding:0 0 140px;max-width:1100px;margin:0 auto;padding-left:56px;padding-right:56px;}
.law-hd{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--gold-d);margin-bottom:80px;display:flex;align-items:center;gap:18px;}
.law-hd::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(201,168,76,.18),transparent)}
.law-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px}
.li{background:rgba(255,255,255,.014);border:1px solid rgba(255,255,255,.02);padding:40px 34px;position:relative;overflow:hidden;transition:background .4s,border-color .4s;}
.li::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--gold);transform:scaleY(0);transform-origin:top;transition:transform .4s ease;}
.li:hover::before{transform:scaleY(1)}
.li:hover{background:var(--gg);border-color:rgba(201,168,76,.1)}
.li-n{font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:3px;color:var(--gold-d);margin-bottom:16px;}
.li-t{font-family:var(--font-cinzel),serif;font-size:15px;font-weight:600;color:var(--t);margin-bottom:12px;letter-spacing:.4px;line-height:1.3;}
.li-d{font-size:14px;color:var(--td);line-height:1.95;font-weight:300}

/* TIERS */
.tiers{position:relative;z-index:1;padding:0 56px 140px;overflow:hidden;}
.tiers::before{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.12),transparent);}
.tiers-in{max-width:1100px;margin:0 auto;}
.tg2{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin-top:64px;}
.tc{padding:34px 24px;border:1px solid rgba(255,255,255,.03);background:rgba(255,255,255,.01);position:relative;transition:background .3s;}
.tc:hover{background:rgba(255,255,255,.022)}
.tc.feat{border-color:rgba(201,168,76,.2);background:rgba(201,168,76,.03);}
.tc-tag{position:absolute;top:12px;right:12px;font-family:var(--font-mono),monospace;font-size:7px;letter-spacing:.2em;color:rgba(201,168,76,.3);text-transform:uppercase;}
.tc-name{font-family:var(--font-cinzel),serif;font-size:15px;letter-spacing:3px;color:var(--t);margin-bottom:10px;}
.tc-name.g{color:var(--gold)}
.tc-price{font-family:var(--font-mono),monospace;font-size:24px;color:var(--td);margin-bottom:6px;font-weight:700;}
.tc-price span{font-size:10px;letter-spacing:.2em;color:var(--tg);font-weight:400;}
.tc-note{font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:.2em;color:rgba(201,168,76,.4);margin-bottom:22px;}
.tc-ul{list-style:none;}
.tc-ul li{font-family:var(--font-mono),monospace;font-size:9.5px;letter-spacing:.08em;color:var(--tg);padding:6px 0;border-bottom:1px solid rgba(255,255,255,.03);}
.tc-ul li::before{content:'— ';color:rgba(201,168,76,.3);}

/* WAITLIST */
.wl{position:relative;z-index:1;padding:0 56px 180px;text-align:center}
.wl-in{max-width:600px;margin:0 auto}
.wl-pre{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--gold-d);margin-bottom:28px;}
.wl-cnt{font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:4px;color:rgba(201,168,76,.6);margin-bottom:22px;}
.wl-h2{font-family:var(--font-cinzel),serif;font-size:clamp(32px,5vw,58px);font-weight:700;color:var(--t);line-height:1.1;margin-bottom:18px;}
.wl-h2 span{color:var(--gold)}
.wl-sub{font-family:var(--font-display),serif;font-style:italic;font-size:clamp(15px,1.8vw,19px);color:var(--td);line-height:1.9;margin-bottom:48px;}
.wl-form{display:flex;flex-direction:column;gap:1px;max-width:500px;margin:0 auto;}
.wl-i,.wl-s{width:100%;background:rgba(255,255,255,.025);border:1px solid rgba(201,168,76,.15);border-bottom:none;color:var(--t);outline:none;transition:border-color .3s,background .3s;}
.wl-i{font-family:var(--font-display),serif;font-size:15.5px;padding:15px 20px;letter-spacing:.5px;}
.wl-i::placeholder{color:var(--tm);font-style:italic}
.wl-i:focus,.wl-s:focus{border-color:rgba(201,168,76,.4);background:rgba(201,168,76,.03);}
.wl-s{font-family:var(--font-mono),monospace;font-size:10.5px;letter-spacing:.15em;padding:15px 20px;-webkit-appearance:none;appearance:none;cursor:none;color:var(--tm);}
.wl-s.fld{color:var(--td);}
.wl-s option{background:#111;color:var(--t);}
.wl-btn{width:100%;background:var(--gold);border:1px solid var(--gold);border-top:none;color:var(--void);font-family:var(--font-cinzel),serif;font-size:12px;font-weight:700;letter-spacing:5px;text-transform:uppercase;padding:18px;cursor:none;transition:all .3s;position:relative;overflow:hidden;}
.wl-btn::after{content:'';position:absolute;top:50%;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);transform:translateY(-50%);transition:left .45s ease;}
.wl-btn:hover{background:var(--gold-b);border-color:var(--gold-b);}
.wl-btn:hover::after{left:110%}
.wl-btn:disabled{opacity:.3;pointer-events:none}
.wl-note{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:3px;color:var(--tm);margin-top:18px;}
.wl-ok{display:none;padding:52px;border:1px solid rgba(201,168,76,.22);background:var(--gg);position:relative;overflow:hidden;}
.wl-ok::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(201,168,76,.12),transparent 55%);pointer-events:none;}
.wl-ok.show{display:block}
.wl-num{font-family:var(--font-cinzel),serif;font-size:clamp(60px,10vw,100px);font-weight:900;color:var(--gold);line-height:1;margin-bottom:14px;text-shadow:0 0 60px rgba(201,168,76,.3);}
.wl-ok-t{font-family:var(--font-display),serif;font-style:italic;font-size:20px;color:var(--td);line-height:1.75;}
.wl-err{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:2px;color:rgba(220,80,80,.75);margin-top:10px;}

/* ORIGIN */
.ori{position:relative;z-index:1;border-top:1px solid rgba(201,168,76,.06);padding:140px 56px;text-align:center;overflow:hidden;}
.ori-glow{position:absolute;width:600px;height:360px;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(ellipse,rgba(201,168,76,.055) 0%,transparent 60%);animation:og 7s ease-in-out infinite;pointer-events:none;}
@keyframes og{0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.22)}}
.ori-t{font-family:var(--font-display),serif;font-style:italic;font-size:clamp(17px,1.9vw,22px);color:var(--tg);letter-spacing:1px;line-height:2.7;position:relative;z-index:1;}
.ori-t strong{color:rgba(201,168,76,.75);font-style:normal;font-weight:400}
.ori-dv{width:40px;height:1px;background:linear-gradient(to right,transparent,var(--gold-d),transparent);margin:44px auto;}
.ori-sig{font-family:var(--font-cinzel),serif;font-size:11px;letter-spacing:5px;color:var(--gold-d);position:relative;z-index:1;}

/* FOOTER */
footer{position:relative;z-index:1;border-top:1px solid rgba(255,255,255,.02);padding:36px 56px;display:flex;justify-content:space-between;align-items:center;}
.fm{font-family:var(--font-cinzel),serif;font-size:11px;letter-spacing:6px;color:var(--gold-d)}
.fn{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:3px;color:var(--tm);text-transform:uppercase}

/* SECTION LABEL */
.sec-l{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--gold-d);margin-bottom:56px;display:flex;align-items:center;gap:16px;}
.sec-l::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(201,168,76,.18),transparent)}

/* SCROLL ANIMATIONS */
.sr{opacity:0;transform:translateY(24px);transition:opacity .9s ease,transform .9s ease;}
.sr.vis{opacity:1;transform:translateY(0)}
.sr2{opacity:0;transform:translateX(-24px);transition:opacity .9s ease,transform .9s ease;}
.sr2.vis{opacity:1;transform:translateX(0)}
.sr3{opacity:0;transform:scale(.97);transition:opacity .9s ease,transform .9s ease;}
.sr3.vis{opacity:1;transform:scale(1)}
.sdv{transform:scaleX(0);transform-origin:left;transition:transform .8s ease;}
.sdv.vis{transform:scaleX(1)}
.sn{opacity:0;transform:translateY(6px);transition:opacity .7s ease,transform .7s ease;}
.sn.vis{opacity:1;transform:translateY(0)}

/* KEYFRAMES */
@keyframes fu{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes htr{0%{opacity:0;transform:scale(.93) translateY(20px);filter:blur(14px)}100%{opacity:1;transform:scale(1) translateY(0);filter:blur(0)}}

/* RESPONSIVE */
@media(max-width:1000px){.sense-in,.dna-in{grid-template-columns:1fr;gap:48px}.dp{display:none}.tg2{grid-template-columns:1fr 1fr}.gal-grid{grid-template-columns:1fr 1fr}}
@media(max-width:768px){
  nav{padding:22px 24px}.np{display:none}
  .mf-in,.law,.wl,.ori,.sense,.arch,.dna,.tiers,.gal,.stats{padding-left:24px;padding-right:24px}
  .law-grid,.tg2,.stats-inner{grid-template-columns:1fr}
  footer{flex-direction:column;gap:14px;text-align:center;padding:28px 24px}
  .hc,.ht{display:none}
  .gal-grid{grid-template-columns:1fr;grid-auto-rows:240px}
  .gal-card.portrait{grid-row:span 1}
}
`

// ─────────────────────────────────────────
// SENSORY DEMO
// ─────────────────────────────────────────
function SensoryDemo(){
  const [mi,setMi]       = useState(0)
  const [typed,setTyped] = useState('')
  const [ph,setPh]       = useState<'typing'|'hold'|'scan'|'show'|'fade'>('typing')
  const [cards,setCards] = useState([false,false,false])
  const mood = MOODS[mi]
  useEffect(()=>{
    if(ph==='typing'){
      if(typed.length<mood.query.length){const t=setTimeout(()=>setTyped(mood.query.slice(0,typed.length+1)),58);return()=>clearTimeout(t)}
      else{const t=setTimeout(()=>setPh('hold'),500);return()=>clearTimeout(t)}
    }
    if(ph==='hold'){const t=setTimeout(()=>setPh('scan'),400);return()=>clearTimeout(t)}
    if(ph==='scan'){const t=setTimeout(()=>{setPh('show');setCards([false,false,false]);setTimeout(()=>setCards(c=>[true,c[1],c[2]]),70);setTimeout(()=>setCards(c=>[c[0],true,c[2]]),240);setTimeout(()=>setCards(c=>[c[0],c[1],true]),410)},1050);return()=>clearTimeout(t)}
    if(ph==='show'){const t=setTimeout(()=>setPh('fade'),2600);return()=>clearTimeout(t)}
    if(ph==='fade'){const t=setTimeout(()=>{setCards([false,false,false]);setTyped('');setMi(i=>(i+1)%MOODS.length);setPh('typing')},800);return()=>clearTimeout(t)}
  },[ph,typed,mi,mood])
  return(
    <div className="dp" style={{borderColor:mood.accent}}>
      <div className="dpt"><div className="dd r"/><div className="dd y"/><div className="dd g"/><span className="dt">umbra://sensory_engine</span></div>
      <div className="db" style={{background:mood.bg}}>
        <div className="dsr" style={{borderColor:mood.dot}}>
          <div className="dsp" style={{color:mood.accent}}>&#9670;</div>
          <input className="dsi" readOnly value={typed}/>
          {ph==='typing'&&typed.length<mood.query.length&&<span className="bl2" style={{padding:'12px 4px',color:mood.accent,fontFamily:'monospace',fontSize:13}}>|</span>}
          <div className={`dsb${ph==='scan'?' sc':''}`} style={{color:mood.accent}}>
            {ph==='scan'?'SCANNING':'ENTER'}
          </div>
        </div>
        <div className="dss">
          <div className="dsd" style={{background:mood.accent,boxShadow:`0 0 6px ${mood.accent}`}}/>
          <span className="dst" style={{color:mood.accent}}>
            {ph==='typing'?'AWAITING_QUERY':ph==='scan'?'SCANNING_LIBRARY...':ph==='show'?`MOOD:${typed.toUpperCase().replace(/ /g,'_')} // 3 RESULTS`:'CLEARING...'}
          </span>
        </div>
        <div className="dcs">
          {mood.cards.map((c,i)=>(
            <div key={`${mi}-${i}`} className={`dc${cards[i]?' show':''}`} style={{transitionDelay:`${i*.12}s`}}>
              <div className="dci" style={{background:c.g}}/>
              <div className="dcf"><div className="dct">{c.t}</div><div className="dcc">{c.c}</div></div>
            </div>
          ))}
        </div>
        <div className="dftr">AESTHETIC_SCORE: 0.97 &nbsp;·&nbsp; MATCH: HIGH</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// ARCH DIAGRAM
// ─────────────────────────────────────────
function ArchDiagram(){
  return(
    <svg viewBox="0 0 860 640" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'auto',overflow:'visible'}}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0,2 L8,5 L0,8 Z" fill="rgba(201,168,76,.4)"/>
        </marker>
        <filter id="glo"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Lines */}
      {[[430,100,430,170],[430,245,175,320],[430,245,430,320],[430,245,685,320],[175,390,280,476],[430,390,430,476],[685,390,580,476]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(201,168,76,.14)" strokeWidth="1" strokeDasharray="5 4" markerEnd="url(#arr)"/>
      ))}
      {/* Animated flow dots */}
      {['M430,100 L430,170','M430,245 L175,320','M430,245 L430,320','M430,245 L685,320','M175,390 L280,476','M430,390 L430,476','M685,390 L580,476'].map((p,i)=>(
        <circle key={i} r="2.5" fill="rgba(201,168,76,.65)">
          <animateMotion dur={`${2+i*.25}s`} repeatCount="indefinite" path={p}/>
        </circle>
      ))}
      {/* SOVEREIGN */}
      <rect x="285" y="32" width="290" height="68" rx="1" fill="rgba(201,168,76,.07)" stroke="rgba(201,168,76,.45)" strokeWidth="1" filter="url(#glo)"/>
      <rect x="285" y="32" width="3" height="68" fill="rgba(201,168,76,.6)"/>
      <text x="432" y="58" textAnchor="middle" fill="#c9a84c" fontFamily="Cinzel,serif" fontSize="12" letterSpacing="5" fontWeight="700">SOVEREIGN</text>
      <text x="432" y="78" textAnchor="middle" fill="rgba(201,168,76,.5)" fontFamily="Courier Prime,monospace" fontSize="9" letterSpacing="2.5">REY TEMPEST · TEMPEST GROUP</text>
      {/* AI SYSTEM */}
      <rect x="230" y="170" width="400" height="75" rx="1" fill="rgba(255,255,255,.015)" stroke="rgba(255,255,255,.055)" strokeWidth="1"/>
      <text x="430" y="197" textAnchor="middle" fill="#d8d8ee" fontFamily="Cinzel,serif" fontSize="11" letterSpacing="3.5">AI SOVEREIGN SYSTEM</text>
      <text x="430" y="215" textAnchor="middle" fill="rgba(180,180,205,.6)" fontFamily="Courier Prime,monospace" fontSize="8.5" letterSpacing="1.5">AESTHETIC ENGINE · GOD ANALYTICS · VISION CORE</text>
      <text x="430" y="232" textAnchor="middle" fill="rgba(201,168,76,.28)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing="1.5">STATUS: ONLINE — NO EGO — NO FATIGUE — 24/7</text>
      {/* Library */}
      <rect x="60" y="320" width="230" height="70" rx="1" fill="rgba(255,255,255,.013)" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
      <text x="175" y="347" textAnchor="middle" fill="#c9a84c" fontFamily="Cinzel,serif" fontSize="10" letterSpacing="2.5">THE LIBRARY</text>
      <text x="175" y="366" textAnchor="middle" fill="rgba(180,180,205,.55)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing="1.5">Aesthetic assets · CC0 + licensed</text>
      <text x="175" y="382" textAnchor="middle" fill="rgba(201,168,76,.3)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing="1.5">Curated. No floor drop. Ever.</text>
      {/* Signal */}
      <rect x="320" y="320" width="220" height="70" rx="1" fill="rgba(255,255,255,.013)" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
      <text x="430" y="347" textAnchor="middle" fill="#c9a84c" fontFamily="Cinzel,serif" fontSize="10" letterSpacing="2.5">SIGNAL RADIO</text>
      <text x="430" y="366" textAnchor="middle" fill="rgba(180,180,205,.55)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing="1.5">Ambient broadcast · live · curated</text>
      <text x="430" y="382" textAnchor="middle" fill="rgba(201,168,76,.3)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing="1.5">Free at ACCESS tier</text>
      {/* Block */}
      <rect x="570" y="320" width="230" height="70" rx="1" fill="rgba(255,255,255,.013)" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
      <text x="685" y="347" textAnchor="middle" fill="#c9a84c" fontFamily="Cinzel,serif" fontSize="10" letterSpacing="2.5">THE BLOCK</text>
      <text x="685" y="366" textAnchor="middle" fill="rgba(180,180,205,.55)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing="1.5">Limited auctions · expiry dates</text>
      <text x="685" y="382" textAnchor="middle" fill="rgba(201,168,76,.3)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing="1.5">Scarcity as design principle</text>
      {/* World */}
      <rect x="260" y="476" width="340" height="70" rx="1" fill="rgba(255,255,255,.01)" stroke="rgba(201,168,76,.12)" strokeWidth="1"/>
      <text x="430" y="503" textAnchor="middle" fill="rgba(201,168,76,.7)" fontFamily="Cinzel,serif" fontSize="11" letterSpacing="3.5">THE WORLD</text>
      <text x="430" y="522" textAnchor="middle" fill="rgba(180,180,205,.5)" fontFamily="Courier Prime,monospace" fontSize="8.5" letterSpacing="1.5">Users · Creators · Subscribers</text>
      <text x="430" y="537" textAnchor="middle" fill="rgba(201,168,76,.25)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing="1.5">ACCESS · NOIR · PRESTIGE · OBSIDIAN</text>
      {/* Labels */}
      <text x="24" y="280" fill="rgba(201,168,76,.2)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing="1.5" textAnchor="middle" transform="rotate(-90,24,280)">CONTROL</text>
      <text x="836" y="360" fill="rgba(201,168,76,.2)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing="1.5" textAnchor="middle" transform="rotate(90,836,360)">CONTENT</text>
    </svg>
  )
}

// ─────────────────────────────────────────
// DNA RADAR
// ─────────────────────────────────────────
function DNAChart(){
  const axes=[
    {label:'Shadow Noir',     a:-90,v:.88},
    {label:'Wabi-Sabi',       a:-30,v:.76},
    {label:'Global Roots',    a: 30,v:.92},
    {label:'Digital Sublime', a: 90,v:.70},
    {label:'Brutalist',       a:150,v:.82},
    {label:'Ancient Futures', a:210,v:.86},
  ]
  const R=118,cx=180,cy=180
  const xy=(a:number,r:number)=>({x:cx+r*Math.cos(a*Math.PI/180),y:cy+r*Math.sin(a*Math.PI/180)})
  const pts=axes.map(a=>xy(a.a,a.v*R))
  const poly=pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')+' Z'
  return(
    <svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:380,height:'auto'}}>
      <defs>
        <radialGradient id="rg" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(201,168,76,.22)"/>
          <stop offset="100%" stopColor="rgba(201,168,76,.04)"/>
        </radialGradient>
      </defs>
      {[.25,.5,.75,1].map((r,i)=>{
        const rpts=axes.map(a=>xy(a.a,r*R))
        const rp=rpts.map((p,j)=>`${j===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')+' Z'
        return <path key={i} d={rp} fill="none" stroke="rgba(201,168,76,.07)" strokeWidth="1"/>
      })}
      {axes.map((a,i)=>{const e=xy(a.a,R);return<line key={i} x1={cx} y1={cy} x2={e.x.toFixed(1)} y2={e.y.toFixed(1)} stroke="rgba(201,168,76,.08)" strokeWidth="1"/>})}
      <path d={poly} fill="url(#rg)" stroke="rgba(201,168,76,.65)" strokeWidth="1.5">
        <animate attributeName="opacity" values=".75;1;.75" dur="4s" repeatCount="indefinite"/>
      </path>
      {pts.map((p,i)=>(
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4" fill="rgba(201,168,76,.8)" stroke="rgba(201,168,76,.3)" strokeWidth="1">
          <animate attributeName="r" values="3.5;5;3.5" dur={`${3+i*.4}s`} repeatCount="indefinite"/>
        </circle>
      ))}
      {axes.map((a,i)=>{const lp=xy(a.a,R+26);return(
        <text key={i} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fill="rgba(180,180,210,.75)" fontFamily="Courier Prime,monospace" fontSize="8.5" letterSpacing="1.2">{a.label.toUpperCase()}</text>
      )})}
      <text x={cx} y={cy-7} textAnchor="middle" fill="rgba(201,168,76,.7)" fontFamily="Cinzel,serif" fontSize="11" letterSpacing="3">UMBRA</text>
      <text x={cx} y={cy+12} textAnchor="middle" fill="rgba(201,168,76,.32)" fontFamily="Courier Prime,monospace" fontSize="7.5" letterSpacing="2">AESTHETIC DNA</text>
    </svg>
  )
}

// ─────────────────────────────────────────
// GALLERY SECTION
// ─────────────────────────────────────────
const GRAD_CLASSES = ['gal-grad-1','gal-grad-2','gal-grad-3','gal-grad-4','gal-grad-5','gal-grad-6']
function Gallery(){
  return(
    <section className="gal">
      <div className="gal-in">
        <div className="sec-l sr">Shadow Gallery</div>
        <p className="sr" style={{fontFamily:'var(--font-mono),monospace',fontSize:10,letterSpacing:'3px',color:'var(--tg)',textTransform:'uppercase',marginBottom:8,transitionDelay:'.1s'}}>Real content loading — assets uploading to the library</p>
        <div className="gal-grid">
          {GALLERY.map((g,i)=>(
            <div key={i} className={`gal-card${g.ratio==='portrait'?' portrait':''} ${GRAD_CLASSES[i]} sr`} style={{transitionDelay:`${.08*i}s`}}>
              {g.src ? (
                g.type==='img'
                  ? <img className="gal-img" src={g.src} alt={g.label}/>
                  : <video className="gal-vid" src={g.src} autoPlay loop muted playsInline/>
              ) : (
                <div className="gal-placeholder">
                  <span className="gal-placeholder-icon">{g.type==='vid' ? '► VIDEO' : '◈ IMAGE'}</span>
                  <span className="gal-placeholder-label">{g.label}</span>
                </div>
              )}
              <div className="gal-overlay"/>
              <div className="gal-info">
                <div className="gal-t">{g.label}</div>
                <div className="gal-c">{g.cat}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────
// COUNTER ANIMATION HOOK
// ─────────────────────────────────────────
function useCounter(target: number, duration: number, started: boolean){
  const [val,setVal] = useState(0)
  useEffect(()=>{
    if(!started)return
    let start:number|null=null
    const step=(ts:number)=>{
      if(!start)start=ts
      const p=Math.min((ts-start)/duration,1)
      setVal(Math.floor(p*target))
      if(p<1)requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  },[started,target,duration])
  return val
}

// ─────────────────────────────────────────
// STATS SECTION
// ─────────────────────────────────────────
function Stats(){
  const ref = useRef<HTMLDivElement>(null)
  const [go,setGo] = useState(false)
  const c1=useCounter(7,1400,go)
  const c2=useCounter(247,1800,go)
  const c3=useCounter(4,1200,go)
  const c4=useCounter(100,1600,go)
  useEffect(()=>{
    const obs=new IntersectionObserver(e=>{if(e[0].isIntersecting)setGo(true)},{threshold:.4})
    if(ref.current)obs.observe(ref.current)
    return()=>obs.disconnect()
  },[])
  const data=[
    {num:`${c1}`,suffix:'',label:'Aesthetic Dimensions',note:'Seven distinct sensory territories'},
    {num:`${c2}+`,suffix:'',label:'Curated Assets',note:'Library · growing daily'},
    {num:`${c4}`,suffix:'',label:'Founding Seats',note:'One-time offer — never again'},
    {num:`${c4}%`,suffix:'',label:'Standard Maintained',note:'No compromises. No floor drops'},
  ]
  return(
    <section className="stats" ref={ref}>
      <div className="stats-inner">
        {data.map((d,i)=>(
          <div key={i} className="stat-item sr" style={{transitionDelay:`${i*.1}s`}}>
            <div className="stat-num">{d.num}</div>
            <div className="stat-label">{d.label}</div>
            <div className="stat-note">{d.note}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────
// WORD REVEAL HELPER
// ─────────────────────────────────────────
function WR({text, className='', delay=0, style={}}: {text:string;className?:string;delay?:number;style?:React.CSSProperties}){
  const ref = useRef<HTMLSpanElement>(null)
  const [vis,setVis] = useState(false)
  useEffect(()=>{
    const obs=new IntersectionObserver(e=>{if(e[0].isIntersecting)setVis(true)},{threshold:.1})
    if(ref.current)obs.observe(ref.current)
    return()=>obs.disconnect()
  },[])
  const words = text.split(' ')
  return(
    <span ref={ref} className={`wr${vis?' vis':''} ${className}`} style={style}>
      {words.map((w,i)=>(
        <span key={i} style={{transitionDelay:`${delay+i*0.05}s`}}>{w}{i<words.length-1?' ':''}</span>
      ))}
    </span>
  )
}

// ─────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────
type Stat='idle'|'loading'|'success'|'error'
export default function ManifestoPage(){
  const [bootStep,setBoot]   = useState(-1)
  const [wmOn,setWm]         = useState(false)
  const [lifted,setLifted]   = useState(false)
  const [eyebrow,setEy]      = useState('')
  const [form,setForm]       = useState({name:'',email:'',aesthetic_affinity:''})
  const [stat,setStat]       = useState<Stat>('idle')
  const [pos,setPos]         = useState<number|null>(null)
  const [count,setCount]     = useState<number|null>(null)
  const [err,setErr]         = useState('')
  const [scrollPct,setScrollPct] = useState(0)
  const canvRef  = useRef<HTMLCanvasElement>(null)
  const trailRef = useRef<HTMLCanvasElement>(null)
  const nxRef    = useRef<HTMLDivElement>(null)
  const EY = 'The World\'s Aesthetic Intelligence — Not a Feed.'

  // Boot
  useEffect(()=>{
    const ts:ReturnType<typeof setTimeout>[]=[]
    BOOT.forEach((_,i)=>ts.push(setTimeout(()=>setBoot(i),260+i*320)))
    ts.push(setTimeout(()=>setWm(true),260+BOOT.length*320))
    ts.push(setTimeout(()=>setLifted(true),260+BOOT.length*320+1500))
    return()=>ts.forEach(clearTimeout)
  },[])

  // Typewriter
  useEffect(()=>{
    if(!lifted)return
    let i=0;const id=setInterval(()=>{setEy(EY.slice(0,i+1));i++;if(i>=EY.length)clearInterval(id)},40)
    return()=>clearInterval(id)
  },[lifted])

  // Count
  useEffect(()=>{
    fetch('/api/waitlist/count').then(r=>r.json()).then(d=>{if(d.count!==undefined)setCount(d.count)}).catch(()=>{})
  },[])

  // Scroll progress
  useEffect(()=>{
    const onScroll=()=>{const h=document.documentElement.scrollHeight-window.innerHeight;setScrollPct(h>0?(window.scrollY/h)*100:0)}
    window.addEventListener('scroll',onScroll,{passive:true})
    return()=>window.removeEventListener('scroll',onScroll)
  },[])

  // Cursor + particles + scroll reveals
  useEffect(()=>{
    if(!lifted)return
    const nx=nxRef.current;const tc=trailRef.current;const cv=canvRef.current
    if(!nx||!tc||!cv)return
    const tctx=tc.getContext('2d')!;const pctx=cv.getContext('2d')!
    let W=0,H=0
    const resize=()=>{W=tc.width=cv.width=window.innerWidth;H=tc.height=cv.height=window.innerHeight}
    resize();window.addEventListener('resize',resize)
    let mx=0,my=0
    const trail:{x:number;y:number;t:number}[]=[]
    const onMove=(e:MouseEvent)=>{
      mx=e.clientX;my=e.clientY
      nx.style.left=mx+'px';nx.style.top=my+'px'
      trail.push({x:mx,y:my,t:Date.now()})
      if(trail.length>35)trail.shift()
    }
    document.addEventListener('mousemove',onMove)
    const onEnt=()=>document.body.classList.add('hov')
    const onLve=()=>document.body.classList.remove('hov')
    document.querySelectorAll('a,button,input,select,.li,.tc,.gal-card').forEach(el=>{el.addEventListener('mouseenter',onEnt);el.addEventListener('mouseleave',onLve)})
    // Particles
    class P{x=0;y=0;sz=0;vx=0;vy=0;o=0;to=0;life=0;max=0
      constructor(){this.reset(true)}
      reset(init:boolean){this.x=Math.random()*W;this.y=init?Math.random()*H:H+10;this.sz=Math.random()*1.9+.3;this.vy=-(Math.random()*.36+.12);this.vx=(Math.random()-.5)*.18;this.o=0;this.to=Math.random()*.42+.06;this.life=0;this.max=Math.random()*440+180}
      tick(){this.x+=this.vx;this.y+=this.vy;this.life++;if(this.life<60)this.o=(this.life/60)*this.to;else if(this.life>this.max-60)this.o=((this.max-this.life)/60)*this.to;if(this.life>=this.max||this.y<-10)this.reset(false)}
      draw(){pctx.save();pctx.globalAlpha=this.o;pctx.fillStyle='#c9a84c';pctx.shadowColor='#c9a84c';pctx.shadowBlur=7;pctx.beginPath();pctx.arc(this.x,this.y,this.sz,0,Math.PI*2);pctx.fill();pctx.restore()}
    }
    const ps:P[]=Array.from({length:100},()=>new P())
    let aid=0,tid=0
    const animP=()=>{
      pctx.clearRect(0,0,W,H)
      for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const dx=ps[i].x-ps[j].x,dy=ps[i].y-ps[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<115){pctx.beginPath();pctx.strokeStyle=`rgba(201,168,76,${(1-d/115)*.06})`;pctx.lineWidth=.55;pctx.moveTo(ps[i].x,ps[i].y);pctx.lineTo(ps[j].x,ps[j].y);pctx.stroke()}}
      ps.forEach(p=>{p.tick();p.draw()})
      aid=requestAnimationFrame(animP)
    }
    aid=requestAnimationFrame(animP)
    const animT=()=>{
      tctx.clearRect(0,0,W,H)
      const now=Date.now()
      const fresh=trail.filter(p=>now-p.t<280)
      if(fresh.length>1){
        for(let i=1;i<fresh.length;i++){
          const age=(now-fresh[i].t)/280
          tctx.beginPath();tctx.arc(fresh[i].x,fresh[i].y,(1-age)*4.5,0,Math.PI*2)
          tctx.fillStyle=`rgba(201,168,76,${(1-age)*.48})`;tctx.shadowBlur=10;tctx.shadowColor='rgba(201,168,76,.3)';tctx.fill()
        }
      }
      tid=requestAnimationFrame(animT)
    }
    tid=requestAnimationFrame(animT)
    // Scroll reveals
    const obs=new IntersectionObserver(e=>{e.forEach(en=>{if(en.isIntersecting)(en.target as HTMLElement).classList.add('vis')})},{threshold:.08,rootMargin:'0px 0px -30px 0px'})
    document.querySelectorAll('.sr,.sr2,.sr3,.sdv,.sn,.ml,.mdv,.mst,.prob-kicker,.prob-line,.prob-break,.prob-gold,.prob-small,.eq-pre,.eq-l,.eq-b,.eq-sub,.stat-item,.ori-t,.ori-dv,.ori-sig,.wl-pre,.wl-cnt,.wl-h2,.wl-sub,.wl-form,.wl-note').forEach(el=>obs.observe(el))
    // Stagger delays
    document.querySelectorAll<HTMLElement>('.li').forEach((el,i)=>{el.style.transitionDelay=(i*.08)+'s'})
    document.querySelectorAll<HTMLElement>('.tc').forEach((el,i)=>{el.style.transitionDelay=(i*.12)+'s'})
    document.querySelectorAll<HTMLElement>('.ml').forEach((el,i)=>{el.style.transitionDelay=(i*.06)+'s'})
    document.querySelectorAll<HTMLElement>('.prob-line').forEach((el,i)=>{el.style.transitionDelay=(i*.12)+'s'})
    document.querySelectorAll<HTMLElement>('.eq-l').forEach((el,i)=>{el.style.transitionDelay=(i*.18)+'s'})
    return()=>{document.removeEventListener('mousemove',onMove);cancelAnimationFrame(aid);cancelAnimationFrame(tid);window.removeEventListener('resize',resize);obs.disconnect()}
  },[lifted])

  const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}))
  const handleSubmit=useCallback(async(e?:React.FormEvent)=>{
    if(e)e.preventDefault()
    if(!form.email||!form.aesthetic_affinity||stat==='loading')return
    setStat('loading');setErr('')
    try{
      const res=await fetch('/api/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:form.name,email:form.email,aesthetic_affinity:form.aesthetic_affinity})})
      const data=await res.json()
      if(res.status===409){setStat('success');setPos(data.position);return}
      if(!res.ok)throw new Error(data.error||'The shadow rejected this.')
      setStat('success');setPos(data.position)
    }catch(e:unknown){setStat('error');setErr(e instanceof Error?e.message:'An error occurred.')}
  },[form,stat])

  return(
    <>
      <style dangerouslySetInnerHTML={{__html:S}}/>

      {/* PROGRESS */}
      <div id="pb" style={{width:`${scrollPct}%`}}/>

      {/* BOOT */}
      <div id="cv" className={lifted?'off':''}>
        <div className="bw">
          {BOOT.map((line,i)=>(
            <div key={i} className={`bl${bootStep>=i?' on':''}${i===BOOT.length-1&&bootStep>=i?' last':''}`}>{line}</div>
          ))}
        </div>
        <div className={`cm${wmOn?' on':''}`}>UMBRA</div>
        <div className={`cs${wmOn?' on':''}`}>Aesthetic Intelligence. Global. Uncompromising.</div>
      </div>

      {/* NEXUS RETICLE CURSOR */}
      <div id="nx" ref={nxRef} style={{position:'fixed',left:'-100px',top:'-100px'}}>
        <div className="nx-ring"/>
        <div className="nx-outer">
          <div className="nx-seg"/><div className="nx-seg" style={{transform:'rotate(90deg)'}}/>
        </div>
        <div className="nx-inner"><div className="nx-arc"/></div>
        <div className="nx-dot"/>
      </div>
      <canvas ref={trailRef} id="tc"/>
      <div className="vig"/>
      <canvas ref={canvRef} id="pc"/>

      {/* NAV */}
      <nav>
        <a href="#" className="nm">UMBRA</a>
        <div className="nl">
          <a href="#manifesto">Manifesto</a>
          <a href="#engine">Sensory Engine</a>
          <a href="#gallery">Gallery</a>
          <a href="#tiers">Access</a>
          <a href="#waitlist">Enter</a>
        </div>
        <div className="np"><div className="npd"/><span>SOVEREIGN ONLINE</span></div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hsc"/>
        <div className="hf">
          <div className="hc a"/><div className="hc b"/>
          <div className="hc c"/><div className="hc d"/>
          <div className="ht a">AESTHETIC_ENGINE: ONLINE</div>
          <div className="ht b">SOVEREIGN_SYSTEM: ACTIVE</div>
          <div className="ht c">SHADOW: INITIALIZING</div>
        </div>
        <div className="hey">{eyebrow}</div>
        <div className="htw">
          <h1 className="ht1">UMBRA<span className="hs"/></h1>
        </div>
        <div className="hk">
          Not a platform. Not a library. Not a feed.<br/>
          <em>A world governed by a single aesthetic law.</em>
        </div>
        <div className="hdv"/>
        <div className="sh"><span>Descend</span><div className="sl"/></div>
      </section>

      {/* ─── THE PROBLEM — SCROLLYTELLING ─── */}
      <section className="prob">
        <div className="prob-inner">
          <p className="prob-kicker sr">The Problem</p>
          <h2 className="prob-line sr">
            <WR text="The internet was given a mandate." delay={0}/>
          </h2>
          <h2 className="prob-line dim sr">
            <WR text="It chose engagement instead." delay={0}/>
          </h2>
          <h2 className="prob-line muted sr" style={{fontSize:'clamp(18px,3vw,40px)'}}>
            <WR text="The algorithm chose whatever kept you scrolling longest." delay={0}/>
          </h2>
          <div className="prob-break sr"/>
          <div className="prob-gold sr">
            <WR text="Twenty years later — a billion assets optimized for nothing except surviving the feed." delay={0}/>
          </div>
          <p className="prob-small sr">
            <WR text="Beauty was not a casualty. It was a design choice — one they made without you." delay={0}/>
          </p>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <Stats/>

      {/* ─── SENSORY ENGINE ─── */}
      <section className="sense" id="engine">
        <div className="sense-in">
          <div>
            <div className="s-label sr">The Sensory Engine</div>
            <h2 className="s-h2 sr">You type a frequency.<br/><em>The library answers it.</em></h2>
            <p className="s-p sr">Every search engine ever built works the same way: you type a word, it finds other words near it. It calls this intelligence. It is not.</p>
            <p className="s-p sr">When you type <strong>&#x201C;silence before a storm&#x201D;</strong> into UMBRA — the interface becomes that atmospheric density. The particles shift frequency. The ambient score changes key. What surfaces was not retrieved by keyword proximity. It was <strong>summoned by aesthetic resonance.</strong></p>
            <div className="sb sr"><div className="sb-n">01</div><div className="sb-t">TYPE MOODS, TEXTURES, SENSATIONS — NOT KEYWORDS</div></div>
            <div className="sb sr"><div className="sb-n">02</div><div className="sb-t">THE INTERFACE BREATHES THE AESTHETIC IN REAL TIME</div></div>
            <div className="sb sr"><div className="sb-n">03</div><div className="sb-t">RESULTS CURATED FOR TRUTH — NOT ENGAGEMENT SCORE</div></div>
          </div>
          <div className="sr3"><SensoryDemo/></div>
        </div>
      </section>

      {/* ─── MANIFESTO ─── */}
      <section className="mf" id="manifesto">
        <div className="mf-in">
          <div className="ml-label">The Manifesto</div>

          <div className="ml sr">
            <h2>The internet was handed a mandate: <em>democratize beauty.</em></h2>
            <p>It chose engagement instead. Engagement chose the algorithm. The algorithm chose whatever kept you scrolling longest. What remained after twenty years of this was a civilization of assets optimized for nothing except surviving the feed. <strong>Beauty was not a casualty. It was a design choice — one they made without you.</strong></p>
          </div>
          <div className="mdv sdv"/>

          <div className="ml sr">
            <h2>You cannot algorithm your way to <em>a point of view.</em></h2>
            <p>Every platform that has tried to build a curated aesthetic layer has eventually sacrificed it for growth. The pressure always wins. The floor always drops. Except on platforms that are built around the refusal to let it. <strong>UMBRA&apos;s architecture is the refusal. Not a feature. The entire structure.</strong></p>
          </div>
          <div className="mdv sdv"/>

          <div className="ml sr">
            <h2>The library is a conscience. <em>Governed by one law.</em></h2>
            <p>Every asset that enters UMBRA is interrogated — not for likes, not for reach, not for trending velocity. For one thing: <strong>does it earn its place?</strong> The answer is binary. Yes, it passes. No, it doesn&apos;t exist here. The interrogation never stops. The standard never negotiates.</p>
          </div>
          <div className="mdv sdv"/>

          <div className="ml sr">
            <h2>Seoul has light the West has not named yet. <em>This is core product.</em></h2>
            <p>Tbilisi has geometry that European schools will theorize in thirty years. Lagos has texture that New York galleries will pay fortunes to reproduce in forty. The world does not orbit a default culture. UMBRA was built knowing this — sourcing from everywhere with the same standard: <strong>no dilution, no tokenism, no quota. The world, held to one honest bar.</strong></p>
          </div>
          <div className="mdv sdv"/>

          <div className="ml sr">
            <h2>Scarcity is not a marketing trick. <em>It is a philosophical position.</em></h2>
            <p>When The Block runs an auction, the asset expires. When it&apos;s gone, it&apos;s gone. This is not artificial urgency. This is the platform saying: <strong>what is limited is respected.</strong> What you could download infinitely, you never valued. What you almost missed, you remember forever.</p>
          </div>
          <div className="mdv sdv"/>

          <div className="ml sr">
            <h2>One mind holds the vision. <em>An AI holds the library.</em></h2>
            <p>The AI curates: sorting, tagging, scheduling, broadcasting — without ego, without fatigue, without the temptation to compromise for traffic spikes. The Sovereign overrides when the vision demands it. Neither replaces the other. <strong>This is not a startup optimizing for growth. This is a new kind of institution</strong> — one where the curation outlasts any single news cycle, funding round, or trend.</p>
          </div>
          <div className="mdv sdv"/>

          <div className="mst sr">
            What is limited is respected.<br/>
            What is rare is real.<br/>
            What is beautiful — belongs.
          </div>
        </div>
      </section>

      {/* ─── EQUATION ─── */}
      <section className="eq">
        <div className="eq-w">
          <p className="eq-pre sr">The Equation</p>
          <p className="eq-l sr">Every platform optimizes for your <em style={{fontStyle:'italic',color:'var(--gold-d)'}}>attention.</em></p>
          <div className="eq-b sr"/>
          <p className="eq-l g sr">UMBRA optimizes for your discernment.</p>
          <div className="eq-b sr"/>
          <p className="eq-sub sr">These are not the same thing.<br/>They never were. They never will be.</p>
        </div>
      </section>

      {/* ─── GALLERY ─── */}
      <div id="gallery"><Gallery/></div>

      {/* ─── ARCH ─── */}
      <section className="arch">
        <div className="arch-in">
          <div className="sec-l sr">System Architecture</div>
          <div className="sr3"><ArchDiagram/></div>
        </div>
      </section>

      {/* ─── DNA ─── */}
      <section className="dna">
        <div className="dna-in">
          <div>
            <div className="sec-l sr">Aesthetic Spectrum</div>
            <h2 className="dna-h2 sr">Seven dimensions.<br/>One standard.</h2>
            <p className="dna-p sr">UMBRA is not a flat archive. It is a multidimensional aesthetic universe — seven distinct sensory territories, each with its own curatorial logic, its own visual language, its own depth. No dimension outranks another. All seven demand the same level of visual truth.</p>
            <p className="dna-tags sr">SHADOW NOIR · WABI-SABI · GLOBAL ROOTS · DIGITAL SUBLIME · BRUTALIST HARMONY · ANCIENT FUTURES · LUMINOUS VOID</p>
          </div>
          <div className="sr3"><DNAChart/></div>
        </div>
      </section>

      {/* ─── THE LAW ─── */}
      <section className="law">
        <div className="law-hd">The Law</div>
        <div className="law-grid">
          {[
            {n:'01',t:'Quality Is the Only Filter',d:'Not popularity. Not recency. Not engagement score. If an asset is beautiful, it belongs. If it is not, it does not. The floor never descends — not for traffic, not for growth, not for any external pressure.'},
            {n:'02',t:'Scarcity Is Respect',d:'When something is limited, its value is acknowledged. When something expires, it meant something while it lasted. These are not marketing tactics. They are a philosophical position on what beauty deserves.'},
            {n:'03',t:'The AI Serves the Vision',d:'Optimized for aesthetic coherence — not engagement metrics, time-on-site, or click rates. A platform optimized for engagement becomes addictive and hollow. Optimized for aesthetic health: it becomes essential.'},
            {n:'04',t:'Your Data Is Not a Product',d:'Behavioral data exists to improve your experience. It is never sold. Never shared. Never used to serve advertising. God Analytics serves curation — not a revenue model built on your attention.'},
            {n:'05',t:'Precision or Silence',d:'Every word published — every description, every broadcast, every error message — is written to the same standard as the content it surrounds. Silence is preferable to the wrong words. Always.'},
            {n:'06',t:'The World Is the Source',d:'UMBRA was built by a mind that refused institutional permission. It serves the entire world — not a default market, not a dominant culture. That tension is what makes the curation honest.'},
          ].map(item=>(
            <div key={item.n} className="li sr">
              <div className="li-n">{item.n}</div>
              <div className="li-t">{item.t}</div>
              <div className="li-d">{item.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TIERS ─── */}
      <section className="tiers" id="tiers">
        <div className="tiers-in">
          <div className="sec-l sr">Access Tiers</div>
          <div className="tg2">
            {[
              {name:'ACCESS',price:'Free',note:'Forever free',feat:false,tag:'ENTRY',feats:['5 CC0 downloads/month','SIGNAL Radio broadcast','Sensory search (limited)','Community layer']},
              {name:'NOIR',price:'$15',note:'/month · regional pricing',feat:false,tag:'MOST POPULAR',feats:['30 CC0 downloads/month','Full sensory search engine','The Block auction access','Priority new arrivals']},
              {name:'PRESTIGE',price:'$39',note:'/month',feat:true,tag:'OBSIDIAN-ADJACENT',feats:['Unlimited CC0 downloads','Full sensory engine + history','The Block early access','Advanced collection tools']},
              {name:'OBSIDIAN',price:'$99',note:'/month',feat:false,tag:'INNER CIRCLE',feats:['Everything in PRESTIGE','Direct API access','Inner Circle dispatches','Sovereign communications']},
            ].map((t)=>(
              <div key={t.name} className={`tc sr${t.feat?' feat':''}`}>
                <div className="tc-tag">{t.tag}</div>
                <div className={`tc-name${t.feat?' g':''}`}>{t.name}</div>
                <div className="tc-price">{t.price} <span>{t.note}</span></div>
                <ul className="tc-ul">{t.feats.map(f=><li key={f}>{f}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WAITLIST ─── */}
      <section className="wl" id="waitlist">
        <div className="wl-in">
          <p className="wl-pre sr">The Shadow Opens</p>
          {count!==null&&<p className="wl-cnt sr">{count} {count===1?'soul':'souls'} already in the shadow</p>}
          <h2 className="wl-h2 sr">Enter <span>Before</span><br/>The World Knows</h2>
          <p className="wl-sub sr">The first 100 subscribers enter at a locked-in price — forever. Their names go on the Founding Wall. Their access never expires. This offer is never made again.</p>
          {stat==='success'?(
            <div className="wl-ok show sr">
              <div className="wl-num">{pos!==null?`#${String(pos).padStart(3,'0')}`:'\u2014'}</div>
              <div className="wl-ok-t">You are in the shadow.<br/>We will call you when the door opens.</div>
            </div>
          ):(
            <form onSubmit={handleSubmit}>
              <div className="wl-form sr">
                <input className="wl-i" type="text" placeholder="Your name (optional)..." value={form.name} onChange={e=>set('name',e.target.value)} autoComplete="name"/>
                <input className="wl-i" type="email" placeholder="Your email address..." value={form.email} onChange={e=>set('email',e.target.value)} autoComplete="email" required style={{borderTop:'none'}}/>
                <div style={{position:'relative'}}>
                  <select className={`wl-s${form.aesthetic_affinity?' fld':''}`} value={form.aesthetic_affinity} onChange={e=>set('aesthetic_affinity',e.target.value)} required>
                    <option value="" disabled>Your aesthetic affinity —</option>
                    {AFFINITIES.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                  <span style={{position:'absolute',right:16,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'rgba(201,168,76,.4)',fontSize:11}}>&#9662;</span>
                </div>
                {stat==='error'&&<p className="wl-err">{err}</p>}
                <button className="wl-btn" type="submit" disabled={!form.email||!form.aesthetic_affinity||stat==='loading'}>{stat==='loading'?'...':'Enter the Shadow'}</button>
              </div>
            </form>
          )}
          <p className="wl-note sr">No notifications. No marketing. One signal — when it opens.</p>
        </div>
      </section>

      {/* ─── ORIGIN — ANONYMOUS ─── */}
      <section className="ori">
        <div className="ori-glow"/>
        <p className="ori-t sr">
          One mind.<br/>
          <strong>Zero permission.</strong><br/>
          Zero institutions. Zero inheritance. Zero map.<br/><br/>
          Built in the hours the world wasn&apos;t watching.<br/>
          From an idea that refused to wait for the right conditions.<br/><br/>
          <em>The right conditions were never coming.<br/>
          So the platform was built instead.</em>
        </p>
        <div className="ori-dv sr"/>
        <div className="ori-sig sr">REY TEMPEST &nbsp;&middot;&nbsp; TEMPEST GROUP</div>
      </section>

      <footer>
        <div className="fm">UMBRA</div>
        <div className="fn">&copy; 2026 Tempest Group &nbsp;&middot;&nbsp; All rights reserved</div>
      </footer>
    </>
  )
}
