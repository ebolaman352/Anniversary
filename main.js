/* main.js — Updated per user request
  - intro uses green hearts pattern background generated via canvas
  - drawn hearts scattered across the intro paragraph
  - skip button includes small text "heh no skipping baby read it first"
  - continue correctly advances to proposal (background2)
  - YES triggers ring catch; after catch, success screen includes extra prompt + mini-game buttons (Balloons of Memories, Catch Hearts, Memory Match)
  - extra robustness: localStorage saves whether ring was caught, more logging, graceful fallbacks
  - written as a single file to paste into main.js
*/
(function(){
  'use strict';

  const CONFIG = {
    titleName: 'Dear, Ema',
    introText: `Dear Ema,\n\nEvery night I fall asleep smiling because somewhere on the other side of the world your laugh is still echoing in my head. You make tiny things feel enormous — a sleepy text, the way you describe a silly little thought, the stories you tell me at 2 AM that turn ordinary minutes into the best part of my day. Loving you is a quiet, constant adventure: I love hearing your voice, trading ridiculous memes, building plans that start as jokes and slowly turn into promises. I want to be the one who learns your favorite songs and sings them badly just so you laugh; the one who cheers when you try something new; the one who holds your hand through cold Wi‑Fi and low battery and every sunrise in between. I promise to choose you even on the ordinary days, to celebrate your tiny wins, to give you a soft place after a rough day, and to keep finding ways to surprise you — with dumb jokes, midnight playlists, and promises written in pixels. You are my favorite conversation, my safest chaos, my warm light when everything else turns grey. Stay with me in this long, silly, beautiful story — I’ll keep turning the pages if you’ll keep reading them with me.\n\n— Ned`,
    singLines: [
      'Oh E-ma, my heart hops like a kite,',
      'When you text me “hey” in the middle of the night.',
      'I’ll be your playlist, your late-call tune,',
      'Your Wi-Fi warrior — and your afternoon moon.'
    ],
    proposalTitle: 'Will you marry me 🥹',
    proposalSubtitle: `Do you accept Ned — as your partner in every midnight chat, your teammate when plans go sideways, your cheerleader when you try something brave, and your stubborn, silly, loving husband through slow days, fast days, low batteries and spotty connections?`,
    successText: `I can't believe you said yes — my luck and my joy and my every future just got a thousand times brighter. I promise to keep being ridiculous with you, to learn how to be better, to listen when you need space and to celebrate when you're shining. We'll build a life made from the little things: playlists we both hate-and-love, secret nicknames, small traditions that only we understand, and a million tiny moments that add up to forever. I choose you now and I'll choose you tomorrow, every time. Thank you for trusting my heart. I love you more than any message can hold.\n\n— Ned`,
    background1: '/images/backgrounds1.png',
    background2: '/images/backgrounds2.png',
    confettiSprite: '/images/confetti.png',
    heartSprite: '/images/heart.png',
    audios: {
      music: '/audios/music.mp3',
      interactions: '/audios/interactions.mp3',
      voice: '/audios/voicemessage.mp3'
    },
    typingSpeed: 22,
    preloaderTimeout: 7000,
    START_DATE: '2025-07-19'
  };

  /* ---------- Utilities ---------- */
  function elt(tag, attrs = {}, ...children){
    const el = document.createElement(tag);
    for(const k in attrs){
      if(k === 'style') Object.assign(el.style, attrs.style);
      else if(k === 'html') el.innerHTML = attrs[k];
      else if(k === 'dataset') for(const d in attrs[k]) el.dataset[d]=attrs[k][d];
      else if(k.startsWith('on') && typeof attrs[k] === 'function') el.addEventListener(k.slice(2), attrs[k]);
      else el.setAttribute(k, attrs[k]);
    }
    for(const c of children) if(c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    return el;
  }
  function rand(min, max){ return Math.random() * (max - min) + min; }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
  function daysTogetherText(startDate){ const start = new Date(startDate + 'T00:00:00'); const now = new Date(); const diff = now - start; const days = Math.floor(diff / (1000*60*60*24)); const hours = Math.floor(diff / (1000*60*60)); return `${days} days (${hours} hours) of silly, cozy, loud, quiet time together`; }
  function log(...args){ try{ console.log('[Anniv]', ...args); }catch(e){} }

  /* ---------- Styles ---------- */
  function injectStyles(){
    const css = `
:root{ --green:#b8f1d6; --teal:#7bdff6; --accent:#67c9b7; }
*{box-sizing:border-box}
html,body{height:100%;margin:0;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial;color:#062126;background:#f4fffb}
#app{min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;padding:24px}
.preloader{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#eafff4,#e6faff);z-index:1000}
.preloader .inner{background:rgba(255,255,255,0.95);padding:18px 22px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.08);text-align:center}
.backgrounds{position:absolute;inset:0;z-index:0;overflow:hidden}
.bgimg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1.2s ease, transform 1.2s ease}
.bgimg.visible{opacity:1}
.bg-filter{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.28));pointer-events:none}
.overlay{position:relative;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%}
.card{max-width:920px;width:100%;background:rgba(255,255,255,0.92);backdrop-filter:blur(6px);border-radius:16px;padding:22px 26px;box-shadow:0 6px 30px rgba(4,23,31,0.06);transition:transform .4s ease}
.title{font-size:28px;margin:0 0 12px 0;font-weight:800}
.para{white-space:pre-wrap;line-height:1.55;font-size:17px;margin-bottom:14px;color:#042b29;position:relative;padding:18px;border-radius:12px;overflow:hidden}
.para .scattered-heart{position:absolute;width:22px;height:22px;opacity:0.85;pointer-events:none;transform:translate(-50%,-50%) scale(.9);filter:drop-shadow(0 4px 8px rgba(0,0,0,0.06));}
.controlsRow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.btn{padding:10px 14px;border-radius:12px;border:none;background:var(--teal);color:#022;cursor:pointer;font-weight:700;box-shadow:0 8px 20px rgba(0,0,0,0.06)}
.btn.secondary{background:#fff;border:2px solid rgba(0,0,0,0.06)}
.bottomArea{display:flex;flex-direction:column;align-items:center;margin-top:8px}
.footerTiny{font-size:13px;color:#556;margin-top:8px}
.proposal{display:flex;flex-direction:column;align-items:center;gap:12px}
.bigTitle{font-size:34px;margin:0}
.partyCanvas{position:absolute;inset:0;pointer-events:none;z-index:20}
.ring{position:fixed;width:86px;height:86px;border-radius:50%;border:8px solid gold;box-shadow:0 6px 20px rgba(0,0,0,0.18);display:grid;place-items:center;z-index:120;pointer-events:auto;background:radial-gradient(circle at 40% 35%, rgba(255,255,200,0.95), rgba(255,240,180,0.5));}
.karaokeLine{padding:6px;border-radius:8px}
.karaokeLine.highlight{background:linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));}
.smallNote{font-size:12px;color:#666;margin-left:8px}
@media(max-width:520px){.card{padding:14px;border-radius:12px}.title{font-size:20px}.bigTitle{font-size:22px}.para{font-size:15px}}
`;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }

  /* ---------- Hearts pattern generator for intro background ---------- */
  function makeHeartsPatternDataURL(width=800, height=400, count=80){
    const c = document.createElement('canvas'); c.width = width; c.height = height; const ctx = c.getContext('2d');
    // base gradient
    const g = ctx.createLinearGradient(0,0,width,height); g.addColorStop(0, '#d7f6e8'); g.addColorStop(1, '#b8f1d6'); ctx.fillStyle = g; ctx.fillRect(0,0,width,height);
    // draw scattered tiny hearts in green tones
    function drawHeart(x,y,s, color){
      ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.beginPath();
      ctx.moveTo(0, -6); ctx.bezierCurveTo(-6, -18, -22, -12, -22, -2); ctx.bezierCurveTo(-22, 10, -8, 20, 0, 30); ctx.bezierCurveTo(8, 20, 22, 10, 22, -2); ctx.bezierCurveTo(22, -12, 6, -18, 0, -6); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); ctx.restore();
    }
    for(let i=0;i<count;i++){
      const x = Math.random() * width; const y = Math.random() * height; const s = 0.6 + Math.random()*0.9;
      const t = Math.random();
      const color = t < 0.6 ? 'rgba(34,128,92,'+(0.12+Math.random()*0.22)+')' : 'rgba(119,201,166,'+(0.08+Math.random()*0.2)+')';
      drawHeart(x,y,s,color);
    }
    // subtle noise overlay
    ctx.globalAlpha = 0.06; for(let i=0;i<3000;i++){ ctx.fillStyle = 'rgba(255,255,255,'+ (Math.random()*0.06) + ')'; ctx.fillRect(Math.random()*width, Math.random()*height, 1,1); }
    return c.toDataURL('image/png');
  }

  /* ---------- Particles (confetti/hearts) ---------- */
  function createPartyCanvas(){
    const c = document.createElement('canvas'); c.className='partyCanvas'; document.body.appendChild(c);
    const ctx = c.getContext('2d'); let W=0,H=0; function resize(){ W=c.width=window.innerWidth; H=c.height=window.innerHeight; } resize(); window.addEventListener('resize', resize);
    const particles = [];
    let raf;
    function spawn(x,y,n=30){
      for(let i=0;i<n;i++){ particles.push({
        x,y,
        vx:rand(-6,6),
        vy:rand(-14,-3),
        size:rand(6,28),
        life:rand(80,240),
        age:0,
        color: `rgba(${Math.floor(rand(80,240))},${Math.floor(rand(120,255))},${Math.floor(rand(140,240))},${0.9 - Math.random()*0.6})`
      }); }
    }
    function frame(){
      ctx.clearRect(0,0,W,H);
      for(let i=particles.length-1;i>=0;i--){
        const p = particles[i]; p.age++; if(p.age>p.life){ particles.splice(i,1); continue; }
        p.vy += 0.35; p.x += p.vx; p.y += p.vy; ctx.fillStyle = p.color; ctx.beginPath(); ctx.ellipse(p.x,p.y,p.size, p.size*0.7, 0,0,Math.PI*2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { spawn, destroy(){ cancelAnimationFrame(raf); c.remove(); } };
  }

  /* ---------- Visualizer (left unchanged) ---------- */
  async function setupVisualizer(audioEl, container){ if(!window.AudioContext && !window.webkitAudioContext) return null; try{ const AudioCtx = window.AudioContext || window.webkitAudioContext; const ctx = new AudioCtx(); const srcNode = ctx.createMediaElementSource(audioEl); const analyser = ctx.createAnalyser(); analyser.fftSize = 256; srcNode.connect(analyser); analyser.connect(ctx.destination); const bufferLength = analyser.frequencyBinCount; const dataArray = new Uint8Array(bufferLength); const canvas = elt('canvas',{class:'visualizer'}); container.appendChild(canvas); const cvs = canvas; const cctx=cvs.getContext('2d'); function resize(){cvs.width = canvas.clientWidth*devicePixelRatio; cvs.height = canvas.clientHeight*devicePixelRatio; cctx.scale(devicePixelRatio,devicePixelRatio);} resize(); window.addEventListener('resize',resize); let running=true; function loop(){ if(!running) return; analyser.getByteFrequencyData(dataArray); cctx.clearRect(0,0,canvas.width,canvas.height); const w = canvas.clientWidth; const h = canvas.clientHeight; const barWidth = w / bufferLength * 1.5; for(let i=0;i<bufferLength;i++){ const v = dataArray[i]/255; const x = i*barWidth; const barH = v*h*1.2; cctx.fillStyle = `rgba(123,223,246, ${0.6 + v*0.4})`; cctx.fillRect(x, h-barH, barWidth*0.9, barH); } requestAnimationFrame(loop); } loop(); return { destroy(){ running=false; canvas.remove(); ctx.close(); } }; }catch(e){ console.warn('Visualizer init failed', e); return null; } }

  /* ---------- Globals ---------- */
  let GLOBALS = { bgEls:[], foundBgs:[], visualizer:null };

  /* ---------- Core UI build ---------- */
  function buildUI(backgrounds, preloaderEl){
    GLOBALS.foundBgs = backgrounds.slice();
    // cleanup old app
    const old = document.getElementById('app'); if(old) old.remove();
    const app = elt('div',{id:'app'}); document.body.appendChild(app);

    // backgrounds
    const bgwrap = elt('div',{class:'backgrounds'}); app.appendChild(bgwrap);
    const bg1 = elt('div',{class:'bgimg', style:{backgroundImage:`url(${backgrounds[0]})`}});
    const bg2 = elt('div',{class:'bgimg', style:{backgroundImage:`url(${backgrounds[1]||backgrounds[0]})`}});
    bgwrap.appendChild(bg1); bgwrap.appendChild(bg2); bgwrap.appendChild(elt('div',{class:'bg-filter'}));
    GLOBALS.bgEls = [bg1,bg2];
    bg1.classList.add('visible'); bg2.classList.remove('visible');

    // overlay and card (intro uses green hearts background)
    const overlay = elt('div',{class:'overlay'});
    const card = elt('div',{class:'card', role:'region','aria-live':'polite'});
    overlay.appendChild(card); app.appendChild(overlay);

    const title = elt('h1',{class:'title'}, CONFIG.titleName);
    card.appendChild(title);

    const daysCounter = elt('div',{class:'footerTiny'}, daysTogetherText(CONFIG.START_DATE));
    card.appendChild(daysCounter);

    // intro paragraph area with hearts background
    const para = elt('div',{class:'para', id:'introPara'});
    // apply generated hearts background to the para element
    const heartsPattern = makeHeartsPatternDataURL(900,300,120);
    para.style.backgroundImage = `url(${heartsPattern})`;
    para.style.backgroundSize = 'cover';
    para.style.backgroundRepeat = 'no-repeat';
    para.style.color = '#043532';
    para.textContent = ''; // will be typed
    card.appendChild(para);

    // scattered hearts overlay inside the para
    function scatterHearts(n=14){
      // remove previous
      Array.from(para.querySelectorAll('.scattered-heart')).forEach(e=>e.remove());
      for(let i=0;i<n;i++){
        const h = elt('div',{class:'scattered-heart'});
        // small SVG heart inline so no external image needed
        h.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-7-4.5-9.5-8C-1 7 5 2 8 5c1.5 1.6 2.4 2.4 4 3.1 1.6-.7 2.5-1.5 4-3.1 3-3 9 2 5.5 8-2.5 3.5-9.5 8-9.5 8z" fill="rgba(255,255,255,0.9)"/></svg>`;
        const x = Math.random() * 92 + '%'; const y = Math.random() * 86 + '%';
        h.style.left = x; h.style.top = y; h.style.transform = `translate(-50%,-50%) rotate(${Math.floor(rand(-40,40))}deg) scale(${0.8 + Math.random()*0.8})`;
        para.appendChild(h);
      }
    }
    scatterHearts(18);

    // controls row with skip small note
    const controls = elt('div',{class:'controlsRow'});
    const musicBtn = elt('button',{class:'btn', id:'musicBtn'}, 'Play music');
    const skipWrap = elt('div',{style:{display:'flex',alignItems:'center'}});
    const skipBtn = elt('button',{class:'btn secondary', id:'skipBtn'}, 'Skip');
    const skipNote = elt('div',{class:'smallNote'}, 'heh no skipping baby — read it first');
    skipWrap.appendChild(skipBtn); skipWrap.appendChild(skipNote);
    const adventureBtn = elt('button',{class:'btn secondary'}, 'Choose our adventure');
    controls.appendChild(musicBtn); controls.appendChild(skipWrap); controls.appendChild(adventureBtn);
    card.appendChild(controls);

    // karaoke area placeholder
    const karaoke = elt('div',{});
    card.appendChild(karaoke);

    const audioControls = elt('div',{class:'controlsRow'});
    const voiceBtn = elt('button',{class:'btn'}, 'Play voice message');
    audioControls.appendChild(voiceBtn); card.appendChild(audioControls);

    // bottom continue
    const bottom = elt('div',{class:'bottomArea'});
    const qTitle = elt('div',{class:'footerTiny'}, 'Did my pretty baby finish reading?');
    const continueBtn = elt('button',{class:'btn', id:'continueBtn'}, 'Continue');
    bottom.appendChild(qTitle); bottom.appendChild(continueBtn);
    card.appendChild(bottom);

    // audio elements
    let music=null, interactions=null, voice=null;
    try{ music = new Audio(CONFIG.audios.music); music.loop=true; }catch(e){ music=null; musicBtn.disabled=true; musicBtn.textContent='Music missing'; }
    try{ interactions = new Audio(CONFIG.audios.interactions); }catch(e){ interactions=null; }
    try{ voice = new Audio(CONFIG.audios.voice); }catch(e){ voice=null; voiceBtn.style.display='none'; }

    // visualizer on music play
    let visualizer=null;
    musicBtn.addEventListener('click', async ()=>{
      if(!music) return;
      try{ if(music.paused){ await music.play(); musicBtn.textContent='Pause music'; visualizer = await setupVisualizer(music, karaoke); } else { music.pause(); musicBtn.textContent='Play music'; if(visualizer && visualizer.destroy) visualizer.destroy(); visualizer=null; } }catch(e){ console.warn(e); }
    });
    if(voice) voiceBtn.addEventListener('click', ()=>{ if(voice.paused) voice.play(); else voice.pause(); });

    // typer for intro
    const typer = typeWithHighlight(para, CONFIG.introText, CONFIG.typingSpeed);
    skipBtn.addEventListener('click', ()=>{ // skip triggers typer skip but keeps note visible
      try{ typer.skip(); skipNote.textContent = 'ok you skipped — but please read ❤️'; }catch(e){ console.warn(e); }
    });

    // continue should reliably go to proposal
    continueBtn.addEventListener('click', ()=>{
      try{
        // ensure intro typing is finished
        if(typer && typeof typer.skip === 'function') typer.skip();
        // play small interaction sound
        if(interactions) { interactions.currentTime = 0; interactions.play().catch(()=>{}); }
        // go to proposal
        showProposalScreen(document.getElementById('app'), {music, interactions, voice});
      }catch(err){ console.error('Continue handler error', err); }
    });

    adventureBtn.addEventListener('click', ()=> showAdventureModal(document.getElementById('app')));

    if(preloaderEl){ preloaderEl.classList.add('hidden'); setTimeout(()=>preloaderEl.remove(), 360); }

    // gentle reveal animation for card
    setTimeout(()=>{ card.style.transform = 'translateY(0)'; },120);
    return { music, interactions, voice };
  }

  /* ---------- Adventure modal (unchanged concept) ---------- */
  function showAdventureModal(app){
    const overlay = elt('div',{class:'gameOverlay'});
    const modal = elt('div',{class:'gameBoard'});
    overlay.appendChild(modal);
    modal.appendChild(elt('h3',{}, 'Choose our little imaginary trip'));
    const choices = elt('div',{style:{display:'flex',gap:'10px',flexWrap:'wrap'}});
    const c1 = elt('button',{class:'btn'}, 'Midnight Picnic');
    const c2 = elt('button',{class:'btn'}, 'Playlist Marathon');
    const c3 = elt('button',{class:'btn'}, 'Stargazing Call');
    choices.appendChild(c1); choices.appendChild(c2); choices.appendChild(c3);
    modal.appendChild(choices);
    const vignette = elt('div',{style:{marginTop:'12px',padding:'12px',background:'#fff',borderRadius:'10px'}});
    modal.appendChild(vignette);
    const close = elt('button',{class:'btn secondary'}, 'Close'); modal.appendChild(close);
    document.getElementById('app').appendChild(overlay);

    c1.addEventListener('click', ()=> { vignette.textContent='We pretend we picnic at midnight in pixel-land...'; });
    c2.addEventListener('click', ()=> { vignette.textContent='We trade awful songs and rate them 0-10...'; });
    c3.addEventListener('click', ()=> { vignette.textContent='We call and stare at the same sky until we fall asleep.'; });
    close.addEventListener('click', ()=> overlay.remove());
  }

  /* ---------- Proposal screen & NO/YES interactions ---------- */
  function showProposalScreen(app, audios){
    try{
      // hide existing overlays if any
      document.querySelectorAll('.overlay').forEach(el=>el.style.display='none');
      // switch bg to background2 if available
      if(GLOBALS.bgEls && GLOBALS.bgEls.length >= 2){
        GLOBALS.bgEls[0].classList.remove('visible');
        GLOBALS.bgEls[1].classList.add('visible');
      }
      const overlay = elt('div',{class:'overlay proposal'});
      const card = elt('div',{class:'card'});
      overlay.appendChild(card); document.getElementById('app').appendChild(overlay);

      card.appendChild(elt('h2',{class:'bigTitle'}, CONFIG.proposalTitle));
      card.appendChild(elt('div',{class:'para'}, CONFIG.proposalSubtitle));

      const btnRow = elt('div',{class:'controlsRow'});
      const yesBtn = elt('button',{class:'btn', style:{fontWeight:800}}, 'YES!');
      const noBtn = elt('button',{class:'btn secondary'}, 'NO!');
      btnRow.appendChild(yesBtn); btnRow.appendChild(noBtn); card.appendChild(btnRow);

      // NO shy move
      let shy=0.1;
      function shyMove(el){
        const pad=8;
        const maxX = Math.max(8, window.innerWidth - el.offsetWidth - pad);
        const maxY = Math.max(8, window.innerHeight - el.offsetHeight - pad);
        const x = Math.floor(rand(8, maxX));
        const y = Math.floor(rand(8, maxY));
        el.style.position = 'fixed'; el.style.left = x + 'px'; el.style.top = y + 'px';
      }
      overlay.addEventListener('pointermove', (e)=>{
        const rect = noBtn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width/2); const dy = e.clientY - (rect.top + rect.height/2);
        const dist = Math.hypot(dx,dy);
        if(dist < 130 && Math.random() < 0.85 + shy){ shyMove(noBtn); shy = Math.min(0.95, shy + 0.05); if(audios && audios.interactions) audios.interactions.play().catch(()=>{}); }
      });
      noBtn.addEventListener('touchstart', ()=> { shyMove(noBtn); });
      noBtn.addEventListener('click', ()=> { alert("I respect your choice — this page is playful. ❤️"); });

      // YES triggers ring catch sequence
      yesBtn.addEventListener('click', async ()=>{
        if(audios && audios.interactions) { audios.interactions.currentTime = 0; audios.interactions.play().catch(()=>{}); }
        // short animation then launch ring sequence
        card.animate([{transform:'scale(1)'},{transform:'scale(.98)'}],{duration:260,fill:'forwards'});
        await sleep(240);
        startRingCatchSequence(overlay, audios);
      });
    }catch(err){ console.error('showProposalScreen error', err); }
  }

  /* ---------- Ring catch ---------- */
  function startRingCatchSequence(parentOverlay, audios){
    // clear overlay
    parentOverlay.innerHTML = '';
    const prompt = elt('div',{class:'card', style:{textAlign:'center',maxWidth:'720px'}});
    prompt.appendChild(elt('h3',{}, "mm sure if you really do wanna marry me then catch the ring!!"));
    prompt.appendChild(elt('div',{class:'para', style:{fontSize:'15px'}}, 'Tap the golden ring as it flies and bounces — catch it to make it official!'));
    parentOverlay.appendChild(prompt);

    // spawn ring
    const ring = elt('div',{class:'ring'});
    document.body.appendChild(ring);
    let x = window.innerWidth/2 - 44, y = window.innerHeight/2 - 44;
    let vx = rand(-5,5), vy = rand(-6,-3);
    const w = 86, h = 86; let running = true;
    const gravity = 0.32, bounce = 0.82;
    function frame(){
      if(!running) return;
      vy += gravity; x += vx; y += vy;
      if(x < 8){ x = 8; vx = -vx * bounce; }
      if(x + w > window.innerWidth - 8){ x = window.innerWidth - w - 8; vx = -vx * bounce; }
      if(y < 8){ y = 8; vy = -vy * bounce; }
      if(y + h > window.innerHeight - 8){ y = window.innerHeight - h - 8; vy = -vy * bounce; vx *= 0.98; }
      ring.style.left = x + 'px'; ring.style.top = y + 'px';
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function caught(){
      if(!running) return; running=false;
      ring.style.transition = 'transform 360ms ease, opacity 360ms ease';
      ring.style.transform = 'scale(0.6) rotate(90deg)';
      ring.style.opacity = '0';
      setTimeout(()=> ring.remove(), 420);
      setTimeout(()=> {
        // after catch show success but include extra mini-game prompt text and mini-game buttons
        showSuccessScreenWithMiniGames(document.getElementById('app'), CONFIG.successText, audios);
      }, 420);
    }
    ring.addEventListener('click', caught);
    ring.addEventListener('touchstart', (e)=>{ e.preventDefault(); caught(); });

    // safety timeout
    setTimeout(()=>{ if(running){ vx *= 0.1; vy *= 0.1; } }, 22000);
  }

  /* ---------- Success + mini games prompt ---------- */
  function showSuccessScreenWithMiniGames(app, text, audios){
    // cleanup overlays and show bg1
    if(GLOBALS.bgEls && GLOBALS.bgEls.length){ GLOBALS.bgEls[0].classList.add('visible'); if(GLOBALS.bgEls[1]) GLOBALS.bgEls[1].classList.remove('visible'); }
    document.querySelectorAll('.overlay').forEach(el=>el.remove());
    const wrap = elt('div',{class:'overlay', style:{alignItems:'center',justifyContent:'center'}});
    const card = elt('div',{class:'card'}); wrap.appendChild(card); document.getElementById('app').appendChild(wrap);

    card.appendChild(elt('h2',{class:'bigTitle'}, '💍 You said YES!'));
    card.appendChild(elt('div',{class:'para'}, text));
    // extra playful paragraph offering mini-game
    card.appendChild(elt('div',{class:'para', style:{fontSize:'15px'}}, "Okay okay how about this — why don't you enjoy a mini game here, yes? It's romantical and full of memories. Don't worry, it's cute."));

    const gamesRow = elt('div',{class:'controlsRow'});
    const g1 = elt('button',{class:'btn'}, 'Balloons of Memories');
    const g2 = elt('button',{class:'btn'}, 'Catch Hearts');
    const g3 = elt('button',{class:'btn'}, 'Memory Match');
    gamesRow.appendChild(g1); gamesRow.appendChild(g2); gamesRow.appendChild(g3);
    card.appendChild(gamesRow);

    // wire up mini-games
    g1.addEventListener('click', ()=> showBalloonsOfMemories(document.getElementById('app')));
    g2.addEventListener('click', ()=> showCatchHeartsGame(document.getElementById('app')));
    g3.addEventListener('click', ()=> showMemoryMatch(document.getElementById('app')));

    // replay voice
    const replay = elt('button',{class:'btn'}, 'Play voice message'); card.appendChild(replay);
    replay.addEventListener('click', ()=>{ if(audios && audios.voice) audios.voice.play().catch(()=>{}); else alert('Voice not available'); });
    // confetti
    const party = createPartyCanvas(); party.spawn(window.innerWidth/2, window.innerHeight/2, 110);
    setTimeout(()=> party.spawn(window.innerWidth/3, window.innerHeight/3, 70), 800);
    // auto-save acceptance
    try{ localStorage.setItem('anniv_accepted','true'); }catch(e){}
  }

  /* ---------- Balloons of Memories mini-game ---------- */
  function showBalloonsOfMemories(app){
    const overlay = elt('div',{class:'gameOverlay'});
    const board = elt('div',{class:'gameBoard'});
    overlay.appendChild(board);
    board.appendChild(elt('h3',{}, 'Balloons of Memories'));
    board.appendChild(elt('div',{class:'small'}, 'Pop the balloons to reveal a memory or a compliment. Pop them all to win.'));
    const stage = elt('div',{style:{position:'relative',flex:1,overflow:'hidden',borderRadius:'10px',background:'linear-gradient(180deg,#fff,#f7fffb)'}});
    board.appendChild(stage);
    const close = elt('button',{class:'btn secondary'}, 'Close'); board.appendChild(close);
    document.getElementById('app').appendChild(overlay);

    const memories = [
      'That rainy picnic where we laughed until our shoes were full of puddles.',
      'The late-night call where you told me about your weird dream and I loved every second.',
      'Your tiny thoughtful texts that make a whole day better.',
      'The time you tried a new recipe for me (and we ate most of it cold)',
      'You, being you, making ordinary feel special.'
    ];
    let popped=0;
    function spawnBalloon(){
      const b = elt('button',{class:'btn'}, '');
      b.style.width = '68px'; b.style.height = '84px'; b.style.borderRadius = '50% 50% 50% 50% / 55% 55% 45% 45%';
      b.style.position = 'absolute'; b.style.left = (rand(8, 86)) + '%'; b.style.bottom = '-120px'; b.style.background = `linear-gradient(180deg, rgba(255,220,240,0.9), rgba(255,180,220,0.9))`;
      stage.appendChild(b);
      const rise = rand(4200, 9000);
      b.animate([{transform:'translateY(0)'},{transform:`translateY(-${stage.clientHeight + 160}px)`}], {duration: rise, easing:'linear'});
      const tid = setTimeout(()=>{ if(b.parentNode) b.remove(); }, rise+300);
      b.addEventListener('click', ()=>{
        clearTimeout(tid); const msg = memories[Math.floor(rand(0, memories.length))]; popped++; b.remove(); alert(msg); if(popped >= 6){ alert('You popped them all — thank you for playing ❤️'); overlay.remove(); }
      });
    }
    const interval = setInterval(spawnBalloon, 700);
    close.addEventListener('click', ()=>{ clearInterval(interval); overlay.remove(); });
  }

  /* ---------- Catch hearts game (as before) ---------- */
  function showCatchHeartsGame(app){
    const overlay = elt('div',{class:'gameOverlay'});
    const board = elt('div',{class:'gameBoard'});
    overlay.appendChild(board);
    board.appendChild(elt('h3',{}, 'Catch 7 Hearts')); board.appendChild(elt('div',{class:'small'}, 'Tap the floating hearts to reveal memories.'));
    const stage = elt('div',{style:{position:'relative',flex:1,overflow:'hidden',borderRadius:'10px',background:'linear-gradient(180deg,#fff,#f7fffb)'}});
    board.appendChild(stage);
    const close = elt('button',{class:'btn secondary'}, 'Close'); board.appendChild(close);
    document.getElementById('app').appendChild(overlay);

    const memories = [
      'The time we stayed up talking about nothing and everything.',
      'Your goofy face when trying to be serious (it failed).',
      'The small gift you once sent that made me cry.',
      'Our first (virtual) movie night that felt oddly perfect.',
      'How you cheer for me without asking for anything.'
    ];
    let caught = 0;
    function spawnHeart(){ const h = elt('div',{class:'heartSprite'}); stage.appendChild(h); const size = rand(36,84); h.style.width = size+'px'; h.style.height = size+'px'; const x = rand(10, Math.max(20, stage.clientWidth - 80)); const y = stage.clientHeight + 40; h.style.left = x+'px'; h.style.top = y+'px'; h.style.background = `radial-gradient(circle at 40% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.5)), linear-gradient(180deg, #ff9fb8, #ff5f84)`; h.style.borderRadius='50%'; h.style.boxShadow='0 6px 18px rgba(0,0,0,0.12)'; const targetY = rand(30, stage.clientHeight - 120); const dur = rand(4200, 7800); h.animate([{transform:`translateY(0px)`, opacity:1},{transform:`translateY(-${y - targetY}px)`, opacity:1}], {duration:dur, easing:'linear'}); const tid = setTimeout(()=>{ h.remove(); }, dur+200); h.addEventListener('click', ()=>{ clearTimeout(tid); const msg = memories[caught % memories.length]; caught++; h.remove(); alert(msg); if(caught >= 7){ alert('You caught them all! Thank you for playing ❤️'); overlay.remove(); } }); }
    const spawnInterval = setInterval(()=> spawnHeart(), 700);
    close.addEventListener('click', ()=>{ clearInterval(spawnInterval); overlay.remove(); });
  }

  /* ---------- Memory match (unchanged) ---------- */
  function showMemoryMatch(app){ const overlay = elt('div',{class:'gameOverlay'}); const board = elt('div',{class:'gameBoard'}); overlay.appendChild(board); board.appendChild(elt('h3',{}, 'Memory Match — find pairs')); board.appendChild(elt('div',{class:'small'}, 'Flip cards and match pairs to reveal cute compliments.')); const grid = elt('div',{style:{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:'8px',flex:1}}); board.appendChild(grid); const close = elt('button',{class:'btn secondary'}, 'Close'); board.appendChild(close); document.getElementById('app').appendChild(overlay); const emojis = ['🌟','🌙','🎵','🍰','🌸','💌','☕','📷']; const deck = emojis.concat(emojis).sort(()=>Math.random()-0.5); let first=null, second=null, matched=0; deck.forEach((symbol, i)=>{ const card = elt('button', {class:'btn', style:{height:'64px'}}, ''); card.dataset.symbol = symbol; card.addEventListener('click', ()=>{ if(card.classList.contains('matched')||card===first) return; card.textContent = symbol; card.style.background='#fff'; if(!first){ first=card; } else { second=card; if(first.dataset.symbol === second.dataset.symbol){ first.classList.add('matched'); second.classList.add('matched'); matched += 2; first=null; second=null; if(matched === deck.length){ alert('All pairs found! Here is a secret compliment: You make the world softer.'); overlay.remove(); } } else { setTimeout(()=>{ first.textContent=''; second.textContent=''; first.style.background=''; second.style.background=''; first=null; second=null; }, 700); } } }); grid.appendChild(card); }); close.addEventListener('click', ()=> overlay.remove()); }

  /* ---------- Typing helper ---------- */
  function typeWithHighlight(node, text, speed=24){
    node.textContent = '';
    const lines = text.split('\n');
    let li = 0; let ci = 0; let skip=false;
    const lineNodes = lines.map(()=> elt('div', {style:{marginBottom:'6px',position:'relative'}}));
    lineNodes.forEach(n=>node.appendChild(n));
    function step(){ if(skip){ lineNodes.forEach((n,i)=> n.textContent = lines[i]); return; } if(li >= lines.length) return; const L = lines[li]; lineNodes[li].textContent = L.slice(0, ci+1); ci++; if(ci >= L.length){ li++; ci=0; setTimeout(step, speed * 5); } else setTimeout(step, speed); }
    step(); return { skip(){ skip=true; } };
  }

  /* ---------- Background discovery ---------- */
  function checkIfExists(url, cb){ const img = new Image(); let done=false; const t = setTimeout(()=>{ if(!done){ done=true; cb(false); } }, 1400); img.onload = ()=>{ if(done) return; done=true; clearTimeout(t); cb(true); }; img.onerror = ()=>{ if(done) return; done=true; clearTimeout(t); cb(false); }; img.src = url; }

  /* ---------- Init ---------- */
  function init(){ injectStyles(); const pre = elt('div',{class:'preloader'}); const inner = elt('div',{class:'inner'}); inner.appendChild(elt('div',{html:'<strong>Loading a special surprise...</strong>'})); const bar = elt('div',{class:'bar'}); const innerBar = elt('i',{}); bar.appendChild(innerBar); inner.appendChild(bar); pre.appendChild(inner); document.body.appendChild(pre);

    // check backgrounds explicitly
    const candidates = [];
    checkIfExists(CONFIG.background1, (ok1)=>{
      if(ok1) candidates.push(CONFIG.background1);
      checkIfExists(CONFIG.background2, (ok2)=>{
        if(ok2) candidates.push(CONFIG.background2);
        if(candidates.length === 0){
          // generate two fallbacks
          candidates.push(makeHeartsPatternDataURL(1200,600,180));
          candidates.push(makeHeartsPatternDataURL(1200,600,140));
        } else if(candidates.length === 1){
          candidates.push(makeHeartsPatternDataURL(1200,600,140));
        }
        preload(candidates, (p)=>{ innerBar.style.width = Math.round(p*100) + '%'; }, ()=>{ setTimeout(()=>{ buildUI(candidates, pre); }, 160); });
      });
    });
  }

  // simple image preloader
  function preload(list, onProgress, onDone){ const arr = list.slice(); if(arr.length===0){ if(onProgress) onProgress(1); onDone(); return; } let loaded=0; const total=arr.length; arr.forEach(src=>{ const i=new Image(); i.onload=()=>{ loaded++; if(onProgress) onProgress(loaded/total); if(loaded>=total) onDone(); }; i.onerror=()=>{ loaded++; if(onProgress) onProgress(loaded/total); if(loaded>=total) onDone(); }; i.src=src; }); setTimeout(()=>{ if(onDone) onDone(); }, CONFIG.preloaderTimeout); }

  // start
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
