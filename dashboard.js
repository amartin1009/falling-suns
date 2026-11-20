/* FALLING SUNS — car-dashboard UI: gauges, turn signals, radio (Spotify). */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);

  // ---------- gauges ----------
  function buildGauge(svg, { max, major, minor, labelEvery, color, redFrom, unit }) {
    const cx = 100, cy = 100, r = 84, a0 = -225, a1 = 45; // sweep 270°
    const ang = v => (a0 + (a1 - a0) * (v / max)) * Math.PI / 180;
    const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.appendChild(e); return e; };
    for (let v = 0; v <= max + 1e-9; v += minor) {
      const isMaj = Math.abs(v / major - Math.round(v / major)) < 1e-6, a = ang(v);
      const r0 = isMaj ? r - 14 : r - 7;
      el('line', { x1: cx + Math.cos(a) * r0, y1: cy + Math.sin(a) * r0, x2: cx + Math.cos(a) * r, y2: cy + Math.sin(a) * r,
        stroke: redFrom != null && v >= redFrom ? '#ff2a1a' : color, 'stroke-width': isMaj ? 3 : 1.4, 'stroke-linecap': 'round', class: 'tick' });
      if (isMaj && Math.abs(v / labelEvery - Math.round(v / labelEvery)) < 1e-6) {
        const t = el('text', { x: cx + Math.cos(a) * (r - 27), y: cy + Math.sin(a) * (r - 27) + 4, 'text-anchor': 'middle', class: 'glabel', fill: redFrom != null && v >= redFrom ? '#ff2a1a' : color });
        t.textContent = Math.round(v);
      }
    }
    const u = el('text', { x: cx, y: cy + 36, 'text-anchor': 'middle', class: 'gunit', fill: color }); u.textContent = unit;
    const needle = el('line', { x1: cx, y1: cy, x2: cx, y2: cy - (r - 10), class: 'needle' });
    el('circle', { cx, cy, r: 6, class: 'hub' });
    return v => needle.setAttribute('transform', `rotate(${(a0 + (a1 - a0) * Math.min(1, Math.max(0, v / max))) + 90} ${cx} ${cy})`);
  }

  const setSpeed = buildGauge($('speedo'), { max: 140, major: 20, minor: 5, labelEvery: 20, color: '#ff3d8b', unit: 'MPH' });
  const setRpm = buildGauge($('tacho'), { max: 8, major: 1, minor: 0.25, labelEvery: 1, color: '#ff3d8b', redFrom: 6.5, unit: 'RPM ×1000' });

  // speed follows the deck; rpm idles and revs on every slide change
  let speed = 0, targetSpeed = 0, rpm = 0.9, rev = 0;
  window.dashSetSlide = (i, n) => {
    targetSpeed = n > 1 ? 10 + (i / (n - 1)) * 110 : 0;
    rev = 3.6;
    $('odo').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
  };
  (function tick(t) {
    speed += (targetSpeed - speed) * 0.06;
    rev *= 0.94;
    rpm = 0.85 + Math.sin(t / 180) * 0.04 + Math.random() * 0.03 + rev * (targetSpeed / 120 + 0.4);
    setSpeed(speed); setRpm(rpm);
    requestAnimationFrame(tick);
  })(0);

  // ---------- turn signals (deck prev/next) ----------
  function blink(btn) { btn.classList.remove('blink'); void btn.offsetWidth; btn.classList.add('blink'); }
  $('sigL').onclick = () => { blink($('sigL')); document.getElementById('prev').click(); };
  $('sigR').onclick = () => { blink($('sigR')); document.getElementById('next').click(); };
  document.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') blink($('sigL')); if (e.key === 'ArrowRight') blink($('sigR')); });

  // ---------- radio (Spotify iFrame API) ----------
  let ctrl = null, api = null, wantPlay = false;
  const playBtn = $('radioPlay');
  function setPlaying(on) {
    playBtn.classList.toggle('on', on); playBtn.setAttribute('aria-pressed', on);
    $('radioPlayLbl').textContent = on ? 'PAUSE' : 'PLAY';
    document.body.classList.toggle('music-on', on);
  }
  function mount() {
    if (!api || ctrl || !window.SPOTIFY_TRACK) return;
    api.createController($('spEmbed'), { uri: 'spotify:track:' + window.SPOTIFY_TRACK, width: '100%', height: 80 }, c => {
      ctrl = c;
      c.addListener('playback_update', e => setPlaying(!e.data.isPaused));
      c.addListener('ready', () => { $('radio').classList.add('ready'); if (wantPlay) c.play(); });
    });
  }
  window.onSpotifyIframeApiReady = API => { api = API; mount(); };
  window.dashUnlocked = () => {
    if (!window.SPOTIFY_TRACK || document.getElementById('spapi')) return;
    const s = document.createElement('script'); s.id = 'spapi'; s.async = true;
    s.src = 'https://open.spotify.com/embed/iframe-api/v1'; document.body.appendChild(s);
  };
  playBtn.onclick = () => {
    if (ctrl) ctrl.togglePlay();
    else { wantPlay = true; $('radioLcd').classList.add('tuning'); }
  };

  // ---------- switches ----------
  $('swFull').onclick = () => document.getElementById('fsBtn').click();
  $('swContact').onclick = () => document.querySelector('footer').scrollIntoView({ behavior: 'smooth' });
})();
