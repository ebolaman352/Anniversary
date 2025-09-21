/* main_fixed.js — Fixed button wiring, robust delegation, and full features
   - All interactive buttons use data-action attributes and are handled by a single delegated click listener.
   - UI Manager ensures only one transient UI visible at a time (no stacking).
   - Buttons: Continue, Choose our adventure, Skip, proposal YES/NO, game controls, etc. all wired.
   - Graceful fallbacks for missing images/audio remain.
   - Save as main.js in repo root.
*/

(function () {
  'use strict';

  /* ---------- Config ---------- */
  const CONFIG = {
    siteTitle: 'Dear, Ema',
    introText: `Dear Ema,\n\nEvery night I fall asleep smiling because somewhere on the other side of the world your laugh is still echoing in my head. You make tiny things feel enormous — a sleepy text, the way you describe a silly little thought, the stories you tell me at 2 AM that turn ordinary minutes into the best part of my day. Loving you is a quiet, constant adventure: I love hearing your voice, trading ridiculous memes, building plans that start as jokes and slowly turn into promises. I want to be the one who learns your favorite songs and sings them badly just so you laugh; the one who cheers when you try something new; the one who holds your hand through cold Wi‑Fi and low battery and every sunrise in between. I promise to choose you even on the ordinary days, to celebrate your tiny wins, to give you a soft place after a rough day, and to keep finding ways to surprise you — with dumb jokes, midnight playlists, and promises written in pixels. You are my favorite conversation, my safest chaos, my warm light when everything else turns grey. Stay with me in this long, silly, beautiful story — I’ll keep turning the pages if you’ll keep reading them with me.\n\n— Ned`,
    proposalTitle: 'Will you marry me 🥹',
    proposalSubtitle: `Do you accept Ned — as your partner in every midnight chat, your teammate when plans go sideways, your cheerleader when you try something brave, and your stubborn, silly, loving husband through slow days, fast days, low batteries and spotty connections?`,
    successText: `I can't believe you said yes — my luck and my joy and my every future just got a thousand times brighter. I promise to keep being ridiculous with you, to learn how to be better, to listen when you need space and to celebrate when you're shining. We'll build a life made from the little things: playlists we both hate-and-love, secret nicknames, small traditions that only we understand, and a million tiny moments that add up to forever. I choose you now and I'll choose you tomorrow, every time. Thank you for trusting my heart. I love you more than any message can hold.\n\n— Ned`,
    images: { bg1: '/images/backgrounds1.png', bg2: '/images/backgrounds2.png', site: '/images/Site.png' },
    audios: { music: '/audios/music.mp3', click: '/audios/click.mp3', ring: '/audios/ring.mp3', yay: '/audios/Yay.mp3', interactions: '/audios/interactions.mp3', voice: '/audios/voicemessage.mp3' },
    typingSpeed: 18,
    ring: { initialSpeed: 12, maxSpeed: 36, timeout: 30000 },
    minigames: { balloonsToPop: 6 },
    allowConfetti: true,
    startDateISO: '2025-07-19T00:00:00Z'
  };

  /* ---------- Utilities ---------- */
  const U = {
    elt(tag, attrs = {}, ...children) {
      const el = document.createElement(tag);
      for (const k in attrs) {
        if (k === 'style' && typeof attrs[k] === 'object') Object.assign(el.style, attrs[k]);
        else if (k === 'html') el.innerHTML = attrs[k];
        else if (k === 'dataset' && typeof attrs[k] === 'object') Object.assign(el.dataset, attrs[k]);
        else if (k.startsWith('on') && typeof attrs[k] === 'function') el.addEventListener(k.slice(2), attrs[k]);
        else el.setAttribute(k, attrs[k]);
      }
      for (const c of children) if (c) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      return el;
    },
    rand(min, max) { return Math.random() * (max - min) + min; },
    clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
    nowISO() { return new Date().toISOString(); },
    daysTogetherText() {
      try {
        const s = new Date(CONFIG.startDateISO);
        const now = new Date();
        const days = Math.floor((now - s) / (1000 * 60 * 60 * 24));
        const hours = Math.floor((now - s) / (1000 * 60 * 60));
        return `${days} days (${hours} hours) together`;
      } catch (e) { return ''; }
    },
    log(...args) { try { console.log('[Anniv]', ...args); } catch (e) { } }
  };

  const PREFERS_REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Styles ---------- */
  function injectStyles() {
    const css = `
:root{--green:#dff7ea;--teal:#7bdff6}
*{box-sizing:border-box}html,body{height:100%;margin:0;font-family:Inter,system-ui,Roboto,Arial;background:linear-gradient(180deg,#f6fffb,#eefafc);color:#062126}
.anniv-bg{position:fixed;inset:0;background-size:cover;background-position:center;transition:opacity .8s;z-index:0}
#anniv-root{position:relative;z-index:10;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:18px}
.card{max-width:920px;width:100%;border-radius:14px;background:rgba(255,255,255,0.96);padding:20px;box-shadow:0 12px 40px rgba(0,0,0,0.06)}
.title{font-size:28px;margin:0 0 10px 0;font-weight:800}
.para{white-space:pre-wrap;line-height:1.6;padding:16px;border-radius:12px;background:linear-gradient(180deg,var(--green),#b8f1d6);color:#043;position:relative;overflow:hidden}
.controls{display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap}
.btn{padding:10px 14px;border-radius:12px;border:0;background:linear-gradient(90deg,var(--green),var(--teal));color:#022;cursor:pointer;font-weight:700}
.btn.secondary{background:#fff;border:1px solid rgba(0,0,0,0.06)}
.small{font-size:13px;color:#445}
.modal{position:fixed;inset:0;background:rgba(0,0,0,0.34);display:flex;align-items:center;justify-content:center;z-index:40}
.modal .content{background:#fff;padding:16px;border-radius:10px;max-width:920px;width:92vw;max-height:86vh;overflow:auto;position:relative}
.closeX{position:absolute;right:10px;top:8px;border:0;background:#fff;padding:6px;border-radius:8px}
.ring{position:fixed;width:88px;height:88px;border-radius:50%;border:8px solid gold;display:grid;place-items:center;z-index:60;box-shadow:0 12px 30px rgba(0,0,0,0.2);cursor:pointer;background:radial-gradient(circle at 35% 35%, rgba(255,250,200,0.95), rgba(255,240,180,0.6));touch-action:none}
@media(max-width:520px){.title{font-size:22px}.para{font-size:15px}}`;
    const s = U.elt('style', {}, css);
    document.head.appendChild(s);
  }

  /* ---------- Audio Manager (safe) ---------- */
  const AudioMgr = (() => {
    const aud = {};
    function safe(src) {
      try { if (!src) return null; const a = new Audio(src); a.preload = 'auto'; return a; } catch (e) { return null; }
    }
    aud.music = safe(CONFIG.audios.music);
    aud.click = safe(CONFIG.audios.click);
    aud.ring = safe(CONFIG.audios.ring);
    aud.yay = safe(CONFIG.audios.yay);
    aud.interactions = safe(CONFIG.audios.interactions);
    aud.voice = safe(CONFIG.audios.voice);

    function attemptAutoplay() {
      if (!aud.music) return;
      aud.music.loop = true; aud.music.volume = 0.18;
      aud.music.play().catch(() => {
        const resume = () => { try { aud.music.play().catch(() => { }); } catch (e) { } window.removeEventListener('pointerdown', resume); window.removeEventListener('touchstart', resume); };
        window.addEventListener('pointerdown', resume, { once: true }); window.addEventListener('touchstart', resume, { once: true });
      });
    }

    // play click on UI clicks: handled centrally below via delegated listener
    return {
      aud,
      attemptAutoplay,
      play(name) { try { if (aud[name]) { aud[name].currentTime = 0; aud[name].play().catch(() => { }); } } catch (e) { } },
      pause(name) { try { if (aud[name]) aud[name].pause(); } catch (e) { } },
      setVolume(name, v) { try { if (aud[name]) aud[name].volume = v; } catch (e) { } },
      isAvailable(name) { return !!aud[name]; }
    };
  })();

  /* ---------- Existence check & fallbacks ---------- */
  function existsImage(src, timeout = 1400) {
    if (!src) return Promise.resolve(false);
    return new Promise(resolve => {
      let done = false;
      const img = new Image();
      const t = setTimeout(() => { if (!done) { done = true; resolve(false); } }, timeout);
      img.onload = () => { if (done) return; done = true; clearTimeout(t); resolve(true); };
      img.onerror = () => { if (done) return; done = true; clearTimeout(t); resolve(false); };
      img.src = src;
    });
  }

  function makeHeartsBackground(w = 1200, h = 800, count = 160) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#e9fff6'); g.addColorStop(1, '#b8f1d6'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    function drawHeart(x, y, s, color) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.beginPath(); ctx.moveTo(0, -6); ctx.bezierCurveTo(-6, -18, -22, -12, -22, -2); ctx.bezierCurveTo(-22, 10, -8, 20, 0, 30); ctx.bezierCurveTo(8, 20, 22, 10, 22, -2); ctx.bezierCurveTo(22, -12, 6, -18, 0, -6); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore(); }
    for (let i = 0; i < count; i++) { drawHeart(Math.random() * w, Math.random() * h, 0.4 + Math.random() * 0.9, Math.random() > 0.6 ? `rgba(34,128,92,${0.08 + Math.random() * 0.3})` : `rgba(119,201,166,${0.06 + Math.random() * 0.25})`); }
    ctx.globalAlpha = 0.04; for (let i = 0; i < 1200; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    return c.toDataURL('image/png');
  }

  /* ---------- UI Manager (single active UI) ---------- */
  const UI = (() => {
    function clear() { document.querySelectorAll('[data-ui]').forEach(e => e.remove()); }
    function show(name, el) { clear(); if (el) { el.setAttribute('data-ui', name); document.body.appendChild(el); } }
    function remove(name) { if (name) document.querySelectorAll('[data-ui="' + name + '"]').forEach(e => e.remove()); else clear(); }
    return { clear, show, remove };
  })();

  /* ---------- Confetti (small) ---------- */
  function startConfetti(ms = 2500) {
    if (PREFERS_REDUCED_MOTION || !CONFIG.allowConfetti) return;
    const canvas = document.createElement('canvas'); canvas.style.position = 'fixed'; canvas.style.left = '0'; canvas.style.top = '0'; canvas.style.pointerEvents = 'none'; canvas.style.zIndex = 9999;
    document.body.appendChild(canvas); const ctx = canvas.getContext('2d');
    let W = canvas.width = innerWidth, H = canvas.height = innerHeight; window.addEventListener('resize', () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; });
    const conf = []; for (let i = 0; i < 120; i++) conf.push({ x: Math.random() * W, y: Math.random() * -H * 0.6, vx: Math.random() * 8 - 4, vy: Math.random() * 6 + 2, r: Math.random() * 8 + 6, col: ['#ff8aa6', '#ffd166', '#7ae7c7', '#8adeff'][Math.floor(Math.random() * 4)], rot: Math.random() * Math.PI * 2 });
    const start = performance.now();
    function frame(t) {
      ctx.clearRect(0, 0, W, H); const elapsed = t - start; if (elapsed > ms) { canvas.remove(); return; }
      conf.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.rot += 0.05; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.fillRect(-p.r / 2, -p.r, p.r, p.r * 0.6); ctx.restore(); });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Keepsake generator ---------- */
  function generateKeepsake(element) {
    const pad = 22; const w = Math.min(window.innerWidth, 1200); const h = Math.min(window.innerHeight, 900);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#e8fff6'); g.addColorStop(1, '#c9f0dd'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#013'; ctx.font = '22px system-ui'; ctx.textBaseline = 'top';
    const text = element.innerText || element.textContent || ''; const lines = text.split('\n'); let y = pad;
    for (const line of lines) { const words = line.split(' '); let x = pad; for (const word of words) { const m = ctx.measureText(word + ' '); if (x + m.width > w - pad) { x = pad; y += 28; } ctx.fillText(word + ' ', x, y); x += m.width; } y += 28; if (y > h - pad) break; }
    return c.toDataURL('image/png');
  }

  /* ---------- Typing helper (skip supported) ---------- */
  function createTyper(container, text, speed = 18) {
    container.textContent = ''; const lines = text.split('\n'); const blocks = lines.map(() => U.elt('div')); blocks.forEach(b => container.appendChild(b));
    let li = 0, ci = 0, skipped = false;
    function step() {
      if (skipped) { blocks.forEach((b, i) => b.textContent = lines[i]); return; }
      if (li >= lines.length) return;
      const L = lines[li]; blocks[li].textContent = L.slice(0, ci + 1); ci++;
      if (ci >= L.length) { li++; ci = 0; setTimeout(step, speed * 5); } else setTimeout(step, speed);
    }
    step(); return { skip() { skipped = true; } };
  }

  /* ---------- Core: build initial UI and wire delegated actions ---------- */
  async function build() {
    injectStyles();
    AudioMgr.attemptAutoplay();

    // background setup (use generated fallback if missing)
    const has1 = await existsImage(CONFIG.images.bg1); const has2 = await existsImage(CONFIG.images.bg2);
    const src1 = has1 ? CONFIG.images.bg1 : makeHeartsBackground(1400, 900, 220);
    const src2 = has2 ? CONFIG.images.bg2 : makeHeartsBackground(1400, 900, 160);
    const bg1 = U.elt('div', { class: 'anniv-bg', style: { backgroundImage: `url(${src1})`, opacity: 1 } });
    const bg2 = U.elt('div', { class: 'anniv-bg', style: { backgroundImage: `url(${src2})`, opacity: 0 } });
    document.body.appendChild(bg1); document.body.appendChild(bg2);

    // root card
    const root = U.elt('div', { id: 'anniv-root' });
    const card = U.elt('div', { class: 'card', id: 'main-card', role: 'main', 'aria-label': 'Anniversary card' });
    root.appendChild(card);

    const title = U.elt('h1', { class: 'title' }, CONFIG.siteTitle);
    const meta = U.elt('div', { class: 'small' }, U.daysTogetherText());
    card.appendChild(title); card.appendChild(meta);

    const para = U.elt('div', { class: 'para', id: 'intro-para' });
    // add a lightweight heart pattern as inline background for the para
    para.style.backgroundImage = `url(${makeHeartsBackground(900, 300, 120)})`;
    card.appendChild(para);

    // scattered hearts in para
    for (let i = 0; i < 14; i++) { const h = U.elt('div', { style: { position: 'absolute', left: `${5 + Math.random() * 90}%`, top: `${6 + Math.random() * 86}%`, transform: `translate(-50%,-50%) rotate(${Math.floor(U.rand(-40, 40))}deg) scale(${0.8 + Math.random() * 0.9})`, pointerEvents: 'none' } }); h.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-8C-1 7 5 2 8 5c1.5 1.6 2.4 2.4 4 3.1 1.6-.7 2.5-1.5 4-3.1 3-3 9 2 5.5 8-2.5 3.5-9.5 8-9.5 8z" fill="rgba(255,255,255,0.95)"/></svg>'; para.appendChild(h); }

    // controls with data-action attributes for delegated handling
    const controls = U.elt('div', { class: 'controls' });
    const skipBtn = U.elt('button', { class: 'btn secondary', 'data-action': 'skip' }, 'Skip');
    const skipNote = U.elt('div', { class: 'small' }, 'heh no skipping baby — read it first');
    const adventureBtn = U.elt('button', { class: 'btn', 'data-action': 'adventure' }, 'Choose our adventure');
    const continueBtn = U.elt('button', { class: 'btn', 'data-action': 'continue' }, 'Continue');
    controls.appendChild(skipBtn); controls.appendChild(skipNote); controls.appendChild(adventureBtn); controls.appendChild(continueBtn);
    card.appendChild(controls);

    // typing into para
    const typer = createTyper(para, CONFIG.introText, CONFIG.typingSpeed);

    // voice control UI appended if voice exists will be handled by delegated action 'play-voice' if present

    document.body.appendChild(root);

    // Delegated click handler (robust)
    document.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-action]');
      // play click sound for all actions
      if (AudioMgr.aud.click) { try { AudioMgr.aud.click.currentTime = 0; AudioMgr.aud.click.play().catch(() => { }); } catch (e) { } }
      if (!btn) return;
      const action = btn.dataset.action;
      handleAction(action, btn.dataset);
    }, false);

    // Central action dispatcher
    function handleAction(action, dataset) {
      switch (action) {
        case 'skip':
          try { typer.skip(); skipNote.textContent = 'ok you peeked — but please enjoy ❤️'; } catch (e) { }
          break;
        case 'adventure':
          openAdventureModal(); break;
        case 'continue':
          try { typer.skip(); if (AudioMgr.aud.interactions) { try { AudioMgr.aud.interactions.currentTime = 0; AudioMgr.aud.interactions.play().catch(() => { }); } catch (e) { } } showProposalUI(bg1, bg2); } catch (e) { } break;
        case 'play-voice':
          if (AudioMgr.aud.voice) { AudioMgr.play('voice'); } break;
        case 'pause-voice':
          if (AudioMgr.aud.voice) { AudioMgr.pause('voice'); } break;
        // proposal actions
        case 'proposal-yes':
          UI.remove('proposal'); startRingChase(); break;
        case 'proposal-no':
          alert('I respect your choice. This is playful ❤️'); break;
        case 'close-proposal':
          UI.remove('proposal'); if (bg1) bg1.style.opacity = 1; if (bg2) bg2.style.opacity = 0; break;
        case 'start-games':
          UI.remove('success'); startGamesSequence(); break;
        case 'download-keepsake':
          const img = generateKeepsake(document.querySelector('#main-card') || document.body); const a = document.createElement('a'); a.href = img; a.download = 'keepsake.png'; document.body.appendChild(a); a.click(); a.remove(); break;
        default:
          U.log('Unhandled action', action); break;
      }
    }

    // Expose for debugging
    window._anniv = { CONFIG, AudioMgr, UI, typer };

    // Attach keyboard helper for proposal close etc (escape)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') UI.clear();
    });

    // Provide inline voice control if voice available
    if (AudioMgr.isAvailable('voice')) {
      const vc = U.elt('div', { style: { marginTop: '12px' } });
      const play = U.elt('button', { class: 'btn', 'data-action': 'play-voice' }, 'Play voice message');
      const pause = U.elt('button', { class: 'btn secondary', 'data-action': 'pause-voice' }, 'Pause voice');
      vc.appendChild(play); vc.appendChild(pause); card.appendChild(vc);
    }

    return { bg1, bg2, typer };
  }

  /* ---------- Modal / adventure / proposal implementations remain but use data-action buttons ---------- */

  function openAdventureModal() {
    const modal = U.elt('div', { class: 'modal' });
    const content = U.elt('div', { class: 'content' });
    const close = U.elt('button', { class: 'closeX', 'data-action': 'close-adventure' }, '✕');
    content.appendChild(close);
    content.appendChild(U.elt('h3', {}, 'Our Little Adventure'));
    content.appendChild(U.elt('p', {}, 'Pick an adventure to imagine together.'));
    const list = U.elt('div', { style: { display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' } });
    ['Midnight Picnic', 'Playlist Marathon', 'Stargazing Call', 'Memory Walk'].forEach(opt => {
      const b = U.elt('button', { class: 'btn', 'data-action': 'adventure-choice', 'data-opt': opt }, opt);
      b.addEventListener('click', () => { alert('Imagine: ' + opt); UI.remove('adventure'); }); // small inline flow
      list.appendChild(b);
    });
    content.appendChild(list);
    modal.appendChild(content);
    UI.show('adventure', modal);
    // close wiring
    close.addEventListener('click', () => UI.remove('adventure'));
  }

  function showProposalUI(bg1, bg2) {
    UI.clear();
    if (bg1) bg1.style.opacity = 0; if (bg2) bg2.style.opacity = 1;
    const modal = U.elt('div', { class: 'modal' });
    const content = U.elt('div', { class: 'content' });
    content.appendChild(U.elt('h2', {}, CONFIG.proposalTitle));
    content.appendChild(U.elt('div', { class: 'para' }, CONFIG.proposalSubtitle));
    const row = U.elt('div', { style: { display: 'flex', gap: '10px', marginTop: '12px' } });
    const yes = U.elt('button', { class: 'btn', 'data-action': 'proposal-yes' }, 'YES!');
    const no = U.elt('button', { class: 'btn secondary', 'data-action': 'proposal-no' }, 'NO!');
    const close = U.elt('button', { class: 'closeX', 'data-action': 'close-proposal' }, '✕');
    row.appendChild(yes); row.appendChild(no); content.appendChild(row); content.appendChild(close); modal.appendChild(content);
    UI.show('proposal', modal);

    // NO dodge: pointermove on modal to move the NO button away
    modal.addEventListener('pointermove', (ev) => {
      try {
        const rect = no.getBoundingClientRect();
        const dx = ev.clientX - (rect.left + rect.width / 2), dy = ev.clientY - (rect.top + rect.height / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < 140 && Math.random() > 0.25) {
          no.style.position = 'fixed'; no.style.left = Math.max(8, Math.floor(U.rand(8, window.innerWidth - rect.width - 16))) + 'px';
          no.style.top = Math.max(80, Math.floor(U.rand(80, window.innerHeight - rect.height - 20))) + 'px';
          if (AudioMgr.isAvailable('interactions')) AudioMgr.play('interactions');
        }
      } catch (e) { U.log('no dodge error', e); }
    });
  }

  /* ---------- Ring chase (data-ui ring) ---------- */
  function startRingChase() {
    UI.clear();
    if (AudioMgr.isAvailable('ring')) AudioMgr.play('ring');
    if (AudioMgr.isAvailable('music')) AudioMgr.setVolume('music', 0.06);

    const ring = U.elt('div', { class: 'ring', 'data-ui': 'ring' });
    document.body.appendChild(ring);

    let x = U.rand(80, window.innerWidth - 160), y = U.rand(80, window.innerHeight - 220);
    ring.style.left = x + 'px'; ring.style.top = y + 'px';
    let vx = U.rand(-CONFIG.ring.initialSpeed, CONFIG.ring.initialSpeed), vy = U.rand(-CONFIG.ring.initialSpeed, CONFIG.ring.initialSpeed);
    const friction = 0.994; const speedLimit = CONFIG.ring.maxSpeed; let running = true;

    function step() {
      if (!running) return;
      x += vx; y += vy;
      if (x < 6) { x = 6; vx = Math.abs(vx) + U.rand(0, 2); }
      if (x + 96 > window.innerWidth - 6) { x = window.innerWidth - 102; vx = -Math.abs(vx) - U.rand(0, 2); }
      if (y < 6) { y = 6; vy = Math.abs(vy) + U.rand(0, 2); }
      if (y + 96 > window.innerHeight - 6) { y = window.innerHeight - 102; vy = -Math.abs(vy) - U.rand(0, 2); }
      if (Math.random() < 0.07) { vx += U.rand(-3, 3); vy += U.rand(-3, 3); }
      const sp = Math.hypot(vx, vy); if (sp > speedLimit) { vx *= 0.96; vy *= 0.96; }
      vx *= friction; vy *= friction;
      ring.style.left = x + 'px'; ring.style.top = y + 'px';
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    function caught() {
      if (!running) return; running = false;
      if (AudioMgr.isAvailable('ring')) AudioMgr.pause('ring'); if (AudioMgr.isAvailable('yay')) AudioMgr.play('yay');
      if (AudioMgr.isAvailable('music')) { const target = 0.18; const iv = setInterval(() => { try { AudioMgr.setVolume('music', Math.min(target, (AudioMgr.aud.music && AudioMgr.aud.music.volume) || target)); } catch (e) { clearInterval(iv); } }, 120); setTimeout(() => clearInterval(iv), 2000); }
      ring.style.transition = 'transform 360ms ease, opacity 320ms ease'; ring.style.transform = 'scale(0.5) rotate(90deg)'; ring.style.opacity = '0';
      setTimeout(() => ring.remove(), 380);
      if (CONFIG.allowConfetti) startConfetti(2200);
      setTimeout(() => { showSuccessModal(); }, 700);
    }

    ring.addEventListener('click', caught); ring.addEventListener('touchstart', (e) => { e.preventDefault(); caught(); });
    setTimeout(() => { if (running) { running = false; try { ring.remove(); } catch (e) { } alert('Ring flew away — try again!'); } }, CONFIG.ring.timeout);
  }

  function showSuccessModal() {
    UI.clear();
    const modal = U.elt('div', { class: 'modal' });
    const content = U.elt('div', { class: 'content' });
    content.appendChild(U.elt('h2', {}, '💍 You said YES!'));
    content.appendChild(U.elt('div', {}, CONFIG.successText));
    content.appendChild(U.elt('div', {}, "Okay okay how about this — why don't you enjoy a mini game here? It's romantical and full of memories."));
    const play = U.elt('button', { class: 'btn', 'data-action': 'start-games' }, "Let's play!!");
    content.appendChild(play);
    modal.appendChild(content);
    UI.show('success', modal);
  }

  /* ---------- Games sequence ---------- */
  function startGamesSequence() {
    const compliments = ['You light up my phone and my life.', 'You have the kindest laugh.', 'Being with you feels like home.', 'You are my favorite notification.', 'Your courage inspires me.'];
    showBalloonsGame(() => showMemoryMatchGame(compliments, () => showFinalMessage()));
  }

  function showBalloonsGame(onDone) {
    UI.clear();
    const modal = U.elt('div', { class: 'modal' });
    const content = U.elt('div', { class: 'content' });
    content.appendChild(U.elt('h3', {}, 'Balloons of Memories'));
    content.appendChild(U.elt('p', {}, 'Pop the balloons to reveal memories. Pop ' + CONFIG.minigames.balloonsToPop + ' to finish.'));
    const stage = U.elt('div', { style: { height: '55vh', position: 'relative', overflow: 'hidden', marginTop: '12px', borderRadius: '10px', background: 'linear-gradient(180deg,#fff,#f7fffb)' } });
    content.appendChild(stage); modal.appendChild(content); UI.show('game-balloons', modal);

    const memories = ['That rainy picnic where we danced in puddles.', 'The late night we laughed until we cried.', 'Your tiny notes that make everything better.', 'When you sent me that silly photo unexpectedly.', 'The first time we said "goodnight" and meant forever.'];
    let popped = 0; let interval = setInterval(spawn, 650);

    function spawn() {
      const b = U.elt('button', { class: 'btn' });
      Object.assign(b.style, { width: '72px', height: '92px', borderRadius: '50%', position: 'absolute', bottom: '-120px', left: U.rand(6, 86) + '%', border: 'none', cursor: 'pointer', background: 'linear-gradient(180deg, rgba(255,220,240,0.95), rgba(255,180,220,0.95))' });
      stage.appendChild(b);
      const dur = U.rand(4200, 8800);
      const anim = b.animate([{ transform: 'translateY(0)' }, { transform: `translateY(-${stage.clientHeight + 140}px)` }], { duration: dur, easing: 'linear' });
      const tid = setTimeout(() => { if (b.parentNode) b.remove(); }, dur + 300);
      b.addEventListener('click', () => { clearTimeout(tid); popped++; b.remove(); alert(memories[Math.floor(U.rand(0, memories.length))]); if (popped >= CONFIG.minigames.balloonsToPop) { clearInterval(interval); UI.remove('game-balloons'); onDone && onDone(); } });
    }
    const mo = new MutationObserver(() => { if (!document.body.contains(modal)) { clearInterval(interval); mo.disconnect(); } });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function showMemoryMatchGame(compliments, onDone) {
    UI.clear();
    const modal = U.elt('div', { class: 'modal' }); const content = U.elt('div', { class: 'content' }); content.appendChild(U.elt('h3', {}, 'Memory Match — find pairs')); content.appendChild(U.elt('p', {}, 'Flip cards and match pairs to reveal cute compliments.'));
    const grid = U.elt('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginTop: '12px' } }); content.appendChild(grid); modal.appendChild(content); UI.show('game-memory', modal);

    const emojis = ['🌟', '🌙', '🎵', '🍰', '🌸', '💌', '☕', '📷']; const deck = emojis.concat(emojis).sort(() => Math.random() - 0.5);
    let first = null, second = null, matched = 0, compIdx = 0;
    deck.forEach(sym => {
      const card = U.elt('button', { class: 'btn', style: { height: '74px', fontSize: '28px' } }, '');
      card.dataset.sym = sym;
      card.addEventListener('click', () => {
        if (card.classList.contains('matched') || card === first) return;
        card.textContent = sym; card.style.background = '#fff';
        if (!first) { first = card; } else {
          second = card;
          if (first.dataset.sym === second.dataset.sym) {
            first.classList.add('matched'); second.classList.add('matched'); matched += 2; if (compliments[compIdx]) { alert(compliments[compIdx]); compIdx++; } first = null; second = null; if (matched === deck.length) { UI.remove('game-memory'); onDone && onDone(); }
          } else { setTimeout(() => { first.textContent = ''; second.textContent = ''; first.style.background = ''; second.style.background = ''; first = null; second = null; }, 700); }
        }
      });
      grid.appendChild(card);
    });
  }

  function showFinalMessage() {
    UI.clear();
    const modal = U.elt('div', { class: 'modal' }); const content = U.elt('div', { class: 'content' });
    content.appendChild(U.elt('h2', {}, "I'm ready to spend all of my life with you")); content.appendChild(U.elt('p', {}, "You've made ordinary days extraordinary, and I'd love to keep making memories with you. Here are a few more things I adore about you:"));
    const ul = U.elt('ul'); ['Your laugh', 'The way you care', 'Your courage', 'Your kindness', 'The little rituals we make together'].forEach(i => ul.appendChild(U.elt('li', {}, i))); content.appendChild(ul);
    content.appendChild(U.elt('p', {}, 'I love you ❤️'));
    const save = U.elt('button', { class: 'btn', 'data-action': 'download-keepsake' }, 'Download keepsake');
    content.appendChild(save); modal.appendChild(content); UI.show('final', modal);
  }

  /* ---------- Keepsake generator uses same function as before ---------- */
  function generateKeepsake(element) {
    const pad = 22; const w = Math.min(window.innerWidth, 1200); const h = Math.min(window.innerHeight, 900);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#e8fff6'); g.addColorStop(1, '#c9f0dd'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#013'; ctx.font = '22px system-ui'; ctx.textBaseline = 'top';
    const text = element.innerText || element.textContent || ''; const lines = text.split('\n'); let y = pad;
    for (const line of lines) { const words = line.split(' '); let x = pad; for (const word of words) { const m = ctx.measureText(word + ' '); if (x + m.width > w - pad) { x = pad; y += 28; } ctx.fillText(word + ' ', x, y); x += m.width; } y += 28; if (y > h - pad) break; }
    return c.toDataURL('image/png');
  }

  /* ---------- Init ---------- */
  async function init() {
    try {
      injectStyles();
      U.log('init start');
      await AudioMgr.attemptAutoplay?.(); // attempt autoplay
      const { bg1, bg2, typer } = await build();
      window._anniv = { CONFIG, AudioMgr, UI, typer };
      U.log('ready');
    } catch (e) {
      U.log('init error', e);
      document.body.innerHTML = '<div style="padding:20px;font-family:system-ui;">An unexpected error happened while loading the anniversary site. Please refresh. — Ned</div>';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
