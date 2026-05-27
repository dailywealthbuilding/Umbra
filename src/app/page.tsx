'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const STYLES = `
:root{
  --void:#040406;
  --gold:#c9a84c;--gold-bright:#f0d98a;--gold-dim:#9a7a36;
  --gold-ghost:rgba(201,168,76,0.07);
  --text:#e8e8f4;--text-dim:#b0b0c8;--text-ghost:#787890;--mist:#6a6a84;
}
::selection{background:rgba(201,168,76,.2);color:var(--gold)}
::-webkit-scrollbar{width:1px}::-webkit-scrollbar-track{background:var(--void)}
::-webkit-scrollbar-thumb{background:var(--gold-dim)}
html{scroll-behavior:smooth}
body{background:var(--void);color:var(--text);font-family:var(--font-display),serif;overflow-x:hidden;cursor:none;-webkit-font-smoothing:antialiased;}
@media(max-width:768px){body{cursor:auto}}

/*═══ CURTAIN ═══*/
#curtain{position:fixed;inset:0;background:var(--void);z-index:9000;display:flex;align-items:center;justify-content:center;flex-direction:column;transition:opacity 1.4s ease .3s,visibility 1.4s ease .3s;}
#curtain.lifted{opacity:0;visibility:hidden;pointer-events:none;}
.boot-wrap{width:340px;margin-bottom:56px;}
.boot-line{font-family:var(--font-mono),monospace;font-size:9.5px;letter-spacing:.22em;color:rgba(201,168,76,0);text-transform:uppercase;line-height:2.2;}
.boot-line.on{color:rgba(201,168,76,.5);transition:color .3s ease;}
.boot-line.on.last{color:rgba(201,168,76,.85)}
.curtain-mark{font-family:var(--font-cinzel),serif;font-size:clamp(56px,12vw,130px);font-weight:900;letter-spacing:.1em;color:transparent;background:linear-gradient(165deg,#8a6f33,#c9a84c,#f0d98a,#c9a84c,#8a6f33);-webkit-background-clip:text;background-clip:text;opacity:0;transform:scale(.94) translateY(10px);}
.curtain-mark.show{animation:cmReveal 1.3s cubic-bezier(.16,1,.3,1) forwards;}
@keyframes cmReveal{0%{opacity:0;transform:scale(.9);filter:blur(18px)}70%{opacity:1;filter:blur(0)}100%{opacity:1;transform:scale(1);filter:blur(0)}}
.curtain-micro{font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:.5em;color:rgba(201,168,76,.3);text-transform:uppercase;margin-top:18px;opacity:0;}
.curtain-micro.show{animation:fadeup .5s ease .15s forwards;}

/*═══ CURSOR — VOID HUNTER ═══*/
#hunter{position:fixed;pointer-events:none;z-index:9999;width:0;height:0;transform:translate(-50%,-50%);}
.h-outer{position:absolute;width:52px;height:52px;top:-26px;left:-26px;animation:outerSpin 20s linear infinite;}
.h-tick{position:absolute;width:100%;height:100%;}
.h-tick::before{content:'';position:absolute;width:5px;height:1px;background:rgba(201,168,76,.5);top:50%;left:0;transform:translateY(-50%);}
.h-tick:nth-child(2){transform:rotate(45deg)}.h-tick:nth-child(3){transform:rotate(90deg)}.h-tick:nth-child(4){transform:rotate(135deg)}.h-tick:nth-child(5){transform:rotate(180deg)}.h-tick:nth-child(6){transform:rotate(225deg)}.h-tick:nth-child(7){transform:rotate(270deg)}.h-tick:nth-child(8){transform:rotate(315deg)}
.h-mid{position:absolute;width:30px;height:30px;top:-15px;left:-15px;animation:midSpinRev 8s linear infinite;}
.h-mid-arc{position:absolute;width:100%;height:100%;border-radius:50%;border:1px solid rgba(201,168,76,0);border-top:1px solid rgba(201,168,76,.45);border-right:1px solid rgba(201,168,76,.2);}
.h-cross{position:absolute;top:-24px;left:-24px;width:48px;height:48px;}
.h-cross::before,.h-cross::after{content:'';position:absolute;background:rgba(201,168,76,.22);}
.h-cross::before{width:16px;height:1px;top:50%;left:0;transform:translateY(-50%)}
.h-cross::after{width:1px;height:16px;left:50%;top:0;transform:translateX(-50%)}
.h-core{position:absolute;width:6px;height:6px;top:-3px;left:-3px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px var(--gold),0 0 18px rgba(201,168,76,.5);animation:corePulse 2.2s ease-in-out infinite;}
.h-ring{position:absolute;width:64px;height:64px;top:-32px;left:-32px;border-radius:50%;border:1px solid rgba(201,168,76,.08);transition:all .3s cubic-bezier(.175,.885,.32,1.1);}
@keyframes outerSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes midSpinRev{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
@keyframes corePulse{0%,100%{box-shadow:0 0 5px var(--gold),0 0 12px rgba(201,168,76,.4)}50%{box-shadow:0 0 12px var(--gold),0 0 28px rgba(201,168,76,.6),0 0 50px rgba(201,168,76,.15)}}
body.hovering .h-outer{animation-duration:3s;}
body.hovering .h-mid{animation-duration:1.5s;}
body.hovering .h-core{box-shadow:0 0 14px var(--gold-bright),0 0 32px rgba(240,217,138,.6)!important;}
body.hovering .h-ring{width:42px;height:42px;top:-21px;left:-21px;border-color:rgba(201,168,76,.3);}
#trail-cv{position:fixed;inset:0;pointer-events:none;z-index:9990;}
@media(max-width:768px){#hunter,#trail-cv{display:none}}

/*═══ CANVAS + GRAIN + VIGNETTE ═══*/
#canvas{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.9}
.vignette{position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(ellipse at center,transparent 28%,rgba(4,4,6,.85) 100%);}
body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:998;opacity:.022;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:180px;}

/*═══ NAV ═══*/
nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:26px 56px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(to bottom,rgba(4,4,6,.9),transparent);}
.nav-mark{font-family:var(--font-cinzel),serif;font-size:12px;font-weight:700;letter-spacing:8px;color:var(--gold);text-decoration:none;opacity:0;animation:fadeup .8s ease forwards 4.2s;}
.nav-links{display:flex;gap:32px;opacity:0;animation:fadeup .8s ease forwards 4.4s;}
.nav-links a{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--text-ghost);text-decoration:none;transition:color .3s;}
.nav-links a:hover{color:var(--gold)}
.nav-pulse{display:flex;align-items:center;gap:8px;font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:.25em;color:rgba(201,168,76,.4);opacity:0;animation:fadeup .8s ease forwards 4.6s;}
.pulse-dot{width:5px;height:5px;border-radius:50%;background:rgba(80,220,80,.65);box-shadow:0 0 7px rgba(80,220,80,.4);animation:pdot 2.5s ease-in-out infinite;}
@keyframes pdot{0%,100%{opacity:.4}50%{opacity:1}}

/*═══ HERO ═══*/
.hero{position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 40px 80px;z-index:1;overflow:hidden;}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 90% 70% at 50% 50%,rgba(201,168,76,.085) 0%,transparent 62%);pointer-events:none;}
.scanlines{position:absolute;inset:0;pointer-events:none;z-index:1;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.016) 3px,rgba(0,0,0,.016) 4px);}
.hud-frame{position:absolute;inset:0;pointer-events:none;z-index:2;}
.hc{position:absolute;width:44px;height:44px;opacity:0;animation:fadeup .5s ease forwards;}
.hc.tl{top:82px;left:56px;border-top:1px solid rgba(201,168,76,.32);border-left:1px solid rgba(201,168,76,.32);animation-delay:3.8s}
.hc.tr{top:82px;right:56px;border-top:1px solid rgba(201,168,76,.32);border-right:1px solid rgba(201,168,76,.32);animation-delay:3.9s}
.hc.bl{bottom:82px;left:56px;border-bottom:1px solid rgba(201,168,76,.32);border-left:1px solid rgba(201,168,76,.32);animation-delay:4.0s}
.hc.br{bottom:82px;right:56px;border-bottom:1px solid rgba(201,168,76,.32);border-right:1px solid rgba(201,168,76,.32);animation-delay:4.1s}
.hud-txt{position:absolute;font-family:var(--font-mono),monospace;font-size:7px;letter-spacing:.2em;color:rgba(201,168,76,.28);text-transform:uppercase;opacity:0;animation:fadeup .4s ease forwards 4.3s;}
.hud-txt.a{top:134px;left:56px}.hud-txt.b{top:134px;right:56px;text-align:right}.hud-txt.c{bottom:134px;left:56px}
.hero-eyebrow{font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:7px;color:var(--gold-dim);text-transform:uppercase;margin-bottom:48px;opacity:0;animation:fadeup .9s ease forwards .5s;min-height:1.5em;z-index:3;position:relative;}
.hero-title{font-family:var(--font-cinzel),serif;font-size:clamp(96px,20vw,240px);font-weight:900;line-height:.85;letter-spacing:-3px;color:transparent;background:linear-gradient(165deg,var(--gold-dim) 0%,var(--gold) 28%,var(--gold-bright) 50%,var(--gold) 72%,var(--gold-dim) 100%);-webkit-background-clip:text;background-clip:text;opacity:0;animation:titleReveal 1.8s cubic-bezier(.16,1,.3,1) forwards 1s;overflow:hidden;position:relative;z-index:3;}
.hero-title::after{content:'UMBRA';position:absolute;inset:0;background:inherit;-webkit-background-clip:text;background-clip:text;color:transparent;filter:blur(55px);opacity:.45;z-index:-1;}
.hero-shimmer{position:absolute;top:0;left:-120%;width:45%;height:100%;background:linear-gradient(90deg,transparent,rgba(240,217,138,.28),transparent);transform:skewX(-12deg);animation:shimmer 10s ease 3s infinite;pointer-events:none;z-index:4;}
@keyframes shimmer{0%{left:-120%}28%{left:200%}100%{left:200%}}
.hero-kicker{font-family:var(--font-display),serif;font-style:italic;font-size:clamp(16px,2.2vw,23px);color:var(--text-dim);letter-spacing:1.5px;margin-top:30px;max-width:600px;line-height:1.65;opacity:0;animation:fadeup .9s ease forwards 2.6s;z-index:3;position:relative;}
.hero-tags{display:flex;gap:2px;align-items:center;margin-top:28px;opacity:0;animation:fadeup .9s ease forwards 2.2s;z-index:3;position:relative;flex-wrap:wrap;justify-content:center;}
.htag{font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:.35em;text-transform:uppercase;padding:7px 14px;border:1px solid rgba(255,255,255,.06);color:var(--text-ghost);}
.htag.lit{color:rgba(201,168,76,.7);border-color:rgba(201,168,76,.18);background:rgba(201,168,76,.03);}
.hero-divider{width:1px;height:52px;background:linear-gradient(to bottom,transparent,var(--gold-dim),transparent);margin:48px auto 0;opacity:0;animation:fadeup .9s ease forwards 3.1s;}
.scroll-hint{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;opacity:0;animation:fadeup .9s ease forwards 3.6s;}
.scroll-hint span{font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:5px;text-transform:uppercase;color:var(--text-ghost);}
.scroll-line{width:1px;height:34px;background:linear-gradient(to bottom,var(--gold-dim),transparent);animation:spulse 2s ease infinite;}
@keyframes spulse{0%,100%{opacity:.35;transform:scaleY(1)}50%{opacity:1;transform:scaleY(1.2)}}

