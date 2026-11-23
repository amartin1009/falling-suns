/* FALLING SUNS — background: real photos cut like a music video.
   Handheld drift + micro-shake, hard cuts, occasional flash frames,
   letterbox, and passing-streetlight sweeps so it feels like a moving car. */
(function () {
  // ===== EDIT: photos to cut between (in media/bg/) =====
  const PHOTOS = ['redcar.jpg', 'tunnel.jpg', 'fabrica.jpg', 'oxxo.jpg', 'dogs.jpg', 'hoop.jpg', 'mask.jpg', 'gas.jpg', 'luchador.jpg', 'rearview.jpg', 'flag.jpg', 'tacos.jpg', 'hand.jpg', 'pemex.jpg'];
  const HOLD = [3.6, 6.2];   // seconds per shot
  // ======================================================

  const bg = document.getElementById('bg');
  if (!bg) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stage = document.createElement('div'); stage.className = 'shots';
  const sweeps = document.createElement('div'); sweeps.className = 'sweeps';
  const flash = document.createElement('div'); flash.className = 'flash';
  const bars = document.createElement('div'); bars.className = 'bars';
  bg.append(stage, sweeps, flash, bars);

  const shots = PHOTOS.map(src => {
    const d = document.createElement('div'); d.className = 'shot';
    ['m', 'r', 'c'].forEach(k => { const l = document.createElement('i'); l.className = 'ch-' + k; l.style.backgroundImage = `url(media/bg/${src})`; d.appendChild(l); });
    stage.appendChild(d);
    new Image().src = `media/bg/${src}`;
    return d;
  });

  const rand = (a, b) => a + Math.random() * (b - a);
  let order = [], idx = 0, timer, timer2, running = false;
  const nextShot = () => {
    if (idx >= order.length) { order = shots.map((_, i) => i).sort(() => Math.random() - 0.5); idx = 0; }
    return shots[order[idx++]];
  };

  function cut(el, hard) {
    shots.forEach(s => s.classList.remove('on', 'glitch'));
    el.style.setProperty('--ox', rand(30, 70) + '%');
    el.style.setProperty('--oy', rand(30, 70) + '%');
    el.style.setProperty('--dx', rand(-2.5, 2.5) + '%');
    el.style.setProperty('--dy', rand(-1.5, 1.5) + '%');
    el.style.setProperty('--dur', rand(6, 9) + 's');
    void el.offsetWidth;
    el.classList.add('on');
    if (hard && Math.random() < 0.35) { el.classList.add('glitch'); setTimeout(() => el.classList.remove('glitch'), 120); }
    if (hard && Math.random() < 0.4) {
      flash.className = 'flash ' + (Math.random() < 0.25 ? 'red' : 'black');
      setTimeout(() => (flash.className = 'flash'), 60);
    }
  }

  // passing streetlights: soft light rolling across the frame
  const LIGHTS = ['rgba(255,150,70,.32)', 'rgba(255,120,60,.28)', 'rgba(120,255,190,.18)', 'rgba(255,60,40,.26)'];
  function sweep() {
    const s = document.createElement('i');
    s.style.setProperty('--c', LIGHTS[Math.floor(Math.random() * LIGHTS.length)]);
    s.style.setProperty('--t', rand(1.1, 2.0) + 's');
    s.style.setProperty('--y', rand(-10, 30) + '%');
    sweeps.appendChild(s);
    setTimeout(() => s.remove(), 2200);
    timer2 = setTimeout(sweep, rand(900, 2600));
  }

  async function run() {
    if (running) return; running = true;
    cut(nextShot(), false);
    if (reduce) return;
    sweep();
    while (running) {
      await new Promise(r => (timer = setTimeout(r, rand(HOLD[0], HOLD[1]) * 1000)));
      if (!running) break;
      bars.classList.toggle('on', Math.random() < 0.35);
      cut(nextShot(), true);
    }
  }
  run();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { running = false; clearTimeout(timer); clearTimeout(timer2); }
    else run();
  });
})();
