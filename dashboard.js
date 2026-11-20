/* FALLING SUNS — dashboard: realistic instrument cluster, head unit (Spotify), slide nav. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);

  // ---------- gauges: red backlit, motion-blurred (after the red speedometer reference) ----------
  function buildGauge(svg, { max, major, minor, labelEvery, unit, labelDiv = 1 }) {
    const id = svg.id, cx = 100, cy = 100, r = 84, a0 = -225, a1 = 45;
    const ang = v => (a0 + (a1 - a0) * (v / max)) * Math.PI / 180;
    const el = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
    const RED = '#ff2a18';
    const defs = el('defs', {});
    defs.innerHTML = `
      <radialGradient id="${id}-face" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#120303"/><stop offset=".75" stop-color="#060101"/><stop offset="1" stop-color="#000"/></radialGradient>
      <linearGradient id="${id}-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <filter id="${id}-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="${id}-ghost" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.2"/></filter>`;
    el('circle', { cx, cy, r: 99, fill: `url(#${id}-face)` });
    const p0 = ang(0), p1 = ang(max), rr = r + 7;
    const arc = `M${cx + Math.cos(p0) * rr} ${cy + Math.sin(p0) * rr} A${rr} ${rr} 0 1 1 ${cx + Math.cos(p1) * rr} ${cy + Math.sin(p1) * rr}`;
    const g = el('g', {});
    el('path', { d: arc, fill: 'none', stroke: RED, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);           // lit outer ring
    for (let v = 0; v <= max + 1e-9; v += minor) {
      const isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6, a = ang(v);
      const r0 = isMaj ? r - 12 : r - 5;
      el('line', { x1: cx + Math.cos(a) * r0, y1: cy + Math.sin(a) * r0, x2: cx + Math.cos(a) * (r + 2), y2: cy + Math.sin(a) * (r + 2), stroke: RED, 'stroke-width': isMaj ? 3 : 1.3 }, g);
      if (isMaj && Math.abs(v / labelEvery - Math.round(v / labelEvery)) < 1e-6) {
        const t = el('text', { x: cx + Math.cos(a) * (r - 29), y: cy + Math.sin(a) * (r - 29) + 5, 'text-anchor': 'middle', class: 'glabel', fill: RED }, g);
        t.textContent = Math.round(v / labelDiv);
      }
    }
    const u = el('text', { x: cx, y: cy + 27, 'text-anchor': 'middle', class: 'gunit' }, g); u.textContent = unit;
    // motion-blur ghost of the dial (double exposure), then the sharp glowing dial on top
    const ghost = g.cloneNode(true); ghost.setAttribute('filter', `url(#${id}-ghost)`); ghost.setAttribute('opacity', '.8'); ghost.setAttribute('transform', 'translate(5,-4)');
    svg.insertBefore(ghost, g); g.setAttribute('filter', `url(#${id}-glow)`);
    // needles: a blurred trailing needle that lags behind the sharp one
    const mk = (op, f) => { const n = el('g', { opacity: op }); if (f) n.setAttribute('filter', f);
      el('polygon', { points: `${cx - 4.5},${cy + 16} ${cx + 4.5},${cy + 16} ${cx + 1.6},${cy - (r - 4)} ${cx - 1.6},${cy - (r - 4)}`, fill: RED }, n); return n; };
    const trail = mk(.55, `url(#${id}-ghost)`), needle = mk(1, `url(#${id}-glow)`);
    el('circle', { cx, cy, r: 8, fill: '#0a0202', stroke: '#2a0805', 'stroke-width': 2 });
    el('ellipse', { cx, cy: 54, rx: 76, ry: 44, fill: `url(#${id}-glass)`, 'pointer-events': 'none' });
    const rot = v => (a0 + (a1 - a0) * Math.min(1, Math.max(0, v / max))) + 90;
    let lag = 0;
    return v => { lag += (v - lag) * 0.12; needle.setAttribute('transform', `rotate(${rot(v)} ${cx} ${cy})`); trail.setAttribute('transform', `rotate(${rot(lag)} ${cx} ${cy})`); };
  }

  const setSpeed = buildGauge($('speedo'), { max: 180, major: 20, minor: 10, labelEvery: 20, unit: 'km/h' });
  const setRpm = buildGauge($('tacho'), { max: 8, major: 1, minor: 0.25, labelEvery: 1, unit: 'RPM × 1000' });

  let speed = 0, targetSpeed = 0, rev = 0, power = false, sweepAt = 0, slideTarget = 0;
  window.dashPower = on => { power = on; if (on) { sweepAt = performance.now(); targetSpeed = slideTarget; } else targetSpeed = 0; };
  window.dashSetSlide = (i, n) => {
    slideTarget = n > 1 ? 10 + (i / (n - 1)) * 150 : 0;
    if (power) { targetSpeed = slideTarget; rev = 3.2; }
    const txt = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    $('odo').textContent = txt; $('huSlide').textContent = txt;
  };
  (function tick(t) {
    if (sweepAt && t - sweepAt < 1500) {                 // startup needle sweep
      const k = Math.sin(Math.PI * (t - sweepAt) / 1500);
      setSpeed(k * 180); setRpm(k * 8); speed = 0;
    } else {
      speed += (targetSpeed - speed) * 0.05;
      rev *= 0.95;
      const rpm = power ? 0.82 + Math.sin(t / 220) * 0.03 + Math.random() * 0.02 + rev * (targetSpeed / 160 + 0.35) : 0;
      setSpeed(speed); setRpm(rpm);
    }
    requestAnimationFrame(tick);
  })(0);

  // ---------- turn-signal telltales (deck prev/next) ----------
  function blink(btn) { btn.classList.remove('blink'); void btn.offsetWidth; btn.classList.add('blink'); }
  $('sigL').onclick = () => { blink($('sigL')); document.getElementById('prev').click(); };
  $('sigR').onclick = () => { blink($('sigR')); document.getElementById('next').click(); };
  document.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') blink($('sigL')); if (e.key === 'ArrowRight') blink($('sigR')); });

  // ---------- head unit: radio stations (YouTube audio), driven by the push-start button ----------
  const STATIONS = [
    { freq: '87.9',  id: 'ZhIWWecwhpg', start: 17, song: "KING'S BLVD 2", artist: 'NANA' },
    { freq: '94.5',  id: 'J7IMwop3RHs', start: 0,  song: 'CHILL BILL', artist: 'ROB $TONE FT. J.DAVIS & SPOOKS' },
    { freq: '101.7', id: '4xoJhE4KvEw', start: 0,  song: 'NO COCAINE', artist: 'SLIGHTLY STOOPID' },
  ];
  let st = 0, player = null, ready = false, pending = null, playing = false, everPlayed = false;
  const sep = ' &nbsp;·&nbsp; ';
  const lcdOn = () => { const S = STATIONS[st]; return `FM ${S.freq}${sep}NOW PLAYING${sep}${S.song}${sep}${S.artist}${sep}FALLING SUNS${sep}TIJUANA AFTER DARK${sep}`; };
  const lcdOff = () => `AUX${sep}READY${sep}PUSH START TO PLAY${sep}FM ${STATIONS[st].freq}${sep}`;
  function paint() {
    $('lcdText').innerHTML = playing ? lcdOn() : lcdOff();
    $('huSrc').textContent = playing ? 'FM ' + STATIONS[st].freq : 'AUX';
  }
  function setPlaying(on) {
    playing = on; if (on) everPlayed = true;
    document.dispatchEvent(new CustomEvent('dash-music', { detail: on }));
    document.body.classList.toggle('music-on', on);
    paint();
    if (on) $('spWrap').classList.remove('reveal');
  }
  setPlaying(false);
  function reveal() { $('spWrap').classList.add('reveal'); $('lcdText').innerHTML = "TAP ▶ ON THE PLAYER BELOW TO START THE MUSIC" + sep; }
  function run(cmd) {
    if (!ready) { pending = cmd; return; }
    if (cmd === 'start') { player.seekTo(STATIONS[st].start, true); player.playVideo(); }
    else if (playing) player.pauseVideo();
    else player.playVideo();
  }
  // a short burst of radio static between stations
  let actx = null;
  function hiss() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const len = actx.sampleRate * 0.35, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = actx.createBufferSource(), g = actx.createGain(), f = actx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = .6; g.gain.value = .12;
      src.buffer = buf; src.connect(f).connect(g).connect(actx.destination); src.start();
    } catch (e) {}
  }
  window.dashStation = dir => {
    st = (st + dir + STATIONS.length) % STATIONS.length;
    const S = STATIONS[st];
    $('huSrc').textContent = 'FM ' + S.freq;
    $('lcdText').innerHTML = `TUNING${sep}FM ${S.freq}${sep}`;
    if (!ready) return;
    if (playing || !everPlayed) { hiss(); player.loadVideoById({ videoId: S.id, startSeconds: S.start }); }
    else player.cueVideoById({ videoId: S.id, startSeconds: S.start });
    setTimeout(paint, 900);
  };
  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('ytPlayer', {
      width: 320, height: 180, videoId: STATIONS[st].id,
      playerVars: { start: STATIONS[st].start, controls: 1, playsinline: 1, rel: 0, modestbranding: 1, disablekb: 1 },
      events: {
        onReady: () => { ready = true; player.setVolume(85); if (pending) { run(pending); pending = null; } },
        onStateChange: e => {
          if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
          else if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
          else if (e.data === YT.PlayerState.ENDED) { player.seekTo(STATIONS[st].start, true); player.playVideo(); }  // loop this station
        },
        onError: () => reveal()
      }
    });
  };
  window.dashUnlocked = () => {
    if (document.getElementById('ytapi')) return;
    const s = document.createElement('script'); s.id = 'ytapi'; s.src = 'https://www.youtube.com/iframe_api'; document.body.appendChild(s);
  };
  window.dashMusic = cmd => {
    run(cmd);
    if (cmd === 'start') setTimeout(() => { if (!everPlayed) reveal(); }, 3000);
    else if (!everPlayed) setTimeout(() => { if (!everPlayed) reveal(); }, 1500);
  };
  if (!document.body.classList.contains('locked')) window.dashUnlocked();

  // ---------- switches ----------
  $('swFull').onclick = () => document.getElementById('fsBtn').click();
  $('swContact').onclick = () => document.querySelector('footer').scrollIntoView({ behavior: 'smooth' });
})();
