/* FALLING SUNS — push-to-start: the button starts the music, powers the dash,
   reveals the deck, then drops into the dashboard as the music on/off switch. */
(function () {
  const $ = id => document.getElementById(id);
  const big = $('startBtn'), slot = $('startBtnDash');
  let started = false;

  function flyToDash() {
    const a = big.getBoundingClientRect(), b = slot.getBoundingClientRect();
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2), s = b.width / a.width;
    const anim = big.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(${dx}px,${dy}px) scale(${s})` }],
      { duration: 900, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' });
    anim.onfinish = () => { document.body.classList.add('docked'); };
  }

  function start() {
    if (started) return; started = true;
    big.classList.add('pressed');
    window.dashMusic && window.dashMusic('start');      // must run inside the click for autoplay
    setTimeout(() => {
      document.body.classList.remove('parked'); document.body.classList.add('running');
      window.dashPower && window.dashPower(true);
      requestAnimationFrame(flyToDash);
    }, 380);
  }
  big.addEventListener('click', start);
  slot.addEventListener('click', () => window.dashMusic && window.dashMusic('toggle'));
})();

/* radio buttons */
(function () {
  const $ = id => document.getElementById(id);
  const tap = b => { b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 140); };
  $('rbSeekL').onclick = e => { tap(e.currentTarget); document.getElementById('prev').click(); };
  $('rbSeekR').onclick = e => { tap(e.currentTarget); document.getElementById('next').click(); };
  $('rbPlay').onclick = e => { tap(e.currentTarget); window.dashMusic && window.dashMusic('toggle'); };
})();