/*═══ SENSORY ENGINE ═══*/
.sense-section{position:relative;z-index:1;padding:120px 56px 140px;overflow:hidden;}
.sense-section::before{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.15),transparent);}
.sense-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;}
.sense-text .s-label{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--gold-dim);margin-bottom:32px;display:flex;align-items:center;gap:16px;}
.sense-text .s-label::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(201,168,76,.2),transparent)}
.sense-text h2{font-family:var(--font-cinzel),serif;font-size:clamp(26px,3.5vw,42px);font-weight:400;color:var(--text);line-height:1.2;margin-bottom:22px;}
.sense-text h2 em{color:var(--gold);font-style:italic;font-family:var(--font-display),serif;}
.sense-text p{font-size:clamp(14px,1.6vw,17px);color:var(--text-dim);line-height:2.1;font-weight:300;}
.sense-bullet{display:flex;align-items:flex-start;gap:14px;margin-top:18px;}
.sb-num{width:22px;height:22px;flex-shrink:0;border:1px solid rgba(201,168,76,.2);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono),monospace;font-size:8px;color:var(--gold-dim);margin-top:1px;}
.sb-text{font-family:var(--font-mono),monospace;font-size:11px;color:var(--text-ghost);line-height:1.8;letter-spacing:.06em;}
.demo-panel{border:1px solid rgba(201,168,76,.15);border-radius:2px;overflow:hidden;transition:border-color .8s ease;}
.demo-topbar{display:flex;align-items:center;gap:8px;padding:10px 16px;background:rgba(0,0,0,.6);border-bottom:1px solid rgba(255,255,255,.04);}
.dtb-dot{width:8px;height:8px;border-radius:50%;}
.dtb-dot.r{background:rgba(255,80,80,.5)}.dtb-dot.y{background:rgba(201,168,76,.5)}.dtb-dot.g{background:rgba(80,200,80,.35)}
.dtb-title{font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:.3em;color:var(--text-ghost);margin-left:6px;}
.demo-body{padding:26px 20px 20px;min-height:340px;position:relative;transition:background 1.4s ease;}
.demo-search-row{display:flex;margin-bottom:20px;border:1px solid rgba(201,168,76,.18);transition:border-color .8s ease;}
.dsr-prefix{padding:11px 13px;font-family:var(--font-mono),monospace;font-size:11px;letter-spacing:.1em;background:rgba(0,0,0,.3);border-right:1px solid rgba(255,255,255,.04);}
.dsr-input{flex:1;background:transparent;border:none;outline:none;color:var(--text);font-family:var(--font-mono),monospace;font-size:11px;letter-spacing:.06em;padding:11px 10px;}
.dsr-btn{padding:11px 16px;font-family:var(--font-cinzel),serif;font-size:8px;letter-spacing:.35em;text-transform:uppercase;background:transparent;border:none;border-left:1px solid rgba(255,255,255,.04);transition:all .3s;}
.dsr-btn.active{animation:scanpulse .5s ease-in-out infinite;}
@keyframes scanpulse{0%,100%{opacity:1}50%{opacity:.35}}
.demo-status{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
.ds-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
.ds-text{font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:.2em;color:var(--text-ghost);}
.demo-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;}
.demo-card{border-radius:2px;overflow:hidden;transform:translateY(10px);opacity:0;transition:opacity .5s ease,transform .5s ease;}
.demo-card.show{transform:translateY(0);opacity:1;}
.dc-img{height:72px;transition:background 1.4s ease;}
.dc-info{padding:7px 9px;background:rgba(0,0,0,.55);}
.dc-title{font-family:var(--font-mono),monospace;font-size:7.5px;letter-spacing:.1em;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.dc-cat{font-size:7px;color:var(--text-ghost);margin-top:3px;font-family:var(--font-mono),monospace;}
.demo-footer{position:absolute;bottom:9px;right:12px;font-family:var(--font-mono),monospace;font-size:7px;letter-spacing:.2em;color:rgba(201,168,76,.25);}
.blink{animation:blink 1s step-end infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

/*═══ MANIFESTO ═══*/
.manifesto{position:relative;z-index:1;padding:140px 0;overflow:hidden;}
.manifesto::before{content:'';position:absolute;left:50%;transform:translateX(-50%);top:0;width:1px;height:100%;background:linear-gradient(to bottom,transparent,rgba(201,168,76,.07),transparent);}
.manifesto-inner{max-width:780px;margin:0 auto;padding:0 56px;}
.m-label{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--gold-dim);margin-bottom:56px;display:flex;align-items:center;gap:18px;}
.m-label::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(201,168,76,.18),transparent)}
.m-line{margin-bottom:48px;opacity:0;transform:translateY(22px);transition:opacity .9s ease,transform .9s ease;}
.m-line.visible{opacity:1;transform:translateY(0)}
.m-line h2{font-family:var(--font-cinzel),serif;font-size:clamp(21px,3.4vw,35px);font-weight:400;color:var(--text);line-height:1.2;margin-bottom:18px;}
.m-line h2 em{font-style:italic;color:var(--gold);font-family:var(--font-display),serif;font-size:1.12em;}
.m-line p{font-size:clamp(15px,1.8vw,17.5px);color:var(--text-dim);line-height:2.15;font-weight:300;}
.m-line p strong{color:var(--text);font-weight:400}
.m-divider{width:40px;height:1px;background:var(--gold-dim);margin:56px 0;opacity:0;transform:scaleX(0);transform-origin:left;transition:opacity .6s ease,transform .8s ease;}
.m-divider.visible{opacity:1;transform:scaleX(1)}
.m-statement{font-family:var(--font-cinzel),serif;font-size:clamp(26px,4.5vw,50px);font-weight:700;line-height:1.2;color:transparent;background:linear-gradient(135deg,var(--gold-dim),var(--gold),var(--gold-bright),var(--gold));-webkit-background-clip:text;background-clip:text;opacity:0;transform:translateY(22px);transition:opacity 1.1s ease,transform 1.1s ease;}
.m-statement.visible{opacity:1;transform:translateY(0)}

/*═══ THE EQUATION ═══*/
.equation{position:relative;z-index:1;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 56px;overflow:hidden;}
.equation::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 50%,rgba(201,168,76,.07) 0%,transparent 60%);pointer-events:none;}
.eq-wrap{max-width:880px;}
.eq-pre{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--gold-dim);margin-bottom:60px;opacity:0;transform:translateY(16px);transition:opacity .8s ease,transform .8s ease;}
.eq-pre.visible{opacity:1;transform:translateY(0)}
.eq-line{font-family:var(--font-cinzel),serif;font-size:clamp(20px,4vw,46px);font-weight:400;color:var(--text-dim);line-height:1.5;opacity:0;transform:translateY(20px);transition:opacity 1s ease,transform 1s ease;}
.eq-line.visible{opacity:1;transform:translateY(0)}
.eq-line.g{color:transparent;background:linear-gradient(90deg,var(--gold-dim),var(--gold-bright),var(--gold));-webkit-background-clip:text;background-clip:text;font-style:italic;}
.eq-break{width:60px;height:1px;background:linear-gradient(to right,transparent,var(--gold-dim),transparent);margin:46px auto;opacity:0;transform:scaleX(0);transform-origin:center;transition:opacity .6s ease,transform .9s ease;}
.eq-break.visible{opacity:1;transform:scaleX(1)}

/*═══ ARCH DIAGRAM ═══*/
.arch-section{position:relative;z-index:1;padding:100px 56px 120px;overflow:hidden;}
.arch-section::before{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.12),transparent);}
.arch-inner{max-width:900px;margin:0 auto;}
.sec-label{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--gold-dim);margin-bottom:60px;display:flex;align-items:center;gap:16px;}
.sec-label::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(201,168,76,.18),transparent)}
.reveal-wrap{opacity:0;transform:translateY(20px);transition:opacity 1s ease,transform 1s ease;}
.reveal-wrap.visible{opacity:1;transform:translateY(0)}

