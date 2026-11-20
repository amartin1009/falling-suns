/* FALLING SUNS — endless night drive background
   Procedural canvas animation: foggy road, passing streetlights,
   neon gas-station canopies, taco stands, taillights ahead. */
(function () {
  const canvas = document.getElementById('drive');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // palette pulled from the inspo
  const C = {
    red: [255, 52, 30], ember: [255, 110, 40], sodium: [255, 150, 60],
    green: [70, 255, 140], fluoro: [150, 255, 190], teal: [60, 200, 170],
    tail: [255, 20, 20]
  };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  // glow sprites (pre-rendered radial gradients)
  const sprites = {};
  function sprite(name) {
    if (sprites[name]) return sprites[name];
    const s = document.createElement('canvas'); s.width = s.height = 128;
    const g = s.getContext('2d'), col = C[name];
    const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, rgba([255, 255, 255], 0.95));
    rg.addColorStop(0.08, rgba(col, 0.9));
    rg.addColorStop(0.35, rgba(col, 0.25));
    rg.addColorStop(1, rgba(col, 0));
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    return (sprites[name] = s);
  }

  let W, H, dpr, horizon, f;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = canvas.width = Math.floor(innerWidth * dpr);
    H = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
    horizon = H * 0.52; f = W * 0.62;
  }
  resize(); addEventListener('resize', resize);

  const SPEED = 22, FAR = 260, CAM_Y = 1.25, ROAD = 4.2;
  // gentle bends in the road
  const bend = (z, t) => (Math.sin(t * 0.07) * 0.9 + Math.sin(t * 0.031 + 1) * 0.6) * (z * z) / 1600;
  const sway = t => Math.sin(t * 0.5) * 0.08 + Math.sin(t * 1.3) * 0.02;

  function proj(x, y, z, t) {
    const zz = Math.max(z, 0.3);
    const xs = x + bend(zz, t) - sway(t);
    return { x: W / 2 + xs * f / zz, y: horizon - (y - CAM_Y) * f / zz, s: f / zz };
  }
  function fog(z) { const near = Math.min(1, Math.max(0, (z - 1.5) / 10)); return near * Math.max(0, 1 - z / FAR) ** 1.4; }

  function glow(name, p, r, a) {
    if (a <= 0.01) return;
    ctx.globalAlpha = a;
    const s = sprite(name);
    ctx.drawImage(s, p.x - r, p.y - r, r * 2, r * 2);
  }

  function sky(t) {
    const g = ctx.createLinearGradient(0, 0, 0, horizon + H * 0.05);
    g.addColorStop(0, '#07050c');
    g.addColorStop(0.55, '#140812');
    g.addColorStop(0.85, '#3a1208');
    g.addColorStop(1, '#6a2a0c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 2);
    // green haze from off-frame light, like the gas station photo
    const gg = ctx.createRadialGradient(W * 0.08, H * 0.25, 0, W * 0.08, H * 0.25, W * 0.6);
    gg.addColorStop(0, 'rgba(60,200,120,0.16)'); gg.addColorStop(1, 'rgba(60,200,120,0)');
    ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
    // distant hills silhouette
    ctx.fillStyle = '#0a0608';
    ctx.beginPath(); ctx.moveTo(0, horizon);
    for (let x = 0; x <= W; x += W / 40) {
      const k = x / W + t * 0.002;
      ctx.lineTo(x, horizon - (Math.sin(k * 9) * 0.5 + Math.sin(k * 23) * 0.25 + 0.8) * H * 0.025);
    }
    ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();
    // city glow on horizon
    for (let i = 0; i < 26; i++) {
      const x = ((i * 137.5 + t * 2) % W);
      const col = i % 5 === 0 ? 'green' : i % 3 === 0 ? 'red' : 'sodium';
      glow(col, { x, y: horizon - H * 0.004 }, H * 0.012, 0.35 + 0.2 * Math.sin(t + i));
    }
  }

  function road(t) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#060405'; ctx.fillRect(0, horizon, W, H - horizon);
    // asphalt as one smooth polygon
    const L = [], R = [];
    for (let z = 0.6; z < FAR; z *= 1.06) { L.push(proj(-ROAD, 0, z, t)); R.push(proj(ROAD, 0, z, t)); }
    const rg = ctx.createLinearGradient(0, horizon, 0, H);
    rg.addColorStop(0, '#2a1410'); rg.addColorStop(0.25, '#140c0c'); rg.addColorStop(1, '#0b0809');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(L[0].x, L[0].y);
    L.forEach(p => ctx.lineTo(p.x, p.y)); R.reverse().forEach(p => ctx.lineTo(p.x, p.y)); ctx.closePath(); ctx.fill();
    // center dashes
    const dash = 6, gap = 10, period = dash + gap, off = (t * SPEED) % period;
    ctx.fillStyle = 'rgba(255,190,90,0.75)';
    for (let z = period - off; z < FAR; z += period) {
      if (z < 3) continue;
      const z0 = z, z1 = z + dash;
      const a = proj(-0.08, 0, z1, t), b = proj(0.08, 0, z1, t), c = proj(0.08, 0, z0, t), d = proj(-0.08, 0, z0, t);
      ctx.globalAlpha = 0.9 * fog(z0);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.fill();
    }
    // edge lines
    ctx.strokeStyle = 'rgba(230,220,210,0.35)'; ctx.lineWidth = 1.5 * dpr;
    [-ROAD + 0.3, ROAD - 0.3].forEach(x => {
      ctx.beginPath();
      for (let z = 1; z < FAR * 0.6; z *= 1.08) { const p = proj(x, 0, z, t); z === 1 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); }
      ctx.globalAlpha = 0.6; ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  // roadside objects repeat on a loop of LOOP units
  const LOOP = 520;
  const lights = [], props = [];
  for (let z = 0; z < LOOP; z += 13) {
    const n = z / 13, side = n % 2 ? 1 : -1;
    const col = n % 7 === 3 ? 'fluoro' : n % 5 === 2 ? 'red' : n % 9 === 4 ? 'green' : 'sodium';
    lights.push({ z, side, col });
  }
  props.push({ z: 60, side: 1, type: 'canopy', col: 'red' });
  props.push({ z: 170, side: -1, type: 'stand' });
  props.push({ z: 260, side: -1, type: 'canopy', col: 'green' });
  props.push({ z: 340, side: 1, type: 'stand' });
  props.push({ z: 430, side: 1, type: 'sign', col: 'red' });
  props.push({ z: 470, side: -1, type: 'sign', col: 'green' });
  props.push({ z: 120, side: -1, type: 'sign', col: 'red' });
  props.push({ z: 220, side: 1, type: 'sign', col: 'green' });
  props.push({ z: 385, side: -1, type: 'canopy', col: 'red' });
  props.push({ z: 500, side: 1, type: 'stand' });

  const zOf = (z0, t) => ((z0 - t * SPEED) % LOOP + LOOP) % LOOP;

  function quad(pts) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.closePath(); }

  function drawCanopy(o, z, t) {
    const x0 = o.side * (ROAD + 3), x1 = o.side * (ROAD + 17), y = 5.2, d = 12, fz = fog(z) * Math.min(1, Math.max(0, (z - 6) / 25));
    if (z < 6) return;
    const a = proj(x0, y, z, t), b = proj(x1, y, z, t), c = proj(x1, y, z + d, t), e = proj(x0, y, z + d, t);
    const a2 = proj(x0, y - 0.9, z, t), b2 = proj(x1, y - 0.9, z, t);
    // underside glow / pool of light
    const pool = proj((x0 + x1) / 2, 0, z + d / 2, t);
    glow(o.col === 'green' ? 'fluoro' : 'ember', pool, pool.s * 9, 0.35 * fz);
    // canopy body
    ctx.globalAlpha = 0.9 * fz; ctx.fillStyle = '#120808';
    quad([a, b, b2, a2]); ctx.fill();
    // neon edge — layered strokes for bloom
    const col = C[o.col];
    [[10, 0.08], [5, 0.2], [2, 0.9]].forEach(([w, al]) => {
      ctx.globalAlpha = al * fz; ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = w * dpr * Math.min(2, a.s / 40 + 0.4);
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(a2.x, a2.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
    });
    // pumps
    for (let k = 0; k < 2; k++) {
      const px = x0 + o.side * (4 + k * 6), p = proj(px, 1.6, z + d / 2, t);
      glow(o.col === 'green' ? 'green' : 'ember', p, p.s * 0.9, 0.7 * fz);
    }
    // fluorescent tubes under canopy
    for (let k = 0; k < 3; k++) glow('fluoro', proj(x0 + o.side * (3 + k * 5), y - 1, z + d / 2, t), a.s * 1.2, 0.5 * fz);
  }

  function drawStand(o, z, t) {
    if (z < 1.5) return;
    const fz = fog(z), x0 = o.side * (ROAD + 2.5), x1 = o.side * (ROAD + 8.5);
    const tl = proj(x0, 3.4, z, t), tr = proj(x1, 3.4, z, t), br = proj(x1, 0, z, t), bl = proj(x0, 0, z, t);
    ctx.globalAlpha = fz; ctx.fillStyle = '#0d0909'; quad([tl, tr, br, bl]); ctx.fill();
    // teal-lit opening
    const ol = proj(x0 + o.side * 1, 2.6, z, t), or = proj(x1 - o.side * 1, 2.6, z, t), obr = proj(x1 - o.side * 1, 0.6, z, t), obl = proj(x0 + o.side * 1, 0.6, z, t);
    const g = ctx.createLinearGradient(0, ol.y, 0, obl.y);
    g.addColorStop(0, 'rgba(90,220,190,0.95)'); g.addColorStop(1, 'rgba(30,120,100,0.9)');
    ctx.globalAlpha = 0.85 * fz; ctx.fillStyle = g; quad([ol, or, obr, obl]); ctx.fill();
    // sign band
    const sl = proj(x0, 3.4, z, t), sr = proj(x1, 3.4, z, t), sbr = proj(x1, 2.8, z, t), sbl = proj(x0, 2.8, z, t);
    ctx.globalAlpha = 0.9 * fz; ctx.fillStyle = 'rgba(240,225,190,0.85)'; quad([sl, sr, sbr, sbl]); ctx.fill();
    // bulbs + spill
    glow('sodium', proj((x0 + x1) / 2, 2.4, z, t), tl.s * 1.3, 0.8 * fz);
    glow('teal', proj((x0 + x1) / 2, 0.2, z - 1, t), tl.s * 5, 0.25 * fz);
  }

  function drawSign(o, z, t) {
    if (z < 2) return;
    const fz = fog(z) * Math.min(1, Math.max(0, (z - 8) / 30)), x = o.side * (ROAD + 7), p = proj(x, 5.5, z, t);
    const flick = Math.sin(t * 17 + z) > 0.97 ? 0.3 : 1;
    const w = p.s * 2.8, h = p.s * 0.9;
    ctx.globalAlpha = 0.25 * fz * flick; ctx.fillStyle = rgba(C[o.col], 1);
    ctx.fillRect(p.x - w / 2 - 6 * dpr, p.y - h / 2 - 6 * dpr, w + 12 * dpr, h + 12 * dpr);
    ctx.globalAlpha = 0.9 * fz * flick; ctx.strokeStyle = rgba(C[o.col], 1); ctx.lineWidth = Math.max(1, p.s * 0.12);
    ctx.strokeRect(p.x - w / 2, p.y - h / 2, w, h);
    glow(o.col, p, w * 0.9, 0.45 * fz * flick);
    // pole
    const base = proj(x, 0, z, t);
    ctx.globalAlpha = 0.6 * fz; ctx.strokeStyle = '#1a1210'; ctx.lineWidth = Math.max(1, p.s * 0.15);
    ctx.beginPath(); ctx.moveTo(p.x, p.y + h / 2); ctx.lineTo(base.x, base.y); ctx.stroke();
  }

  function drawLight(l, z, t) {
    if (z < 0.8) return;
    const fz = fog(z), x = l.side * (ROAD + 1.4);
    const top = proj(x, 6.5, z, t), base = proj(x, 0, z, t), arm = proj(x - l.side * 1.6, 6.6, z, t);
    ctx.globalAlpha = 0.7 * fz; ctx.strokeStyle = '#140d0c'; ctx.lineWidth = Math.max(1, top.s * 0.12);
    ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(top.x, top.y); ctx.lineTo(arm.x, arm.y); ctx.stroke();
    glow(l.col, arm, top.s * 1.4, 0.95 * fz);
    glow(l.col, arm, top.s * 6, 0.35 * fz);          // fog halo
    const pool = proj(x - l.side * 1.6, 0, z, t);
    glow(l.col, pool, top.s * 4, 0.3 * fz);
    // wet-road reflection: stretched glow
    ctx.save(); ctx.translate(pool.x, pool.y); ctx.scale(0.18, 1.6);
    glow(l.col, { x: 0, y: top.s * 1.5 }, top.s * 3, 0.35 * fz); ctx.restore();
  }

  function taillights(t) {
    const z = 55 + Math.sin(t * 0.13) * 12, x = 1.6 + Math.sin(t * 0.21) * 0.4;
    const brake = (Math.sin(t * 0.09) > 0.92) ? 1.6 : 1;
    const fz = fog(z);
    [-0.75, 0.75].forEach(dx => {
      const p = proj(x + dx, 0.9, z, t);
      glow('tail', p, p.s * 0.9 * brake, 0.95 * fz);
      const r = proj(x + dx, 0, z - 3, t);
      ctx.globalAlpha = 0.25 * fz; ctx.fillStyle = 'rgba(255,30,20,1)';
      ctx.fillRect(r.x - p.s * 0.1, r.y, p.s * 0.2, p.s * 2.5);
    });
  }

  function haze() {
    ctx.globalCompositeOperation = 'source-over';
    // fog band at horizon
    const g = ctx.createLinearGradient(0, horizon - H * 0.18, 0, horizon + H * 0.25);
    g.addColorStop(0, 'rgba(60,20,14,0)');
    g.addColorStop(0.45, 'rgba(120,40,20,0.42)');
    g.addColorStop(1, 'rgba(10,6,6,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // vignette
    const v = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.25, W / 2, H * 0.55, W * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  function frame(t) {
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    sky(t); road(t);
    // collect + sort far→near
    const items = [];
    lights.forEach(l => items.push({ z: zOf(l.z, t), o: l, k: 'l' }));
    props.forEach(p => items.push({ z: zOf(p.z, t), o: p, k: p.type }));
    items.sort((a, b) => b.z - a.z);
    for (const it of items) {
      if (it.z > FAR) continue;
      ctx.globalCompositeOperation = 'lighter';
      if (it.k === 'l') drawLight(it.o, it.z, t);
      else if (it.k === 'canopy') { ctx.globalCompositeOperation = 'source-over'; drawCanopy(it.o, it.z, t); }
      else if (it.k === 'stand') { ctx.globalCompositeOperation = 'source-over'; drawStand(it.o, it.z, t); }
      else if (it.k === 'sign') drawSign(it.o, it.z, t);
    }
    ctx.globalCompositeOperation = 'lighter';
    taillights(t);
    haze();
  }

  let start = performance.now(), last = 0, raf;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - last < 1000 / 40) return; // cap ~40fps
    last = now;
    frame((now - start) / 1000 + 40);
  }
  if (reduce) frame(52);
  else raf = requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!reduce) { last = 0; raf = requestAnimationFrame(loop); }
  });
  window.__nightdriveFrame = frame;
})();
