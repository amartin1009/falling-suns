/* FALLING SUNS — dashboard: realistic instrument cluster, head unit (Spotify), slide nav. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);

  window.dashSetSlide = () => {};
  window.dashPower = () => {};

  // ---------- head unit: radio stations (YouTube or Spotify audio), driven by the push-start button ----------
  const STATIONS = [
    { freq: '87.9',  src: 'yt', id: 'ZhIWWecwhpg',            start: 17, song: "KING'S BLVD 2", artist: 'NANA' },
    { freq: '94.5',  src: 'sp', id: '5uDASfU19gDxSjW8cnCaBp', start: 18, song: 'CHILL BILL',    artist: 'ROB $TONE FT. J.DAVI$ & SPOOKS' },
    { freq: '101.7', src: 'sp', id: '2vo0kfh9mZIUe2WsqYkFGb', start: 0,  song: 'NO COCAINE',    artist: 'SLIGHTLY STOOPID' },
  ];
  let st = 0, playing = false, everPlayed = false;
  let yt = null, ytReady = false, sp = null, spReady = false, spLoaded = null, spSeeked = false, spWasPlaying = false, pending = null;
  const sep = ' &nbsp;·&nbsp; ';
  const lcdOn = () => { const S = STATIONS[st]; return `FM ${S.freq}${sep}NOW PLAYING${sep}${S.song}${sep}${S.artist}${sep}SEEK ◀◀ ▶▶ TO CHANGE STATION${sep}FALLING SUNS${sep}`; };
  const lcdOff = () => `AUX${sep}READY${sep}PUSH START TO PLAY${sep}FM ${STATIONS[st].freq}${sep}`;
  const list = $('playlist');
  STATIONS.forEach((S, i) => {
    const li = document.createElement('button'); li.className = 'pl-item'; li.type = 'button';
    li.innerHTML = `<span class="tf">${S.freq}</span><span class="tn">${S.song}</span><span class="ta">${S.artist}</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>`;
    li.onclick = () => window.dashStation(i - st);
    list.appendChild(li);
  });
  function paint() {
    $('lcdText').innerHTML = playing ? lcdOn() : lcdOff();
    $('huSrc').textContent = playing ? 'FM ' + STATIONS[st].freq : 'AUX';
    [...list.children].forEach((li, i) => li.classList.toggle('on', i === st));
  }
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

  // show only the player for the current station (used only if a browser blocks playback)
  function showPlayerFor(S) { $('ytBox').style.display = S.src === 'yt' ? '' : 'none'; $('spBox').style.display = S.src === 'sp' ? '' : 'none'; }
  const srcReady = S => S.src === 'yt' ? ytReady : spReady;
  function playStation(fromStart) {
    const S = STATIONS[st]; showPlayerFor(S);
    if (!srcReady(S)) { pending = 'start'; return; }
    if (S.src === 'yt') {
      if (spReady && spWasPlaying) sp.pause();
      if (fromStart || yt.getVideoData().video_id !== S.id) yt.loadVideoById({ videoId: S.id, startSeconds: S.start }); else yt.playVideo();
    } else {
      if (ytReady) yt.pauseVideo();
      if (fromStart || spLoaded !== S.id) { spLoaded = S.id; spSeeked = false; sp.loadUri('spotify:track:' + S.id); sp.play(); }
      else sp.resume();
    }
  }
  function pauseAll() { if (ytReady) yt.pauseVideo(); if (spReady) sp.pause(); }
  function run(cmd) {
    if (cmd === 'start') playStation(true);
    else if (playing) pauseAll();
    else playStation(false);
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
  function next() { st = (st + 1) % STATIONS.length; playStation(true); setTimeout(paint, 700); }
  window.dashStation = dir => {
    hint(false);
    if (!dir) { run('toggle'); return; }
    st = (st + dir + STATIONS.length) % STATIONS.length;
    const S = STATIONS[st];
    $('huSrc').textContent = 'FM ' + S.freq;
    $('lcdText').innerHTML = `TUNING${sep}FM ${S.freq}${sep}`;
    hiss(); playStation(true);
    setTimeout(paint, 900);
  };

  // YouTube
  window.onYouTubeIframeAPIReady = () => {
    yt = new YT.Player('ytPlayer', {
      width: 320, height: 180, videoId: STATIONS[0].id,
      playerVars: { start: STATIONS[0].start, controls: 1, playsinline: 1, rel: 0, modestbranding: 1, disablekb: 1 },
      events: {
        onReady: () => { ytReady = true; yt.setVolume(85); if (pending && STATIONS[st].src === 'yt') { pending = null; playStation(true); } },
        onStateChange: e => {
          if (STATIONS[st].src !== 'yt') return;
          if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
          else if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
          else if (e.data === YT.PlayerState.ENDED) next();
        },
        onError: () => reveal()
      }
    });
  };
  // Spotify
  window.onSpotifyIframeApiReady = API => {
    const first = STATIONS.find(S => S.src === 'sp');
    API.createController($('spEmbed'), { uri: 'spotify:track:' + first.id, width: '100%', height: 80 }, c => {
      sp = c; spLoaded = first.id;
      c.addListener('ready', () => { spReady = true; if (pending && STATIONS[st].src === 'sp') { pending = null; playStation(true); } });
      c.addListener('playback_update', e => {
        const d = e.data, S = STATIONS[st];
        if (S.src !== 'sp') return;
        // full track: jump to the station's start point (30-second previews play as-is)
        if (!spSeeked && !d.isPaused && S.start && d.duration > 60000 && d.position < (S.start - 1) * 1000) { spSeeked = true; c.seek(S.start); }
        if (!d.isPaused) spWasPlaying = true;
        if (d.isPaused && spWasPlaying && d.duration && d.position >= d.duration - 1500) { spWasPlaying = false; next(); return; }
        setPlaying(!d.isPaused);
      });
    });
  };
  window.dashUnlocked = () => {
    if (!document.getElementById('ytapi')) { const s = document.createElement('script'); s.id = 'ytapi'; s.src = 'https://www.youtube.com/iframe_api'; document.body.appendChild(s); }
    if (!document.getElementById('spapi')) { const s = document.createElement('script'); s.id = 'spapi'; s.async = true; s.src = 'https://open.spotify.com/embed/iframe-api/v1'; document.body.appendChild(s); }
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