/*═══ DNA SECTION ═══*/
.dna-section{position:relative;z-index:1;padding:80px 56px 120px;overflow:hidden;}
.dna-inner{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;}
.dna-text h2{font-family:var(--font-cinzel),serif;font-size:clamp(22px,3vw,36px);font-weight:400;color:var(--text);line-height:1.25;margin-bottom:18px;}
.dna-text p{font-size:clamp(13px,1.5vw,16px);color:var(--text-dim);line-height:2.1;font-weight:300;}
.dna-text p+p{margin-top:14px;}

/*═══ PLATFORM MOCKUP ═══*/
.mockup-section{position:relative;z-index:1;padding:80px 56px 120px;overflow:hidden;}
.mockup-section::before{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.12),transparent);}
.mockup-inner{max-width:900px;margin:0 auto;}

/*═══ PRINCIPLES ═══*/
.principles{position:relative;z-index:1;padding:0 0 140px;max-width:1100px;margin:0 auto;padding-left:56px;padding-right:56px;}
.p-header{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--gold-dim);margin-bottom:80px;display:flex;align-items:center;gap:18px;}
.p-header::after{content:'';flex:1;height:1px;background:linear-gradient(to right,rgba(201,168,76,.18),transparent)}
.p-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px}
.p-item{background:rgba(255,255,255,.015);border:1px solid rgba(255,255,255,.022);padding:38px 34px;position:relative;overflow:hidden;opacity:0;transform:translateY(20px);transition:opacity .8s ease,transform .8s ease,background .4s,border-color .4s;}
.p-item.visible{opacity:1;transform:translateY(0)}
.p-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--gold);transform:scaleY(0);transform-origin:top;transition:transform .4s ease;}
.p-item:hover::before{transform:scaleY(1)}
.p-item:hover{background:var(--gold-ghost);border-color:rgba(201,168,76,.1)}
.p-num{font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:3px;color:var(--gold-dim);margin-bottom:16px;}
.p-title{font-family:var(--font-cinzel),serif;font-size:14.5px;font-weight:600;color:var(--text);margin-bottom:11px;letter-spacing:.4px;line-height:1.3;}
.p-desc{font-size:13.5px;color:var(--text-dim);line-height:1.9;font-weight:300}

/*═══ TIERS ═══*/
.tiers-section{position:relative;z-index:1;padding:0 56px 140px;overflow:hidden;}
.tiers-section::before{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,.12),transparent);}
.tiers-inner{max-width:1100px;margin:0 auto;}
.tiers-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin-top:60px;}
.tier-card{padding:32px 24px;border:1px solid rgba(255,255,255,.03);background:rgba(255,255,255,.01);position:relative;opacity:0;transform:translateY(16px);transition:opacity .7s ease,transform .7s ease,background .3s;}
.tier-card.visible{opacity:1;transform:translateY(0)}
.tier-card:hover{background:rgba(255,255,255,.025)}
.tier-card.featured{border-color:rgba(201,168,76,.18);background:rgba(201,168,76,.028);}
.tier-badge{font-family:var(--font-cinzel),serif;font-size:14px;letter-spacing:3px;color:var(--text);margin-bottom:10px;}
.tier-badge.gold{color:var(--gold)}
.tier-price{font-family:var(--font-mono),monospace;font-size:22px;color:var(--text-dim);margin-bottom:6px;}
.tier-price span{font-size:10px;letter-spacing:.2em;color:var(--text-ghost);}
.tier-note{font-family:var(--font-mono),monospace;font-size:8px;letter-spacing:.2em;color:rgba(201,168,76,.4);margin-bottom:20px;}
.tier-features{list-style:none;}
.tier-features li{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:.1em;color:var(--text-ghost);padding:5px 0;border-bottom:1px solid rgba(255,255,255,.03);}
.tier-features li::before{content:'—  ';color:rgba(201,168,76,.3);}
.tier-corner{position:absolute;top:12px;right:12px;font-family:var(--font-mono),monospace;font-size:7px;letter-spacing:.2em;color:rgba(201,168,76,.25);}

/*═══ WAITLIST ═══*/
.waitlist{position:relative;z-index:1;padding:0 56px 180px;text-align:center}
.wl-inner{max-width:580px;margin:0 auto}
.wl-pre{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:6px;text-transform:uppercase;color:var(--gold-dim);margin-bottom:28px;opacity:0;transform:translateY(16px);transition:opacity .8s ease,transform .8s ease;}
.wl-pre.visible{opacity:1;transform:translateY(0)}
.wl-count{font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:4px;color:rgba(201,168,76,.55);margin-bottom:20px;opacity:0;transform:translateY(12px);transition:opacity .8s ease .15s,transform .8s ease .15s;}
.wl-count.visible{opacity:1;transform:translateY(0)}
.wl-title{font-family:var(--font-cinzel),serif;font-size:clamp(30px,5vw,54px);font-weight:700;color:var(--text);line-height:1.1;margin-bottom:18px;opacity:0;transform:translateY(16px);transition:opacity .9s ease .1s,transform .9s ease .1s;}
.wl-title.visible{opacity:1;transform:translateY(0)}
.wl-title span{color:var(--gold)}
.wl-sub{font-family:var(--font-display),serif;font-style:italic;font-size:clamp(14px,1.8vw,18px);color:var(--text-dim);line-height:1.9;margin-bottom:44px;opacity:0;transform:translateY(16px);transition:opacity .9s ease .2s,transform .9s ease .2s;}
.wl-sub.visible{opacity:1;transform:translateY(0)}
.wl-form{display:flex;flex-direction:column;gap:1px;max-width:480px;margin:0 auto;opacity:0;transform:translateY(16px);transition:opacity .9s ease .3s,transform .9s ease .3s;}
.wl-form.visible{opacity:1;transform:translateY(0)}
.wl-input,.wl-select{width:100%;background:rgba(255,255,255,.025);border:1px solid rgba(201,168,76,.14);border-bottom:none;color:var(--text);outline:none;transition:border-color .3s,background .3s;}
.wl-input{font-family:var(--font-display),serif;font-size:15px;padding:14px 20px;letter-spacing:.5px;}
.wl-input::placeholder{color:var(--mist);font-style:italic}
.wl-input:focus,.wl-select:focus{border-color:rgba(201,168,76,.4);background:rgba(201,168,76,.03);}
.wl-select{font-family:var(--font-mono),monospace;font-size:10px;letter-spacing:.15em;padding:14px 20px;-webkit-appearance:none;appearance:none;cursor:none;color:var(--mist);}
.wl-select.filled{color:var(--text-dim);}
.wl-select option{background:#111;color:var(--text);}
.wl-btn{width:100%;background:var(--gold);border:1px solid var(--gold);border-top:none;color:var(--void);font-family:var(--font-cinzel),serif;font-size:11px;font-weight:700;letter-spacing:5px;text-transform:uppercase;padding:17px;cursor:none;transition:all .3s;position:relative;overflow:hidden;}
.wl-btn::after{content:'';position:absolute;top:50%;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);transform:translateY(-50%);transition:left .45s ease;}
.wl-btn:hover{background:var(--gold-bright);border-color:var(--gold-bright);}
.wl-btn:hover::after{left:110%}
.wl-btn:disabled{opacity:.3;pointer-events:none}
.wl-note{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:3px;color:var(--text-ghost);margin-top:18px;opacity:0;transform:translateY(16px);transition:opacity .9s ease .5s,transform .9s ease .5s;}
.wl-note.visible{opacity:1;transform:translateY(0)}
.wl-success{display:none;padding:48px;border:1px solid rgba(201,168,76,.2);background:var(--gold-ghost);position:relative;overflow:hidden;}
.wl-success::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(201,168,76,.1),transparent 55%);pointer-events:none;}
.wl-success.show{display:block}
.wl-success-num{font-family:var(--font-cinzel),serif;font-size:clamp(56px,10vw,96px);font-weight:900;color:var(--gold);line-height:1;margin-bottom:14px;text-shadow:0 0 60px rgba(201,168,76,.3);}
.wl-success-line{font-family:var(--font-display),serif;font-style:italic;font-size:19px;color:var(--text-dim);line-height:1.75;}
.wl-error{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:2px;color:rgba(220,80,80,.7);margin-top:10px;}

/*═══ ORIGIN — ANONYMOUS ═══*/
.origin{position:relative;z-index:1;border-top:1px solid rgba(201,168,76,.05);padding:140px 56px;text-align:center;overflow:hidden;}
.origin-glow{position:absolute;width:600px;height:360px;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(ellipse,rgba(201,168,76,.05) 0%,transparent 60%);animation:oglow 7s ease-in-out infinite;pointer-events:none;}
@keyframes oglow{0%,100%{opacity:.4;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}}
.origin-text{font-family:var(--font-display),serif;font-style:italic;font-size:clamp(16px,1.8vw,20px);color:var(--text-ghost);letter-spacing:1px;line-height:2.6;opacity:0;transform:translateY(12px);transition:opacity .9s ease,transform .9s ease;position:relative;z-index:1;}
.origin-text.visible{opacity:1;transform:translateY(0)}
.origin-text strong{color:rgba(201,168,76,.75);font-style:normal;font-weight:400}
.origin-div{width:40px;height:1px;background:linear-gradient(to right,transparent,var(--gold-dim),transparent);margin:44px auto;opacity:0;transform:scaleX(0);transform-origin:center;transition:opacity .6s ease .2s,transform .8s ease .2s;}
.origin-div.visible{opacity:1;transform:scaleX(1)}
.origin-sig{font-family:var(--font-cinzel),serif;font-size:11px;letter-spacing:5px;color:var(--gold-dim);opacity:0;transform:translateY(12px);transition:opacity .9s ease .3s,transform .9s ease .3s;position:relative;z-index:1;}
.origin-sig.visible{opacity:1;transform:translateY(0)}

