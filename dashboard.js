/* FALLING SUNS — dashboard: head unit (Spotify), slide nav, switches. */
(function () {
  const $ = id => document.getElementById(id);

  // slide counter on the head unit
  window.dashSetSlide = (i, n) => { $('huSlide').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0'); };

  // nav
  $('navL').onclick = () => document.getElementById('prev').click();
  $('navR').onclick = () => document.getElementById('next').click();

  // Spotify iFrame API
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

  // switches
  $('swFull').onclick = () => document.getElementById('fsBtn').click();
  $('swContact').onclick = () => document.querySelector('footer').scrollIntoView({ behavior: 'smooth' });
})();
