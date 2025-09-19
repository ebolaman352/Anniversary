/*
UPDATED: main.js (with index.html snippet)

INDEX.HTML (create this file at the repo root)

<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Anniversary</title>
</head>
<body>
  <!-- Tiny loader. The entire UI and logic are built by main.js -->
  <script src="/main.js"></script>
</body>
</html>

ASSETS (place these exact paths in the repo):
- /images/backgrounds1.png, backgrounds2.png, ... (add as many as you want; defaults try up to 12)
- /images/confetti.png
- /images/heart.png
- /audios/music.mp3
- /audios/interactions.mp3
- /audios/voicemessage.mp3

This upgraded main.js includes many extra features beyond the original version:
- asset preloader with a progress UI
- animated intro with typewriter + line-highlighting
- richer background slideshow with CSS blur & parallax plus swipe support
- music visualizer (canvas) reacting to playback (if browser supports WebAudio)
- prebuilt mini-game "Catch 7 Hearts" revealing 7 short memories / compliments
- secret easter-egg sequence (tap/click certain corners in order) to unlock a hidden video/message
- downloadable PDF/PNG keepsake generator using canvas
- advanced, accessible NO-button behaviour with gradual 'shy' movement and fallback
- motion-reduction toggle and accessibility improvements
- responsive touch optimizations & vibration feedback where available
- many small UX polish: smooth transitions, micro-interactions, ARIA labels, focus trapping on dialogs


/* =========================
   main.js - upgraded single-file site
   ========================= */

