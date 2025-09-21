/* main.js — updated: use backgrounds1.png for intro, backgrounds2.png for proposal,
   and add bouncing ring-catch after pressing YES (then show success screen). */

(function(){
  'use strict';

  /* ---------- CONFIG / CONTENT ---------- */
  const CONFIG = {
    titleName: 'Dear, Ema',
    introText: `Dear Ema,\n\nEvery night I fall asleep smiling because somewhere on the other side of the world your laugh is still echoing in my head. You make tiny things feel enormous — a sleepy text, the way you describe a silly little thought, the stories you tell me at 2 AM that turn ordinary minutes into the best part of my day. Loving you is a quiet, constant adventure: I love hearing your voice, trading ridiculous memes, building plans that start as jokes and slowly turn into promises. I want to be the one who learns your favorite songs and sings them badly just so you laugh; the one who cheers when you try something new; the one who holds your hand through cold Wi-Fi and low battery and every sunrise in between. I promise to choose you even on the ordinary days, to celebrate your tiny wins, to give you a soft place after a rough day, and to keep finding ways to surprise you — with dumb jokes, midnight playlists, and promises written in pixels. You are my favorite conversation, my safest chaos, my warm light when everything else turns grey. Stay with me in this long, silly, beautiful story — I’ll keep turning the pages if you’ll keep reading them with me.\n\n— Ned`,

    singLines: [
      'Oh E-ma, my heart hops like a kite,',
      'When you text me “hey” in the middle of the night.',
      'I’ll be your playlist, your late-call tune,',
      'Your Wi-Fi warrior — and your afternoon moon.'
    ],

    proposalTitle: 'Will you marry me 🥹',
    proposalSubtitle: `Do you accept Ned — as your partner in every midnight chat, your teammate when plans go sideways, your cheerleader when you try something brave, and your stubborn, silly, loving husband through slow days, fast days, low batteries and spotty connections?`,
    successText: `I can't believe you said yes — my luck and my joy and my every future just got a thousand times brighter. I promise to keep being ridiculous with you, to learn how to be better, to listen when you need space and to celebrate when you're shining. We'll build a life made from the little things: playlists we both hate-and-love, secret nicknames, small traditions that only we understand, and a million tiny moments that add up to forever. I choose you now and I'll choose you tomorrow, every time. Thank you for trusting my heart. I love you more than any message can hold.\n\n— Ned`,

    greenHex: '#b8f1d6',
    tealHex: '#7bdff6',
    accentHex: '#67c9b7',

    // We'll explicitly check for these two files:
    background1: '/images/backgrounds1.png',
    background2: '/images/backgrounds2.png',

    confettiSprite: '/images/confetti.png',
    heartSprite: '/images/heart.png',

    audios: {
      music: '/audios/music.mp3',
      interactions: '/audios/interactions.mp3',
      voice: '/audios/voicemessage.mp3'
    },

    typingSpeed: 24,
    preloaderTimeout: 7000,
    gameHeartsCount: 7,
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

  /* ---------- Styles ---------- */
  function injectStyles(){
    const css = `
:root{ --green:${CONFIG.greenHex}; --teal:${CONFIG.tealHex}; --accent:${CONFIG.accentHex}; }
*{box-sizing:border-box}
html,body{height:100%;margin:0;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial;color:#062126;background:#f4fffb}
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
.card{max-width:920px;width:max(92%,760px);background:rgba(255,255,255,0.92);backdrop-filter:blur(8px);border-radius:16px;padding:26px 30px;box-shadow:0 6px 40px rgba(4,23,31,0.08);transition:transform 0.5s ease}
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
.gameBoard{width:min(820px,96vw);height:min(620px,86vh);background:linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0.9));border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:12px}
.heartSprite{position:absolute;width:44px;height:44px;pointer-events:auto}
.ring{position:fixed;width:86px;height:86px;border-radius:50%;border:8px solid gold;box-shadow:0 6px 20px rgba(0,0,0,0.18);display:grid;place-items:center;z-index:120;pointer-events:auto;background:radial-gradient(circle at 40% 35%, rgba(255,255,200,0.9), rgba(255,240,180,0.5));}
.controlsRow{display:flex;gap:8px;align-items:center}
.karaokeLine{padding:6px;border-radius:8px}
.karaokeLine.highlight{background:linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));}
@media(max-width:520px){.card{padding:16px;border-radius:12px}.title{font-size:20px}.bigTitle{font-size:24px}.para{font-size:15px}.visualizer{width:86%}}
`;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }

  /* ---------- Preload helpers ---------- */
  function preload(urls, onProgress, onDone){
    const list = urls.slice(); if(list.length === 0){ if(onProgress) onProgress(1); onDone(); return; }
    let loaded = 0; const total = list.length; function progressed(){ loaded++; if(onProgress) onProgress(loaded/total); if(loaded >= total) onDone(); }
    list.forEach(src=>{
      const img = new Image(); img.onload = progressed; img.onerror = progressed; img.src = src;
    });
    setTimeout(()=>{ onDone(); }, CONFIG.preloaderTimeout);
  }

  /* ---------- Fallback background generation ---------- */
  function makeGradientDataURL(w=1200,h=800, colors=['#b8f1d6','#7bdff6']){
    const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0,0,w,h); const step = 1/(colors.length-1);
    colors.forEach((col,i)=> g.addColorStop(i*step, col)); ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.globalAlpha = 0.06; ctx.fillStyle = '#ffffff'; for(let i=0;i<200;i++){ ctx.beginPath(); ctx.arc(Math.random()*w, Math.random()*h, Math.random()*2.5, 0, Math.PI*2); ctx.fill(); }
    return c.toDataURL('image/png');
  }

  /* ---------- Party particles (same as before) ---------- */
  function createPartyCanvas(){
    const c = document.createElement('canvas'); c.className='partyCanvas'; document.body.appendChild(c);
    const ctx = c.getContext('2d'); let W=0,H=0; function resize(){W=c.width=window.innerWidth;H=c.height=window.innerHeight;} resize(); window.addEventListener('resize',resize);
    const particles = []; const sprites = {}; function loadSprite(url,name){ const img = new Image(); img.onload = ()=> { sprites[name]=img; }; img.onerror=()=>{}; img.src = url; }
    loadSprite(CONFIG.confettiSprite,'confetti'); loadSprite(CONFIG.heartSprite,'heart');
    function spawn(x,y,n=30){ for(let i=0;i<n;i++){ particles.push({x,y,vx:rand(-6,6),vy:rand(-14,-3),size:rand(14,44),life:rand(80,220),age:0,rot:rand(0,6.28),vrot:rand(-0.12,0.12),sprite: Math.random()>0.5 ? 'heart' : 'confetti'}); } }
    let raf; function frame(){ ctx.clearRect(0,0,W,H); for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.age++; if(p.age>p.life){ particles.splice(i,1); continue; } p.vy += 0.4; p.x += p.vx; p.y += p.vy; p.rot += p.vrot; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); const img=sprites[p.sprite]; if(img) ctx.drawImage(img, -p.size/2, -p.size/2, p.size, p.size); else { if(p.sprite === 'heart'){ drawHeart(ctx,0,0,p.size/2); } else { ctx.fillStyle = `rgba(${Math.floor(rand(60,240))},${Math.floor(rand(60,240))},${Math.floor(rand(60,240))},${0.9 - p.age/p.life})`; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size); } } ctx.restore(); } raf = requestAnimationFrame(frame); }
    frame(); return { spawn, destroy(){ cancelAnimationFrame(raf); c.remove(); } };
  }
  function drawHeart(ctx, x, y, size){ ctx.save(); ctx.translate(x,y); ctx.beginPath(); const topCurveHeight = size * 0.3; ctx.moveTo(0, topCurveHeight); ctx.bezierCurveTo(0, topCurveHeight - (size * 0.5), -size, topCurveHeight - (size * 0.5), -size, topCurveHeight); ctx.bezierCurveTo(-size, topCurveHeight + (size * 0.5), 0, topCurveHeight + (size * 0.9), 0, size); ctx.bezierCurveTo(0, topCurveHeight + (size * 0.9), size, topCurveHeight + (size * 0.5), size, topCurveHeight); ctx.bezierCurveTo(size, topCurveHeight - (size * 0.5), 0, topCurveHeight - (size * 0.5), 0, topCurveHeight); ctx.closePath(); ctx.fillStyle = 'rgba(255,80,120,0.95)'; ctx.fill(); ctx.restore(); }

  /* ---------- Simple audio visualizer (unchanged) ---------- */
  async function setupVisualizer(audioEl, container){
    if(!window.AudioContext && !window.webkitAudioContext) return null;
    try{
      const AudioCtx = window.AudioContext || window.webkitAudioContext; const ctx = new AudioCtx();
      const srcNode = ctx.createMediaElementSource(audioEl);
      const analyser = ctx.createAnalyser(); analyser.fftSize = 256; srcNode.connect(analyser); analyser.connect(ctx.destination);
      const bufferLength = analyser.frequencyBinCount; const dataArray = new Uint8Array(bufferLength);
      const canvas = elt('canvas',{class:'visualizer'}); container.appendChild(canvas); const cvs = canvas; const cctx=cvs.getContext('2d'); function resize(){cvs.width = canvas.clientWidth*devicePixelRatio; cvs.height = canvas.clientHeight*devicePixelRatio; cctx.scale(devicePixelRatio,devicePixelRatio);} resize(); window.addEventListener('resize',resize);
      let running=true; function loop(){ if(!running) return; analyser.getByteFrequencyData(dataArray); cctx.clearRect(0,0,canvas.width,canvas.height); const w = canvas.clientWidth; const h = canvas.clientHeight; const barWidth = w / bufferLength * 1.5; for(let i=0;i<bufferLength;i++){ const v = dataArray[i]/255; const x = i*barWidth; const barH = v*h*1.2; cctx.fillStyle = `rgba(123,223,246, ${0.6 + v*0.4})`; cctx.fillRect(x, h-barH, barWidth*0.9, barH); } requestAnimationFrame(loop); }
      loop(); return { destroy(){ running=false; canvas.remove(); ctx.close(); } };
    }catch(e){ console.warn('Visualizer init failed', e); return null; }
  }

  /* ---------- GLOBALS that we will need later ---------- */
  let GLOBALS = {
    availableBackgrounds: [], // will hold discovered background srcs
    bgWrapEl: null,
    bgEls: [],
    currentBgIndex: 0
  };

  /* ---------- Build main UI ---------- */
  function buildUI(backgrounds, preloaderEl){
    GLOBALS.availableBackgrounds = backgrounds.slice();
    const existingApp = document.getElementById('app'); if(existingApp) existingApp.remove();
    const app = elt('div',{id:'app'}); document.body.appendChild(app);

    // background wrapper
    const bgwrap = elt('div',{class:'backgrounds'}); app.appendChild(bgwrap);
    GLOBALS.bgWrapEl = bgwrap;
    // create two bg layers: base for intro (bg1) and proposal overlay (bg2) if available
    const bgEls = [];
    // prefer explicit background1 and background2 if found in provided backgrounds
    const b1 = backgrounds.find(s => s && s.includes('backgrounds1')) || backgrounds[0];
    const b2 = backgrounds.find(s => s && s.includes('backgrounds2')) || backgrounds[1] || b1;

    const bg1El = elt('div',{class:'bgimg', style:{backgroundImage:`url(${b1})`}});
    const bg2El = elt('div',{class:'bgimg', style:{backgroundImage:`url(${b2})`}});
    bgwrap.appendChild(bg1El);
    bgwrap.appendChild(bg2El);
    bgwrap.appendChild(elt('div',{class:'bg-filter'}));
    GLOBALS.bgEls = [bg1El, bg2El];
    // show first
    bg1El.classList.add('visible'); bg2El.classList.remove('visible');

    // main overlay
    const overlay = elt('div',{class:'overlay'});
    const card = elt('div',{class:'card', role:'region','aria-live':'polite'});
    overlay.appendChild(card); app.appendChild(overlay);

    const title = elt('h1',{class:'title'}, CONFIG.titleName);
    card.appendChild(title);

    const daysCounter = elt('div',{class:'footerTiny',id:'daysCounter'}, daysTogetherText(CONFIG.START_DATE));
    card.appendChild(daysCounter);
    setInterval(()=>{ daysCounter.textContent = daysTogetherText(CONFIG.START_DATE); }, 60*1000);

    const para = elt('div',{class:'para',id:'introPara'});
    card.appendChild(para);

    const controlsRow = elt('div',{class:'controlsRow'});
    const musicBtn = elt('button',{class:'btn','aria-label':'Play music'}, 'Play music');
    const skipBtn = elt('button',{class:'btn secondary','aria-label':'Skip intro'}, 'Skip');
    const adventureBtn = elt('button',{class:'btn secondary','aria-label':'Choose an adventure'}, 'Choose our adventure');
    controlsRow.appendChild(musicBtn); controlsRow.appendChild(skipBtn); controlsRow.appendChild(adventureBtn);
    card.appendChild(controlsRow);

    const karaokeWrap = elt('div',{style:{marginTop:'12px',width:'100%'}});
    const karaokeList = elt('div',{});
    karaokeWrap.appendChild(karaokeList);
    card.appendChild(karaokeWrap);

    const audioControls = elt('div',{class:'audioControls'});
    const audioVoiceBtn = elt('button',{class:'iconButton',title:'Play voice message','aria-label':'Play voice message'}); audioVoiceBtn.textContent='▶';
    audioControls.appendChild(audioVoiceBtn);
    card.appendChild(audioControls);

    const visualizerContainer = elt('div',{}); card.appendChild(visualizerContainer);

    const bottom = elt('div',{class:'bottomArea'});
    const qTitle = elt('div',{class:'footerTiny'}, 'Did my pretty baby finish reading?'); bottom.appendChild(qTitle);
    const continueWrap = elt('div',{class:'continueWrap'});
    const continueBtn = elt('button',{class:'btn',id:'continueBtn'}, 'Continue'); continueWrap.appendChild(continueBtn); bottom.appendChild(continueWrap);
    const gamesRow = elt('div',{style:{marginTop:'12px',display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'center'}});
    const game1 = elt('button',{class:'btn secondary'}, 'Catch Hearts');
    const game2 = elt('button',{class:'btn secondary'}, 'Pillow Fight');
    const game3 = elt('button',{class:'btn secondary'}, 'Memory Match');
    gamesRow.appendChild(game1); gamesRow.appendChild(game2); gamesRow.appendChild(game3); bottom.appendChild(gamesRow);
    card.appendChild(bottom);

    // audio elements
    let music=null, interactions=null, voice=null; try{ music = new Audio(CONFIG.audios.music); music.loop=true; music.preload='none'; }catch(e){ music=null; }
    try{ interactions = new Audio(CONFIG.audios.interactions); interactions.preload='none'; }catch(e){ interactions=null; }
    try{ voice = new Audio(CONFIG.audios.voice); voice.preload='none'; }catch(e){ voice=null; }
    if(!voice) audioVoiceBtn.style.display='none'; if(!music) { musicBtn.disabled=true; musicBtn.textContent='Music unavailable'; }

    let visualizerHandle = null; async function tryInitVisualizer(){ if(visualizerHandle || !music) return; visualizerHandle = await setupVisualizer(music, visualizerContainer); }

    let musicPlaying=false; musicBtn.addEventListener('click', async ()=>{ if(!music) return; try{ if(!musicPlaying){ await music.play(); musicPlaying=true; musicBtn.textContent='Pause music'; tryInitVisualizer(); } else { music.pause(); musicPlaying=false; musicBtn.textContent='Play music'; } }catch(e){ console.warn('music play blocked', e); } });

    let voicePlaying=false; if(voice){ audioVoiceBtn.addEventListener('click', ()=>{ if(!voicePlaying){ voice.play().catch(()=>{}); audioVoiceBtn.textContent='⏸'; voicePlaying=true; } else { voice.pause(); audioVoiceBtn.textContent='▶'; voicePlaying=false; } }); voice.addEventListener('ended', ()=>{ audioVoiceBtn.textContent='▶'; voicePlaying=false; }); }

    const typer = typeWithHighlight(para, CONFIG.introText, CONFIG.typingSpeed);
    skipBtn.addEventListener('click', ()=>{ typer.skip(); });

    CONFIG.singLines.forEach((line, idx)=>{
      const l = elt('div',{class:'karaokeLine',dataset:{idx:idx}} , line);
      karaokeList.appendChild(l);
    });
    function highlightKaraoke(i){ const children = Array.from(karaokeList.children); children.forEach((c,idx)=> c.classList.toggle('highlight', idx===i)); }

    adventureBtn.addEventListener('click', ()=>{ showAdventureModal(app); });

    continueBtn.addEventListener('click', ()=>{ if(interactions) interactions.play().catch(()=>{}); showProposalScreen(app, {music, interactions, voice}); });

    game1.addEventListener('click', ()=> showCatchHeartsGame(app));
    game2.addEventListener('click', ()=> showPillowFight(app));
    game3.addEventListener('click', ()=> showMemoryMatch(app));

    if(preloaderEl) { preloaderEl.classList.add('hidden'); setTimeout(()=>preloaderEl.remove(),450); }
    setTimeout(()=>{ karaokeWrap.style.opacity = 1; karaokeWrap.style.transition = 'opacity 900ms ease'; }, 900);

    return { music, interactions, voice, visualizerHandle };
  }

  /* ---------- Adventure modal (unchanged) ---------- */
  function showAdventureModal(app){
    const overlay = elt('div',{class:'gameOverlay'});
    const modal = elt('div',{class:'gameBoard'});
    overlay.appendChild(modal);
    const title = elt('h3',{}, 'Choose our little imaginary trip'); modal.appendChild(title);
    const choices = elt('div',{style:{display:'flex',gap:'10px',flexWrap:'wrap',marginTop:'6px'}});
    const c1 = elt('button',{class:'btn'}, 'Midnight Picnic');
    const c2 = elt('button',{class:'btn'}, 'Playlist Marathon');
    const c3 = elt('button',{class:'btn'}, 'Stargazing Call');
    choices.appendChild(c1); choices.appendChild(c2); choices.appendChild(c3); modal.appendChild(choices);

    const vignette = elt('div',{style:{flex:1,marginTop:'10px',borderRadius:'10px',overflow:'hidden',position:'relative',background:'#fff'}});
    modal.appendChild(vignette);

    const close = elt('button',{class:'btn secondary'}, 'Close'); modal.appendChild(close);
    document.getElementById('app').appendChild(overlay);

    function showVignette(kind){ vignette.innerHTML = ''; if(kind==='Midnight Picnic'){
        vignette.appendChild(elt('div',{style:{padding:'18px'}}, 'We spread a tiny blanket in pixel-lands, send each other snacks and make ridiculous toasts to our future. A soft string of messages becomes our constellation.'));
        const party = createPartyCanvas(); party.spawn(window.innerWidth/2, window.innerHeight/2, 40); setTimeout(()=>party.destroy(),1700);
      } else if(kind==='Playlist Marathon'){
        vignette.appendChild(elt('div',{style:{padding:'18px'}}, 'We take turns sending the worst songs we secretly love. Each song gets a silly caption and a promise attached — the silliest gets a dance challenge.'));
      } else if(kind==='Stargazing Call'){
        vignette.appendChild(elt('div',{style:{padding:'18px'}}, 'We call with cameras off, watch the same sky in different places, and point at imaginary constellations until we fall asleep.'));
      }
    }
    c1.addEventListener('click', ()=> showVignette('Midnight Picnic'));
    c2.addEventListener('click', ()=> showVignette('Playlist Marathon'));
    c3.addEventListener('click', ()=> showVignette('Stargazing Call'));
    close.addEventListener('click', ()=> overlay.remove());
  }

  /* ---------- Proposal screen (modified to switch background2) ---------- */
  function showProposalScreen(app, audios){
    // hide existing overlays
    document.querySelectorAll('.overlay').forEach(el=>el.style.display='none');

    // switch visible background to background2 (if available)
    if(GLOBALS.bgEls && GLOBALS.bgEls.length >= 2){
      GLOBALS.bgEls[0].classList.remove('visible');
      GLOBALS.bgEls[1].classList.add('visible');
    }

    const overlay = elt('div',{class:'overlay proposal', style:{alignItems:'center',justifyContent:'center'}});
    const card = elt('div',{class:'card', role:'dialog','aria-modal':'true'});
    overlay.appendChild(card); document.getElementById('app').appendChild(overlay);

    const title = elt('h2',{class:'bigTitle'}, CONFIG.proposalTitle); card.appendChild(title);
    const sub = elt('div',{class:'para'}, CONFIG.proposalSubtitle); card.appendChild(sub);

    const btnRow = elt('div',{style:{display:'flex',gap:'12px',marginTop:'8px',flexWrap:'wrap',justifyContent:'center'}});
    const yesBtn = elt('button',{class:'yesBtn',role:'button','aria-label':'Yes I will marry you'}, 'YES!');
    const noBtn = elt('button',{class:'noBtn',role:'button','aria-label':'No I will not'}, 'NO!');
    btnRow.appendChild(yesBtn); btnRow.appendChild(noBtn); card.appendChild(btnRow);

    // NO shy move (same playful behavior)
    let shyness = 0.08; function shyMove(el){ const pad=12; const maxX = window.innerWidth-el.offsetWidth-pad; const maxY = window.innerHeight-el.offsetHeight-pad; const x = Math.floor(rand(0, Math.max(0,maxX))); const y = Math.floor(rand(0, Math.max(0,maxY))); el.style.position='fixed'; el.style.left = x+'px'; el.style.top = y+'px'; }
    function onApproach(e){ const rect = noBtn.getBoundingClientRect(); const dx = e.clientX - (rect.left + rect.width/2); const dy = e.clientY - (rect.top + rect.height/2); const dist = Math.hypot(dx,dy); if(dist < 140){ if(Math.random() < 0.9 + shyness) { shyMove(noBtn); shyness = clamp(shyness+0.06, 0, 0.95); navigator.vibrate && navigator.vibrate(15); if(audios && audios.interactions) audios.interactions.play().catch(()=>{}); } } }
    overlay.addEventListener('pointermove', onApproach); noBtn.addEventListener('touchstart', ()=>{ shyMove(noBtn); shyness = clamp(shyness+0.06,0,0.95); });

    noBtn.addEventListener('keydown', (ev)=>{ if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); const sure = confirm('This page is playful — are you sure you want to say NO? If you confirm, I will accept and respect your choice.'); if(sure){ alert('I understand. Thank you for being honest.'); window.location.reload(); } } });

    // YES: trigger ring-catching sequence (playful) instead of immediate success
    yesBtn.addEventListener('click', async ()=>{ if(audios && audios.interactions) { audios.interactions.currentTime = 0; audios.interactions.play().catch(()=>{}); } // animate card slightly then start ring sequence
      card.animate([{transform:'scale(1)'},{transform:'scale(0.98)'}],{duration:260,fill:'forwards'}); await sleep(260);
      startRingCatchSequence(overlay, audios); // will show "catch the ring" message and spawn ring
    });

    const tiny = elt('div',{class:'footerTiny'}, 'This is playful — you always have a choice.'); card.appendChild(tiny);
    const teaser = createPartyCanvas(); teaser.spawn(window.innerWidth/2, window.innerHeight/2, 18); setTimeout(()=>teaser.destroy(),1800);
  }

  /* ---------- Ring catch sequence ---------- */
  function startRingCatchSequence(parentOverlay, audios){
    // remove proposal card content but keep overlay so we can place ring
    parentOverlay.innerHTML = '';
    // create a playful panel with the prompt
    const promptCard = elt('div',{class:'card', style:{maxWidth:'720px',textAlign:'center'}});
    promptCard.appendChild(elt('h3',{}, 'mm sure if you really do wanna marry me then catch the ring!!'));
    promptCard.appendChild(elt('div',{class:'para', style:{fontSize:'15px'}}, 'Tap the golden ring as it flies and bounces — catch it to make it official!'));
    parentOverlay.appendChild(promptCard);

    // spawn ring element and physics
    const ring = document.createElement('div'); ring.className = 'ring'; ring.style.left = (window.innerWidth/2 - 44) + 'px'; ring.style.top = (window.innerHeight/2 - 44) + 'px';
    document.body.appendChild(ring);

    // simple physics
    let vx = rand(-5,5), vy = rand(-6,-3);
    let x = window.innerWidth/2 - 44, y = window.innerHeight/2 - 44;
    const w = 86, h = 86;
    let running = true;
    const gravity = 0.32;
    const bounceFactor = 0.82;

    function frame(){
      if(!running) return;
      vy += gravity;
      x += vx; y += vy;
      // bounce off bounds (keeping ring fully on screen)
      if(x < 8){ x = 8; vx = -vx * bounceFactor; }
      if(x + w > window.innerWidth - 8){ x = window.innerWidth - w - 8; vx = -vx * bounceFactor; }
      if(y < 8){ y = 8; vy = -vy * bounceFactor; }
      if(y + h > window.innerHeight - 8){ y = window.innerHeight - h - 8; vy = -vy * bounceFactor; vx *= 0.98; }
      ring.style.left = x + 'px'; ring.style.top = y + 'px';
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // tap/click handler to "catch" the ring
    function caught(){
      if(!running) return;
      running = false;
      ring.style.transition = 'transform 360ms ease, opacity 360ms ease';
      ring.style.transform = 'scale(0.6) rotate(90deg)';
      ring.style.opacity = '0';
      setTimeout(()=> ring.remove(), 420);
      // after catch, show success
      setTimeout(()=> {
        // switch background back to background1 or keep background2? we'll keep bg2 then show success overlay.
        showSuccessScreen(document.getElementById('app'), CONFIG.successText, audios);
      }, 420);
    }

    ring.addEventListener('click', caught);
    ring.addEventListener('touchstart', (e)=>{ e.preventDefault(); caught(); });

    // safety: after 22 seconds, slow ring and nudge to center if untouched
    const safety = setTimeout(()=>{ if(running){ vx *= 0.2; vy *= 0.2; } }, 22000);

    // if user navigates away, clean up
    const cleanup = ()=>{ running=false; ring.remove(); clearTimeout(safety); window.removeEventListener('resize', onResize); };
    function onResize(){ x = clamp(x, 8, window.innerWidth - w - 8); y = clamp(y, 8, window.innerHeight - h - 8); }
    window.addEventListener('resize', onResize);
  }

  /* ---------- Success screen (unchanged) ---------- */
  function showSuccessScreen(app, text, audios){
    // remove other overlays and ensure background shows bg1 or keep current (we'll show bg1 for quiet ending)
    if(GLOBALS.bgEls && GLOBALS.bgEls.length >= 1){
      GLOBALS.bgEls[0].classList.add('visible');
      if(GLOBALS.bgEls[1]) GLOBALS.bgEls[1].classList.remove('visible');
    }
    document.querySelectorAll('.overlay').forEach(el=>el.remove());
    const wrap = elt('div',{class:'overlay', style:{alignItems:'center',justifyContent:'center'}});
    const card = elt('div',{class:'card'}); wrap.appendChild(card); document.getElementById('app').appendChild(wrap);

    const title = elt('h2',{class:'bigTitle'}, '💍 You said YES!'); card.appendChild(title);
    const para = elt('div',{class:'para'}, text); card.appendChild(para);

    const controls = elt('div',{class:'controlsRow'});
    const replayVoice = elt('button',{class:'btn'}, 'Play voice message');
    const downloadPNG = elt('button',{class:'btn'}, 'Download keepsake (PNG)');
    const downloadPDF = elt('button',{class:'btn'}, 'Download keepsake (PDF)');
    const playGame = elt('button',{class:'btn'}, 'Play "Catch 7 Hearts"');
    const shareBtn = elt('button',{class:'btn'}, 'Copy love message');
    controls.appendChild(replayVoice); controls.appendChild(downloadPNG); controls.appendChild(downloadPDF); controls.appendChild(playGame); controls.appendChild(shareBtn);
    card.appendChild(controls);

    if(audios && audios.interactions) { audios.interactions.currentTime = 0; audios.interactions.play().catch(()=>{}); }
    const party = createPartyCanvas(); party.spawn(window.innerWidth/2, window.innerHeight/2, 120); setTimeout(()=>party.spawn(window.innerWidth/3, window.innerHeight/3, 80), 700);

    replayVoice.addEventListener('click', ()=>{ if(audios && audios.voice) { audios.voice.currentTime = 0; audios.voice.play().catch(()=>{}); } else alert('Voice message not available.'); });

    async function generatePNG(){ const canvas = document.createElement('canvas'); const W=1400, H=900; canvas.width=W; canvas.height=H; const ctx=canvas.getContext('2d'); const g = ctx.createLinearGradient(0,0,W,H); g.addColorStop(0, CONFIG.greenHex); g.addColorStop(1, CONFIG.tealHex); ctx.fillStyle = g; ctx.fillRect(0,0,W,H); ctx.fillStyle='#023'; ctx.font='56px serif'; ctx.fillText(CONFIG.titleName, 80, 120); ctx.font='28px system-ui'; const lines = CONFIG.introText.split('\n'); let y=170; ctx.fillStyle='#033'; for(const line of lines){ ctx.fillText(line, 80, y); y+=36; if(y > H-120) break; } ctx.fillStyle='#022'; ctx.font='24px system-ui'; ctx.fillText('— Ned', 80, y+20); return canvas.toDataURL('image/png'); }
    downloadPNG.addEventListener('click', async ()=>{ const url = await generatePNG(); const a = document.createElement('a'); a.href=url; a.download='keepsake.png'; document.body.appendChild(a); a.click(); a.remove(); });

    downloadPDF.addEventListener('click', ()=>{ const w = window.open('', '_blank'); const html = `<!doctype html><html><head><meta charset=\"utf-8\"><title>Keepsake</title></head><body><pre style=\"font-family:system-ui,Arial;white-space:pre-wrap;font-size:16px;\">${CONFIG.titleName}\n\n${CONFIG.introText}\n\n${CONFIG.proposalTitle}\n${CONFIG.proposalSubtitle}\n\n${CONFIG.successText}</pre></body></html>`; w.document.write(html); w.document.close(); w.print(); });

    shareBtn.addEventListener('click', ()=>{ const textMsg = `${CONFIG.titleName}\n\n${CONFIG.proposalTitle}\n${CONFIG.proposalSubtitle}\n\n${CONFIG.successText}`; navigator.clipboard && navigator.clipboard.writeText(textMsg).then(()=> alert('Love message copied to clipboard!')); });

    playGame.addEventListener('click', ()=>{ showCatchHeartsGame(document.getElementById('app')); });

    const t = setInterval(()=> party.spawn(rand(100,window.innerWidth-100), rand(100,window.innerHeight-100), 40), 1600);
    window.addEventListener('beforeunload', ()=>{ clearInterval(t); party.destroy(); });
  }

  /* ---------- Mini-games (unchanged) ---------- */
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

    document.getElementById('app').appendChild(overlay);

    const memories = [
      'The first time you laughed at my terrible joke — I knew I wanted more of your smile.',
      'That rainy picnic where we got soaked and didn\'t care.',
      'Your hand in mine during the sunset — quiet but perfect.',
      'How you made my favorite meal and somehow made it taste like home.',
      'The way you dance in the kitchen when no one is watching.',
      'Your morning texts that make the whole day brighter.',
      'When you shared your umbrella and we walked slower on purpose.'
    ];

    let caught = 0; function spawnHeart(){ const h = elt('div',{class:'heartSprite'}); stage.appendChild(h); const size = rand(36,84); h.style.width = size+'px'; h.style.height = size+'px'; const x = rand(10, Math.max(20, stage.clientWidth - 80)); const y = stage.clientHeight + 40; h.style.left = x+'px'; h.style.top = y+'px'; h.style.background = `radial-gradient(circle at 40% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.5)), linear-gradient(180deg, #ff9fb8, #ff5f84)`; h.style.borderRadius='50%'; h.style.boxShadow='0 6px 18px rgba(0,0,0,0.12)'; const targetY = rand(30, stage.clientHeight - 120); const dur = rand(4200, 7800); h.animate([{transform:`translateY(0px)`, opacity:1},{transform:`translateY(-${y - targetY}px)`, opacity:1}], {duration:dur, easing:'linear'}); const tid = setTimeout(()=>{ h.remove(); }, dur+200); h.addEventListener('click', ()=>{ clearTimeout(tid); const msg = memories[caught % memories.length]; caught++; h.remove(); alert(msg); if(caught >= CONFIG.gameHeartsCount){ alert('You caught them all! Thank you for playing ❤️'); overlay.remove(); } }); }
    const spawnInterval = setInterval(()=> spawnHeart(), 700);

    closeBtn.addEventListener('click', ()=>{ clearInterval(spawnInterval); overlay.remove(); });
  }

  function showPillowFight(app){
    const overlay = elt('div',{class:'gameOverlay'});
    const board = elt('div',{class:'gameBoard',role:'dialog','aria-modal':'true'});
    overlay.appendChild(board);
    board.appendChild(elt('h3',{}, 'Pillow Fight — Tap the flying pillows!'));
    board.appendChild(elt('div',{class:'small'}, 'Tap pillows as they fly across the screen. Reach 20 taps to win a silly victory.'));
    const stage = elt('div',{style:{position:'relative',flex:1,overflow:'hidden',borderRadius:'10px',background:'linear-gradient(180deg,#fff,#fff6fb)'}});
    board.appendChild(stage);
    const footer = elt('div',{style:{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'10px'}});
    const close = elt('button',{class:'btn secondary'}, 'Quit'); footer.appendChild(close); board.appendChild(footer);
    document.getElementById('app').appendChild(overlay);

    let score = 0; const scoreEl = elt('div',{class:'footerTiny'}, 'Score: 0'); board.insertBefore(scoreEl, stage);
    function spawnPillow(){ const p = elt('div',{}); stage.appendChild(p); const size = rand(56,110); p.style.width = size+'px'; p.style.height = size+'px'; p.style.borderRadius = '12px'; p.style.background = `linear-gradient(180deg, #fff7f8, #fceef1)`; p.style.boxShadow='0 8px 20px rgba(0,0,0,0.08)'; const startX = rand(10, stage.clientWidth - 100); p.style.left = startX + 'px'; p.style.top = (stage.clientHeight + 60) + 'px'; const dur = rand(2800, 5200); p.animate([{transform:'translateY(0px)'},{transform:`translateY(-${stage.clientHeight + 80}px)`}], {duration: dur, easing:'linear'}); const tid = setTimeout(()=> p.remove(), dur+200); p.addEventListener('click', ()=>{ clearTimeout(tid); score++; scoreEl.textContent = 'Score: ' + score; p.remove(); if(score >= 20){ alert('You win! Pillow champion 🏆'); overlay.remove(); } }); }
    const interval = setInterval(()=> spawnPillow(), 700);
    close.addEventListener('click', ()=>{ clearInterval(interval); overlay.remove(); });
  }

  function showMemoryMatch(app){
    const overlay = elt('div',{class:'gameOverlay'});
    const board = elt('div',{class:'gameBoard',role:'dialog','aria-modal':'true'});
    overlay.appendChild(board);
    board.appendChild(elt('h3',{}, 'Memory Match — find pairs')); board.appendChild(elt('div',{class:'small'}, 'Flip cards and match pairs to reveal cute compliments.'));
    const grid = elt('div',{style:{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:'8px',flex:1}});
    board.appendChild(grid);
    const footer = elt('div',{style:{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'10px'}});
    const close = elt('button',{class:'btn secondary'}, 'Close'); footer.appendChild(close); board.appendChild(footer);
    document.getElementById('app').appendChild(overlay);

    const emojis = ['🌟','🌙','🎵','🍰','🌸','💌','☕','📷']; const deck = emojis.concat(emojis).sort(()=>Math.random()-0.5);
    let first=null, second=null, matched=0;
    deck.forEach((symbol, i)=>{ const card = elt('button', {class:'btn', style:{height:'64px'}}, ''); card.dataset.symbol = symbol; card.addEventListener('click', ()=>{ if(card.classList.contains('matched')||card===first) return; card.textContent = symbol; card.style.background='#fff'; if(!first){ first=card; } else { second=card; if(first.dataset.symbol === second.dataset.symbol){ first.classList.add('matched'); second.classList.add('matched'); matched += 2; first=null; second=null; if(matched === deck.length){ alert('All pairs found! Here is a secret compliment: You make the world softer.'); overlay.remove(); } } else { setTimeout(()=>{ first.textContent=''; second.textContent=''; first.style.background=''; second.style.background=''; first=null; second=null; }, 700); } } }); grid.appendChild(card); });
    close.addEventListener('click', ()=> overlay.remove());
  }

  /* ---------- Easter egg (unchanged) ---------- */
  function initSecretEasterEgg(){ const seq = ['TL','TR','BL','BR','C']; let idx=0; let lastTime=0; function posToKey(x,y){ const w=window.innerWidth, h=window.innerHeight; const mx = x < w*0.25 ? 'L' : (x > w*0.75 ? 'R' : 'M'); const my = y < h*0.25 ? 'T' : (y > h*0.75 ? 'B' : 'M'); if(mx==='M' && my==='M') return 'C'; if(mx==='L' && my==='T') return 'TL'; if(mx==='R' && my==='T') return 'TR'; if(mx==='L' && my==='B') return 'BL'; if(mx==='R' && my==='B') return 'BR'; return 'C'; }
    window.addEventListener('pointerdown', (e)=>{ const now=Date.now(); if(now - lastTime > 6000) idx=0; lastTime=now; const k = posToKey(e.clientX, e.clientY); if(k === seq[idx]){ idx++; if(idx >= seq.length){ idx=0; launchHiddenMessage(); } } else { idx=0; } }); }
  function launchHiddenMessage(){ alert('Secret unlocked! You found my hidden message ❤️\nI love you more than anything.'); }

  /* ---------- Background discovery and init ---------- */
  function checkIfExists(url, cb){
    const img = new Image();
    let done=false;
    const t = setTimeout(()=>{ if(!done){ done=true; cb(false); } }, 1400);
    img.onload = ()=>{ if(done) return; done=true; clearTimeout(t); cb(true); };
    img.onerror = ()=>{ if(done) return; done=true; clearTimeout(t); cb(false); };
    img.src = url;
  }

  function init(){
    injectStyles();
    const pre = elt('div',{class:'preloader'}); const inner = elt('div',{class:'inner'}); inner.appendChild(elt('div',{html:'<strong>Loading a special surprise...</strong>'})); const bar = elt('div',{class:'bar'}); const innerBar = elt('i',{}); bar.appendChild(innerBar); inner.appendChild(bar); pre.appendChild(inner); document.body.appendChild(pre);

    // Check for backgrounds1 and backgrounds2 specifically
    const candidates = [];
    checkIfExists(CONFIG.background1, (ok1)=>{ if(ok1) candidates.push(CONFIG.background1); checkIfExists(CONFIG.background2, (ok2)=>{ if(ok2) candidates.push(CONFIG.background2); // if none exist, create generated fallbacks
        if(candidates.length === 0){
          console.warn('No explicit background images found — using generated fallbacks.');
          const generated = [makeGradientDataURL(1200,800), makeGradientDataURL(1200,800), makeGradientDataURL(1200,800)];
          candidates.push(...generated);
        } else {
          // if only one candidate (background1) present, add a generated second so proposal bg exists
          if(candidates.length === 1) candidates.push(makeGradientDataURL(1200,800));
        }
        preload(candidates, (p)=>{ innerBar.style.width = Math.round(p*100) + '%'; }, ()=>{ setTimeout(()=>{ buildUI(candidates, pre); initSecretEasterEgg(); }, 180); });
      }); });
  }

  // run
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  /* ---------- Typing helper (bottom of file to avoid hoisting weirdness) ---------- */
  function typeWithHighlight(node, text, speed=CONFIG.typingSpeed){
    node.textContent = '';
    const lines = text.split('\n');
    let li = 0; let ci = 0; let skip=false;
    const lineNodes = lines.map(()=> elt('div', {style:{marginBottom:'6px'}}));
    lineNodes.forEach(n=>node.appendChild(n));
    function step(){ if(skip){ lineNodes.forEach((n,i)=> n.textContent = lines[i]); return; } if(li >= lines.length) return; const L = lines[li]; lineNodes[li].textContent = L.slice(0, ci+1); ci++; if(ci >= L.length){ li++; ci=0; setTimeout(step, speed * 6); } else setTimeout(step, speed); }
    step(); return { skip(){ skip=true; } };
  }

})();