/*═══ FOOTER ═══*/
footer{position:relative;z-index:1;border-top:1px solid rgba(255,255,255,.022);padding:36px 56px;display:flex;justify-content:space-between;align-items:center;}
.footer-mark{font-family:var(--font-cinzel),serif;font-size:11px;letter-spacing:6px;color:var(--gold-dim)}
.footer-note{font-family:var(--font-mono),monospace;font-size:9px;letter-spacing:3px;color:var(--text-ghost);text-transform:uppercase}

/*═══ KEYFRAMES ═══*/
@keyframes fadeup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes titleReveal{0%{opacity:0;transform:scale(.93) translateY(20px);filter:blur(14px)}100%{opacity:1;transform:scale(1) translateY(0);filter:blur(0)}}

/*═══ RESPONSIVE ═══*/
@media(max-width:1000px){.sense-inner,.dna-inner{grid-template-columns:1fr;gap:48px}.demo-panel{display:none}.tiers-grid{grid-template-columns:1fr 1fr}}
@media(max-width:768px){
  nav{padding:22px 24px}.nav-pulse{display:none}
  .manifesto-inner,.principles,.waitlist,.origin,.sense-section,.arch-section,.dna-section,.tiers-section,.mockup-section{padding-left:24px;padding-right:24px}
  .p-grid{grid-template-columns:1fr}.tiers-grid{grid-template-columns:1fr}
  footer{flex-direction:column;gap:14px;text-align:center;padding:28px 24px}
  .hc,.hud-txt{display:none}
}

`

// ═════════════════════════════════════════
// MOOD DATA
// ═════════════════════════════════════════
const MOODS = [
  { query:'silence before storm', bg:'linear-gradient(160deg,#020210 0%,#080820 100%)', accent:'rgba(70,80,220,.5)', dotC:'#4850dc', btn:'rgba(80,90,220,.7)', status:'DEEP_INDIGO',
    cards:[{title:'The Hour Before Rain',cat:'Fine Art · Tokyo',img:'linear-gradient(140deg,#0a0a22,#14143a)'},{title:'Void Architecture II',cat:'Architecture · Oslo',img:'linear-gradient(140deg,#05051a,#0f0f2c)'},{title:'Static & Breath',cat:'Abstract · Seoul',img:'linear-gradient(140deg,#0c0c24,#12122e)'}]},
  { query:'brutalist tokyo neon', bg:'linear-gradient(160deg,#0b020f 0%,#180520 100%)', accent:'rgba(180,40,220,.5)', dotC:'#a030c8', btn:'rgba(160,40,200,.7)', status:'ULTRA_VIOLET',
    cards:[{title:'Shinjuku After Midnight',cat:'Urban · Tokyo',img:'linear-gradient(140deg,#160520,#0e0318)'},{title:'Concrete Cathedral',cat:'Architecture · Osaka',img:'linear-gradient(140deg,#12031a,#0c040f)'},{title:'Neon Entropy Vol.7',cat:'Abstract · Kyoto',img:'linear-gradient(140deg,#18061e,#100412)'}]},
  { query:'wabi-sabi golden dusk', bg:'linear-gradient(160deg,#0f0906 0%,#1e1108 100%)', accent:'rgba(201,168,76,.5)', dotC:'#c9a84c', btn:'rgba(201,168,76,.7)', status:'AMBER_DUSK',
    cards:[{title:'Autumn Impermanence',cat:'Nature · Kyoto',img:'linear-gradient(140deg,#1a0e04,#241508)'},{title:'The Rust Speaks',cat:'Still Life · Barcelona',img:'linear-gradient(140deg,#160c03,#1c1204)'},{title:'Last Light on Stone',cat:'Architecture · Tbilisi',img:'linear-gradient(140deg,#1e1205,#241604)'}]},
  { query:'ghost in the machine', bg:'linear-gradient(160deg,#020c10 0%,#041622 100%)', accent:'rgba(30,190,220,.45)', dotC:'#1ebedd', btn:'rgba(30,190,220,.65)', status:'CYAN_GHOST',
    cards:[{title:'Signal & Noise III',cat:'Digital Art · Global',img:'linear-gradient(140deg,#031018,#041820)'},{title:'Synthetic Memory',cat:'Concept · Seoul',img:'linear-gradient(140deg,#020e18,#031016)'},{title:'Data as Elegy',cat:'Mixed Media · Berlin',img:'linear-gradient(140deg,#041218,#031520)'}]},
  { query:'bloom after war', bg:'linear-gradient(160deg,#0e0408 0%,#1c0712 100%)', accent:'rgba(200,60,100,.45)', dotC:'#c83c64', btn:'rgba(200,60,100,.65)', status:'CRIMSON_BLOOM',
    cards:[{title:'Hiroshima Iris',cat:'Fine Art · Hiroshima',img:'linear-gradient(140deg,#1a0610,#120408)'},{title:'Soil Remembers',cat:'Documentary · Rwanda',img:'linear-gradient(140deg,#140408,#0e0306)'},{title:'Scar Tissue',cat:'Abstract · Berlin',img:'linear-gradient(140deg,#180510,#100410)'}]},
]

const AFFINITIES = [
  {value:'shadow_noir',label:'Shadow Noir — Dark. Cinematic. Absolute.'},
  {value:'luminous_void',label:'Luminous Void — Minimal. Ethereal. Still.'},
  {value:'ancient_futures',label:'Ancient Futures — History meets the horizon.'},
  {value:'brutalist_harmony',label:'Brutalist Harmony — Raw form. Raw truth.'},
  {value:'wabi_sabi',label:'Wabi-Sabi — Imperfect. Transient. Beautiful.'},
  {value:'digital_sublime',label:'Digital Sublime — Code as art. Light as signal.'},
  {value:'global_roots',label:'Global Roots — Every culture. Every terrain.'},
]

const BOOT_LINES = [
  'UMBRA_OS .................. INIT',
  'AESTHETIC_ENGINE .......... LOADING',
  'GOD_ANALYTICS ............. LINK_OK',
  'SOVEREIGN_IDENTITY ........ VERIFIED',
  'LIBRARY_CORE .............. ONLINE',
  'ENTERING_SHADOW ...........',
]

// ═════════════════════════════════════════
// SENSORY DEMO
// ═════════════════════════════════════════
function SensoryDemo() {
  const [mi, setMi]       = useState(0)
  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState<'typing'|'hold'|'scanning'|'showing'|'fading'>('typing')
  const [cards, setCards] = useState([false,false,false])

  useEffect(()=>{
    const mood = MOODS[mi]
    if(phase==='typing'){
      if(typed.length<mood.query.length){
        const t=setTimeout(()=>setTyped(mood.query.slice(0,typed.length+1)),60)
        return()=>clearTimeout(t)
      } else {
        const t=setTimeout(()=>setPhase('hold'),600)
        return()=>clearTimeout(t)
      }
    }
    if(phase==='hold'){const t=setTimeout(()=>setPhase('scanning'),400);return()=>clearTimeout(t)}
    if(phase==='scanning'){
      const t=setTimeout(()=>{
        setPhase('showing');setCards([false,false,false])
        setTimeout(()=>setCards(c=>[true,c[1],c[2]]),80)
        setTimeout(()=>setCards(c=>[c[0],true,c[2]]),260)
        setTimeout(()=>setCards(c=>[c[0],c[1],true]),440)
      },1100)
      return()=>clearTimeout(t)
    }
    if(phase==='showing'){const t=setTimeout(()=>setPhase('fading'),2400);return()=>clearTimeout(t)}
    if(phase==='fading'){
      const t=setTimeout(()=>{
        setCards([false,false,false]);setTyped('');
        setMi(i=>(i+1)%MOODS.length);setPhase('typing')
      },900)
      return()=>clearTimeout(t)
    }
  },[phase,typed,mi])

  const mood=MOODS[mi]
  return(
    <div className="demo-panel" style={{borderColor:mood.accent}}>
      <div className="demo-topbar">
        <div className="dtb-dot r"/><div className="dtb-dot y"/><div className="dtb-dot g"/>
        <span className="dtb-title">umbra://sensory_engine</span>
      </div>
      <div className="demo-body" style={{background:mood.bg}}>
        <div className="demo-search-row" style={{borderColor:mood.accent}}>
          <div className="dsr-prefix" style={{color:mood.dotC}}>&#9670;</div>
          <input className="dsr-input" readOnly value={typed}/>
          {phase==='typing'&&typed.length<mood.query.length&&<span className="blink" style={{padding:'11px 4px',color:mood.dotC,fontFamily:'monospace',fontSize:13}}>|</span>}
          <div className={`dsr-btn${phase==='scanning'?' active':''}`} style={{color:mood.btn,borderColor:mood.accent}}>
            {phase==='scanning'?'SCANNING':'ENTER'}
          </div>
        </div>
        <div className="demo-status">
          <div className="ds-dot" style={{background:mood.dotC,boxShadow:`0 0 6px ${mood.dotC}`}}/>
          <span className="ds-text" style={{color:mood.btn}}>
            {phase==='typing'?'AWAITING_QUERY':phase==='scanning'?'SCANNING_LIBRARY...':phase==='showing'?`MOOD:${mood.status} // 3 RESULTS`:'CLEARING...'}
          </span>
        </div>
        <div className="demo-cards">
          {mood.cards.map((c,i)=>(
            <div key={`${mi}-${i}`} className={`demo-card${cards[i]?' show':''}`} style={{transitionDelay:`${i*.12}s`}}>
              <div className="dc-img" style={{background:c.img}}/>
              <div className="dc-info">
                <div className="dc-title">{c.title}</div>
                <div className="dc-cat">{c.cat}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="demo-footer">AESTHETIC_SCORE: 0.97 &nbsp;·&nbsp; SENSORY_MATCH: HIGH</div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════
// ARCHITECTURE DIAGRAM
// ═════════════════════════════════════════
function ArchDiagram(){
  return(
    <svg viewBox="0 0 860 620" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'auto',overflow:'visible'}}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0,2 L8,5 L0,8 Z" fill="rgba(201,168,76,.35)"/>
        </marker>
        <filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* Connector lines */}
      {[[430,90,430,158],[430,228,180,300],[430,228,430,300],[430,228,680,300],[180,370,280,456],[430,370,430,456],[680,370,580,456]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(201,168,76,.15)" strokeWidth="1" strokeDasharray="5 4" markerEnd="url(#arr)"/>
      ))}
      {/* Animated dots on key lines */}
      {['M430,90 L430,158','M430,228 L180,300','M430,228 L430,300','M430,228 L680,300'].map((p,i)=>(
        <circle key={i} r="2.5" fill={`rgba(201,168,76,${.6-i*.08})`}>
          <animateMotion dur={`${1.8+i*.3}s`} repeatCount="indefinite" path={p}/>
        </circle>
      ))}
      {/* SOVEREIGN */}
      <rect x="290" y="30" width="280" height="60" rx="1" fill="rgba(201,168,76,.065)" stroke="rgba(201,168,76,.4)" strokeWidth="1" filter="url(#glow)"/>
      <rect x="290" y="30" width="3" height="60" fill="rgba(201,168,76,.55)"/>
      <text x="430" y="54" textAnchor="middle" fill="#c9a84c" fontFamily="Cinzel,serif" fontSize="11" letterSpacing="4">SOVEREIGN</text>
      <text x="430" y="73" textAnchor="middle" fill="rgba(201,168,76,.55)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing="2">REY TEMPEST · TEMPEST GROUP</text>
      {/* AI SYSTEM */}
      <rect x="230" y="158" width="400" height="70" rx="1" fill="rgba(255,255,255,.016)" stroke="rgba(255,255,255,.05)" strokeWidth="1"/>
      <text x="430" y="183" textAnchor="middle" fill="#d4d4e0" fontFamily="Cinzel,serif" fontSize="10" letterSpacing="3">AI SOVEREIGN SYSTEM</text>
      <text x="430" y="200" textAnchor="middle" fill="rgba(160,160,185,.65)" fontFamily="Courier Prime,monospace" fontSize="7.5" letterSpacing="1.5">AESTHETIC ENGINE · GOD ANALYTICS · VISION CORE</text>
      <text x="430" y="216" textAnchor="middle" fill="rgba(201,168,76,.28)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="1.5">STATUS: ONLINE — NO EGO — NO FATIGUE — 24/7</text>
      {/* Library */}
      <rect x="70" y="300" width="220" height="70" rx="1" fill="rgba(255,255,255,.014)" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
      <text x="180" y="327" textAnchor="middle" fill="#c9a84c" fontFamily="Cinzel,serif" fontSize="9" letterSpacing="2.5">THE LIBRARY</text>
      <text x="180" y="345" textAnchor="middle" fill="rgba(160,160,185,.55)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="1.5">Aesthetic assets · CC0 + licensed</text>
      <text x="180" y="360" textAnchor="middle" fill="rgba(201,168,76,.3)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="1.5">Curated. No floor drop. Ever.</text>
      {/* Signal Radio */}
      <rect x="320" y="300" width="220" height="70" rx="1" fill="rgba(255,255,255,.014)" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
      <text x="430" y="327" textAnchor="middle" fill="#c9a84c" fontFamily="Cinzel,serif" fontSize="9" letterSpacing="2.5">SIGNAL RADIO</text>
      <text x="430" y="345" textAnchor="middle" fill="rgba(160,160,185,.55)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="1.5">Ambient broadcast · live · curated</text>
      <text x="430" y="360" textAnchor="middle" fill="rgba(201,168,76,.3)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="1.5">Free at ACCESS tier</text>
      {/* The Block */}
      <rect x="570" y="300" width="220" height="70" rx="1" fill="rgba(255,255,255,.014)" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
      <text x="680" y="327" textAnchor="middle" fill="#c9a84c" fontFamily="Cinzel,serif" fontSize="9" letterSpacing="2.5">THE BLOCK</text>
      <text x="680" y="345" textAnchor="middle" fill="rgba(160,160,185,.55)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="1.5">Limited auctions · expiry dates</text>
      <text x="680" y="360" textAnchor="middle" fill="rgba(201,168,76,.3)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="1.5">Scarcity as design principle</text>
      {/* THE WORLD */}
      <rect x="260" y="456" width="340" height="70" rx="1" fill="rgba(255,255,255,.01)" stroke="rgba(201,168,76,.1)" strokeWidth="1"/>
      <text x="430" y="483" textAnchor="middle" fill="rgba(201,168,76,.65)" fontFamily="Cinzel,serif" fontSize="10" letterSpacing="3">THE WORLD</text>
      <text x="430" y="500" textAnchor="middle" fill="rgba(160,160,185,.5)" fontFamily="Courier Prime,monospace" fontSize="7.5" letterSpacing="1.5">Users · Creators · Subscribers</text>
      <text x="430" y="515" textAnchor="middle" fill="rgba(201,168,76,.25)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="1.5">ACCESS · NOIR · PRESTIGE · OBSIDIAN</text>
      {/* Side labels */}
      <text x="24" y="180" fill="rgba(201,168,76,.18)" fontFamily="Courier Prime,monospace" fontSize="7.5" letterSpacing="1.5" textAnchor="middle" transform="rotate(-90,24,180)">CONTROL</text>
      <text x="836" y="330" fill="rgba(201,168,76,.18)" fontFamily="Courier Prime,monospace" fontSize="7.5" letterSpacing="1.5" textAnchor="middle" transform="rotate(90,836,330)">CONTENT</text>
    </svg>
  )
}

