/* FALLING SUNS — music-video background edit.
   Cuts between the animated night drive and still photos with
   hard cuts, flash frames, slow push-ins, RGB-split jitter and letterbox. */
(function () {
  // ===== EDIT: photos to cut to (in media/bg/) =====
  const PHOTOS = ['mirror.jpg', 'redcar.jpg', 'fabrica.jpg', 'gas.jpg', 'pinkdash.jpg', 'car.jpg', 'rearview.jpg', 'tacos.jpg', 'redspeedo.jpg', 'pemex.jpg'];
  // seconds on the drive between photo bursts, and per photo
  const DRIVE_HOLD = [7, 11], PHOTO_HOLD = [2.2, 3.6], BURST = [1, 3];
  // ==================================================

  const bg = document.getElementById('bg');
  if (!bg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const stage = document.createElement('div'); stage.className = 'shots';
  const flash = document.createElement('div'); flash.className = 'flash';
  const bars = document.createElement('div'); bars.className = 'bars';
  bg.append(stage, flash, bars);

  const shots = PHOTOS.map(src => {
    const d = document.createElement('div'); d.className = 'shot';
    ['r', 'c', 'm'].forEach(k => { const l = document.createElement('i'); l.className = 'ch-' + k; l.style.backgroundImage = `url(media/bg/${src})`; d.appendChild(l); });
    stage.appendChild(d);
    const img = new Image(); img.src = `media/bg/${src}`; // preload
    return d;
  });

  const rand = (a, b) => a + Math.random() * (b - a);
  let last = -1, timer;
  const wait = s => new Promise(r => (timer = setTimeout(r, s * 1000)));

  function cut(el) {
    shots.forEach(s => s.classList.remove('on', 'glitch'));
    if (el) {
      el.style.setProperty('--ox', rand(20, 80) + '%');
      el.style.setProperty('--oy', rand(25, 70) + '%');
      el.style.setProperty('--dur', rand(4, 7) + 's');
      el.classList.remove('on'); void el.offsetWidth; // restart push-in
      el.classList.add('on', 'glitch');
      setTimeout(() => el.classList.remove('glitch'), 260);
    }
    // flash frame: mostly black, sometimes a red hit
    flash.className = 'flash ' + (Math.random() < 0.3 ? 'red' : 'black');
    setTimeout(() => (flash.className = 'flash'), Math.random() < 0.5 ? 70 : 120);
    bg.classList.toggle('photo', !!el);
  }

  async function run() {
    await wait(rand(4, 6));
    while (true) {
      const n = Math.round(rand(BURST[0], BURST[1]));
      bars.classList.toggle('on', Math.random() < 0.6);
      for (let k = 0; k < n; k++) {
        let i; do { i = Math.floor(Math.random() * shots.length); } while (i === last && shots.length > 1);
        last = i; cut(shots[i]);
        await wait(rand(PHOTO_HOLD[0], PHOTO_HOLD[1]));
      }
      cut(null); bars.classList.remove('on');
      await wait(rand(DRIVE_HOLD[0], DRIVE_HOLD[1]));
    }
  }
  run();
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else run(); });
})();
