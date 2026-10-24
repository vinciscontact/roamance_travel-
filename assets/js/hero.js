/* Roamance — home hero: dotted world map + the logo eagle.
 * The eagle follows the pointer (desktop) or the last tap (touch), banks into turns and flaps;
 * dots swell and darken under the pointer and the eagle. Click / tap sends the eagle swooping
 * to that spot with a ripple through the map. Idles on a figure-of-eight when nobody is steering.
 */
(function () {
  'use strict';
  const hero = document.querySelector('[data-hero-map]');
  const M = window.ROAMANCE_MAP;
  if (!hero || !M) return;
  const canvas = hero.querySelector('canvas'), ctx = canvas.getContext('2d');
  const eagle = hero.querySelector('[data-eagle]');
  const wing = hero.querySelector('[data-eagle-wing]'), tail = hero.querySelector('[data-eagle-tail]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;

  // decode the bit rows → [col,row] land cells
  const cells = [];
  M.data.forEach((hex, r) => {
    const bits = hex.split('').map((h) => parseInt(h, 16).toString(2).padStart(4, '0')).join('');
    for (let c = 0; c < M.cols; c++) if (bits[c] === '1') cells.push([c, r]);
  });

  const css = (n) => getComputedStyle(hero).getPropertyValue(n).trim();
  const rgb = (h) => { h = h.replace('#', ''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  let DOT, INK, W = 0, H = 0, dpr = 1, cell = 8, ox = 0, oy = 0;

  // Lay the map out: fill the width on wide screens; on tall phones zoom in around India.
  const FOCUS = [(78 + 168) / ((192 + 168) / M.cols), (78 - 22) / ((192 + 168) / M.cols)];   // India, in grid units
  function layout() {
    const r = hero.getBoundingClientRect(); W = r.width; H = r.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    cell = Math.max(W / M.cols, (H * (W < 768 ? 0.9 : 0.62)) / M.rows);
    const mapW = cell * M.cols, mapH = cell * M.rows;
    ox = mapW <= W * 1.02 ? (W - mapW) / 2 : Math.min(0, Math.max(W - mapW, W * 0.5 - FOCUS[0] * cell));
    oy = W < 768 ? Math.min(H * 0.08, Math.max(H - mapH, H * 0.38 - FOCUS[1] * cell)) : (H - mapH) / 2 + H * 0.06;
    DOT = rgb(css('--sd-dot') || '#c5b13e'); INK = rgb(css('--sd-ink') || '#2e3231');
    eagleSize = Math.max(120, Math.min(W < 768 ? W * 0.42 : W * 0.2, H * 0.5));
    eagle.style.width = eagleSize + 'px';
  }

  // state
  let eagleSize = 200;
  const pos = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  const pointer = { x: -9999, y: -9999, on: false, t: 0 };
  let steer = null, steerUntil = 0, bank = 0, flap = 0, flapSpeed = 1, ripples = [], t0 = performance.now(), visible = true;

  function idleTarget(t) {
    const cx = W < 768 ? W * 0.62 : W * 0.7, cy = W < 768 ? H * 0.3 : H * 0.36;
    return { x: cx + Math.sin(t * 0.32) * W * (W < 768 ? 0.18 : 0.13), y: cy + Math.sin(t * 0.64) * H * 0.07 };
  }

  function draw(now) {
    const t = (now - t0) / 1000;
    // where does the eagle want to be?
    let goal;
    if (steer && now < steerUntil) goal = steer;
    else if (pointer.on && !touch && now - pointer.t < 4000) goal = { x: pointer.x + eagleSize * 0.15, y: pointer.y - eagleSize * 0.35 };
    else goal = idleTarget(t);
    target.x += (goal.x - target.x) * 0.08; target.y += (goal.y - target.y) * 0.08;
    // spring toward target → natural overshoot and banking
    vel.x += (target.x - pos.x) * 0.012; vel.y += (target.y - pos.y) * 0.012;
    vel.x *= 0.9; vel.y *= 0.9;
    pos.x += vel.x; pos.y += vel.y + Math.sin(t * 2.2) * 0.25;
    const speed = Math.hypot(vel.x, vel.y);
    bank += (Math.max(-24, Math.min(24, vel.x * 2.4)) - bank) * 0.1;
    flapSpeed += ((speed > 1.2 ? 9 : 3.2) - flapSpeed) * 0.05;
    flap += flapSpeed / 60;
    const f = Math.sin(flap);
    eagle.style.transform = `translate3d(${pos.x - eagleSize / 2}px, ${pos.y - eagleSize * 0.66}px, 0) rotate(${bank - vel.y * 0.6}deg)`;
    wing.style.transform = `rotate(${f * (speed > 1.2 ? 9 : 5)}deg) scaleY(${1 - Math.max(0, f) * 0.06})`;
    tail.style.transform = `rotate(${-f * 4 - vel.x * 0.5}deg)`;

    // dots
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const R1 = Math.max(110, W * 0.11), R2 = eagleSize * 0.9, base = cell * 0.28;
    const ex = pos.x, ey = pos.y + eagleSize * 0.15;
    ripples = ripples.filter((r) => t - r.t < 1.6);
    for (let i = 0; i < cells.length; i++) {
      const x = ox + (cells[i][0] + 0.5) * cell, y = oy + (cells[i][1] + 0.5) * cell;
      if (x < -cell || y < -cell || x > W + cell || y > H + cell) continue;
      let k = 0;
      if (pointer.on) { const d = Math.hypot(x - pointer.x, y - pointer.y); if (d < R1) k = Math.max(k, 1 - d / R1); }
      const de = Math.hypot(x - ex, y - ey); if (de < R2) k = Math.max(k, (1 - de / R2) * 0.7);
      for (const r of ripples) { const ring = (t - r.t) * W * 0.45, d = Math.abs(Math.hypot(x - r.x, y - r.y) - ring); if (d < 40) k = Math.max(k, (1 - d / 40) * (1 - (t - r.t) / 1.6)); }
      k = k * k * (3 - 2 * k);
      const tw = 1 + 0.12 * Math.sin(t * 1.4 + cells[i][0] * 0.35 + cells[i][1] * 0.5);
      const rad = base * tw * (1 + k * 0.9);
      const c = DOT.map((v, j) => Math.round(v + (INK[j] - v) * k * 0.75));
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill();
    }
    if (visible && !reduced) raf = requestAnimationFrame(draw);
  }

  let raf = 0;
  function start() { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
  layout();
  Object.assign(pos, idleTarget(0)); Object.assign(target, pos);
  addEventListener('resize', () => { layout(); if (reduced) draw(performance.now()); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !reduced) start(); }).observe(hero);

  const local = (e) => { const r = hero.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  hero.parentElement.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; Object.assign(pointer, local(e), { on: true, t: performance.now() }); });
  hero.parentElement.addEventListener('pointerleave', () => { pointer.on = false; });
  // click / tap: swoop + ripple (ignore clicks on links and buttons)
  hero.parentElement.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return;
    const p = local(e), now = performance.now();
    steer = { x: p.x, y: p.y - eagleSize * 0.2 }; steerUntil = now + (touch ? 5000 : 1400);
    ripples.push({ x: p.x, y: p.y, t: (now - t0) / 1000 });
    if (touch) Object.assign(pointer, p, { on: true, t: now }), setTimeout(() => (pointer.on = false), 1200);
  });

  if (reduced) { pos.x = W * 0.72; pos.y = H * 0.36; draw(performance.now()); }
  else start();
})();
