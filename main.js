/* main.js — Robust Anniversary site
   - Full feature set: intro with typed paragraph, hearts pattern background, scattered SVG hearts
   - Choose our adventure opens a modal with close X (does not relocate page)
   - Continue reliably advances to proposal; Skip skips typing; Skip small note updated
   - Proposal screen with YES/NO; NO dodges; YES starts ring chase
   - Ring chase: configurable fast, no gravity bounce behavior; ring.mp3 plays while chasing; Yay.mp3 plays on catch; music volume ducking/restoring
   - Minigame flow: "Let's play!!" -> Balloons -> Memory Match (compliments per match)
   - Audio & image fallbacks: missing assets won't break the site; generated backgrounds used if images absent
   - Smooth animations, mobile friendly, accessibility attributes, careful try/catch
   - Save as main.js in repo root. Keep images in /images and audio in /audios if available.
*/
(function () {
  'use strict';

  // ---------- Config ----------
  const CONFIG = {
    titleName: 'Dear, Ema',
    introText: `Dear Ema,\n\nEvery night I fall asleep smiling because somewhere on the other side of the world your laugh is still echoing in my head. You make tiny things feel enormous — a sleepy text, the way you describe a silly little thought, the stories you tell me at 2 AM that turn ordinary minutes into the best part of my day. Loving you is a quiet, constant adventure: I love hearing your voice, trading ridiculous memes, building plans that start as jokes and slowly turn into promises. I want to be the one who learns your favorite songs and sings them badly just so you laugh; the one who cheers when you try something new; the one who holds your hand through cold Wi‑Fi and low battery and every sunrise in between. I promise to choose you even on the ordinary days, to celebrate your tiny wins, to give you a soft place after a rough day, and to keep finding ways to surprise you — with dumb jokes, midnight playlists, and promises written in pixels. You are my favorite conversation, my safest chaos, my warm light when everything else turns grey. Stay with me in this long, silly, beautiful story — I’ll keep turning the pages if you’ll keep reading them with me.\n\n— Ned`,
    proposalTitle: 'Will you marry me 🥹',
    proposalSubtitle: `Do you accept Ned — as your partner in every midnight chat, your teammate when plans go sideways, your cheerleader when you try something brave, and your stubborn, silly, loving husband through low days, fast days, low batteries and spotty connections?`,
    successText: `I can't believe you said yes — my luck and my joy and my every future just got a thousand times brighter. I promise to keep being ridiculous with you, to learn how to be better, to listen when you need space and to celebrate when you're shining. We'll build a life made from the little things: playlists we both hate-and-love, secret nicknames, small traditions that only we understand, and a million tiny moments that add up to forever. I choose you now and I'll choose you tomorrow, every time. Thank you for trusting my heart. I love you more than any message can hold.\n\n— Ned`,
    images: {
      background1: '/images/backgrounds1.png',
      background2: '/images/backgrounds2.png',
      siteImage: '/images/Site.png'
    },
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
    startDate: '2025-07-19'
  };

  // ---------- Utilities ----------
  function elt(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'style') Object.assign(el.style, attrs.style);
      else if (k === 'html') el.innerHTML = attrs[k];
      else if (k === 'dataset') for (const d in attrs[k]) el.dataset[d] = attrs[k][d];
      else if (k.startsWith('on') && typeof attrs[k] === 'function') el.addEventListener(k.slice(2), attrs[k]);
      else el.setAttribute(k, attrs[k]);
    }
    for (const c of children) if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    return el;
  }
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function daysTogetherText() {
    const start = new Date(CONFIG.startDate + 'T00:00:00');
    const now = new Date();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((now - start) / (1000 * 60 * 60));
    return `${days} days (${hours} hours) together — our little adventure`;
  }
  function log(...args) { try { console.log('[Anniv]', ...args); } catch (e) { } }

  // ---------- Styles ----------
  function injectStyles() {
    const css = `
:root{--green:#dff7ea;--teal:#7bdff6;--accent:#67c9b7;--card-bg:rgba(255,255,255,0.96)}
*{box-sizing:border-box}
html,body{height:100%;margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial;background:linear-gradient(180deg,#f6fffb,#eefafc);color:#062126}
#app{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;padding:20px}
.background-layer{position:fixed;inset:0;background-size:cover;background-position:center;transition:opacity 900ms ease;z-index:0}
.overlay{position:relative;z-index:10;display:flex;align-items:center;justify-content:center;width:100%;height:100%}
.card{max-width:960px;width:100%;background:var(--card-bg);border-radius:16px;padding:22px 26px;box-shadow:0 16px 50px rgba(4,23,31,0.07);transition:transform 420ms cubic-bezier(.2,.9,.2,1)}
.title{font-size:32px;margin:0 0 8px 0;font-weight:800}
.para{white-space:pre-wrap;line-height:1.6;font-size:18px;padding:18px;border-radius:12px;position:relative;overflow:hidden;background:linear-gradient(180deg,var(--green),#b8f1d6);color:#053}
.scattered-heart{position:absolute;width:22px;height:22px;pointer-events:none;opacity:0.92;transform:translate(-50%,-50%)}
.controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px}
.btn{padding:12px 16px;border-radius:12px;border:0;background:linear-gradient(90deg,var(--green),var(--teal));color:#033;font-weight:800;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,0.08)}
.btn.secondary{background:#fff;border:1px solid rgba(0,0,0,0.06);font-weight:700}
.smallNote{font-size:13px;color:#445;margin-left:8px}
.modal{position:fixed;inset:0;background:rgba(0,0,0,0.36);display:flex;align-items:center;justify-content:center;z-index:50}
.modal .content{width:min(920px,94vw);max-height:86vh;overflow:auto;background:#fff;border-radius:12px;padding:18px;position:relative}
.closeX{position:absolute;right:12px;top:8px;border:0;background:#fff;padding:8px;border-radius:8px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,0.06)}
.ring{position:fixed;width:96px;height:96px;border-radius:50%;border:8px solid gold;display:grid;place-items:center;z-index:210;box-shadow:0 12px 36px rgba(0,0,0,0.2);cursor:pointer;background:radial-gradient(circle at 35% 35%, rgba(255,250,200,0.96), rgba(255,240,180,0.6));touch-action:none}
.gamesRow{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:520px){.card{padding:14px;border-radius:12px}.title{font-size:22px}.para{font-size:15px}}
`;
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ---------- Audio handling (robust) ----------
  const AUDIO = {
    music: null, interactions: null, voice: null, click: null, ring: null, yay: null
  };

  function safeNewAudio(src) {
    try {
      const a = new Audio(src);
      a.preload = 'auto';
      return a;
    } catch (e) {
      return null;
    }
  }

  function setupAudioObjects() {
    AUDIO.music = safeNewAudio(CONFIG.audios.music);
    AUDIO.interactions = safeNewAudio(CONFIG.audios.interactions);
    AUDIO.voice = safeNewAudio(CONFIG.audios.voice);
    AUDIO.click = safeNewAudio(CONFIG.audios.click);
    AUDIO.ring = safeNewAudio(CONFIG.audios.ring);
    AUDIO.yay = safeNewAudio(CONFIG.audios.yay);

    // volume defaults
    if (AUDIO.music) AUDIO.music.volume = 0.18;
    if (AUDIO.ring) AUDIO.ring.volume = 0.6;

    // Try autoplay: if blocked, set up gesture resume
    if (AUDIO.music) {
      AUDIO.music.play().catch(() => {
        const resume = () => {
          AUDIO.music.play().catch(() => { });
          window.removeEventListener('pointerdown', resume);
          window.removeEventListener('touchstart', resume);
        };
        window.addEventListener('pointerdown', resume, { once: true });
        window.addEventListener('touchstart', resume, { once: true });
      });
    }

    // Click sound for buttons (capture phase)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn && AUDIO.click) {
        try { AUDIO.click.currentTime = 0; AUDIO.click.play().catch(() => { }); } catch (err) { }
      }
    }, true);
  }

  // ---------- Image detection & fallback generator ----------
  function checkImageExists(src, timeout = 1400) {
    return new Promise(resolve => {
      if (!src) return resolve(false);
      const img = new Image();
      let done = false;
      const t = setTimeout(() => { if (!done) { done = true; resolve(false); } }, timeout);
      img.onload = () => { if (done) return; done = true; clearTimeout(t); resolve(true); };
      img.onerror = () => { if (done) return; done = true; clearTimeout(t); resolve(false); };
      img.src = src;
    });
  }

  function makeHeartsPattern(width = 1200, height = 700, density = 160) {
    const c = document.createElement('canvas');
    c.width = width; c.height = height;
    const ctx = c.getContext('2d');
    // soft gradient
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, '#e8fff6'); g.addColorStop(1, '#b8f1d6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
    // draw hearts
    function drawHeart(x, y, s, col) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.bezierCurveTo(-6, -18, -22, -12, -22, -2);
      ctx.bezierCurveTo(-22, 10, -8, 20, 0, 30);
      ctx.bezierCurveTo(8, 20, 22, 10, 22, -2);
      ctx.bezierCurveTo(22, -12, 6, -18, 0, -6);
      ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.restore();
    }
    for (let i = 0; i < density; i++) {
      const x = Math.random() * width, y = Math.random() * height, s = 0.4 + Math.random() * 1.0;
      const col = Math.random() > 0.6 ? `rgba(34,128,92,${0.08 + Math.random() * 0.35})` : `rgba(119,201,166,${0.06 + Math.random() * 0.24})`;
      drawHeart(x, y, s, col);
    }
    // subtle noise
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 1500; i++) ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
    return c.toDataURL('image/png');
  }

  // ---------- Party particles (lightweight) ----------
  function createParty() {
    const canvas = document.createElement('canvas'); canvas.className = 'partyCanvas'; document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d'); let W = 0, H = 0;
    function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
    resize(); window.addEventListener('resize', resize);
    const parts = [];
    let raf;
    function spawn(x, y, n = 40) {
      for (let i = 0; i < n; i++) parts.push({
        x, y,
        vx: rand(-8, 8),
        vy: rand(-14, -4),
        size: rand(8, 26),
        life: rand(80, 240),
        age: 0,
        col: `hsl(${rand(300, 360)},${rand(60, 90)}%,${rand(60, 75)}%)`
      });
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.age++; if (p.age > p.life) { parts.splice(i, 1); continue; }
        p.vy += 0.42; p.x += p.vx; p.y += p.vy; ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size, p.size * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    frame();
    return { spawn, destroy() { cancelAnimationFrame(raf); canvas.remove(); } };
  }

  // ---------- Build UI and behavior ----------
  const GLOBALS = { bg1: null, bg2: null, party: null };

  function buildMainUI({ bg1src, bg2src }) {
    document.body.innerHTML = ''; // clear anything previously inserted (preloader etc)
    // background layers
    const bg1 = elt('div', { class: 'background-layer', style: { backgroundImage: `url(${bg1src})`, opacity: 1 } });
    const bg2 = elt('div', { class: 'background-layer', style: { backgroundImage: `url(${bg2src})`, opacity: 0 } });
    document.body.appendChild(bg1); document.body.appendChild(bg2);
    GLOBALS.bg1 = bg1; GLOBALS.bg2 = bg2;

    // main overlay
    const overlay = elt('div', { class: 'overlay', id: 'overlay' });
    const card = elt('section', { class: 'card', role: 'region', 'aria-label': 'Anniversary card' });
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const title = elt('h1', { class: 'title' }, CONFIG.titleName);
    card.appendChild(title);
    const days = elt('div', { class: 'smallNote', role: 'note' }, daysTogetherText());
    card.appendChild(days);

    // paragraph area
    const para = elt('div', { class: 'para', id: 'introPara' });
    para.style.backgroundImage = `url(${makeHeartsPattern(900, 320, 140)})`;
    card.appendChild(para);

    // scattered hearts (SVG inline)
    for (let i = 0; i < 18; i++) {
      const heart = elt('div', { class: 'scattered-heart' });
      heart.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-7-4.5-9.5-8C-1 7 5 2 8 5c1.5 1.6 2.4 2.4 4 3.1 1.6-.7 2.5-1.5 4-3.1 3-3 9 2 5.5 8-2.5 3.5-9.5 8-9.5 8z" fill="rgba(255,255,255,0.95)"/></svg>`;
      heart.style.left = `${5 + Math.random() * 90}%`;
      heart.style.top = `${5 + Math.random() * 85}%`;
      heart.style.transform = `translate(-50%,-50%) rotate(${Math.floor(rand(-40, 40))}deg) scale(${0.8 + Math.random() * 0.9})`;
      para.appendChild(heart);
    }

    // controls row
    const controls = elt('div', { class: 'controls', role: 'toolbar', 'aria-label': 'Controls' });
    const musicNote = elt('div', { class: 'smallNote' }, 'Music will play automatically (if allowed)');
    const musicToggle = elt('button', { class: 'btn secondary', id: 'musicToggle', title: 'Toggle music' }, 'Music');
    const skipBtn = elt('button', { class: 'btn secondary', id: 'skipBtn', title: 'Skip intro' }, 'Skip');
    const skipNote = elt('div', { class: 'smallNote', id: 'skipNote' }, 'heh no skipping baby — read it first');
    const adventureBtn = elt('button', { class: 'btn', id: 'adventureBtn', title: 'Choose our adventure' }, 'Choose our adventure');
    controls.appendChild(musicToggle); controls.appendChild(skipBtn); controls.appendChild(skipNote); controls.appendChild(adventureBtn); controls.appendChild(musicNote);
    card.appendChild(controls);

    // continue area
    const bottom = elt('div', { style: { marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' } });
    const q = elt('div', { class: 'smallNote' }, 'Did my pretty baby finish reading?');
    const continueBtn = elt('button', { class: 'btn', id: 'continueBtn' }, 'Continue');
    bottom.appendChild(q); bottom.appendChild(continueBtn); card.appendChild(bottom);

    // typing behavior
    const typer = typeWithHighlight(para, CONFIG.introText, CONFIG.typingSpeed);

    // skip action
    skipBtn.addEventListener('click', () => {
      try { typer.skip(); document.getElementById('skipNote').textContent = "ok you peeked — but please enjoy ❤️"; } catch (e) { log('skip error', e); }
    });

    // continue action => proposal
    continueBtn.addEventListener('click', () => {
      try {
        typer.skip();
        if (AUDIO.interactions) { try { AUDIO.interactions.currentTime = 0; AUDIO.interactions.play().catch(() => { }); } catch (e) { } }
        showProposal();
      } catch (err) { log('Continue error', err); }
    });

    // adventure opens modal with its own section and close X
    adventureBtn.addEventListener('click', openAdventureModal);

    // music toggle fallback toggle
    musicToggle.addEventListener('click', () => {
      if (!AUDIO.music) return alert('Music file missing');
      if (AUDIO.music.paused) { AUDIO.music.play().catch(() => { }); musicToggle.textContent = 'Music: Playing'; } else { AUDIO.music.pause(); musicToggle.textContent = 'Music: Paused'; }
    });

    // remember for debugging
    GLOBALS.typer = typer;
    // accessibility focus
    continueBtn.focus();
  }

  // ---------- Adventure modal ----------
  function openAdventureModal() {
    const modal = elt('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
    const content = elt('div', { class: 'content' });
    const closeX = elt('button', { class: 'closeX', 'aria-label': 'Close adventure' }, '✕');
    content.appendChild(closeX);
    content.appendChild(elt('h3', {}, 'Our Little Adventure'));
    content.appendChild(elt('p', {}, 'Pick an adventure to imagine together — these are small, sweet little scenarios.'));
    const area = elt('div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } });
    const opt1 = elt('button', { class: 'btn' }, 'Midnight Picnic');
    const opt2 = elt('button', { class: 'btn' }, 'Playlist Marathon');
    const opt3 = elt('button', { class: 'btn' }, 'Stargazing Call');
    area.appendChild(opt1); area.appendChild(opt2); area.appendChild(opt3); content.appendChild(area);
    modal.appendChild(content); document.body.appendChild(modal);

    closeX.addEventListener('click', () => modal.remove());
    opt1.addEventListener('click', () => showMiniAdventure('Midnight Picnic', modal));
    opt2.addEventListener('click', () => showMiniAdventure('Playlist Marathon', modal));
    opt3.addEventListener('click', () => showMiniAdventure('Stargazing Call', modal));
  }

  function showMiniAdventure(kind, parentModal) {
    const modal = elt('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
    const content = elt('div', { class: 'content' });
    const closeX = elt('button', { class: 'closeX' }, '✕');
    content.appendChild(closeX);
    content.appendChild(elt('h3', {}, kind));
    const descriptions = {
      'Midnight Picnic': 'We pretend to spread a tiny blanket, send each other a picture of our snack, and whisper silly promises.',
      'Playlist Marathon': 'We swap secretly-loved songs and write a tiny rating that becomes our inside joke.',
      'Stargazing Call': 'We call with cameras off, point at the sky, and invent constellations to each other.'
    };
    content.appendChild(elt('p', {}, descriptions[kind] || ''));
    modal.appendChild(content); document.body.appendChild(modal);
    closeX.addEventListener('click', () => modal.remove());
    if (parentModal) parentModal.remove();
  }

  // ---------- Proposal screen ----------
  function showProposal() {
    // show bg2 visually if present
    if (GLOBALS.bg2) GLOBALS.bg2.style.opacity = 1;
    if (GLOBALS.bg1) GLOBALS.bg1.style.opacity = 0;
    const overlayCard = elt('div', { class: 'card', role: 'dialog', 'aria-modal': 'true', style: { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 120, maxWidth: '760px' } });
    overlayCard.appendChild(elt('h2', { class: 'title' }, CONFIG.proposalTitle));
    overlayCard.appendChild(elt('div', { class: 'para' }, CONFIG.proposalSubtitle));
    const row = elt('div', { class: 'controls' });
    const yes = elt('button', { class: 'btn', 'aria-label': 'Yes' }, 'YES!');
    const no = elt('button', { class: 'btn secondary', 'aria-label': 'No' }, 'NO!');
    row.appendChild(yes); row.appendChild(no);
    const closeBtn = elt('button', { class: 'btn secondary', style: { position: 'absolute', right: '12px', top: '8px' } }, 'Close');
    overlayCard.appendChild(closeBtn); overlayCard.appendChild(row); document.body.appendChild(overlayCard);

    // NO dodge behavior
    let shyness = 0.08;
    overlayCard.addEventListener('pointermove', (e) => {
      try {
        const rect = no.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2), dy = e.clientY - (rect.top + rect.height / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < 140 && Math.random() < 0.86 + shyness) {
          const x = Math.floor(rand(12, window.innerWidth - no.offsetWidth - 16));
          const y = Math.floor(rand(80, window.innerHeight - no.offsetHeight - 16));
          no.style.position = 'fixed'; no.style.left = x + 'px'; no.style.top = y + 'px';
          shyness = Math.min(0.98, shyness + 0.05);
          if (AUDIO.interactions) { try { AUDIO.interactions.currentTime = 0; AUDIO.interactions.play().catch(() => { }); } catch (e) { } }
        }
      } catch (err) { log('NO dodge error', err); }
    });
    no.addEventListener('click', () => { alert('I respect your choice. This is playful ❤️'); });

    yes.addEventListener('click', () => {
      try { if (AUDIO.interactions) { AUDIO.interactions.currentTime = 0; AUDIO.interactions.play().catch(() => { }); } } catch (e) { }
      overlayCard.remove();
      startRingChase(); // start ring chase
    });
    closeBtn.addEventListener('click', () => { overlayCard.remove(); if (GLOBALS.bg1) GLOBALS.bg1.style.opacity = 1; if (GLOBALS.bg2) GLOBALS.bg2.style.opacity = 0; });
  }

  // ---------- Ring chase (fast, no gravity) ----------
  function startRingChase() {
    const prompt = elt('div', { class: 'card', style: { position: 'fixed', left: '50%', top: '10%', transform: 'translateX(-50%)', zIndex: 210, maxWidth: '720px', textAlign: 'center' } });
    prompt.appendChild(elt('h3', {}, 'mm sure if you really do wanna marry me then catch the ring!!'));
    prompt.appendChild(elt('div', { class: 'smallNote' }, 'Tap the golden ring as it zips across the screen — try to catch it!'));
    document.body.appendChild(prompt);

    const ring = elt('div', { class: 'ring', role: 'button', 'aria-label': 'Ring to catch' });
    let x = rand(80, window.innerWidth - 140), y = rand(80, window.innerHeight - 220);
    ring.style.left = x + 'px'; ring.style.top = y + 'px';
    document.body.appendChild(ring);

    // velocities: faster, random initial, no gravity, bouncing at walls
    let vx = rand(-14, 14), vy = rand(-14, 14);
    let running = true;
    const friction = 0.995;
    const speedLimit = 32;

    // play ring audio if available and reduce background music
    if (AUDIO.ring) { try { AUDIO.ring.currentTime = 0; AUDIO.ring.play().catch(() => { }); } catch (e) { } }
    if (AUDIO.music) { try { AUDIO.music.volume = 0.06; } catch (e) { } }

    function step() {
      if (!running) return;
      x += vx; y += vy;
      // bounds bounce
      if (x < 6) { x = 6; vx = Math.abs(vx) + rand(0, 2); }
      if (x + 96 > window.innerWidth - 6) { x = window.innerWidth - 102; vx = -Math.abs(vx) - rand(0, 2); }
      if (y < 6) { y = 6; vy = Math.abs(vy) + rand(0, 2); }
      if (y + 96 > window.innerHeight - 6) { y = window.innerHeight - 102; vy = -Math.abs(vy) - rand(0, 2); }
      // lively nudges so it doesn't get stuck
      if (Math.random() < 0.08) { vx += rand(-3, 3); vy += rand(-3, 3); }
      // clamp speed
      const sp = Math.hypot(vx, vy); if (sp > speedLimit) { vx *= 0.96; vy *= 0.96; }
      vx *= friction; vy *= friction;
      ring.style.left = x + 'px'; ring.style.top = y + 'px';
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    function catchIt() {
      if (!running) return;
      running = false;
      // stop ring SFX and play yay; restore music volume
      try { if (AUDIO.ring) { AUDIO.ring.pause(); AUDIO.ring.currentTime = 0; } } catch (e) { }
      try { if (AUDIO.yay) { AUDIO.yay.currentTime = 0; AUDIO.yay.play().catch(() => { }); } } catch (e) { }
      if (AUDIO.music) {
        const target = 0.18; const stepVol = 0.02;
        const t = setInterval(() => { try { AUDIO.music.volume = Math.min(target, AUDIO.music.volume + stepVol); if (AUDIO.music.volume >= target) clearInterval(t); } catch (err) { clearInterval(t); } }, 120);
      }
      ring.style.transition = 'transform 360ms ease, opacity 320ms ease';
      ring.style.transform = 'scale(0.5) rotate(90deg)';
      ring.style.opacity = '0';
      setTimeout(() => ring.remove(), 380);
      setTimeout(() => showSuccessWithGames(), 520);
    }

    ring.addEventListener('click', catchIt);
    ring.addEventListener('touchstart', (e) => { e.preventDefault(); catchIt(); });

    // cleanup fallback
    setTimeout(() => { if (running) { running = false; try { ring.remove(); if (AUDIO.ring) { AUDIO.ring.pause(); AUDIO.ring.currentTime = 0; } } catch (e) { } alert('The ring got shy and flew away — you can try again!'); } }, 30000);
  }

  // ---------- Success then "Let's play" and game flow ----------
  function showSuccessWithGames() {
    if (GLOBALS.bg1) GLOBALS.bg1.style.opacity = 1;
    if (GLOBALS.bg2) GLOBALS.bg2.style.opacity = 0;
    const wrap = elt('div', { class: 'card', style: { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 190, maxWidth: '760px' } });
    wrap.appendChild(elt('h2', { class: 'title' }, '💍 You said YES!'));
    wrap.appendChild(elt('div', { class: 'para' }, CONFIG.successText));
    wrap.appendChild(elt('div', { class: 'para', style: { fontSize: '15px' } }, "Okay okay how about this — why don't you enjoy a mini game here? It's romantical and full of memories."));
    const lets = elt('button', { class: 'btn' }, "Let's play!!");
    wrap.appendChild(lets); document.body.appendChild(wrap);
    lets.addEventListener('click', () => { wrap.remove(); startGameSequence(); });
  }

  function startGameSequence() {
    // Level 1: Balloons, then onComplete -> Memory Match with compliments
    showBalloonsOfMemories(document.getElementById('app'), () => {
      const compliments = ['You light up my phone and my life.', 'You have the kindest laugh.', 'Being with you feels like home.', 'You are my favorite notification.', 'Your courage inspires me.'];
      showMemoryMatch(document.getElementById('app'), compliments, () => { alert('All levels complete — thank you for playing with me ❤️'); });
    });
  }

  // ---------- Balloons of Memories (level 1) ----------
  function showBalloonsOfMemories(app, onComplete) {
    const modal = elt('div', { class: 'modal' });
    const content = elt('div', { class: 'content' });
    const close = elt('button', { class: 'closeX' }, '✕'); content.appendChild(close);
    content.appendChild(elt('h3', {}, 'Balloons of Memories'));
    content.appendChild(elt('p', {}, 'Pop the balloons to reveal memories. Pop 6 to finish.'));
    const stage = elt('div', { style: { height: '60vh', position: 'relative', overflow: 'hidden', marginTop: '12px', background: 'linear-gradient(180deg,#fff,#f7fffb)', borderRadius: '10px' } });
    content.appendChild(stage); modal.appendChild(content); document.body.appendChild(modal);
    close.addEventListener('click', () => modal.remove());

    const memories = ['That rainy picnic where we danced in puddles.', 'The late night we laughed until we cried.', 'Your tiny notes that make everything better.', 'When you sent me that silly photo unexpectedly.', 'The first time we said "goodnight" and meant forever.'];
    let popped = 0;
    function spawnBalloon() {
      const b = elt('button', { class: 'btn', style: { width: '74px', height: '94px', borderRadius: '50%', position: 'absolute', bottom: '-120px', left: rand(6, 86) + '%' } });
      b.style.background = `linear-gradient(180deg, rgba(255,220,240,0.95), rgba(255,180,220,0.95))`;
      stage.appendChild(b);
      const rise = rand(4200, 8800);
      const anim = b.animate([{ transform: 'translateY(0)' }, { transform: `translateY(-${stage.clientHeight + 140}px)` }], { duration: rise, easing: 'linear' });
      const tid = setTimeout(() => { if (b.parentNode) b.remove(); }, rise + 300);
      b.addEventListener('click', () => {
        clearTimeout(tid); const msg = memories[Math.floor(rand(0, memories.length))]; popped++; b.remove(); try { alert(msg); } catch (e) { console.log(msg); }
        if (popped >= 6) { modal.remove(); onComplete && onComplete(); }
      });
    }
    const interval = setInterval(spawnBalloon, 700);
    // cleanup on close
    close.addEventListener('click', () => clearInterval(interval));
  }

  // ---------- Memory Match (level 2) ----------
  function showMemoryMatch(app, compliments = null, onComplete) {
    const modal = elt('div', { class: 'modal' }); const content = elt('div', { class: 'content' });
    const close = elt('button', { class: 'closeX' }, '✕'); content.appendChild(close);
    content.appendChild(elt('h3', {}, 'Memory Match — find pairs')); content.appendChild(elt('p', {}, 'Flip cards and match pairs to reveal compliments.'));
    const grid = elt('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginTop: '12px' } }); content.appendChild(grid);
    modal.appendChild(content); document.body.appendChild(modal);
    close.addEventListener('click', () => modal.remove());

    const emojis = ['🌟', '🌙', '🎵', '🍰', '🌸', '💌', '☕', '📷'];
    const deck = emojis.concat(emojis).sort(() => Math.random() - 0.5);
    let first = null, second = null, matched = 0, compIdx = 0;
    deck.forEach(sym => {
      const card = elt('button', { class: 'btn', style: { height: '74px', fontSize: '28px' } }, '');
      card.dataset.sym = sym;
      card.addEventListener('click', () => {
        if (card.classList.contains('matched') || card === first) return;
        card.textContent = sym; card.style.background = '#fff';
        if (!first) { first = card; } else {
          second = card;
          if (first.dataset.sym === second.dataset.sym) {
            first.classList.add('matched'); second.classList.add('matched'); matched += 2;
            if (Array.isArray(compliments) && compliments[compIdx]) { try { alert(compliments[compIdx]); } catch (e) { console.log(compliments[compIdx]); } compIdx++; }
            first = null; second = null;
            if (matched === deck.length) { modal.remove(); onComplete && onComplete(); }
          } else {
            setTimeout(() => { first.textContent = ''; second.textContent = ''; first.style.background = ''; second.style.background = ''; first = null; second = null; }, 700);
          }
        }
      });
      grid.appendChild(card);
    });
  }

  // ---------- Typing helper ----------
  function typeWithHighlight(node, text, speed = 20) {
    node.textContent = '';
    const lines = text.split('\n');
    const containers = lines.map(() => elt('div', { style: { marginBottom: '6px' } }));
    containers.forEach(c => node.appendChild(c));
    let lineIdx = 0, charIdx = 0, skipped = false;
    function step() {
      if (skipped) { containers.forEach((c, i) => c.textContent = lines[i]); return; }
      if (lineIdx >= lines.length) return;
      const line = lines[lineIdx];
      containers[lineIdx].textContent = line.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx >= line.length) { lineIdx++; charIdx = 0; setTimeout(step, speed * 5); } else setTimeout(step, speed);
    }
    step();
    return { skip() { skipped = true; } };
  }

  // ---------- Initialization sequence ----------
  async function init() {
    injectStyles();
    setupAudioObjects(); setupAudios();
    // small friendly preloader element
    const pre = elt('div', { style: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.95)', zIndex: 9999 } });
    pre.appendChild(elt('div', {}, 'Loading your special surprise...'));
    document.body.appendChild(pre);

    // detect available images, generate fallbacks where missing
    const hasBg1 = await checkImageExists(CONFIG.images.background1);
    const hasBg2 = await checkImageExists(CONFIG.images.background2);
    const bg1src = hasBg1 ? CONFIG.images.background1 : makeHeartsPattern(1200, 800, 200);
    const bg2src = hasBg2 ? CONFIG.images.background2 : makeHeartsPattern(1200, 800, 120);

    // done loading
    setTimeout(() => {
      try { pre.remove(); } catch (e) { }
      buildMainUI({ bg1src, bg2src });
    }, 160);
  }

  // Setup audio objects and graceful features
  function setupAudios() {
    // audio objects already created in setupAudioObjects(); assign to local for convenience
    // On some browsers audio play may be blocked until user gesture; we handle that in setupAudioObjects
    // Nothing else required here for now
  }

  // call to define AUDIO objects safely (works even if files missing)
  function setupAudioObjects() { /* NOTE: intentionally separate to ensure audio files attempted early */
    AUDIO.music = safeNewAudio(CONFIG.audios.music);
    AUDIO.interactions = safeNewAudio(CONFIG.audios.interactions);
    AUDIO.voice = safeNewAudio(CONFIG.audios.voice);
    AUDIO.click = safeNewAudio(CONFIG.audios.click);
    AUDIO.ring = safeNewAudio(CONFIG.audios.ring);
    AUDIO.yay = safeNewAudio(CONFIG.audios.yay);
    if (AUDIO.music) AUDIO.music.loop = true, AUDIO.music.volume = 0.18;
    if (AUDIO.ring) AUDIO.ring.loop = true, AUDIO.ring.volume = 0.6;

    // autoplay attempt
    if (AUDIO.music) {
      AUDIO.music.play().catch(() => {
        const resume = () => { AUDIO.music.play().catch(() => { }); window.removeEventListener('pointerdown', resume); window.removeEventListener('touchstart', resume); };
        window.addEventListener('pointerdown', resume, { once: true }); window.addEventListener('touchstart', resume, { once: true });
      });
    }

    // global click sound for button interactions
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn && AUDIO.click) { try { AUDIO.click.currentTime = 0; AUDIO.click.play().catch(() => { }); } catch (err) { } }
    }, true);
  }

  // ---------- Run ----------
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  // Expose some internals for debugging (only in dev)
  window._anniv = { CONFIG, AUDIO, GLOBALS };

})();