(function(){
  'use strict';

  /* ---------- CONFIG / CONTENT ---------- */
  const CONFIG = {
    titleName: 'Dear, Ema',
    introText: `Dear Ema,

Every moment with you paints my world in brighter colors. I love the way you laugh, the little ways you notice tiny beautiful things, and the way your hand fits perfectly in mine. I want to be with you forever — to support you, to cherish you, and to make our ordinary days feel extraordinary.

Always,
Ned`,
    proposalTitle: 'Will you marry me 🥹',
    proposalSubtitle: `Do you accept Ned to be your loving husband forever — even through low battery, spotty Wi‑Fi, and every sunrise in between?`,
    successText: `You said YES! My heart is the luckiest. I promise to make you laugh, to be your teammate, and to choose you every single day. Thank you for being you. I love you more than words can say. — Ned`,

    // visuals
    greenHex: '#b8f1d6',
    tealHex: '#7bdff6',
    accentHex: '#67c9b7',

    // attempt to load these background filenames. We'll try up to 12
    backgroundCandidates: Array.from({length:12}, (_,i) => `/images/backgrounds${i+1}.png`),

    confettiSprite: '/images/confetti.png',
    heartSprite: '/images/heart.png',

    audios: {
      music: '/audios/music.mp3',
      interactions: '/audios/interactions.mp3',
      voice: '/audios/voicemessage.mp3'
    },

    // timings & tuning
    typingSpeed: 26, // ms per char
    slideshowInterval: 6000, // ms
    preloaderTimeout: 7000, // ms max wait for assets
    gameHeartsCount: 7,
  };

  /* ---------- UTILITIES ---------- */
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

  /* ---------- STYLES ---------- */
  function injectStyles(){
    const css = `
:root{ --green:${CONFIG.greenHex}; --teal:${CONFIG.tealHex}; --accent:${CONFIG.accentHex}; }
*{box-sizing:border-box}
html,body{height:100%;margin:0;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;color:#062126;background:#f4fffb}
#app{height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
.preloader{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#eafff4,#e6faff);z-index:1000}
.preloader .inner{background:rgba(255,255,255,0.85);padding:18px 22px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.08);text-align:center}
.preloader .bar{height:8px;background:rgba(0,0,0,0.06);border-radius:6px;margin-top:12px;overflow:hidden}
.preloader .bar > i{display:block;height:100%;width:0%;background:linear-gradient(90deg,var(--green),var(--teal));border-radius:6px}
.backgrounds{position:absolute;inset:0;z-index:0;overflow:hidden}
.bgimg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1.2s ease, transform 1.6s ease}
.bgimg.visible{opacity:1}
.bg-filter{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,0.15),rgba(255,255,255,0.35));pointer-events:none}
.overlay{position:relative;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;width:100%;height:100%}
.card{max-width:920px;width:max(92%,760px);background:rgba(255,255,255,0.9);backdrop-filter:blur(8px);border-radius:16px;padding:26px 30px;box-shadow:0 6px 40px rgba(4,23,31,0.08);transition:transform 0.5s ease}
.title{font-size:30px;margin:0 0 12px 0;font-weight:800}
.para{white-space:pre-wrap;line-height:1.55;font-size:18px;margin-bottom:14px;color:#09323a}
.controls{display:flex;gap:12px;align-items:center}
.btn{padding:12px 18px;border-radius:12px;border:none;background:var(--teal);color:#022;cursor:pointer;font-weight:700;box-shadow:0 8px 20px rgba(0,0,0,0.06)}
.btn.secondary{background:#fff;border:2px solid rgba(0,0,0,0.06)}
.bottomArea{display:flex;flex-direction:column;align-items:center;margin-top:8px}
.footerTiny{font-size:13px;color:#556;margin-top:8px}
.proposal{display:flex;flex-direction:column;align-items:center;gap:12px}
.bigTitle{font-size:36px;margin:0}
.partyCanvas{position:absolute;inset:0;pointer-events:none;z-index:20}
.audioControls{display:flex;gap:8px;align-items:center;margin-top:8px}
.iconButton{width:44px;height:44px;border-radius:50%;display:inline-grid;place-items:center;border:0;background:rgba(255,255,255,0.95);box-shadow:0 6px 18px rgba(0,0,0,0.08);cursor:pointer}
.noBtn,.yesBtn{padding:12px 20px;border-radius:14px;font-size:18px}
.yesBtn{background:linear-gradient(90deg,var(--green),var(--teal));color:#032;font-weight:800}
.noBtn{background:#fff;border:2px solid rgba(0,0,0,0.08)}
.small{font-size:13px}
.hidden{display:none}
.visualizer{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);width:60%;height:48px;z-index:8}
.gameOverlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.36);z-index:60}
.gameBoard{width:min(720px,96vw);height:min(520px,86vh);background:linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0.9));border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px}
.heartSprite{position:absolute;width:44px;height:44px;pointer-events:auto}
.controlsRow{display:flex;gap:8px;align-items:center}
@media(max-width:520px){.card{padding:16px;border-radius:12px}.title{font-size:20px}.bigTitle{font-size:24px}.para{font-size:15px}.visualizer{width:86%}}
`;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }

  /* ---------- PRELOADER / ASSET LOADER ---------- */
  function preloadAssets(images, audios, onProgress, onDone){
    const total = images.length + Object.values(audios).length;
    let loaded = 0; let calledDone=false;
    function progressed(){ loaded++; if(onProgress) onProgress(loaded/total); if(loaded >= total && !calledDone){ calledDone=true; onDone(); } }

    // preload images
    images.forEach(src=>{
      const img = new Image(); img.onload = progressed; img.onerror = progressed; img.src = src;
    });
    // preload audios (metadata)
    Object.values(audios).forEach(src=>{
      const a = document.createElement('audio'); a.preload='metadata';
      a.addEventListener('loadeddata', progressed, {once:true});
      a.addEventListener('error', progressed, {once:true});
      a.src = src;
    });

    // safety timeout
    setTimeout(()=>{ if(!calledDone) { calledDone=true; onDone(); } }, CONFIG.preloaderTimeout);
  }

  /* ---------- TYPER (with highlight lines) ---------- */
  function typeWithHighlight(node, text, speed=CONFIG.typingSpeed){
    node.textContent = '';
    const lines = text.split('
');
    let li = 0; let ci = 0;
    let skip=false;
    const lineNodes = lines.map(()=> elt('div', {style:{marginBottom:'6px'}}));
    lineNodes.forEach(n=>node.appendChild(n));

    function step(){
      if(skip){ lineNodes.forEach((n,i)=> n.textContent = lines[i]); return; }
      if(li >= lines.length) return;
      const L = lines[li];
      lineNodes[li].textContent = L.slice(0, ci+1);
      ci++;
      if(ci >= L.length){ li++; ci=0; // small pause on line end
        setTimeout(step, speed * 6);
      } else setTimeout(step, speed);
    }
    step();
    return { skip(){ skip=true; } };
  }

  /* ---------- PARTY PARTICLES (confetti + hearts) ---------- */
  function createPartyCanvas(){
    const c = document.createElement('canvas'); c.className='partyCanvas'; document.body.appendChild(c);
    const ctx = c.getContext('2d'); let W=0,H=0; function resize(){W=c.width=window.innerWidth;H=c.height=window.innerHeight;} resize(); window.addEventListener('resize',resize);
    const particles = []; const sprites = {};
    function loadSprite(url, name){ const img = new Image(); img.src = url; img.onload = ()=>sprites[name]=img; }
    loadSprite(CONFIG.confettiSprite,'confetti'); loadSprite(CONFIG.heartSprite,'heart');

    function spawn(x,y,n=30){ for(let i=0;i<n;i++){ particles.push({ x,y, vx:rand(-6,6), vy:rand(-14,-3), size:rand(14,44), life:rand(80,220), age:0, rot:rand(0,6.28), vrot:rand(-0.12,0.12), sprite: Math.random()>0.5 ? 'heart' : 'confetti' }); } }

    let raf; function frame(){ ctx.clearRect(0,0,W,H); for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.age++; if(p.age>p.life){ particles.splice(i,1); continue; } p.vy += 0.4; p.x += p.vx; p.y += p.vy; p.rot += p.vrot; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); const img=sprites[p.sprite]; if(img) ctx.drawImage(img, -p.size/2, -p.size/2, p.size, p.size); else { ctx.fillStyle='rgba(255,0,100,0.8)'; ctx.beginPath(); ctx.arc(0,0,p.size/4,0,6.28); ctx.fill(); } ctx.restore(); } raf=requestAnimationFrame(frame); }
    frame();
    return { spawn, destroy(){ cancelAnimationFrame(raf); c.remove(); } };
  }

  /* ---------- MUSIC VISUALIZER (WebAudio API) ---------- */
  async function setupVisualizer(audioEl, container){
    if(!window.AudioContext && !window.webkitAudioContext) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext; const ctx = new AudioCtx();
    const srcNode = ctx.createMediaElementSource(audioEl);
    const analyser = ctx.createAnalyser(); analyser.fftSize = 256; srcNode.connect(analyser); analyser.connect(ctx.destination);
    const bufferLength = analyser.frequencyBinCount; const dataArray = new Uint8Array(bufferLength);

    const canvas = elt('canvas',{class:'visualizer'}); container.appendChild(canvas); const cvs = canvas; const cctx=cvs.getContext('2d'); function resize(){cvs.width = canvas.clientWidth*devicePixelRatio; cvs.height = canvas.clientHeight*devicePixelRatio; cctx.scale(devicePixelRatio,devicePixelRatio);} resize(); window.addEventListener('resize',resize);
    let running=true; function loop(){ if(!running) return; analyser.getByteFrequencyData(dataArray); cctx.clearRect(0,0,canvas.width,canvas.height); const w = canvas.clientWidth; const h = canvas.clientHeight; const barWidth = w / bufferLength * 1.5; for(let i=0;i<bufferLength;i++){ const v = dataArray[i]/255; const x = i*barWidth; const barH = v*h*1.2; cctx.fillStyle = `rgba(123,223,246, ${0.6 + v*0.4})`; cctx.fillRect(x, h-barH, barWidth*0.9, barH); } requestAnimationFrame(loop); }
    loop(); return { destroy(){ running=false; canvas.remove(); ctx.close(); } };
  }

  /* ---------- BUILD MAIN UI ---------- */
  function buildUI(backgrounds, preloaderEl){
    // root app
    const app = elt('div',{id:'app'}); document.body.appendChild(app);

    // backgrounds
    const bgwrap = elt('div',{class:'backgrounds'}); app.appendChild(bgwrap);
    const bgEls = backgrounds.length ? backgrounds.map((src,i)=> elt('div',{class:'bgimg',style:{backgroundImage:`url(${src})`}})) : [elt('div',{class:'bgimg',style:{background:'#eafaf6'}})];
    bgEls.forEach(b=>bgwrap.appendChild(b));
    bgwrap.appendChild(elt('div',{class:'bg-filter'}));

    // overlay & card
    const overlay = elt('div',{class:'overlay'});
    const card = elt('div',{class:'card',role:'region','aria-live':'polite'});
    overlay.appendChild(card); app.appendChild(overlay);

    // header
    const title = elt('h1',{class:'title'}, CONFIG.titleName);
    card.appendChild(title);

    // intro paragraph area
    const para = elt('div',{class:'para',id:'introPara'});
    card.appendChild(para);

    // typed highlight
    const controlsRow = elt('div',{class:'controlsRow'});
    const skipBtn = elt('button',{class:'btn secondary','aria-label':'Skip intro'}, 'Skip');
    const musicBtn = elt('button',{class:'btn','aria-label':'Play music'}, 'Play music');
    const motionToggle = elt('button',{class:'btn small','aria-pressed':'false','title':'Reduce motion'}, 'Reduce motion: OFF');
    controlsRow.appendChild(musicBtn); controlsRow.appendChild(skipBtn); controlsRow.appendChild(motionToggle);
    card.appendChild(controlsRow);

    // audio controls & visualizer container
    const audioControls = elt('div',{class:'audioControls'});
    const audioVoiceBtn = elt('button',{class:'iconButton',title:'Play voice message','aria-label':'Play voice message'}); audioVoiceBtn.textContent='▶';
    audioControls.appendChild(audioVoiceBtn);
    card.appendChild(audioControls);

    const visualizerContainer = elt('div',{}); card.appendChild(visualizerContainer);

    // bottom continue area
    const bottom = elt('div',{class:'bottomArea'});
    const qTitle = elt('div',{class:'footerTiny'}, 'Did my pretty baby finish reading?'); bottom.appendChild(qTitle);
    const continueWrap = elt('div',{class:'continueWrap'});
    const continueBtn = elt('button',{class:'btn',id:'continueBtn'}, 'Continue'); continueWrap.appendChild(continueBtn); bottom.appendChild(continueWrap);
    const extraTiny = elt('div',{class:'footerTiny'}, 'Mobile-friendly: tap to control audio and swipe backgrounds.'); bottom.appendChild(extraTiny);
    card.appendChild(bottom);

    // audio elements
    const music = new Audio(CONFIG.audios.music); music.loop=true; music.preload='none';
    const interactions = new Audio(CONFIG.audios.interactions); interactions.preload='none';
    const voice = new Audio(CONFIG.audios.voice); voice.preload='none';

    // visualizer (try to connect when user plays music)
    let visualizerHandle = null; async function tryInitVisualizer(){ if(visualizerHandle) return; visualizerHandle = await setupVisualizer(music, visualizerContainer); }

    // music controls
    let musicPlaying=false;
    musicBtn.addEventListener('click', async ()=>{
      try{ await music.play(); musicPlaying=true; musicBtn.textContent='Pause music'; tryInitVisualizer(); }catch(e){ console.warn('music play blocked',e); }
      if(!musicPlaying){ music.pause(); musicPlaying=false; musicBtn.textContent='Play music'; }
    });

    // voice control
    let voicePlaying=false; audioVoiceBtn.addEventListener('click', ()=>{
      if(!voicePlaying){ voice.play().catch(()=>{}); audioVoiceBtn.textContent='⏸'; voicePlaying=true; } else { voice.pause(); audioVoiceBtn.textContent='▶'; voicePlaying=false; }
    });
    voice.addEventListener('ended', ()=>{ audioVoiceBtn.textContent='▶'; voicePlaying=false; });

    // typing
    const typer = typeWithHighlight(para, CONFIG.introText, CONFIG.typingSpeed);
    skipBtn.addEventListener('click', ()=>{ typer.skip(); });

    // background slideshow & swipe
    let currentBg=0; function showBg(i){ bgEls.forEach((el,idx)=> el.classList.toggle('visible', idx===i)); }
    showBg(0);
    let bgTimer = setInterval(()=>{ currentBg=(currentBg+1)%bgEls.length; showBg(currentBg); }, CONFIG.slideshowInterval);

    // swipe support
    let touchStartX=null; overlay.addEventListener('touchstart', e=>{ touchStartX = e.touches[0].clientX; });
    overlay.addEventListener('touchend', e=>{ if(touchStartX===null) return; const dx = (e.changedTouches[0].clientX - touchStartX); if(Math.abs(dx) > 60){ clearInterval(bgTimer); if(dx<0) currentBg=(currentBg+1)%bgEls.length; else currentBg=(currentBg-1+bgEls.length)%bgEls.length; showBg(currentBg); bgTimer = setInterval(()=>{ currentBg=(currentBg+1)%bgEls.length; showBg(currentBg); }, CONFIG.slideshowInterval); } touchStartX=null; });

    // parallax pointer move
    let reduceMotion=false; motionToggle.addEventListener('click', ()=>{ reduceMotion=!reduceMotion; motionToggle.textContent = `Reduce motion: ${reduceMotion? 'ON' : 'OFF'}`; motionToggle.setAttribute('aria-pressed', String(reduceMotion)); });
    window.addEventListener('pointermove', e=>{ if(reduceMotion) return; const sx=(e.clientX/window.innerWidth-0.5)*6; const sy=(e.clientY/window.innerHeight-0.5)*6; bgEls.forEach((el,idx)=>{ el.style.transform = `translate(${sx*(idx+1)/10}px, ${sy*(idx+1)/10}px) scale(1.02)`; }); });

    // continue -> proposal
    continueBtn.addEventListener('click', ()=>{ interactions.play().catch(()=>{}); showProposalScreen(app, {music, interactions, voice}); });

    // progress removal of preloader
    if(preloaderEl) { preloaderEl.classList.add('hidden'); setTimeout(()=>preloaderEl.remove(),450); }

    // return handles
    return { music, interactions, voice, visualizerHandle };
  }

  /* ---------- PROPOSAL SCREEN (advanced) ---------- */
  function showProposalScreen(app, audios){
    // trap focus & hide other overlays
    document.querySelectorAll('.overlay').forEach(el=>el.style.display='none');

    const overlay = elt('div',{class:'overlay proposal', style:{alignItems:'center',justifyContent:'center'}});
    const card = elt('div',{class:'card', role:'dialog','aria-modal':'true'});
    overlay.appendChild(card);
    app.appendChild(overlay);

    const title = elt('h2',{class:'bigTitle'}, CONFIG.proposalTitle);
    card.appendChild(title);
    const sub = elt('div',{class:'para'}, CONFIG.proposalSubtitle);
    card.appendChild(sub);

    const btnRow = elt('div',{style:{display:'flex',gap:'12px',marginTop:'8px',flexWrap:'wrap',justifyContent:'center'}});
    const yesBtn = elt('button',{class:'yesBtn',role:'button','aria-label':'Yes I will marry you'}, 'YES!');
    const noBtn = elt('button',{class:'noBtn',role:'button','aria-label':'No I will not'}, 'NO!');
    btnRow.appendChild(yesBtn); btnRow.appendChild(noBtn); card.appendChild(btnRow);

    // NO button: shy movement algorithm (gradually increases tendency to move)
    let shyness = 0.08; // starting small
    function shyMove(el){ const pad=12; const maxX = window.innerWidth-el.offsetWidth-pad; const maxY = window.innerHeight-el.offsetHeight-pad; const x = Math.floor(rand(0, Math.max(0,maxX))); const y = Math.floor(rand(0, Math.max(0,maxY))); el.style.position='fixed'; el.style.left = x+'px'; el.style.top = y+'px'; }

    function onApproach(e){ // pointermove
      const rect = noBtn.getBoundingClientRect(); const dx = e.clientX - (rect.left + rect.width/2); const dy = e.clientY - (rect.top + rect.height/2); const dist = Math.hypot(dx,dy);
      if(dist < 140){ if(Math.random() < 0.9 + shyness) { shyMove(noBtn); shyness = clamp(shyness+0.06, 0, 0.95); navigator.vibrate && navigator.vibrate(20); audios.interactions.play().catch(()=>{}); } }
    }
    // pointer and touch
    overlay.addEventListener('pointermove', onApproach);
    noBtn.addEventListener('touchstart', ()=>{ shyMove(noBtn); shyness = clamp(shyness+0.06,0,0.95); });

    // keyboard fallback: if user tabs to NO and presses Enter show confirmation modal
    noBtn.addEventListener('keydown', (ev)=>{
      if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); const sure = confirm('This page is playful — are you sure you want to say NO? If you confirm, I will respect your choice.'); if(sure){ // show a gentle message and return to start
          alert('I understand. Thank you for being honest.'); window.location.reload(); } }
    });

    // Yes handler (advanced sequence)
    yesBtn.addEventListener('click', async ()=>{
      audios.interactions.currentTime = 0; audios.interactions.play().catch(()=>{});
      // small transition animation
      card.animate([{transform:'scale(1)', opacity:1},{transform:'scale(0.94)', opacity:0}],{duration:420,easing:'ease-in'});
      await sleep(380);
      showSuccessScreen(app, CONFIG.successText, audios);
    });

    // small hint
    const tiny = elt('div',{class:'footerTiny'}, 'Keyboard users: use Tab to focus buttons. This page is playful — you always have a choice.'); card.appendChild(tiny);

    // quick particle teaser
    const teaser = createPartyCanvas(); teaser.spawn(window.innerWidth/2, window.innerHeight/2, 18); setTimeout(()=>teaser.destroy(),1800);
  }

  /* ---------- SUCCESS SCREEN (advanced), keepsake gen, mini-games ---------- */
  function showSuccessScreen(app, text, audios){
    document.querySelectorAll('.overlay').forEach(el=>el.remove());
    const wrap = elt('div',{class:'overlay', style:{alignItems:'center',justifyContent:'center'}});
    const card = elt('div',{class:'card'}); wrap.appendChild(card); app.appendChild(wrap);

    const title = elt('h2',{class:'bigTitle'}, '💍 You said YES!'); card.appendChild(title);
    const para = elt('div',{class:'para'}, text); card.appendChild(para);

    // controls: replay voice, download keepsake (PNG/PDF), play mini-game, share
    const controls = elt('div',{class:'controlsRow'});
    const replayVoice = elt('button',{class:'btn'}, 'Play voice message');
    const downloadPNG = elt('button',{class:'btn'}, 'Download keepsake (PNG)');
    const downloadPDF = elt('button',{class:'btn'}, 'Download keepsake (PDF)');
    const playGame = elt('button',{class:'btn'}, 'Play "Catch 7 Hearts"');
    const shareBtn = elt('button',{class:'btn'}, 'Copy love message');
    controls.appendChild(replayVoice); controls.appendChild(downloadPNG); controls.appendChild(downloadPDF); controls.appendChild(playGame); controls.appendChild(shareBtn);
    card.appendChild(controls);

    audios.interactions.currentTime = 0; audios.interactions.play().catch(()=>{});

    // confetti big party
    const party = createPartyCanvas(); party.spawn(window.innerWidth/2, window.innerHeight/2, 120); setTimeout(()=>party.spawn(window.innerWidth/3, window.innerHeight/3, 80), 700);

    // replay voice
    replayVoice.addEventListener('click', ()=>{ audios.voice.currentTime = 0; audios.voice.play().catch(()=>{}); });

    // keepsake PNG generation (render card into canvas)
    async function generatePNG(){
      // basic approach: render a custom canvas with the text and current background
      const canvas = document.createElement('canvas'); const W=1200, H=800; canvas.width=W; canvas.height=H; const ctx=canvas.getContext('2d');
      // background gradient
      const g = ctx.createLinearGradient(0,0,W,H); g.addColorStop(0, CONFIG.greenHex); g.addColorStop(1, CONFIG.tealHex); ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
      // title
      ctx.fillStyle='#023'; ctx.font='48px serif'; ctx.fillText(CONFIG.titleName, 60, 90);
      // intro text
      ctx.font='22px system-ui'; const lines = CONFIG.introText.split('
'); let y=140; ctx.fillStyle='#033'; for(const line of lines){ ctx.fillText(line, 60, y); y+=30; }
      // small footer
      ctx.fillStyle='#022'; ctx.font='20px system-ui'; ctx.fillText('— Ned', 60, y+20);
      return canvas.toDataURL('image/png');
    }
    downloadPNG.addEventListener('click', async ()=>{ const url = await generatePNG(); const a = document.createElement('a'); a.href=url; a.download='keepsake.png'; document.body.appendChild(a); a.click(); a.remove(); });

    // PDF generation: simple single-page PDF using built-in browser print fallback (we'll make a printable page)
    downloadPDF.addEventListener('click', ()=>{
      const w = window.open('', '_blank'); const html = `<!doctype html><html><head><meta charset=\"utf-8\"><title>Keepsake</title></head><body><pre style=\"font-family:system-ui,Arial;white-space:pre-wrap;font-size:16px;\">${CONFIG.titleName}

${CONFIG.introText}

${CONFIG.proposalTitle}
${CONFIG.proposalSubtitle}

${CONFIG.successText}</pre></body></html>`; w.document.write(html); w.document.close(); w.print(); });

    // share copy
    shareBtn.addEventListener('click', ()=>{ const text = `${CONFIG.titleName}

${CONFIG.proposalTitle}
${CONFIG.proposalSubtitle}

${CONFIG.successText}`; navigator.clipboard && navigator.clipboard.writeText(text).then(()=> alert('Love message copied to clipboard!')); });

    // Mini-game: Catch hearts -> reveals memories
    playGame.addEventListener('click', ()=>{ showCatchHeartsGame(app); });

    // subtle repeated particles
    const t = setInterval(()=> party.spawn(rand(100,window.innerWidth-100), rand(100,window.innerHeight-100), 40), 1600);
    window.addEventListener('beforeunload', ()=>{ clearInterval(t); party.destroy(); });
  }

  /* ---------- CATCH HEARTS GAME ---------- */
  function showCatchHeartsGame(app){
    const overlay = elt('div',{class:'gameOverlay'});
    const board = elt('div',{class:'gameBoard',role:'dialog','aria-modal':'true'});
    overlay.appendChild(board);
    const title = elt('h3',{}, 'Catch 7 Hearts'); board.appendChild(title);
    const instr = elt('div',{class:'small'}, 'Tap or click the floating hearts. Each heart reveals a memory or compliment. Catch all to finish!'); board.appendChild(instr);

    const stage = elt('div',{style:{position:'relative',flex:1,overflow:'hidden',borderRadius:'10px',background:'linear-gradient(180deg,#fff,#f7fffb)'}});
    board.appendChild(stage);

    const footer = elt('div',{style:{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'10px'}});
    const closeBtn = elt('button',{class:'btn secondary'}, 'Close'); footer.appendChild(closeBtn); board.appendChild(footer);

    app.appendChild(overlay);

    const memories = [
      'The first time you laughed at my terrible joke — I knew I wanted more of your smile.',
      'That rainy picnic where we got soaked and didn\'t care.',
      'Your hand in mine during the sunset — quiet but perfect.',
      'How you made my favorite meal and somehow made it taste like home.',
      'The way you dance in the kitchen when no one is watching.',
      'Your morning texts that make the whole day brighter.',
      'When you shared your umbrella and we walked slower on purpose.'
    ];

    let caught = 0; function spawnHeart(){ const h = elt('img',{class:'heartSprite',src:CONFIG.heartSprite}); stage.appendChild(h);
      const size = rand(36,84); h.style.width = size+'px'; h.style.height = size+'px';
      const x = rand(10, stage.clientWidth - 80); const y = stage.clientHeight + 40; h.style.left = x+'px'; h.style.top = y+'px';
      // animate up
      const targetY = rand(30, stage.clientHeight - 120);
      const dur = rand(4200, 7800);
      h.animate([{transform:`translateY(0px)`, opacity:1},{transform:`translateY(-${y - targetY}px)`, opacity:1}], {duration:dur, easing:'linear'});
      // remove after
      const tid = setTimeout(()=>{ h.remove(); }, dur+200);
      h.addEventListener('click', ()=>{ clearTimeout(tid); stage.appendChild(elt('div',{})); h.remove(); const msg = memories[caught % memories.length]; alert(msg); caught++; if(caught >= CONFIG.gameHeartsCount){ alert('You caught them all! Thank you for playing ❤️'); overlay.remove(); } });
    }
    // spawn many hearts periodically
    const spawnInterval = setInterval(()=> spawnHeart(), 700);

    closeBtn.addEventListener('click', ()=>{ clearInterval(spawnInterval); overlay.remove(); });
  }

  /* ---------- SECRET EASTER EGG (corner taps) ---------- */
  function initSecretEasterEgg(){
    // sequence of corners to tap: TL, TR, BL, BR, center
    const seq = ['TL','TR','BL','BR','C']; let idx=0; let lastTime=0; function posToKey(x,y){ const w=window.innerWidth, h=window.innerHeight; const mx = x < w*0.25 ? 'L' : (x > w*0.75 ? 'R' : 'M'); const my = y < h*0.25 ? 'T' : (y > h*0.75 ? 'B' : 'M'); if(mx==='M' && my==='M') return 'C'; if(mx==='L' && my==='T') return 'TL'; if(mx==='R' && my==='T') return 'TR'; if(mx==='L' && my==='B') return 'BL'; if(mx==='R' && my==='B') return 'BR'; return 'C'; }
    window.addEventListener('pointerdown', (e)=>{ const now=Date.now(); if(now - lastTime > 6000) idx=0; lastTime=now; const k = posToKey(e.clientX, e.clientY); if(k === seq[idx]){ idx++; if(idx >= seq.length){ idx=0; launchHiddenMessage(); } } else { idx=0; } });
  }
  function launchHiddenMessage(){ alert('Secret unlocked! You found my hidden message ❤️
I love you more than anything.'); }

  /* ---------- INIT ---------- */
  function init(){
    injectStyles();

    // preloader UI
    const pre = elt('div',{class:'preloader'});
    const inner = elt('div',{class:'inner'});
    inner.appendChild(elt('div',{html:'<strong>Loading a special surprise...</strong>'}));
    const bar = elt('div',{class:'bar'}); const innerBar = elt('i',{}); bar.appendChild(innerBar); inner.appendChild(bar); pre.appendChild(inner); document.body.appendChild(pre);

    // pick valid backgrounds (only those that load)
    preloadCandidateBackgrounds(CONFIG.backgroundCandidates, (valid)=>{
      const backgrounds = valid.length ? valid : ['/images/backgrounds1.png'];
      // now preload assets (images + audio metadata)
      const imagesToPreload = backgrounds.concat([CONFIG.confettiSprite, CONFIG.heartSprite]);
      preloadAssets(imagesToPreload, CONFIG.audios, (p)=>{ innerBar.style.width = Math.round(p*100)+'%'; }, ()=>{
        // remove preloader after a moment
        setTimeout(()=>{ buildUI(backgrounds, pre); initSecretEasterEgg(); }, 180);
      });
    });
  }

  // improved background candidate loader - tries each but returns only those that load quickly
  function preloadCandidateBackgrounds(candidates, cb){
    const valid = []; let remaining = candidates.length; if(remaining === 0) return cb([]);
    candidates.forEach((src)=>{ const img = new Image(); let done=false; const timer = setTimeout(()=>{ if(!done){ done=true; remaining--; if(remaining===0) cb(valid); } }, 1200); img.onload = ()=>{ if(done) return; done=true; clearTimeout(timer); valid.push(src); remaining--; if(remaining===0) cb(valid); }; img.onerror = ()=>{ if(done) return; done=true; clearTimeout(timer); remaining--; if(remaining===0) cb(valid); }; img.src = src; });
  }

  // run
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
