/* main.js - clean, fixed version
Features:
- Uses /images/backgrounds1.png for intro, /images/backgrounds2.png for proposal (fallback gradients if missing)
- Intro with typed paragraph and Continue button
- Proposal screen with YES and NO (NO dodges)
- On YES: shows message "mm sure if you really do wanna marry me then catch the ring!!" and spawns a bouncing, clickable ring
- When ring is clicked, shows success screen
- Mobile-friendly, simple audio support and graceful fallbacks
Save this file as main.js in your repo root (or paste into your single-file HTML).
*/

(function(){
  'use strict';

  const CONFIG = {
    titleName: 'Dear, Ema',
    introText: `Dear Ema,

Every night I fall asleep smiling because somewhere on the other side of the world your laugh is still echoing in my head. You make tiny things feel enormous — a sleepy text, the way you describe a silly little thought, the stories you tell me at 2 AM that turn ordinary minutes into the best part of my day. Loving you is a quiet, constant adventure: I love hearing your voice, trading ridiculous memes, building plans that start as jokes and slowly turn into promises. I want to be the one who learns your favorite songs and sings them badly just so you laugh; the one who cheers when you try something new; the one who holds your hand through cold Wi‑Fi and low battery and every sunrise in between. I promise to choose you even on the ordinary days, to celebrate your tiny wins, to give you a soft place after a rough day, and to keep finding ways to surprise you — with dumb jokes, midnight playlists, and promises written in pixels. You are my favorite conversation, my safest chaos, my warm light when everything else turns grey. Stay with me in this long, silly, beautiful story — I’ll keep turning the pages if you’ll keep reading them with me.

— Ned`,

    proposalTitle: 'Will you marry me 🥹',
    proposalSubtitle: `Do you accept Ned — as your partner in every midnight chat, your teammate when plans go sideways, your cheerleader when you try something brave, and your stubborn, silly, loving husband through slow days, fast days, low batteries and spotty connections?`,
    successText: `I can't believe you said yes — my luck and my joy and my every future just got a thousand times brighter. I promise to keep being ridiculous with you, to learn how to be better, to listen when you need space and to celebrate when you're shining. We'll build a life made from the little things: playlists we both hate-and-love, secret nicknames, small traditions that only we understand, and a million tiny moments that add up to forever. I choose you now and I'll choose you tomorrow, every time. Thank you for trusting my heart. I love you more than any message can hold.

— Ned`,

    background1: '/images/backgrounds1.png',
    background2: '/images/backgrounds2.png',
    confettiSprite: '/images/confetti.png',
    heartSprite: '/images/heart.png',
    audios: {
      music: '/audios/music.mp3',
      interactions: '/audios/interactions.mp3',
      voice: '/audios/voicemessage.mp3'
    },
    typingSpeed: 18,
    preloaderTimeout: 6000,
    START_DATE: '2025-07-19'
  };

  /* utilities */
  function elt(tag, attrs, ...children){
    attrs = attrs || {};
    const el = document.createElement(tag);
    for(const k in attrs){
      if(k === 'style') Object.assign(el.style, attrs.style);
      else if(k === 'html') el.innerHTML = attrs.html;
      else if(k === 'dataset'){ for(const d in attrs.dataset) el.dataset[d] = attrs.dataset[d]; }
      else if(k.startsWith('on') && typeof attrs[k] === 'function'){ el.addEventListener(k.slice(2), attrs[k]); }
      else el.setAttribute(k, attrs[k]);
    }
    for(const c of children) if(c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    return el;
  }
  function rand(min,max){ return Math.random()*(max-min)+min; }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

  /* inject minimal styles */
  function injectStyles(){
    const css = `
:root{ --green:#b8f1d6; --teal:#7bdff6; --accent:#67c9b7; }
*{box-sizing:border-box}
html,body{height:100%;margin:0;font-family:Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial;background:#f4fffb;color:#062126}
#app{height:100vh;position:relative;overflow:hidden}
.backgrounds{position:absolute;inset:0;z-index:0;overflow:hidden}
.bgimg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1s ease}
.bgimg.visible{opacity:1}
.bg-filter{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.28));pointer-events:none}
.overlay{position:relative;z-index:5;display:flex;align-items:center;justify-content:center;height:100%;padding:24px}
.card{max-width:900px;width:92%;background:rgba(255,255,255,0.95);border-radius:14px;padding:22px;box-shadow:0 8px 30px rgba(0,0,0,0.06)}
.title{font-size:26px;margin:0 0 8px 0;font-weight:800}
.para{white-space:pre-wrap;line-height:1.55;font-size:16px;color:#09323a}
.controls{display:flex;gap:10px;margin-top:12px}
.btn{padding:10px 14px;border-radius:10px;border:0;background:var(--teal);color:#022;cursor:pointer;font-weight:700}
.btn.secondary{background:#fff;border:2px solid rgba(0,0,0,0.06)}
.footerTiny{font-size:13px;color:#556;margin-top:10px;text-align:center}
.ring{position:fixed;width:86px;height:86px;border-radius:50%;border:8px solid gold;background:radial-gradient(circle at 35% 30%, rgba(255,255,200,0.95), rgba(255,220,120,0.5));box-shadow:0 8px 30px rgba(0,0,0,0.18);z-index:9999;display:grid;place-items:center}
@media(max-width:520px){ .card{padding:14px} .title{font-size:20px} .para{font-size:15px} }
`;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }

  /* small helper to check image exists */
  function imageExists(src, timeout=1200){
    return new Promise(resolve=>{
      const img = new Image();
      let done=false;
      const t = setTimeout(()=>{ if(!done){ done=true; resolve(false); } }, timeout);
      img.onload = ()=>{ if(done) return; done=true; clearTimeout(t); resolve(true); };
      img.onerror = ()=>{ if(done) return; done=true; clearTimeout(t); resolve(false); };
      img.src = src;
    });
  }

  function makeGradientDataURL(w=1200,h=800, a='#b8f1d6', b='#7bdff6'){
    const c = document.createElement('canvas'); c.width=w; c.height=h;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,a); g.addColorStop(1,b);
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    return c.toDataURL('image/png');
  }

  /* typing effect */
  function typeText(node, text, speed=18){
    node.textContent = '';
    let i=0;
    return new Promise(resolve=>{
      function step(){
        if(i >= text.length){ resolve(); return; }
        node.textContent = text.slice(0,i+1);
        i++;
        setTimeout(step, speed);
      }
      step();
    });
  }

  /* build main UI */
  async function buildMain(){
    injectStyles();
    // root
    const existing = document.getElementById('app'); if(existing) existing.remove();
    const app = elt('div',{id:'app'}); document.body.appendChild(app);

    // backgrounds
    const bgWrap = elt('div',{class:'backgrounds'});
    const bg1 = elt('div',{class:'bgimg'}); const bg2 = elt('div',{class:'bgimg'});
    bgWrap.appendChild(bg1); bgWrap.appendChild(bg2);
    bgWrap.appendChild(elt('div',{class:'bg-filter'}));
    app.appendChild(bgWrap);

    // detect backgrounds
    let bg1src = CONFIG.background1, bg2src = CONFIG.background2;
    const b1ok = await imageExists(bg1src);
    const b2ok = await imageExists(bg2src);
    if(!b1ok) bg1src = makeGradientDataURL();
    if(!b2ok) bg2src = b1ok ? makeGradientDataURL() : bg1src;

    bg1.style.backgroundImage = `url(${bg1src})`; bg2.style.backgroundImage = `url(${bg2src})`;
    bg1.classList.add('visible'); bg2.classList.remove('visible');

    // overlay card
    const overlay = elt('div',{class:'overlay'});
    const card = elt('div',{class:'card'});
    overlay.appendChild(card);
    app.appendChild(overlay);

    const title = elt('h1',{class:'title'}, CONFIG.titleName);
    card.appendChild(title);

    const para = elt('div',{class:'para'}, '');
    card.appendChild(para);

    const controls = elt('div',{class:'controls'});
    const continueBtn = elt('button',{class:'btn'}, 'Continue');
    const skipBtn = elt('button',{class:'btn secondary'}, 'Skip');
    controls.appendChild(continueBtn); controls.appendChild(skipBtn);
    card.appendChild(controls);

    // type intro
    await typeText(para, CONFIG.introText, CONFIG.typingSpeed);

    // continue -> proposal
    continueBtn.addEventListener('click', ()=> showProposalScreen({app, bg1El: bg1, bg2El: bg2}));
    skipBtn.addEventListener('click', ()=> { para.textContent = CONFIG.introText; });

    // small footer
    card.appendChild(elt('div',{class:'footerTiny'}, 'Did my pretty baby finish reading?'));
  }

  /* proposal screen */
  function showProposalScreen({app, bg1El, bg2El}){
    // switch background to bg2
    if(bg1El && bg2El){ bg1El.classList.remove('visible'); bg2El.classList.add('visible'); }
    // clear overlay content
    const overlay = elt('div',{class:'overlay'});
    const card = elt('div',{class:'card'});
    overlay.appendChild(card);
    app.appendChild(overlay);

    const title = elt('h1',{class:'title'}, CONFIG.proposalTitle);
    card.appendChild(title);
    card.appendChild(elt('div',{class:'para'}, CONFIG.proposalSubtitle));

    const controls = elt('div',{class:'controls'});
    const yesBtn = elt('button',{class:'btn'}, 'YES!');
    const noBtn = elt('button',{class:'btn secondary'}, 'NO!');
    controls.appendChild(yesBtn); controls.appendChild(noBtn);
    card.appendChild(controls);

    // make NO dodge when pointer nears
    let dodgeLevel = 0.2;
    function maybeDodge(e){
      const r = noBtn.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const dist = Math.hypot(dx,dy);
      if(dist < 140 && Math.random() < 0.9 + dodgeLevel){
        // move noBtn to random position
        const pad = 12;
        const nx = Math.floor(rand(pad, window.innerWidth - r.width - pad));
        const ny = Math.floor(rand(pad, window.innerHeight - r.height - pad));
        noBtn.style.position = 'fixed';
        noBtn.style.left = nx + 'px'; noBtn.style.top = ny + 'px';
        dodgeLevel = clamp(dodgeLevel + 0.06, 0, 0.95);
        navigator.vibrate && navigator.vibrate(15);
      }
    }
    overlay.addEventListener('pointermove', maybeDodge);

    noBtn.addEventListener('click', ()=>{ alert("This page is playful — if you really want to say NO, please tell me. I will respect you."); });

    yesBtn.addEventListener('click', async ()=>{
      // small animation then ring sequence
      yesBtn.disabled = true;
      try{ await sleep(180); }catch(e){}
      startRingCatchSequence({app, bg1El, bg2El});
    });
  }

  /* ring sequence */
  function startRingCatchSequence({app, bg1El, bg2El}){
    // remove all overlays
    document.querySelectorAll('.overlay').forEach(el=>el.remove());
    // show prompt card
    const overlay = elt('div',{class:'overlay'});
    const card = elt('div',{class:'card'});
    card.appendChild(elt('h2',{class:'title'}, 'mm sure if you really do wanna marry me then catch the ring!!'));
    card.appendChild(elt('div',{class:'para'}, 'Tap the golden ring as it flies and bounces — catch it to make it official!'));
    overlay.appendChild(card);
    app.appendChild(overlay);

    // create ring element
    const ring = elt('div',{class:'ring'});
    document.body.appendChild(ring);

    // initial physics
    let x = window.innerWidth/2 - 43;
    let y = window.innerHeight/2 - 43;
    let vx = rand(-6,6);
    let vy = rand(-8,-4);
    const W = 86, H = 86;
    const gravity = 0.35;
    const bounce = 0.78;
    let running = true;

    function frame(){
      if(!running) return;
      vy += gravity;
      x += vx; y += vy;
      // collisions
      if(x < 8){ x = 8; vx = -vx * bounce; }
      if(x + W > window.innerWidth - 8){ x = window.innerWidth - W - 8; vx = -vx * bounce; }
      if(y < 8){ y = 8; vy = -vy * bounce; }
      if(y + H > window.innerHeight - 8){ y = window.innerHeight - H - 8; vy = -vy * bounce; vx *= 0.98; }
      ring.style.left = x + 'px'; ring.style.top = y + 'px';
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // click/tap handler
    function caught(){
      if(!running) return;
      running = false;
      ring.style.transition = 'transform 360ms ease, opacity 360ms ease';
      ring.style.transform = 'scale(0.6) rotate(90deg)';
      ring.style.opacity = '0';
      setTimeout(()=> ring.remove(), 420);
      setTimeout(()=> showSuccessScreen({app, bg1El, bg2El}), 420);
    }
    ring.addEventListener('click', caught);
    ring.addEventListener('touchstart', (e)=>{ e.preventDefault(); caught(); });

    // safety: after 20s slow down and center a bit
    const safety = setTimeout(()=>{
      if(running){
        vx *= 0.12; vy *= 0.12;
      }
    }, 20000);

    // cleanup on resize/unload
    function onResize(){ x = clamp(x,8,window.innerWidth - W - 8); y = clamp(y,8,window.innerHeight - H - 8); }
    window.addEventListener('resize', onResize);
    // remove ring if user leaves overlay (not strictly necessary)
  }

  /* success screen */
  function showSuccessScreen({app, bg1El, bg2El}){
    // show bg1 softly
    if(bg1El && bg2El){ bg2El.classList.remove('visible'); bg1El.classList.add('visible'); }
    document.querySelectorAll('.overlay').forEach(el=>el.remove());
    const overlay = elt('div',{class:'overlay'});
    const card = elt('div',{class:'card'});
    card.appendChild(elt('h1',{class:'title'}, '💍 You said YES!'));
    card.appendChild(elt('div',{class:'para'}, CONFIG.successText));
    const controls = elt('div',{class:'controls'});
    const replay = elt('button',{class:'btn'}, 'Play voice message');
    const keep = elt('button',{class:'btn'}, 'Download keepsake (PNG)');
    controls.appendChild(replay); controls.appendChild(keep);
    card.appendChild(controls);
    overlay.appendChild(card);
    app.appendChild(overlay);

    // replay voice if available
    if(CONFIG.audios && CONFIG.audios.voice){
      const voice = new Audio(CONFIG.audios.voice);
      replay.addEventListener('click', ()=>{ voice.currentTime = 0; voice.play().catch(()=>{}); });
    } else {
      replay.addEventListener('click', ()=> alert('Voice message not available.'));
    }

    keep.addEventListener('click', async ()=>{
      // generate simple PNG keepsake
      const canvas = document.createElement('canvas'); canvas.width = 1400; canvas.height = 900;
      const ctx = canvas.getContext('2d');
      const g = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
      g.addColorStop(0,'#b8f1d6'); g.addColorStop(1,'#7bdff6');
      ctx.fillStyle = g; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#012'; ctx.font = '48px serif'; ctx.fillText(CONFIG.titleName, 80, 120);
      ctx.font = '24px system-ui';
      const lines = CONFIG.introText.split('\n');
      let y = 170;
      for(const line of lines){
        ctx.fillText(line, 80, y);
        y += 32;
        if(y > canvas.height - 120) break;
      }
      ctx.fillText('— Ned', 80, y + 24);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = 'keepsake.png'; document.body.appendChild(a); a.click(); a.remove();
    });
  }

  /* init */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', buildMain);
  } else buildMain();

})();
