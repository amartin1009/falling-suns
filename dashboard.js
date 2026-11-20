/* FALLING SUNS — dashboard: realistic instrument cluster, head unit (Spotify), slide nav. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);

  window.dashSetSlide = () => {};
  window.dashPower = () => {};

  // ---------- head unit: radio stations (YouTube audio), driven by the push-start button ----------
  const STATIONS = [
    { freq: '87.9',  id: 'ZhIWWecwhpg', start: 17, song: "KING'S BLVD 2", artist: 'NANA' },
    { freq: '94.5',  id: 'J7IMwop3RHs', start: 18, song: 'CHILL BILL', artist: 'ROB $TONE FT. J.DAVIS & SPOOKS' },
    { freq: '101.7', id: '4xoJhE4KvEw', start: 0,  song: 'NO COCAINE', artist: 'SLIGHTLY STOOPID' },
  ];
  let st = 0, player = null, ready = false, pending = null, playing = false, everPlayed = false;
  const sep = ' &nbsp;·&nbsp; ';
  const lcdOn = () => { const S = STATIONS[st]; return `FM ${S.freq}${sep}NOW PLAYING${sep}${S.song}${sep}${S.artist}${sep}SEEK ◀◀ ▶▶ TO CHANGE STATION${sep}FALLING SUNS${sep}`; };
  const lcdOff = () => `AUX${sep}READY${sep}PUSH START TO PLAY${sep}FM ${STATIONS[st].freq}${sep}`;
  const list = $('playlist');
  STATIONS.forEach((S, i) => {
    const li = document.createElement('button'); li.className = 'track'; li.type = 'button';
    li.innerHTML = `<span class="tf">${S.freq}</span><span class="tn">${S.song}</span><span class="ta">${S.artist}</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>`;
    li.onclick = () => window.dashStation(i - st);
    list.appendChild(li);
  });
  function paint() {
    $('lcdText').innerHTML = playing ? lcdOn() : lcdOff();
    $('huSrc').textContent = playing ? 'FM ' + STATIONS[st].freq : 'AUX';
    [...list.children].forEach((li, i) => li.classList.toggle('on', i === st));
  }
  // heads-up: tell viewers they can change the station
  let hinted = false;
  function hint(show) { $('stationHint').classList.toggle('show', show); }
  document.addEventListener('dash-music', e => { if (e.detail && !hinted) { hinted = true; setTimeout(() => hint(true), 1800); setTimeout(() => hint(false), 11000); } });
  function setPlaying(on) {
    playing = on; if (on) everPlayed = true;
    document.dispatchEvent(new CustomEvent('dash-music', { detail: on }));
    document.body.classList.toggle('music-on', on);
    paint();
    if (on) $('spWrap').classList.remove('reveal');
  }
  setPlaying(false); paint();
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
    hint(false);
    if (!dir) { run('toggle'); return; }
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
          else if (e.data === YT.PlayerState.ENDED) { st = (st + 1) % STATIONS.length; const S = STATIONS[st]; player.loadVideoById({ videoId: S.id, startSeconds: S.start }); setTimeout(paint, 600); }  // playlist: next song
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
