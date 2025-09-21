/* main.js — v2 (full)
   Features:
   - Intro with green hearts background and scattered SVG hearts
   - "Choose our adventure" opens a modal with its own content and X to close
   - Continue reliably proceeds to proposal; Skip skips typing and updates small note
   - Proposal screen: YES triggers fast, bouncing, no-gravity ring with ring.mp3 playing; NO dodges
   - When ring is caught: Yay.mp3 plays, background music volume restored, success screen shows "Let's play!!"
   - Game flow: Let's play -> Balloons of Memories -> Memory Match (compliments per correct match)
   - Audios: music.mp3 (autoplay attempted), click.mp3 on every click, ring.mp3 in ring game, Yay.mp3 on catch
   - Designed to be saved as main.js and used with index.html that references it
*/

(function(){
  'use strict';

  const CONFIG = {
    titleName: 'Dear, Ema',
    introText: `Dear Ema,\n\nEvery night I fall asleep smiling because somewhere on the other side of the world your laugh is still echoing in my head. You make tiny things feel enormous — a sleepy text, the way you describe a silly little thought, the stories you tell me at 2 AM that turn ordinary minutes into the best part of my day. Loving you is a quiet, constant adventure: I love hearing your voice, trading ridiculous memes, building plans that start as jokes and slowly turn into promises. I want to be the one who learns your favorite songs and sings them badly just so you laugh; the one who cheers when you try something new; the one who holds your hand through cold Wi‑Fi and low battery and every sunrise in between. I promise to choose you even on the ordinary days, to celebrate your tiny wins, to give you a soft place after a rough day, and to keep finding ways to surprise you — with dumb jokes, midnight playlists, and promises written in pixels. You are my favorite conversation, my safest chaos, my warm light when everything else turns grey. Stay with me in this long, silly, beautiful story — I’ll keep turning the pages if you’ll keep reading them with me.\n\n— Ned`,
    proposalTitle: 'Will you marry me 🥹',
    proposalSubtitle: `Do you accept Ned — as your partner in every midnight chat, your teammate when plans go sideways, your cheerleader when you try something brave, and your stubborn, silly, loving husband through slow days, fast days, low batteries and spotty connections?`,
    successText: `I can't believe you said yes — my luck and my joy and my every future just got a thousand times brighter. I promise to keep being ridiculous with you, to learn how to be better, to listen when you need space and to celebrate when you're shining. We'll build a life made from the little things: playlists we both hate-and-love, secret nicknames, small traditions that only we understand, and a million tiny moments that add up to forever. I choose you now and I'll choose you tomorrow, every time. Thank you for trusting my heart. I love you more than any message can hold.\n\n— Ned`,
    background1: '/images/backgrounds1.png',
    background2: '/images/backgrounds2.png',
    siteImage: '/images/Site.png',
    audios: {
      music: '/audios/music.mp3',
      interactions: '/audios/interactions.mp3',
      voice: '/audios/voicemessage.mp3',
      click: '/audios/click.mp3',
      ring: '/audios/ring.mp3',
      yay: '/audios/Yay.mp3'
    },
    typingSpeed: 20,
    preloaderTimeout: 7000,
    START_DATE: '2025-07-19'
  };

  /* Small helpers */
  function elt(tag, attrs={}, ...children){
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
  function rand(min,max){ return Math.random()*(max-min)+min; }
  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
  function daysTogether(){ const s=new Date(CONFIG.START_DATE+'T00:00:00'); const now=new Date(); const days=Math.floor((now-s)/(1000*60*60*24)); const hrs=Math.floor((now-s)/(1000*60*60)); return `${days} days (${hrs} hours)`; }

  /* Styles */
  function injectStyles(){
    const css = `
:root{--green:#cfeee0;--teal:#7bdff6}
*{box-sizing:border-box}html,body{height:100%;margin:0;font-family:Inter,system-ui,Segoe UI,Roboto,Arial;background:#f4fffb;color:#062126}
#app{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;padding:20px}
.card{max-width:920px;width:100%;background:rgba(255,255,255,0.96);border-radius:14px;padding:20px;box-shadow:0 8px 28px rgba(6,30,30,0.06)}
.title{font-size:26px;margin:0 0 10px 0;font-weight:800}
.para{white-space:pre-wrap;line-height:1.5;font-size:17px;padding:18px;border-radius:12px;position:relative;background:linear-gradient(180deg,var(--green),#b8f1d6);overflow:hidden;color:#023}
.scattered-heart{position:absolute;width:20px;height:20px;pointer-events:none;opacity:0.95}
.controls{display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap}
.btn{padding:10px 14px;border-radius:12px;border:0;background:var(--teal);color:#022;font-weight:700;cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,0.06)}
.btn.secondary{background:#fff;border:1px solid rgba(0,0,0,0.06)}
.modal{position:fixed;inset:0;background:rgba(0,0,0,0.38);display:flex;align-items:center;justify-content:center;z-index:80}
.modal .content{width:min(920px,94vw);max-height:86vh;overflow:auto;background:#fff;border-radius:12px;padding:18px;position:relative}
.closeX{position:absolute;right:12px;top:8px;border:0;background:#fff;padding:8px;border-radius:8px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,0.06)}
.ring{position:fixed;width:88px;height:88px;border-radius:50%;border:8px solid gold;display:grid;place-items:center;z-index:200;box-shadow:0 10px 30px rgba(0,0,0,0.18);cursor:pointer;background:radial-gradient(circle at 35% 35%, rgba(255,250,200,0.95), rgba(255,240,180,0.6))}
.gamesRow{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
.smallNote{font-size:13px;color:#445;margin-left:8px}
`;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }

  /* Audio setup */
  const audio = { music:null, interactions:null, voice:null, click:null, ring:null, yay:null };
  function setupAudios(){
    try{ audio.music = new Audio(CONFIG.audios.music); audio.music.loop = true; audio.music.volume = 0.18; audio.music.preload='auto'; }catch(e){ audio.music=null; }
    try{ audio.interactions = new Audio(CONFIG.audios.interactions); audio.interactions.preload='auto'; }catch(e){ audio.interactions=null; }
    try{ audio.voice = new Audio(CONFIG.audios.voice); audio.voice.preload='auto'; }catch(e){ audio.voice=null; }
    try{ audio.click = new Audio(CONFIG.audios.click); audio.click.preload='auto'; }catch(e){ audio.click=null; }
    try{ audio.ring = new Audio(CONFIG.audios.ring); audio.ring.loop=true; audio.ring.volume=0.5; }catch(e){ audio.ring=null; }
    try{ audio.yay = new Audio(CONFIG.audios.yay); }catch(e){ audio.yay=null; }

    // try autoplay; if blocked, start on first user interaction
    if(audio.music){
      audio.music.play().catch(()=>{
        const start = ()=>{ audio.music.play().catch(()=>{}); window.removeEventListener('pointerdown', start); window.removeEventListener('touchstart', start); };
        window.addEventListener('pointerdown', start, {once:true}); window.addEventListener('touchstart', start, {once:true});
      });
    }

    // play click sound on button presses
    document.addEventListener('click', (e)=>{
      if(e.target.closest('button') && audio.click){ try{ audio.click.currentTime = 0; audio.click.play().catch(()=>{}); }catch(e){} }
    }, true);
  }

  /* Hearts pattern generator for intro paragraph */
  function makeHeartsPatternDataURL(w=900,h=320,count=120){
    const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d');
    const g = ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,'#dff7ea'); g.addColorStop(1,'#b8f1d6'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    function drawHeart(x,y,s,color){ ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.beginPath(); ctx.moveTo(0,-6); ctx.bezierCurveTo(-6,-18,-22,-12,-22,-2); ctx.bezierCurveTo(-22,10,-8,20,0,30); ctx.bezierCurveTo(8,20,22,10,22,-2); ctx.bezierCurveTo(22,-12,6,-18,0,-6); ctx.closePath(); ctx.fillStyle=color; ctx.fill(); ctx.restore(); }
    for(let i=0;i<count;i++){ const x=Math.random()*w, y=Math.random()*h, s=0.5+Math.random()*1.0; const color = Math.random()<0.7 ? `rgba(34,128,92,${0.12+Math.random()*0.25})` : `rgba(119,201,166,${0.08+Math.random()*0.2})`; drawHeart(x,y,s,color); }
    ctx.globalAlpha=0.05; for(let i=0;i<1500;i++){ ctx.fillStyle='rgba(255,255,255,'+Math.random()*0.06+')'; ctx.fillRect(Math.random()*w,Math.random()*h,1,1); }
    return c.toDataURL('image/png');
  }

  /* Build main UI */
  function buildUI(bgs){
    const old = document.getElementById('app'); if(old) old.remove();
    const app = elt('div',{id:'app'}); document.body.appendChild(app);

    // backgrounds
    const bgwrap = elt('div',{style:{position:'absolute',inset:0,zIndex:0}});
    const bg1 = elt('div',{style:{position:'absolute',inset:0,backgroundImage:`url(${bgs[0]})`,backgroundSize:'cover',backgroundPosition:'center',opacity:1,transition:'opacity .8s'}});
    const bg2 = elt('div',{style:{position:'absolute',inset:0,backgroundImage:`url(${bgs[1]||bgs[0]})`,backgroundSize:'cover',backgroundPosition:'center',opacity:0,transition:'opacity .8s'}});
    bgwrap.appendChild(bg1); bgwrap.appendChild(bg2); document.body.appendChild(bgwrap);
    GLOBALS.bg1 = bg1; GLOBALS.bg2 = bg2;

    const container = elt('div',{class:'card'});
    const title = elt('h1',{class:'title'}, CONFIG.titleName);
    const days = elt('div',{class:'smallNote'}, daysTogether());
    container.appendChild(title); container.appendChild(days);

    // paragraph with hearts background
    const para = elt('div',{class:'para', id:'introPara'});
    para.style.backgroundImage = `url(${makeHeartsPatternDataURL(900,320,120)})`;
    para.textContent = ''; container.appendChild(para);

    // scattered SVG hearts inside para
    for(let i=0;i<16;i++){
      const h = elt('div',{class:'scattered-heart'});
      const svg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-7-4.5-9.5-8C-1 7 5 2 8 5c1.5 1.6 2.4 2.4 4 3.1 1.6-.7 2.5-1.5 4-3.1 3-3 9 2 5.5 8-2.5 3.5-9.5 8-9.5 8z" fill="rgba(255,255,255,0.95)"/></svg>`;
      h.innerHTML = svg; h.style.left = (5 + Math.random()*90) + '%'; h.style.top = (5 + Math.random()*85) + '%'; h.style.transform = `translate(-50%,-50%) rotate(${Math.floor(rand(-40,40))}deg) scale(${0.8 + Math.random()*0.8})`;
      para.appendChild(h);
    }

    // controls
    const controls = elt('div',{class:'controls'});
    const musicNote = elt('div',{class:'smallNote'}, 'Music will play automatically');
    const musicBtn = elt('button',{class:'btn secondary', id:'musicBtn'}, 'Music control');
    const skipBtn = elt('button',{class:'btn secondary', id:'skipBtn'}, 'Skip');
    const skipNote = elt('div',{class:'smallNote'}, 'heh no skipping baby — read it first');
    const adventureBtn = elt('button',{class:'btn', id:'adventureBtn'}, 'Choose our adventure');
    controls.appendChild(musicBtn); controls.appendChild(skipBtn); controls.appendChild(skipNote); controls.appendChild(adventureBtn); controls.appendChild(musicNote);
    container.appendChild(controls);

    // bottom continue
    const bottom = elt('div',{style:{marginTop:'12px',display:'flex',gap:'8px',alignItems:'center'}});
    const q = elt('div',{class:'smallNote'}, 'Did my pretty baby finish reading?');
    const contBtn = elt('button',{class:'btn', id:'continueBtn'}, 'Continue');
    bottom.appendChild(q); bottom.appendChild(contBtn); container.appendChild(bottom);

    app.appendChild(container);

    // typing intro
    const typer = typeWithHighlight(para, CONFIG.introText, CONFIG.typingSpeed);

    // skip
    skipBtn.addEventListener('click', ()=>{ try{ typer.skip(); skipNote.textContent = "ok you peeked — but please enjoy ❤️"; }catch(e){ console.warn(e); } });

    // continue -> proposal
    contBtn.addEventListener('click', ()=>{ try{ typer.skip(); if(audio.interactions){ audio.interactions.currentTime=0; audio.interactions.play().catch(()=>{});} showProposal(); }catch(e){ console.error(e); } });

    // adventure modal
    adventureBtn.addEventListener('click', ()=> openAdventureModal());

    // music control
    musicBtn.addEventListener('click', ()=>{ if(!audio.music) return alert('Music not available'); if(audio.music.paused){ audio.music.play().catch(()=>{}); musicBtn.textContent='Music: Playing'; } else { audio.music.pause(); musicBtn.textContent='Music: Paused'; } });

    return {typer};
  }

  /* Adventure modal with own section and close X */
  function openAdventureModal(){
    const modal = elt('div',{class:'modal'});
    const content = elt('div',{class:'content'});
    const closeX = elt('button',{class:'closeX'}, '✕');
    content.appendChild(closeX); content.appendChild(elt('h3',{}, 'Our Little Adventure'));
    content.appendChild(elt('div',{style:{marginTop:'10px'}}, 'Pick an adventure to imagine together.'));
    const area = elt('div',{style:{display:'flex',gap:'8px',marginTop:'10px'}});
    const opt1 = elt('button',{class:'btn'}, 'Midnight Picnic'); const opt2 = elt('button',{class:'btn'}, 'Playlist Marathon'); const opt3 = elt('button',{class:'btn'}, 'Stargazing Call');
    area.appendChild(opt1); area.appendChild(opt2); area.appendChild(opt3); content.appendChild(area);
    modal.appendChild(content); document.body.appendChild(modal);

    closeX.addEventListener('click', ()=> modal.remove());
    opt1.addEventListener('click', ()=> showMiniAdventure('Midnight Picnic', modal));
    opt2.addEventListener('click', ()=> showMiniAdventure('Playlist Marathon', modal));
    opt3.addEventListener('click', ()=> showMiniAdventure('Stargazing Call', modal));
  }

  function showMiniAdventure(kind, parentModal){
    const modal = elt('div',{class:'modal'});
    const content = elt('div',{class:'content'});
    content.appendChild(elt('button',{class:'closeX'}, '✕')); content.appendChild(elt('h3',{}, kind));
    const text = { 'Midnight Picnic':'We pretend to have a tiny picnic at midnight, swapping snacks & silly toasts.', 'Playlist Marathon':'We send each other secret favorite songs and rate them with funny notes.', 'Stargazing Call':'Video-off call pointing at the sky and making up constellations.' };
    content.appendChild(elt('div',{style:{marginTop:'8px'}}, text[kind]||''));
    modal.appendChild(content); document.body.appendChild(modal);
    content.querySelector('.closeX').addEventListener('click', ()=> modal.remove());
    if(parentModal) parentModal.remove();
  }

  /* Proposal screen */
  function showProposal(){
    if(GLOBALS.bg2) GLOBALS.bg2.style.opacity = 1;
    if(GLOBALS.bg1) GLOBALS.bg1.style.opacity = 0;
    const overlayCard = elt('div',{class:'card', style:{position:'fixed',zIndex:90,left:'50%',top:'50%',transform:'translate(-50%,-50%)',maxWidth:'760px'}});
    overlayCard.appendChild(elt('h2',{class:'title'}, CONFIG.proposalTitle));
    overlayCard.appendChild(elt('div',{class:'para'}, CONFIG.proposalSubtitle));
    const row = elt('div',{class:'controls'}); const yes = elt('button',{class:'btn'}, 'YES!'); const no = elt('button',{class:'btn secondary'}, 'NO!'); row.appendChild(yes); row.appendChild(no);
    const close = elt('button',{class:'btn secondary', style:{position:'absolute',right:'12px',top:'8px'}}, 'Close');
    overlayCard.appendChild(close); overlayCard.appendChild(row); document.body.appendChild(overlayCard);

    // NO dodge
    let shy = 0.12;
    overlayCard.addEventListener('pointermove', (e)=>{
      const rect = no.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width/2); const dy = e.clientY - (rect.top + rect.height/2); const dist = Math.hypot(dx,dy);
      if(dist < 140 && Math.random() < 0.85 + shy){ const x = Math.floor(rand(8, window.innerWidth - no.offsetWidth - 16)); const y = Math.floor(rand(80, window.innerHeight - no.offsetHeight - 16)); no.style.position='fixed'; no.style.left = x + 'px'; no.style.top = y + 'px'; shy = Math.min(0.95, shy + 0.06); if(audio.interactions){ audio.interactions.currentTime=0; audio.interactions.play().catch(()=>{}); } }
    });
    no.addEventListener('click', ()=> { alert('I respect your choice. This is playful.'); });

    yes.addEventListener('click', ()=>{ if(audio.interactions){ audio.interactions.currentTime=0; audio.interactions.play().catch(()=>{}); } overlayCard.remove(); startRingSequence(); });
    close.addEventListener('click', ()=>{ overlayCard.remove(); if(GLOBALS.bg1) GLOBALS.bg1.style.opacity = 1; if(GLOBALS.bg2) GLOBALS.bg2.style.opacity = 0; });
  }

  /* Ring: faster, no gravity, bounces with lively movement */
  function startRingSequence(){
    const prompt = elt('div',{class:'card', style:{position:'fixed',left:'50%',top:'12%',transform:'translateX(-50%)',zIndex:190,maxWidth:'720px',textAlign:'center'}});
    prompt.appendChild(elt('h3',{}, "mm sure if you really do wanna marry me then catch the ring!!"));
    prompt.appendChild(elt('div',{class:'smallNote'}, 'Tap the golden ring as it zips across the screen — try to catch it!'));
    document.body.appendChild(prompt);

    const ring = elt('div',{class:'ring'});
    let x = rand(80, window.innerWidth - 120), y = rand(80, window.innerHeight - 180);
    ring.style.left = x + 'px'; ring.style.top = y + 'px';
    document.body.appendChild(ring);

    let vx = rand(-12,12), vy = rand(-12,12); let running=true; const friction=0.996; const speedLimit=28;
    if(audio.ring){ try{ audio.ring.currentTime=0; audio.ring.play().catch(()=>{}); }catch(e){} if(audio.music) audio.music.volume = 0.06; }

    function loop(){
      if(!running) return;
      x += vx; y += vy;
      if(x < 8){ x = 8; vx = Math.abs(vx); }
      if(x + 88 > window.innerWidth - 8){ x = window.innerWidth - 96; vx = -Math.abs(vx); }
      if(y < 8){ y = 8; vy = Math.abs(vy); }
      if(y + 88 > window.innerHeight - 8){ y = window.innerHeight - 96; vy = -Math.abs(vy); }
      if(Math.random() < 0.08){ vx += rand(-3,3); vy += rand(-3,3); }
      const sp = Math.hypot(vx,vy); if(sp > speedLimit){ vx *= 0.96; vy *= 0.96; }
      vx *= friction; vy *= friction; ring.style.left = x + 'px'; ring.style.top = y + 'px'; requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    function caught(){
      if(!running) return; running=false;
      try{ if(audio.ring){ audio.ring.pause(); audio.ring.currentTime=0; } }catch(e){} if(audio.yay){ try{ audio.yay.currentTime=0; audio.yay.play().catch(()=>{}); }catch(e){} }
      if(audio.music){ const target=0.18; const step=0.02; const t=setInterval(()=>{ audio.music.volume = Math.min(target, audio.music.volume + step); if(audio.music.volume >= target) clearInterval(t); }, 120); }
      ring.style.transition='transform 350ms ease, opacity 320ms ease'; ring.style.transform='scale(.5) rotate(90deg)'; ring.style.opacity = '0'; setTimeout(()=> ring.remove(), 360);
      setTimeout(()=> showSuccessThenGames(), 420);
    }
    ring.addEventListener('click', caught);
    ring.addEventListener('touchstart', (e)=>{ e.preventDefault(); caught(); });

    setTimeout(()=>{ if(running){ running=false; try{ ring.remove(); if(audio.ring){ audio.ring.pause(); audio.ring.currentTime=0; } }catch(e){} alert('Ring flew away — try again!'); } }, 28000);
  }

  /* After success, show prompt and "Let's play!!" */
  function showSuccessThenGames(){
    if(GLOBALS.bg1) GLOBALS.bg1.style.opacity = 1; if(GLOBALS.bg2) GLOBALS.bg2.style.opacity = 0;
    const wrap = elt('div',{class:'card', style:{position:'fixed',left:'50%',top:'50%',transform:'translate(-50%,-50%)',zIndex:190,maxWidth:'760px'}});
    wrap.appendChild(elt('h2',{class:'title'}, '💍 You said YES!'));
    wrap.appendChild(elt('div',{class:'para'}, CONFIG.successText));
    wrap.appendChild(elt('div',{class:'para', style:{fontSize:'15px'}}, "Okay okay how about this — why don't you enjoy a mini game here? It's romantical and full of memories."));
    const lets = elt('button',{class:'btn'}, "Let's play!!"); wrap.appendChild(lets); document.body.appendChild(wrap);
    lets.addEventListener('click', ()=>{ wrap.remove(); startGameLevels(); });
  }

  /* Game progression: Balloons -> Memory Match -> finish */
  function startGameLevels(){
    showBalloonsOfMemories(document.getElementById('app'), ()=>{
      const compliments = ['You light up my phone and my life.','You have the kindest laugh.','Being with you feels like home.','You are my favorite notification.','Your courage inspires me.'];
      showMemoryMatch(document.getElementById('app'), compliments, ()=>{ alert('All levels complete — thank you for playing with me ❤️'); });
    });
  }

  /* Balloons of Memories */
  function showBalloonsOfMemories(app, onComplete){
    const overlay = elt('div',{class:'modal'}); const content = elt('div',{class:'content'});
    const close = elt('button',{class:'closeX'}, '✕'); content.appendChild(close); content.appendChild(elt('h3',{}, 'Balloons of Memories'));
    content.appendChild(elt('div',{style:{marginTop:'8px'}}, 'Pop balloons to reveal memories. Pop 6 to finish.'));
    const stage = elt('div',{style:{height:'60vh',position:'relative',overflow:'hidden',marginTop:'12px',background:'linear-gradient(180deg,#fff,#f7fffb)',borderRadius:'10px'}});
    content.appendChild(stage); overlay.appendChild(content); document.body.appendChild(overlay);
    const memories = ['That rainy picnic where we danced in puddles.','The late night we laughed until we cried.','Your tiny notes that make everything better.','When you sent me that silly photo unexpectedly.','The first time we said "goodnight" and meant forever.'];
    let popped=0;
    function spawnBalloon(){ const b = elt('button',{class:'btn'}); b.style.width='74px'; b.style.height='94px'; b.style.borderRadius='50%'; b.style.position='absolute'; b.style.left = rand(6,86)+'%'; b.style.bottom='-120px'; b.style.background='linear-gradient(180deg, rgba(255,220,240,0.95), rgba(255,180,220,0.95))'; stage.appendChild(b); const rise = rand(4200,9000); b.animate([{transform:'translateY(0)'},{transform:`translateY(-${stage.clientHeight + 140}px)`}], {duration:rise, easing:'linear'}); const tid = setTimeout(()=>{ if(b.parentNode) b.remove(); }, rise+300); b.addEventListener('click', ()=>{ clearTimeout(tid); const m = memories[Math.floor(rand(0,memories.length))]; popped++; b.remove(); alert(m); if(popped >= 6){ overlay.remove(); onComplete && onComplete(); } }); }
    const interval = setInterval(spawnBalloon, 700); close.addEventListener('click', ()=>{ clearInterval(interval); overlay.remove(); });
  }

  /* Memory Match with compliments per correct pair */
  function showMemoryMatch(app, compliments=null, onComplete){
    const overlay = elt('div',{class:'modal'}); const content = elt('div',{class:'content'}); const close = elt('button',{class:'closeX'}, '✕');
    content.appendChild(close); content.appendChild(elt('h3',{}, 'Memory Match — find pairs')); content.appendChild(elt('div',{style:{marginTop:'8px'}}, 'Flip cards and match pairs to reveal cute compliments.'));
    const grid = elt('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px',marginTop:'12px'}}); content.appendChild(grid); overlay.appendChild(content); document.body.appendChild(overlay);
    const emojis = ['🌟','🌙','🎵','🍰','🌸','💌','☕','📷']; const deck = emojis.concat(emojis).sort(()=>Math.random()-0.5);
    let first=null, second=null, matched=0, compIdx=0;
    deck.forEach(sym=>{ const card = elt('button',{class:'btn', style:{height:'74px',fontSize:'28px'}}, ''); card.dataset.sym = sym; card.addEventListener('click', ()=>{ if(card.classList.contains('matched')||card===first) return; card.textContent = sym; card.style.background = '#fff'; if(!first){ first = card; } else { second = card; if(first.dataset.sym === second.dataset.sym){ first.classList.add('matched'); second.classList.add('matched'); matched+=2; if(Array.isArray(compliments) && compliments[compIdx]){ alert(compliments[compIdx]); compIdx++; } first=null; second=null; if(matched === deck.length){ overlay.remove(); onComplete && onComplete(); } } else { setTimeout(()=>{ first.textContent=''; second.textContent=''; first.style.background=''; second.style.background=''; first=null; second=null; },700); } } }); grid.appendChild(card); });
    close.addEventListener('click', ()=> overlay.remove());
  }

  /* Typing helper */
  function typeWithHighlight(node, text, speed=20){
    node.textContent=''; const lines = text.split('\n'); let li=0, ci=0, skip=false; const lineNodes = lines.map(()=> elt('div',{style:{marginBottom:'6px'}})); lineNodes.forEach(n=>node.appendChild(n));
    function step(){ if(skip){ lineNodes.forEach((n,i)=> n.textContent = lines[i]); return; } if(li >= lines.length) return; const L = lines[li]; lineNodes[li].textContent = L.slice(0, ci+1); ci++; if(ci >= L.length){ li++; ci=0; setTimeout(step, speed*5); } else setTimeout(step, speed); } step(); return { skip(){ skip=true; } };
  }

  /* check image exists */
  function checkExists(url, cb){ const img = new Image(); let done=false; const t=setTimeout(()=>{ if(!done){ done=true; cb(false); } }, 1400); img.onload = ()=>{ if(done) return; done=true; clearTimeout(t); cb(true); }; img.onerror = ()=>{ if(done) return; done=true; clearTimeout(t); cb(false); }; img.src = url; }

  /* Init & glue */
  const GLOBALS = {};
  function init(){
    injectStyles(); setupAudios();
    const pre = elt('div',{style:{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.9)',zIndex:999}});
    pre.appendChild(elt('div',{}, 'Preparing a sweet surprise...')); document.body.appendChild(pre);
    const cands = [];
    checkExists(CONFIG.background1,(b1)=>{ if(b1) cands.push(CONFIG.background1); checkExists(CONFIG.background2,(b2)=>{ if(b2) cands.push(CONFIG.background2); if(cands.length===0){ cands.push(makeHeartsPatternDataURL(1200,800,180)); cands.push(makeHeartsPatternDataURL(1200,800,160)); } else if(cands.length===1){ cands.push(makeHeartsPatternDataURL(1200,800,160)); } setTimeout(()=>{ pre.remove(); buildUI(cands); }, 220); }); });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
