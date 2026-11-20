/* FALLING SUNS — dashboard: realistic instrument cluster, head unit (Spotify), slide nav. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);

  // ---------- realistic gauges ----------
  function buildGauge(svg, { max, major, minor, labelEvery, redFrom, unit, labelDiv = 1 }) {
    const id = svg.id, cx = 100, cy = 100, r = 86, a0 = -225, a1 = 45;
    const ang = v => (a0 + (a1 - a0) * (v / max)) * Math.PI / 180;
    const el = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
    const defs = el('defs', {});
    defs.innerHTML = `
      <radialGradient id="${id}-face" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#1b1416"/><stop offset=".7" stop-color="#0a0708"/><stop offset="1" stop-color="#030203"/></radialGradient>
      <radialGradient id="${id}-cap" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#8d8d8d"/><stop offset=".45" stop-color="#2c2c2c"/><stop offset="1" stop-color="#0c0c0c"/></radialGradient>
      <linearGradient id="${id}-needle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6a3d"/><stop offset=".5" stop-color="#ff2a12"/><stop offset="1" stop-color="#b31708"/></linearGradient>
      <linearGradient id="${id}-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <filter id="${id}-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
    el('circle', { cx, cy, r: 98, fill: `url(#${id}-face)` });
    el('circle', { cx, cy, r: 70, fill: 'none', stroke: 'rgba(255,70,40,.07)', 'stroke-width': 26 }); // backlight bloom
    if (redFrom != null) {
      const p0 = ang(redFrom), p1 = ang(max), rr = r - 3;
      el('path', { d: `M${cx + Math.cos(p0) * rr} ${cy + Math.sin(p0) * rr} A${rr} ${rr} 0 0 1 ${cx + Math.cos(p1) * rr} ${cy + Math.sin(p1) * rr}`, fill: 'none', stroke: '#d8241a', 'stroke-width': 6, opacity: .9, filter: `url(#${id}-glow)` });
    }
    const g = el('g', { filter: `url(#${id}-glow)` });
    for (let v = 0; v <= max + 1e-9; v += minor) {
      const isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6, a = ang(v), red = redFrom != null && v >= redFrom - 1e-9;
      const r0 = isMaj ? r - 13 : r - 6;
      el('line', { x1: cx + Math.cos(a) * r0, y1: cy + Math.sin(a) * r0, x2: cx + Math.cos(a) * r, y2: cy + Math.sin(a) * r,
        stroke: red ? '#ff4a3a' : '#f4e6df', 'stroke-width': isMaj ? 2.6 : 1.1 }, g);
      if (isMaj && Math.abs(v / labelEvery - Math.round(v / labelEvery)) < 1e-6) {
        const t = el('text', { x: cx + Math.cos(a) * (r - 26), y: cy + Math.sin(a) * (r - 26) + 5, 'text-anchor': 'middle', class: 'glabel', fill: red ? '#ff5a48' : '#f4e6df' }, g);
        t.textContent = Math.round(v / labelDiv);
      }
    }
    const u = el('text', { x: cx, y: cy + 27, 'text-anchor': 'middle', class: 'gunit' }); u.textContent = unit;
    const needle = el('g', {});
    el('polygon', { points: `${cx - 3.2},${cy + 14} ${cx + 3.2},${cy + 14} ${cx + 1.1},${cy - (r - 6)} ${cx - 1.1},${cy - (r - 6)}`, fill: `url(#${id}-needle)`, filter: `url(#${id}-glow)` }, needle);
    el('circle', { cx, cy, r: 9, fill: `url(#${id}-cap)`, stroke: '#000', 'stroke-width': 1 });
    el('ellipse', { cx, cy: 52, rx: 78, ry: 46, fill: `url(#${id}-glass)`, 'pointer-events': 'none' }); // glass glare
    return v => needle.setAttribute('transform', `rotate(${(a0 + (a1 - a0) * Math.min(1, Math.max(0, v / max))) + 90} ${cx} ${cy})`);
  }

  const setSpeed = buildGauge($('speedo'), { max: 140, major: 20, minor: 5, labelEvery: 20, unit: 'MPH' });
  const setRpm = buildGauge($('tacho'), { max: 8, major: 1, minor: 0.25, labelEvery: 1, redFrom: 6.5, unit: 'RPM × 1000' });

  let speed = 0, targetSpeed = 0, rev = 0;
  window.dashSetSlide = (i, n) => {
    targetSpeed = n > 1 ? 8 + (i / (n - 1)) * 112 : 0;
    rev = 3.2;
    const txt = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    $('odo').textContent = txt; $('huSlide').textContent = txt;
  };
  (function tick(t) {
    speed += (targetSpeed - speed) * 0.05;
    rev *= 0.95;
    const rpm = 0.82 + Math.sin(t / 220) * 0.03 + Math.random() * 0.02 + rev * (targetSpeed / 120 + 0.35);
    setSpeed(speed); setRpm(rpm);
    requestAnimationFrame(tick);
  })(0);

  // ---------- turn-signal telltales (deck prev/next) ----------
  function blink(btn) { btn.classList.remove('blink'); void btn.offsetWidth; btn.classList.add('blink'); }
  $('sigL').onclick = () => { blink($('sigL')); document.getElementById('prev').click(); };
  $('sigR').onclick = () => { blink($('sigR')); document.getElementById('next').click(); };
  document.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') blink($('sigL')); if (e.key === 'ArrowRight') blink($('sigR')); });

  // ---------- head unit (Spotify iFrame API) ----------
  let ctrl = null, api = null, wantPlay = false;
  const playBtn = $('radioPlay');
  function setPlaying(on) {
    playBtn.classList.toggle('on', on); playBtn.setAttribute('aria-pressed', on);
    $('radioPlayLbl').textContent = on ? 'Pause' : 'Play';
    document.body.classList.toggle('music-on', on);
  }
  function mount() {
    if (!api || ctrl || !window.SPOTIFY_TRACK) return;
    api.createController($('spEmbed'), { uri: 'spotify:track:' + window.SPOTIFY_TRACK, width: '100%', height: 80 }, c => {
      ctrl = c;
      c.addListener('playback_update', e => setPlaying(!e.data.isPaused));
      c.addListener('ready', () => { if (wantPlay) c.play(); });
    });
  }
  window.onSpotifyIframeApiReady = API => { api = API; mount(); };
  window.dashUnlocked = () => {
    if (!window.SPOTIFY_TRACK || document.getElementById('spapi')) return;
    const s = document.createElement('script'); s.id = 'spapi'; s.async = true;
    s.src = 'https://open.spotify.com/embed/iframe-api/v1'; document.body.appendChild(s);
  };
  playBtn.onclick = () => { if (ctrl) ctrl.togglePlay(); else wantPlay = true; };
  if (!document.body.classList.contains('locked')) window.dashUnlocked();

  // ---------- switches ----------
  $('swFull').onclick = () => document.getElementById('fsBtn').click();
  $('swContact').onclick = () => document.querySelector('footer').scrollIntoView({ behavior: 'smooth' });
})();
