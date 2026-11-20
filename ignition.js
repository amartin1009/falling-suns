/* FALLING SUNS — ignition: the cursor is a set of keys. Click the ignition, the key flies in,
   turns to START, the car starts (music + gauges + deck), and the ignition docks in the dash.
   In the dash, turning the key ON/ACC plays/stops the music. Also wires the radio buttons. */
(function () {
  const $ = id => document.getElementById(id);
  const POS = { LOCK: -50, ACC: -17, ON: 17, START: 50 };   // key angles (deg)

  // ---------- build an ignition switch (cylinder + key) inside a button ----------
  function cylinderSVG(id) {
    const lab = (t, a, red) => {
      const r = 72, rad = (a - 90) * Math.PI / 180;
      return `<text x="${100 + Math.cos(rad) * r}" y="${100 + Math.sin(rad) * r + 4}" text-anchor="middle" class="ig-lab${red ? ' red' : ''}">${t}</text>`;
    };
    const tick = a => { const rad = (a - 90) * Math.PI / 180; return `<line x1="${100 + Math.cos(rad) * 58}" y1="${100 + Math.sin(rad) * 58}" x2="${100 + Math.cos(rad) * 63}" y2="${100 + Math.sin(rad) * 63}" stroke="#ddd" stroke-width="2"/>`; };
    return `<svg class="cyl" viewBox="0 0 200 200" aria-hidden="true"><defs>
      <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0f0f0"/><stop offset=".35" stop-color="#8a8a8a"/><stop offset=".6" stop-color="#d6d6d6"/><stop offset="1" stop-color="#3f3f3f"/></linearGradient>
      <radialGradient id="${id}c" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#f4f4f4"/><stop offset=".45" stop-color="#9a9a9a"/><stop offset="1" stop-color="#2d2d2d"/></radialGradient>
      <radialGradient id="${id}f" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#1c1c1c"/><stop offset="1" stop-color="#050505"/></radialGradient></defs>
      <circle cx="100" cy="100" r="97" fill="url(#${id}b)"/>
      <circle cx="100" cy="100" r="88" fill="url(#${id}f)" stroke="#000" stroke-width="2"/>
      ${tick(POS.LOCK)}${tick(POS.ACC)}${tick(POS.ON)}${tick(POS.START)}
      ${lab('LOCK', POS.LOCK)}${lab('ACC', POS.ACC)}${lab('ON', POS.ON)}${lab('START', POS.START, true)}
      <circle cx="100" cy="100" r="44" fill="url(#${id}c)" stroke="#111" stroke-width="2"/>
      <circle cx="100" cy="100" r="36" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1"/>
      <rect x="96" y="76" width="8" height="48" rx="3" fill="#050505"/>
      <circle cx="100" cy="10" r="3.2" class="ig-led"/>
    </svg>`;
  }
  function keySVG(id) {   // front view of a key seated in the cylinder (rotates around the center)
    return `<svg class="key" viewBox="0 0 200 200" aria-hidden="true"><defs>
      <linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050505"/><stop offset=".35" stop-color="#2e2e2e"/><stop offset=".6" stop-color="#151515"/><stop offset="1" stop-color="#000"/></linearGradient>
      <linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6f6f6f"/><stop offset=".5" stop-color="#eaeaea"/><stop offset="1" stop-color="#6a6a6a"/></linearGradient></defs>
      <ellipse cx="100" cy="100" rx="14" ry="14" fill="url(#${id}m)" stroke="#333"/>
      <path d="M84 100 C84 60 88 34 100 30 C112 34 116 60 116 100 C116 140 112 166 100 170 C88 166 84 140 84 100Z" fill="url(#${id}h)" stroke="#000" stroke-width="1.5"/>
      <path d="M92 52 C92 44 96 38 100 37" stroke="rgba(255,255,255,.25)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="100" cy="148" r="5" fill="#0a0a0a" stroke="#444"/>
    </svg>`;
  }
  function build(btn, id) {
    btn.insertAdjacentHTML('beforeend', cylinderSVG(id) + '<span class="keywrap">' + keySVG(id) + '</span>');
    return btn.querySelector('.keywrap');
  }
  const big = $('startBtn'), mini = $('startBtnDash');
  const bigKey = build(big, 'igA'), miniKey = build(mini, 'igB');
  const turn = (k, deg, ms = 380) => { k.style.transition = `transform ${ms}ms cubic-bezier(.4,0,.2,1)`; k.style.transform = `rotate(${deg}deg)`; };

  // ---------- start sequence ----------
  let started = false;
  function insertFrom(x, y, done) {
    const r = big.getBoundingClientRect();
    const fly = document.createElement('img');
    fly.src = 'media/keys.png'; fly.className = 'flykey';
    fly.style.left = x + 'px'; fly.style.top = y + 'px';
    document.body.appendChild(fly);
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    fly.animate([{ transform: 'translate(-4px,-1px) scale(1) rotate(0deg)', opacity: 1 },
                 { transform: `translate(${cx - x - 4}px,${cy - y - 1}px) scale(.8) rotate(-10deg)`, opacity: 1, offset: .8 },
                 { transform: `translate(${cx - x - 4}px,${cy - y - 1}px) scale(.6) rotate(-10deg)`, opacity: 0 }],
      { duration: 520, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }).onfinish = () => { fly.remove(); done(); };
  }
  function start(e) {
    if (started) return; started = true;
    document.body.classList.add('keying');
    window.dashMusic && window.dashMusic('start');        // inside the click so the browser allows playback
    const x = e && e.clientX ? e.clientX : innerWidth / 2, y = e && e.clientY ? e.clientY : innerHeight / 2;
    insertFrom(x, y, () => {
      big.classList.add('seated'); turn(bigKey, POS.LOCK, 0);
      requestAnimationFrame(() => {
        turn(bigKey, POS.START, 420);                       // crank
        setTimeout(() => {
          big.classList.add('lit'); turn(bigKey, POS.ON, 260); // spring back to ON
          document.body.classList.remove('parked'); document.body.classList.add('running');
          window.dashPower && window.dashPower(true);
          setTimeout(dock, 450);
        }, 520);
      });
    });
  }
  function dock() {
    const a = big.getBoundingClientRect(), b = mini.getBoundingClientRect();
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2), s = b.width / a.width;
    big.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx}px,${dy}px) scale(${s})` }],
      { duration: 900, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' })
      .onfinish = () => { mini.classList.add('seated', 'lit'); turn(miniKey, playingNow ? POS.ON : POS.ON, 0); document.body.classList.add('docked'); };
  }
  document.getElementById('ignition').addEventListener('click', start);   // click anywhere: the keys fly into the ignition

  // ---------- music state <-> key position ----------
  let playingNow = false;
  document.addEventListener('dash-music', e => {
    playingNow = e.detail;
    if (document.body.classList.contains('docked')) { turn(miniKey, playingNow ? POS.ON : POS.ACC); mini.classList.toggle('lit', playingNow); }
  });
  mini.addEventListener('click', () => {
    turn(miniKey, playingNow ? POS.ACC : POS.ON);
    window.dashMusic && window.dashMusic('toggle');
  });

  // ---------- radio buttons ----------
  const tap = b => { b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 140); };
  $('rbSeekL').onclick = e => { tap(e.currentTarget); document.getElementById('prev').click(); };
  $('rbSeekR').onclick = e => { tap(e.currentTarget); document.getElementById('next').click(); };
  $('rbPlay').onclick = e => { tap(e.currentTarget); window.dashMusic && window.dashMusic('toggle'); };
})();