// ═════════════════════════════════════════
// DNA RADAR CHART
// ═════════════════════════════════════════
function DNAChart(){
  const axes=[
    {label:'Shadow Noir',     a:-90,v:.88},
    {label:'Wabi-Sabi',       a:-30,v:.75},
    {label:'Global Roots',    a: 30,v:.92},
    {label:'Digital Sublime', a: 90,v:.70},
    {label:'Brutalist',       a:150,v:.80},
    {label:'Ancient Futures', a:210,v:.85},
  ]
  const R=118,cx=180,cy=175
  const xy=(a:number,r:number)=>({x:cx+r*Math.cos(a*Math.PI/180),y:cy+r*Math.sin(a*Math.PI/180)})
  const rings=[.25,.5,.75,1]
  const pts=axes.map(a=>xy(a.a,a.v*R))
  const poly=pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')+' Z'
  return(
    <svg viewBox="0 0 360 350" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:360,height:'auto'}}>
      <defs>
        <radialGradient id="rf" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(201,168,76,.2)"/>
          <stop offset="100%" stopColor="rgba(201,168,76,.04)"/>
        </radialGradient>
      </defs>
      {rings.map((r,i)=>{
        const rpts=axes.map(a=>xy(a.a,r*R))
        const rp=rpts.map((p,j)=>`${j===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')+' Z'
        return <path key={i} d={rp} fill="none" stroke="rgba(201,168,76,.07)" strokeWidth="1"/>
      })}
      {axes.map((a,i)=>{const e=xy(a.a,R);return<line key={i} x1={cx} y1={cy} x2={e.x.toFixed(1)} y2={e.y.toFixed(1)} stroke="rgba(201,168,76,.09)" strokeWidth="1"/>})}
      <path d={poly} fill="url(#rf)" stroke="rgba(201,168,76,.6)" strokeWidth="1.5">
        <animate attributeName="opacity" values=".7;1;.7" dur="4s" repeatCount="indefinite"/>
      </path>
      {pts.map((p,i)=>(
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill="rgba(201,168,76,.75)" stroke="rgba(201,168,76,.3)" strokeWidth="1">
          <animate attributeName="r" values="3;4.5;3" dur={`${3+i*.4}s`} repeatCount="indefinite"/>
        </circle>
      ))}
      {axes.map((a,i)=>{const lp=xy(a.a,R+22);return(
        <text key={i} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle" fill="rgba(170,170,195,.75)" fontFamily="Courier Prime,monospace" fontSize="7.5" letterSpacing="1.2">{a.label.toUpperCase()}</text>
      )})}
      <text x={cx} y={cy-6} textAnchor="middle" fill="rgba(201,168,76,.65)" fontFamily="Cinzel,serif" fontSize="10" letterSpacing="3">UMBRA</text>
      <text x={cx} y={cy+11} textAnchor="middle" fill="rgba(201,168,76,.3)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="2">AESTHETIC DNA</text>
    </svg>
  )
}

// ═════════════════════════════════════════
// PLATFORM MOCKUP
// ═════════════════════════════════════════
function PlatformMockup(){
  return(
    <svg viewBox="0 0 860 520" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'auto',borderRadius:2}}>
      {/* Browser chrome */}
      <rect width="860" height="520" fill="#040407"/>
      <rect width="860" height="38" fill="rgba(0,0,0,.6)"/>
      <circle cx="20" cy="19" r="5" fill="rgba(255,80,80,.4)"/>
      <circle cx="36" cy="19" r="5" fill="rgba(201,168,76,.4)"/>
      <circle cx="52" cy="19" r="5" fill="rgba(80,200,80,.3)"/>
      <rect x="70" y="10" width="720" height="18" rx="2" fill="rgba(255,255,255,.03)"/>
      <text x="430" y="22.5" textAnchor="middle" fill="rgba(160,160,180,.4)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing=".15em">umbra.black</text>
      {/* Sidebar */}
      <rect x="0" y="38" width="200" height="482" fill="rgba(0,0,0,.4)"/>
      <text x="24" y="68" fill="#c9a84c" fontFamily="Cinzel,serif" fontSize="12" letterSpacing="5">UMBRA</text>
      {[{label:'Library',y:100},{label:'Signal Radio',y:124},{label:'The Block',y:148},{label:'My Collection',y:172},{label:'Sensory Search',y:196}].map((item,i)=>(
        <g key={i}>
          <rect x="0" y={item.y-12} width="200" height="22" fill={i===4?'rgba(201,168,76,.06)':'transparent'}/>
          <text x="24" y={item.y+4} fill={i===4?'rgba(201,168,76,.7)':'rgba(160,160,180,.5)'} fontFamily="Courier Prime,monospace" fontSize="8.5" letterSpacing="1.5">{item.label.toUpperCase()}</text>
          {i===4&&<rect x="0" y={item.y-12} width="2" height="22" fill="rgba(201,168,76,.7)"/>}
        </g>
      ))}
      <text x="24" y="280" fill="rgba(120,120,140,.4)" fontFamily="Courier Prime,monospace" fontSize="7" letterSpacing="1.5">TIER</text>
      <rect x="24" y="290" width="120" height="24" rx="1" fill="rgba(201,168,76,.08)" stroke="rgba(201,168,76,.2)" strokeWidth="1"/>
      <text x="84" y="306" textAnchor="middle" fill="rgba(201,168,76,.6)" fontFamily="Cinzel,serif" fontSize="9" letterSpacing="3">NOIR</text>
      {/* Main area */}
      <rect x="200" y="38" width="660" height="50" fill="rgba(0,0,0,.3)" stroke="none"/>
      <rect x="220" y="51" width="440" height="24" rx="1" fill="rgba(255,255,255,.03)" stroke="rgba(201,168,76,.12)" strokeWidth="1"/>
      <text x="244" y="67" fill="rgba(160,160,180,.45)" fontFamily="Courier Prime,monospace" fontSize="9" letterSpacing=".1em">Type a mood, a texture, a feeling...</text>
      <text x="650" y="67" fill="rgba(201,168,76,.35)" fontFamily="Courier Prime,monospace" fontSize="8" letterSpacing="2">&#9670; SEARCH</text>
      {/* Grid header */}
      <text x="220" y="114" fill="rgba(201,168,76,.4)" fontFamily="Courier Prime,monospace" fontSize="7.5" letterSpacing="3">SHADOW NOIR · 247 ASSETS</text>
      {/* Asset cards */}
      {[
        {x:220,y:126,w:148,h:110,bg:'rgba(12,8,20,.9)',light:'rgba(60,40,120,.3)'},
        {x:374,y:126,w:148,h:110,bg:'rgba(8,12,18,.9)',light:'rgba(20,80,140,.2)'},
        {x:528,y:126,w:148,h:110,bg:'rgba(14,6,10,.9)',light:'rgba(120,30,60,.2)'},
        {x:682,y:126,w:148,h:110,bg:'rgba(10,12,8,.9)',light:'rgba(20,100,40,.15)'},
        {x:220,y:244,w:148,h:110,bg:'rgba(16,12,4,.9)',light:'rgba(160,120,20,.2)'},
        {x:374,y:244,w:148,h:110,bg:'rgba(6,14,16,.9)',light:'rgba(20,120,140,.2)'},
        {x:528,y:244,w:148,h:110,bg:'rgba(12,6,18,.9)',light:'rgba(80,20,160,.2)'},
        {x:682,y:244,w:148,h:110,bg:'rgba(14,14,6,.9)',light:'rgba(100,100,10,.15)'},
      ].map((c,i)=>(
        <g key={i}>
          <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={c.bg} stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
          <circle cx={c.x+c.w/2} cy={c.y+c.h/2} r={c.w*.4} fill={c.light} style={{filter:'blur(20px)'}}/>
          <rect x={c.x} y={c.y+c.h-26} width={c.w} height="26" fill="rgba(0,0,0,.6)"/>
          <text x={c.x+10} y={c.y+c.h-14} fill="rgba(200,200,215,.55)" fontFamily="Courier Prime,monospace" fontSize="7.5" letterSpacing=".1em">ASSET {String(i+1).padStart(3,'0')}</text>
          <text x={c.x+10} y={c.y+c.h-4} fill="rgba(201,168,76,.3)" fontFamily="Courier Prime,monospace" fontSize="6.5">CC0 · 4K</text>
        </g>
      ))}
      {/* Row 3 partial */}
      {[{x:220},{x:374},{x:528}].map((c,i)=>(
        <rect key={i} x={c.x} y={362} width={148} height={110} fill="rgba(255,255,255,.012)" stroke="rgba(255,255,255,.03)" strokeWidth="1"/>
      ))}
      {/* Status bar */}
      <rect x="200" y="482" width="660" height="38" fill="rgba(0,0,0,.5)" stroke="none"/>
      <text x="220" y="505" fill="rgba(201,168,76,.3)" fontFamily="Courier Prime,monospace" fontSize="7.5" letterSpacing="2">AESTHETIC_ENGINE: ACTIVE &nbsp;·&nbsp; 247 ASSETS LOADED &nbsp;·&nbsp; SIGNAL RADIO: BROADCASTING</text>
    </svg>
  )
}

// ═════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════
type Stat = 'idle'|'loading'|'success'|'error'

export default function ManifestoPage(){
  const [bootStep,setBoot]   = useState(-1)
  const [wmShow,setWm]       = useState(false)
  const [lifted,setLifted]   = useState(false)
  const [eyebrow,setEy]      = useState('')
  const [form,setForm]       = useState({name:'',email:'',aesthetic_affinity:''})
  const [stat,setStat]       = useState<Stat>('idle')
  const [pos,setPos]         = useState<number|null>(null)
  const [count,setCount]     = useState<number|null>(null)
  const [err,setErr]         = useState('')
  const canvasRef            = useRef<HTMLCanvasElement>(null)
  const trailRef             = useRef<HTMLCanvasElement>(null)
  const hunterRef            = useRef<HTMLDivElement>(null)

  const EY_TEXT = 'The World\'s Aesthetic Intelligence. Not a Feed.'

  // Boot sequence
  useEffect(()=>{
    const ts:ReturnType<typeof setTimeout>[]=[]
    BOOT_LINES.forEach((_,i)=>ts.push(setTimeout(()=>setBoot(i),280+i*340)))
    ts.push(setTimeout(()=>setWm(true),280+BOOT_LINES.length*340))
    ts.push(setTimeout(()=>setLifted(true),280+BOOT_LINES.length*340+1500))
    return()=>ts.forEach(clearTimeout)
  },[])

  // Typewriter
  useEffect(()=>{
    if(!lifted)return
    let i=0
    const id=setInterval(()=>{setEy(EY_TEXT.slice(0,i+1));i++;if(i>=EY_TEXT.length)clearInterval(id)},42)
    return()=>clearInterval(id)
  },[lifted])

  // Count
  useEffect(()=>{
    fetch('/api/waitlist/count').then(r=>r.json()).then(d=>{if(d.count!==undefined)setCount(d.count)}).catch(()=>{})
  },[])

  // Cursor + particles + scroll reveals
  useEffect(()=>{
    if(!lifted)return
    const hunter=hunterRef.current
    const trail=trailRef.current
    const canvas=canvasRef.current
    if(!trail||!canvas||!hunter)return
    const tctx=trail.getContext('2d')!
    const pctx=canvas.getContext('2d')!
    let W=0,H=0
    const resize=()=>{W=trail.width=canvas.width=window.innerWidth;H=trail.height=canvas.height=window.innerHeight}
    resize();window.addEventListener('resize',resize)
    let mx=0,my=0
    const trailPts:{x:number;y:number;t:number}[]=[]
    const onMove=(e:MouseEvent)=>{
      mx=e.clientX;my=e.clientY
      hunter.style.left=mx+'px';hunter.style.top=my+'px'
      trailPts.push({x:mx,y:my,t:Date.now()})
      if(trailPts.length>30)trailPts.shift()
    }
    document.addEventListener('mousemove',onMove)
    const onEnt=()=>document.body.classList.add('hovering')
    const onLve=()=>document.body.classList.remove('hovering')
    document.querySelectorAll('a,button,input,select,.p-item').forEach(el=>{el.addEventListener('mouseenter',onEnt);el.addEventListener('mouseleave',onLve)})

    // Particles
    class P{x=0;y=0;sz=0;vx=0;vy=0;o=0;to=0;life=0;max=0
      constructor(){this.reset(true)}
      reset(init:boolean){this.x=Math.random()*W;this.y=init?Math.random()*H:H+10;this.sz=Math.random()*1.8+.4;this.vy=-(Math.random()*.38+.14);this.vx=(Math.random()-.5)*.2;this.o=0;this.to=Math.random()*.4+.07;this.life=0;this.max=Math.random()*420+200}
      tick(){this.x+=this.vx;this.y+=this.vy;this.life++;if(this.life<60)this.o=(this.life/60)*this.to;else if(this.life>this.max-60)this.o=((this.max-this.life)/60)*this.to;if(this.life>=this.max||this.y<-10)this.reset(false)}
      draw(){pctx.save();pctx.globalAlpha=this.o;pctx.fillStyle='#c9a84c';pctx.shadowColor='#c9a84c';pctx.shadowBlur=8;pctx.beginPath();pctx.arc(this.x,this.y,this.sz,0,Math.PI*2);pctx.fill();pctx.restore()}
    }
    const ps:P[]=Array.from({length:90},()=>new P())
    let aid:number,tid:number
    const animP=()=>{
      pctx.clearRect(0,0,W,H)
      for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const dx=ps[i].x-ps[j].x,dy=ps[i].y-ps[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<110){pctx.beginPath();pctx.strokeStyle=`rgba(201,168,76,${(1-d/110)*.065})`;pctx.lineWidth=.6;pctx.moveTo(ps[i].x,ps[i].y);pctx.lineTo(ps[j].x,ps[j].y);pctx.stroke()}}
      ps.forEach(p=>{p.tick();p.draw()})
      aid=requestAnimationFrame(animP)
    }
    aid=requestAnimationFrame(animP)

    // Comet trail
    const animT=()=>{
      tctx.clearRect(0,0,W,H)
      const now=Date.now()
      const fresh=trailPts.filter(p=>now-p.t<300)
      if(fresh.length>1){
        for(let i=1;i<fresh.length;i++){
          const age=(now-fresh[i].t)/300
          tctx.beginPath();tctx.arc(fresh[i].x,fresh[i].y,(1-age)*4.5,0,Math.PI*2)
          tctx.fillStyle=`rgba(201,168,76,${(1-age)*.5})`;tctx.shadowBlur=10;tctx.shadowColor='rgba(201,168,76,.35)';tctx.fill()
        }
      }
      tid=requestAnimationFrame(animT)
    }
    tid=requestAnimationFrame(animT)

    // Scroll reveals
    const obs=new IntersectionObserver(e=>{e.forEach(en=>{if(en.isIntersecting)(en.target as HTMLElement).classList.add('visible')})},{threshold:.1,rootMargin:'0px 0px -40px 0px'})
    document.querySelectorAll('.m-line,.m-divider,.m-statement,.p-item,.wl-pre,.wl-count,.wl-title,.wl-sub,.wl-form,.wl-note,.origin-text,.origin-div,.origin-sig,.eq-pre,.eq-line,.eq-break,.reveal-wrap,.tier-card').forEach(el=>obs.observe(el))
    document.querySelectorAll<HTMLElement>('.p-item').forEach((el,i)=>{el.style.transitionDelay=(i*.08)+'s'})
    document.querySelectorAll<HTMLElement>('.tier-card').forEach((el,i)=>{el.style.transitionDelay=(i*.12)+'s'})

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
      if(!res.ok)throw new Error(data.error||'The shadow rejected this entry.')
      setStat('success');setPos(data.position)
    }catch(e:unknown){setStat('error');setErr(e instanceof Error?e.message:'An error occurred.')}
  },[form,stat])

  const canSub=form.email&&form.aesthetic_affinity&&stat!=='loading'

  return(
    <>
      <style dangerouslySetInnerHTML={{__html:STYLES}}/>

      {/* BOOT CURTAIN */}
      <div id="curtain" className={lifted?'lifted':''}>
        <div className="boot-wrap">
          {BOOT_LINES.map((line,i)=>(
            <div key={i} className={`boot-line${bootStep>=i?' on':''}${i===BOOT_LINES.length-1&&bootStep>=i?' last':''}`}>{line}</div>
          ))}
        </div>
        <div className={`curtain-mark${wmShow?' show':''}`}>UMBRA</div>
        <div className={`curtain-micro${wmShow?' show':''}`}>Aesthetic Intelligence. Global. Uncompromising.</div>
      </div>

      {/* VOID HUNTER CURSOR */}
      <div id="hunter" ref={hunterRef}>
        <div className="h-ring"/>
        <div className="h-outer">
          {[...Array(8)].map((_,i)=><div key={i} className="h-tick"/>)}
        </div>
        <div className="h-mid"><div className="h-mid-arc"/></div>
        <div className="h-cross"/>
        <div className="h-core"/>
      </div>
      <canvas ref={trailRef} id="trail-cv"/>

      <div className="vignette"/>
      <canvas ref={canvasRef} id="canvas"/>

      {/* NAV */}
      <nav>
        <a href="#" className="nav-mark">UMBRA</a>
        <div className="nav-links">
          <a href="#manifesto">Manifesto</a>
          <a href="#engine">Sensory Engine</a>
          <a href="#tiers">Access</a>
          <a href="#waitlist">Enter</a>
        </div>
        <div className="nav-pulse"><div className="pulse-dot"/><span>SOVEREIGN ONLINE</span></div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="hero">
        <div className="scanlines"/>
        <div className="hud-frame">
          <div className="hc tl"/><div className="hc tr"/>
          <div className="hc bl"/><div className="hc br"/>
          <div className="hud-txt a">AESTHETIC_ENGINE: ONLINE</div>
          <div className="hud-txt b">SOVEREIGN_SYSTEM: ACTIVE</div>
          <div className="hud-txt c">SHADOW: INITIALIZING</div>
        </div>
        <div className="hero-eyebrow">{eyebrow}</div>
        <div style={{position:'relative',zIndex:3}}>
          <h1 className="hero-title">UMBRA<span className="hero-shimmer"/></h1>
        </div>
        <div className="hero-tags">
          {['Dark','Luminous','Global','Unsentimental','Precise'].map((t,i)=>(
            <div key={t} className={`htag${i===0||i===2?'  lit':''}`}>{t}</div>
          ))}
        </div>
        <p className="hero-kicker">
          Not a platform. Not a library. Not a feed.<br/>
          <em>A world, governed by a single aesthetic law.</em>
        </p>
        <div className="hero-divider"/>
        <div className="scroll-hint"><span>Descend</span><div className="scroll-line"/></div>
      </section>

      {/* ══ SENSORY ENGINE ══ */}
      <section className="sense-section" id="engine">
        <div className="sense-inner">
          <div className="sense-text">
            <div className="s-label">The Sensory Engine</div>
            <h2>You type a frequency.<br/><em>The library answers it.</em></h2>
            <p>Every search engine alive works the same way. You type a word. It finds other words near it. It calls this intelligence.</p>
            <p style={{marginTop:14}}>UMBRA does not do this. When you type <strong style={{color:'var(--text)'}}>&#x201C;silence before a storm&#x201D;</strong> — the interface becomes that atmospheric density. The particles shift frequency. The ambient score changes key. What surfaces was not retrieved by keyword proximity. It was <strong style={{color:'var(--text)'}}>summoned by aesthetic resonance.</strong></p>
            <div className="sense-bullet" style={{marginTop:28}}>
              <div className="sb-num">01</div>
              <div className="sb-text">TYPE MOODS, TEXTURES, SENSATIONS — NOT KEYWORDS</div>
            </div>
            <div className="sense-bullet">
              <div className="sb-num">02</div>
              <div className="sb-text">THE INTERFACE BREATHES THE AESTHETIC IN REAL TIME</div>
            </div>
            <div className="sense-bullet">
              <div className="sb-num">03</div>
              <div className="sb-text">RESULTS CURATED FOR TRUTH — NOT ENGAGEMENT SCORE</div>
            </div>
          </div>
          <div><SensoryDemo/></div>
        </div>
      </section>

      {/* ══ MANIFESTO ══ */}
      <section className="manifesto" id="manifesto">
        <div className="manifesto-inner">
          <div className="m-label">The Manifesto</div>

          <div className="m-line">
            <h2>The internet was handed a mandate: <em>democratize beauty.</em></h2>
            <p>It chose engagement instead. Engagement chose the algorithm. The algorithm chose whatever kept you scrolling longest. What remained after twenty years of this was a billion assets optimized for nothing except surviving the feed. <strong>Beauty was not a casualty. It was a design choice — one they made without you.</strong></p>
          </div>
          <div className="m-divider"/>

          <div className="m-line">
            <h2>You cannot algorithm your way to <em>a point of view.</em></h2>
            <p>Every platform that has tried to build a curated aesthetic layer has eventually sacrificed it for growth. The pressure always wins. The floor always drops. Except on platforms built around the refusal to let it. <strong>UMBRA&apos;s architecture is the refusal.</strong> Not a feature. The entire structure.</p>
          </div>
          <div className="m-divider"/>

          <div className="m-line">
            <h2>The library is a conscience. <em>Governed by aesthetic law.</em></h2>
            <p>Every asset that enters UMBRA is interrogated — not for likes, not for reach, not for trending velocity. For one thing: <strong>does it earn its place?</strong> The answer is binary. Yes, it passes. No, it doesn&apos;t exist here. The interrogation never stops. The standard never negotiates. This is not curation as a feature. This is curation as the organism&apos;s immune system.</p>
          </div>
          <div className="m-divider"/>

          <div className="m-line">
            <h2>Seoul has light the West has not named yet. <em>This is core product.</em></h2>
            <p>Tbilisi has geometry that European schools will theorize in thirty years. Lagos has texture that New York galleries will pay fortunes to reproduce in forty. The world does not orbit a default culture. UMBRA was built knowing this — sourcing from everywhere with the same standard, no dilution, no tokenism, no diversity quota. <strong>The world, held to one honest bar.</strong></p>
          </div>
          <div className="m-divider"/>

          <div className="m-line">
            <h2>Scarcity is not a marketing trick. <em>It is a philosophical position.</em></h2>
            <p>When The Block runs an auction, the asset expires. When it&apos;s gone, it&apos;s gone. This is not artificial urgency. This is the platform saying: <strong>what is limited is respected.</strong> What you could download infinitely, you never valued. What you almost missed, you remember. The architecture builds that relationship at the structural level — not in the copy.</p>
          </div>
          <div className="m-divider"/>

          <div className="m-line">
            <h2>UMBRA earns your return. <em>It will not perform for it.</em></h2>
            <p>There are no push notifications. No re-engagement campaigns. No &ldquo;we miss you.&rdquo; No streak mechanics. No dark patterns dressed as features. You leave. You come back when it serves you. When you do, the platform has grown in your absence. <strong>The confidence to not chase is the brand itself.</strong> Platforms that beg for attention reveal they have nothing worth returning to.</p>
          </div>
          <div className="m-divider"/>

          <div className="m-statement">
            What is limited is respected.<br/>
            What is rare is real.<br/>
            What is beautiful — belongs.
          </div>
          <div className="m-divider"/>

          <div className="m-line">
            <h2>One mind holds the vision. <em>An AI holds the library.</em></h2>
            <p>The AI curates: sorting, tagging, scheduling, broadcasting — without ego, without fatigue, without the temptation to compromise for traffic spikes. The Sovereign overrides when the vision demands it. Neither replaces the other. <strong>This is not a startup optimizing for growth. This is a new kind of institution</strong> — one where the curation outlasts any single news cycle, funding round, or trend.</p>
          </div>
        </div>
      </section>

      {/* ══ THE EQUATION ══ */}
      <section className="equation">
        <div className="eq-wrap">
          <div className="eq-pre">The Equation</div>
          <p className="eq-line">Every platform optimizes for your <em style={{fontStyle:'italic'}}>attention.</em></p>
          <div className="eq-break"/>
          <p className="eq-line g">UMBRA optimizes for your discernment.</p>
          <div className="eq-break"/>
          <p className="eq-line" style={{fontSize:'clamp(13px,2vw,20px)',color:'var(--text-ghost)'}}>
            These are not the same thing.<br/>They never were. They never will be.
          </p>
        </div>
      </section>

      {/* ══ PLATFORM MOCKUP ══ */}
      <section className="mockup-section">
        <div className="mockup-inner">
          <div className="sec-label">What You Enter</div>
          <div className="reveal-wrap">
            <PlatformMockup/>
          </div>
        </div>
      </section>

      {/* ══ ARCHITECTURE ══ */}
      <section className="arch-section">
        <div className="arch-inner">
          <div className="sec-label">System Architecture</div>
          <div className="reveal-wrap"><ArchDiagram/></div>
        </div>
      </section>

      {/* ══ DNA CHART ══ */}
      <section className="dna-section">
        <div className="dna-inner">
          <div className="dna-text">
            <div className="sec-label">Aesthetic Spectrum</div>
            <h2>Seven dimensions.<br/>One standard.</h2>
            <p>UMBRA is not a flat archive. It is a multidimensional aesthetic universe — seven distinct sensory territories, each with its own curatorial logic, its own visual language, its own depth. No dimension outranks another. All seven demand the same level of visual truth.</p>
            <p style={{color:'var(--text-ghost)',fontSize:13,fontFamily:'var(--font-mono)',letterSpacing:'.08em',lineHeight:2,marginTop:16}}>SHADOW NOIR · WABI-SABI · GLOBAL ROOTS · DIGITAL SUBLIME · BRUTALIST HARMONY · ANCIENT FUTURES · LUMINOUS VOID</p>
          </div>
          <div className="reveal-wrap"><DNAChart/></div>
        </div>
      </section>

      {/* ══ THE LAW ══ */}
      <section className="principles">
        <div className="p-header">The Law</div>
        <div className="p-grid">
          {[
            {n:'01',t:'Quality Is the Only Filter',d:'Not popularity. Not recency. Not engagement score. If an asset is beautiful, it belongs. If it is not, it does not. The floor never descends — not for traffic, not for growth, not for any external pressure.'},
            {n:'02',t:'Scarcity Is Respect',d:'When something is limited, its value is acknowledged. When something expires, it meant something while it lasted. These are not marketing tricks. They are a position on what beauty deserves.'},
            {n:'03',t:'The AI Serves the Vision',d:'Optimized for aesthetic coherence — not engagement metrics, time-on-site, or click rates. A platform optimized for engagement becomes addictive and hollow. Optimized for aesthetic health: it becomes essential.'},
            {n:'04',t:'Your Data Is Not a Product',d:'Behavioral data exists to improve your experience. It is never sold. Never shared. Never used to serve advertising. God Analytics serves curation — not a revenue model built on your attention.'},
            {n:'05',t:'Precision or Silence',d:'Every word published — every description, every broadcast, every error message — is written to the same standard as the content it surrounds. Silence is preferable to the wrong words. Always.'},
            {n:'06',t:'The World Is the Source',d:'UMBRA was built by a mind that refused institutional permission. It serves the entire world — not a default market, not a dominant culture. That tension is what makes the curation honest.'},
          ].map(item=>(
            <div key={item.n} className="p-item">
              <div className="p-num">{item.n}</div>
              <div className="p-title">{item.t}</div>
              <div className="p-desc">{item.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ TIERS ══ */}
      <section className="tiers-section" id="tiers">
        <div className="tiers-inner">
          <div className="sec-label">Access Tiers</div>
          <div className="tiers-grid">
            {[
              {name:'ACCESS',price:'Free',note:'Forever free',featured:false,corner:'ENTRY',features:['5 CC0 downloads / month','SIGNAL Radio broadcast','Sensory search (limited)','Community layer']},
              {name:'NOIR',price:'$15',note:'/month · regional pricing available',featured:false,corner:'MOST POPULAR',features:['30 CC0 downloads / month','Full sensory search engine','The Block auction access','Priority new arrivals']},
              {name:'PRESTIGE',price:'$39',note:'/month',featured:true,corner:'OBSIDIAN-ADJACENT',features:['Unlimited CC0 downloads','Full sensory engine + history','The Block early access','Advanced collection tools']},
              {name:'OBSIDIAN',price:'$99',note:'/month',featured:false,corner:'INNER CIRCLE',features:['Everything in PRESTIGE','Direct API access','Inner Circle dispatches','Sovereign communications']},
            ].map((t,i)=>(
              <div key={t.name} className={`tier-card${t.featured?' featured':''}`}>
                <div className="tier-corner">{t.corner}</div>
                <div className={`tier-badge${t.featured?' gold':''}`}>{t.name}</div>
                <div className="tier-price">{t.price} <span>{t.note}</span></div>
                <ul className="tier-features">{t.features.map(f=><li key={f}>{f}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WAITLIST ══ */}
      <section className="waitlist" id="waitlist">
        <div className="wl-inner">
          <div className="wl-pre">The Shadow Opens</div>
          {count!==null&&<div className="wl-count">{count} {count===1?'soul':'souls'} already in the shadow</div>}
          <h2 className="wl-title">Enter <span>Before</span> the World Knows</h2>
          <p className="wl-sub">The first 100 subscribers enter at a locked-in price — forever. Their names go on the Founding Wall. Their access never expires. Founding membership is never offered again.</p>
          {stat==='success'?(
            <div className="wl-success show">
              <div className="wl-success-num">{pos!==null?`#${String(pos).padStart(3,'0')}`:'\u2014'}</div>
              <div className="wl-success-line">You are in the shadow.<br/>We will call you when the door opens.</div>
            </div>
          ):(
            <form onSubmit={handleSubmit}>
              <div className="wl-form visible">
                <input className="wl-input" type="text" placeholder="Your name..." value={form.name} onChange={e=>set('name',e.target.value)} autoComplete="name"/>
                <input className="wl-input" type="email" placeholder="Your email address..." value={form.email} onChange={e=>set('email',e.target.value)} autoComplete="email" required style={{borderTop:'none'}}/>
                <div style={{position:'relative'}}>
                  <select className={`wl-select${form.aesthetic_affinity?' filled':''}`} value={form.aesthetic_affinity} onChange={e=>set('aesthetic_affinity',e.target.value)} required>
                    <option value="" disabled>Your aesthetic affinity —</option>
                    {AFFINITIES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <span style={{position:'absolute',right:16,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'rgba(201,168,76,.4)',fontSize:11}}>&#9662;</span>
                </div>
                {stat==='error'&&<p className="wl-error">{err}</p>}
                <button className="wl-btn" type="submit" disabled={!canSub}>{stat==='loading'?'...':'Enter the Shadow'}</button>
              </div>
            </form>
          )}
          <p className="wl-note">No notifications. No marketing. One email &mdash; when it opens.</p>
        </div>
      </section>

      {/* ══ ORIGIN — ANONYMOUS ══ */}
      <section className="origin">
        <div className="origin-glow"/>
        <p className="origin-text">
          One mind.<br/>
          <strong>Zero permission.</strong><br/>
          Zero institutions. Zero inheritance. Zero map.<br/><br/>
          Built in the hours the world wasn&apos;t watching.<br/>
          From an idea that refused to wait for the right conditions.<br/><br/>
          <em>The right conditions were never coming.<br/>
          So the platform was built instead.</em>
        </p>
        <div className="origin-div"/>
        <div className="origin-sig">REY TEMPEST &nbsp;&middot;&nbsp; TEMPEST GROUP</div>
      </section>

      <footer>
        <div className="footer-mark">UMBRA</div>
        <div className="footer-note">&copy; 2026 Tempest Group &nbsp;&middot;&nbsp; All rights reserved</div>
      </footer>
    </>
  )
}
