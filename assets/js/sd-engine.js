/*!
 * sd-engine.js — "Son Daven"-style motion engine (clean-room reimplementation)
 * Requires (load BEFORE this file):
 *   gsap 3.13+, ScrollTrigger, SplitText, CustomEase, Flip   (all free since 3.13)
 *   lenis 1.3+
 * Optional: barba core 2.x (page transitions), Swiper 11 (free-mode sliders)
 *
 * Everything is attribute-driven (data-sd-*). Call SD.init() once after DOM ready.
 * Every module is also exposed on window.SD so you can call it by hand.
 */
(function (global) {
  'use strict';
  const gsap = global.gsap;
  if (!gsap) { console.error('[sd] GSAP missing'); return; }
  const { ScrollTrigger, SplitText, CustomEase, Flip } = global;
  gsap.registerPlugin(...[ScrollTrigger, SplitText, CustomEase, Flip].filter(Boolean));

  /* ------------------------------------------------------------------ *
   * 1. TOKENS — the whole site is built on 3 durations + 4 curves
   * ------------------------------------------------------------------ */
  const T = {
    S: 0.4, M: 0.8, L: 1.2,     // durations
    stagger: 0.1,
    delay: 0.2,                 // default reveal delay
    bp: 992,                    // desktop breakpoint (fancy stuff is desktop-only)
  };
  const E = { inOut: 'sd-inOut', out: 'sd-out', in: 'sd-in', ease: 'sd-ease', write: 'sd-write' };
  if (CustomEase) {
    CustomEase.create(E.inOut, '0.76,0,0.24,1');   // expo-ish in-out: transitions, tabs, menus
    CustomEase.create(E.out,   '0.25,1,0.5,1');    // quart-out: every reveal
    CustomEase.create(E.in,    '0.5,0,0.75,0');    // quart-in: every hide
    CustomEase.create(E.ease,  '0.25,0.1,0.25,1'); // css "ease": sliders
    CustomEase.create(E.write, '0.333,0,0.667,1'); // near-linear: drawing
  } else {
    E.inOut = 'power4.inOut'; E.out = 'power3.out'; E.in = 'power3.in'; E.ease = 'power1.inOut'; E.write = 'none';
  }
  const reduced = global.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesk = () => global.innerWidth >= T.bp;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const desktopOnly = (fn) => {
    if (!gsap.matchMedia) return isDesk() && fn();
    gsap.matchMedia().add(`(min-width: ${T.bp}px)`, fn);
  };

  /* ------------------------------------------------------------------ *
   * 2. TEXT & BLOCK PRIMITIVES  (mode: 'initial' | 'reveal' | 'hide')
   *    These four functions are reused by EVERY component.
   * ------------------------------------------------------------------ */
  const rnd = (vals) => gsap.utils.wrap(vals);

  // Headlines: words pop from scale 0 with alternating vertical offsets, random order
  function words(targets, mode, delay) {
    gsap.utils.toArray(targets).forEach((el, i) => {
      if (!el._sdWords) el._sdWords = new SplitText(el, { type: 'words', tag: 'span', wordsClass: 'sd-word', smartWrap: true });
      const w = el._sdWords.words;
      const offset = i * T.stagger * 0.5;
      if (mode === 'initial') return gsap.set(w, { yPercent: rnd([-150, 75, -75, 150]), scale: 0, opacity: 0 });
      if (mode === 'reveal') return gsap.fromTo(w,
        { yPercent: rnd([-150, 75, -75, 150]), scale: 0, opacity: 0 },
        { yPercent: 0, scale: 1, opacity: 1, duration: reduced ? 0.01 : T.L, delay: (delay ?? T.delay) + offset,
          stagger: { each: T.stagger * 0.25, from: 'random' }, ease: E.out, overwrite: true });
      if (mode === 'hide') return gsap.to(w, {
        yPercent: rnd([75, -75, 75, -75]), scale: 0, opacity: 0, duration: T.S, delay: delay ?? 0,
        stagger: { each: T.stagger * 0.25, from: 'random' }, ease: E.in, overwrite: true });
    });
  }

  // Paragraphs: lines rise 250% with fade, sequential
  function lines(targets, mode, delay) {
    gsap.utils.toArray(targets).forEach((el, i) => {
      if (!el._sdLines) el._sdLines = new SplitText(el, { type: 'lines', linesClass: 'sd-line', aria: 'none' });
      const l = el._sdLines.lines;
      const offset = i * T.stagger * 0.25;
      if (mode === 'initial') return gsap.set(l, { yPercent: 0, opacity: 0 });
      if (mode === 'reveal') return gsap.fromTo(l, { yPercent: 250, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: reduced ? 0.01 : T.L, delay: (delay ?? T.delay) + offset,
          stagger: T.stagger * 0.5, ease: E.out, overwrite: true });
      if (mode === 'hide') return gsap.to(l, { opacity: 0, duration: T.S, delay: delay ?? 0,
        stagger: T.stagger * 0.5, ease: E.in, overwrite: true });
    });
  }

  // Containers (buttons, cards, meta rows): rise one full height
  function block(targets, mode, delay) {
    const els = gsap.utils.toArray(targets); if (!els.length) return;
    if (mode === 'initial') return gsap.set(els, { opacity: 0, yPercent: 0 });
    if (mode === 'reveal') return gsap.fromTo(els, { opacity: 0, yPercent: 100 },
      { opacity: 1, yPercent: 0, duration: reduced ? 0.01 : T.L, delay: delay ?? T.delay,
        stagger: T.stagger * 0.5, ease: E.out, overwrite: true });
    if (mode === 'hide') return gsap.to(els, { opacity: 0, duration: T.S, delay: delay ?? 0,
      stagger: T.stagger * 0.5, ease: E.in, overwrite: true });
  }

  // Rules / dividers: draw left→right, erase toward the right
  function rule(targets, mode, delay) {
    const els = gsap.utils.toArray(targets); if (!els.length) return;
    if (mode === 'initial') return gsap.set(els, { clipPath: 'inset(0% 0% -1px 100%)' });
    if (mode === 'reveal') return gsap.fromTo(els, { clipPath: 'inset(0% 100% -1px 0%)' },
      { clipPath: 'inset(0% 0% -1px 0%)', duration: T.L, delay: delay ?? T.delay, stagger: T.stagger, ease: E.out, overwrite: true });
    if (mode === 'hide') return gsap.to(els, { clipPath: 'inset(0% 0% -1px 100%)', duration: T.S,
      delay: delay ?? 0, stagger: T.stagger * 0.5, ease: E.in, overwrite: true });
  }

  /* ------------------------------------------------------------------ *
   * 3. SMOOTH SCROLL (Lenis) + scroll lock
   * ------------------------------------------------------------------ */
  let lenis = null;
  function initLenis() {
    if (!global.Lenis) return null;
    if (lenis) lenis.destroy();
    lenis = new global.Lenis({
      duration: 1.2, smoothWheel: true, touchMultiplier: 2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),   // expo-out
    });
    if (ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    // Inner scroll areas (modals, lists) get their own short Lenis
    $$('[data-sd-lenis-inner]').forEach((wrapper) => {
      const inner = new global.Lenis({ wrapper, content: wrapper.firstElementChild || wrapper, duration: 0.6,
        smoothWheel: true, touchMultiplier: 2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      gsap.ticker.add((time) => inner.raf(time * 1000));
    });
    return lenis;
  }
  function lockScroll() {
    const sw = innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--sd-scrollbar', sw + 'px');
    document.body.style.paddingRight = 'var(--sd-scrollbar)';
    document.documentElement.style.overflow = 'hidden';
    lenis && lenis.stop();
  }
  function unlockScroll() {
    document.body.style.paddingRight = '';
    document.documentElement.style.overflow = '';
    lenis && lenis.start();
  }

  /* ------------------------------------------------------------------ *
   * 4. SCROLL REVEALS — once, when the group's top hits the viewport bottom
   *    data-sd-reveal="words|lines|block|rule|card"
   *    data-sd-reveal-group  → optional common trigger wrapper
   * ------------------------------------------------------------------ */
  const PRIM = { words, lines, block, rule };
  function initReveals(root = document) {
    $$('[data-sd-reveal]', root).forEach((el) => {
      const kind = el.getAttribute('data-sd-reveal');
      const trigger = el.closest('[data-sd-reveal-group]') || el;
      if (kind === 'card') {
        gsap.set(el, { transformPerspective: 1000, visibility: 'visible' });
        gsap.timeline({ scrollTrigger: { trigger, start: 'top bottom', toggleActions: 'play none none reset' } })
          .from(el, { scale: 0, rotateY: -90, rotate: -25, duration: T.L, delay: T.delay, ease: E.out });
        return;
      }
      const fn = PRIM[kind]; if (!fn) return;
      fn(el, 'initial');
      gsap.set(el, { visibility: 'visible' });
      ScrollTrigger.create({ trigger, start: 'top bottom', once: true, onEnter: () => fn(el, 'reveal', 0) });
    });
    // Rows of slides slide in from the right, staggered
    $$('[data-sd-slider-reveal]', root).forEach((row) => {
      const kids = Array.from(row.children); if (!kids.length) return;
      gsap.set(kids, { visibility: 'visible' });
      gsap.from(kids, { opacity: 0, xPercent: 50, duration: T.L, delay: T.delay, stagger: T.stagger, ease: E.out,
        scrollTrigger: { trigger: row, start: 'top bottom' } });
    });
    // Chrome slides in on load
    const header = $('[data-sd-header]'); if (header) { gsap.from(header, { yPercent: -100, duration: T.L, ease: E.inOut }); gsap.set(header, { visibility: 'visible' }); }
    $$('[data-sd-dock="bottom"]').forEach((d) => { gsap.from(d, { yPercent: 125, duration: T.L, ease: E.inOut }); gsap.set(d, { visibility: 'visible' }); });
  }

  /* Highlight: chars go from 10% to 100% opacity, scrubbed to scroll */
  function initHighlight(root = document) {
    $$('[data-sd-highlight]', root).forEach((el) => {
      const chars = new SplitText(el, { type: 'chars', smartWrap: true, charsClass: 'sd-char' }).chars;
      const trigger = el.closest('[data-sd-highlight-group]') || el;
      gsap.timeline({ scrollTrigger: { trigger, start: 'top 75%', end: 'bottom 50%', scrub: true } })
        .from(chars, { opacity: 0.1, duration: T.S, ease: E.out, stagger: T.stagger });
    });
  }

  /* ------------------------------------------------------------------ *
   * 5. PARALLAX FAMILY
   *    data-sd-parallax="img"     inside [data-sd-parallax-wrap]  -20% → 20%
   *    data-sd-parallax="img-out" inside wrap, starts at 50%      -10% → 30%
   *    data-sd-parallax="down" | "up"   (add data-sd-mobile="false" to skip <bp)
   *    data-sd-parallax="drift" → children drift sideways ±5% (big titles)
   *    data-sd-zoom        → image scales 1 → 1.25 from bottom-center
   * ------------------------------------------------------------------ */
  function initParallax(root = document) {
    if (reduced) return;
    $$('[data-sd-parallax]', root).forEach((el) => {
      const kind = el.getAttribute('data-sd-parallax');
      const wrap = el.closest('[data-sd-parallax-wrap]') || el.parentElement;
      const skipMob = el.getAttribute('data-sd-mobile') === 'false' && !isDesk();
      if (skipMob) return;
      const st = (o) => ({ trigger: wrap, scrub: true, ...o });
      switch (kind) {
        case 'img':     gsap.fromTo(el, { yPercent: -20 }, { yPercent: 20, ease: 'none', scrollTrigger: st({ start: 'top bottom', end: 'bottom top' }) }); break;
        case 'img-out': gsap.fromTo(el, { yPercent: -10 }, { yPercent: 30, ease: 'none', scrollTrigger: st({ start: 'top 50%', end: 'bottom top' }) }); break;
        case 'down':    gsap.fromTo(el, { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }); break;
        case 'up':      gsap.fromTo(el, { yPercent: 10 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }); break;
        case 'drift': {
          const kids = Array.from(el.children); if (!kids.length) break;
          gsap.fromTo(kids, { xPercent: rnd([5, -1, -5]) }, { xPercent: rnd([-5, 1, 5]), ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 } });
        }
      }
    });
    $$('[data-sd-zoom]', root).forEach((el) => {
      const target = el.querySelector('[data-sd-zoom-target]') || el.firstElementChild;
      gsap.fromTo(target, { scale: 1, transformOrigin: 'center bottom' }, { scale: 1.25, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });
  }

  /* ------------------------------------------------------------------ *
   * 6. SECTION CHOREOGRAPHY
   * ------------------------------------------------------------------ */
  // 6a. Title that scales 0→1 in a gap, then intro fades as outro leaves
  function initGrowTitle(root = document) {
    $$('[data-sd-grow]', root).forEach((w) => {
      const title = w.querySelector('[data-sd-grow="title"]') || w.querySelector('[data-sd-grow-title]');
      const gap = w.querySelector('[data-sd-grow-gap]') || w;
      const fade = $$('[data-sd-grow-fade]', w);
      const outro = w.querySelector('[data-sd-grow-outro]');
      if (title) gsap.fromTo(title, { scale: 0 }, { scale: 1, ease: E.inOut, scrollTrigger: { trigger: gap, start: 'top bottom', end: 'bottom bottom', scrub: true } });
      if (fade.length && outro) gsap.fromTo(fade, { opacity: 1 }, { opacity: 0, ease: E.out, scrollTrigger: { trigger: outro, start: 'bottom top', end: '200% top', scrub: true } });
    });
  }

  // 6b. Horizontal scroll with "scattered polaroid" cards (desktop only)
  //     <section data-sd-hscroll style="height:400vh"><div class="sticky"><ul data-sd-hscroll-track><li data-sd-hscroll-card>
  function initHScroll(root = document) {
    desktopOnly(() => {
      $$('[data-sd-hscroll]', root).forEach((sec) => {
        const track = sec.querySelector('[data-sd-hscroll-track]'); if (!track) return;
        const cards = $$('[data-sd-hscroll-card]', track);
        const sticky = track.parentElement;
        const tween = gsap.to(track, {
          x: () => -(track.scrollWidth - sticky.clientWidth), ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
        });
        cards.forEach((card, i) => {
          const sign = () => (Math.random() < 0.5 ? 1 : -1);
          const r = { x: (10 * Math.random() + 20) * sign(), y: 5 * sign(), rot: (5 * Math.random() + 5) * sign() };
          const alt = i % 2 === 0 ? 15 : -15;
          gsap.fromTo(card,
            { rotation: r.rot, xPercent: r.x, yPercent: r.y + 75 + alt },
            { rotation: -r.rot, xPercent: -r.x, yPercent: -r.y - 75 - alt, ease: 'none',
              scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 120%', end: 'right -20%', scrub: true } });
        });
      });
    });
  }

  // 6c. Footer "zoom-out reveal": content scale 2→1, bg .75→1 (footer is tall + sticky inner)
  function initFooterZoom(root = document) {
    desktopOnly(() => {
      $$('[data-sd-footer-zoom]', root).forEach((f) => {
        const inner = f.querySelector('[data-sd-footer-zoom="content"]') || f.querySelector('[data-sd-footer-content]');
        const bg = f.querySelector('[data-sd-footer-bg]');
        const tl = gsap.timeline({ scrollTrigger: { trigger: f, start: 'top top', end: 'bottom bottom', scrub: true } });
        if (inner) tl.fromTo(inner, { scale: 2, z: 10, transformOrigin: 'center 10%' }, { scale: 1, ease: 'none' });
        if (bg) tl.fromTo(bg, { scale: 0.75, z: 10, transformOrigin: 'center 10%' }, { scale: 1, ease: 'none' }, '<');
      });
    });
  }

  // 6d. Hero scroll-out: copy lifts & shrinks, then whole hero card shrinks to .3
  function initHeroOut(root = document) {
    desktopOnly(() => {
      $$('[data-sd-hero-out]', root).forEach((area) => {
        const card = area.querySelector('[data-sd-hero-card]');
        const stage = area.querySelector('[data-sd-hero-stage]');
        const copy = area.querySelector('[data-sd-hero-copy]');
        if (copy) gsap.to(copy, { yPercent: -100, scale: 0.5, opacity: 0, ease: 'none', scrollTrigger: { trigger: area, start: 'top top', end: '50% bottom', scrub: 0.25 } });
        const tl = gsap.timeline({ scrollTrigger: { trigger: area, start: '70% bottom', end: 'bottom bottom', scrub: 1 } });
        if (card) tl.to(card, { scale: 0.3, ease: E.out, duration: 1 }, 0);
        if (stage) tl.to(stage, { opacity: 0, ease: E.out, duration: 0.33 }, 0);
      });
    });
  }

  // 6e. Canvas image sequence scrubbed by scroll (cover-fit), desktop only
  //     <div data-sd-sequence data-sd-frames="https://…/frames/{i}.webp" data-sd-count="120" data-sd-pad="3"><canvas></canvas></div>
  function initSequence(root = document) {
    const promises = [];
    desktopOnly(() => {
      $$('[data-sd-sequence]', root).forEach((wrap) => {
        const canvas = wrap.querySelector('canvas'); if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const pattern = wrap.getAttribute('data-sd-frames');
        const count = +wrap.getAttribute('data-sd-count') || 120;
        const pad = +wrap.getAttribute('data-sd-pad') || 3;
        const draw = (img) => {
          if (!img) return;
          canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
          const s = Math.max(canvas.width / img.width, canvas.height / img.height);
          ctx.drawImage(img, (canvas.width - img.width * s) / 2, (canvas.height - img.height * s) / 2, img.width * s, img.height * s);
        };
        const p = Promise.all(Array.from({ length: count }, (_, i) => new Promise((res) => {
          const im = new Image(); im.decoding = 'async';
          im.onload = () => res(im); im.onerror = () => res(null);
          im.src = pattern.replace('{i}', String(i).padStart(pad, '0'));
        }))).then((frames) => {
          frames = frames.filter(Boolean); if (!frames.length) return;
          draw(frames[0]);
          const state = { f: 0 };
          gsap.to(state, { f: frames.length - 1, snap: 'f', ease: 'none',
            scrollTrigger: { trigger: wrap, start: 'top top', end: '75% bottom', scrub: 0.25 },
            onUpdate: () => draw(frames[Math.round(state.f)]) });
        });
        promises.push(p);
      });
    });
    return Promise.all(promises);
  }

  /* ------------------------------------------------------------------ *
   * 7. HEADER: theme flip per section + hide on scroll down
   * ------------------------------------------------------------------ */
  // Sections carry data-sd-bg="dark|light"; fixed UI carries data-sd-theme-target.
  // Each target swaps .theme-dark/.theme-light when its own vertical centre crosses a section.
  function initThemeFlip(root = document) {
    const targets = $$('[data-sd-theme-target]'); if (!targets.length) return;
    $$('[data-sd-bg]', root).forEach((sec) => {
      if (getComputedStyle(sec).display === 'none') return;
      const add = 'theme-' + (sec.getAttribute('data-sd-bg') || 'light');   // light | dark | navy
      const all = ['theme-light', 'theme-dark', 'theme-navy'];
      targets.forEach((t) => {
        const line = () => { const r = t.getBoundingClientRect(); return r.top + r.height / 2; };
        const swap = () => { t.classList.remove(...all); t.classList.add(add); };
        ScrollTrigger.create({ trigger: sec, start: () => `top top+=${line()}`, end: () => `bottom top+=${line()}`, onEnter: swap, onEnterBack: swap });
      });
    });
  }
  function initHeaderHide() {
    const h = $('[data-sd-header]'); if (!h) return;
    const bg = h.querySelector('[data-sd-header-bg]');
    let last = scrollY, hidden = false, past = scrollY > 1000;
    if (bg) gsap.set(bg, { opacity: past ? 1 : 0 });
    ScrollTrigger.create({ start: 'top top', end: 'max', onUpdate: (self) => {
      const y = self.scroll(), d = Math.abs(y - last);
      const toBottom = document.documentElement.scrollHeight - (y + innerHeight);
      past = y > 1000;
      if (bg) gsap.to(bg, { opacity: past ? 1 : 0, duration: T.S, ease: E.out });
      if (d < 40) return;                      // ignore jitter
      if (toBottom <= 160) { gsap.to(h, { yPercent: 0, duration: T.M, ease: E.out }); hidden = false; last = y; return; }
      if (y > last && past && !hidden) { gsap.to(h, { yPercent: -100, duration: T.M, ease: E.out }); hidden = true; }
      else if (y < last && hidden) { gsap.to(h, { yPercent: 0, duration: T.M, ease: E.out }); hidden = false; }
      last = y;
    } });
  }

  /* ------------------------------------------------------------------ *
   * 8. POINTER EFFECTS (desktop only)
   * ------------------------------------------------------------------ */
  // Magnetic: data-sd-magnetic="25" (strength, em-scaled), inner: data-sd-magnetic-inner (+ data-sd-magnetic-inner-strength)
  function initMagnetic(root = document) {
    desktopOnly(() => {
      $$('[data-sd-magnetic]', root).forEach((el) => {
        const strength = parseFloat(el.getAttribute('data-sd-magnetic')) || 25;
        const innerStrength = parseFloat(el.getAttribute('data-sd-magnetic-inner-strength')) || strength;
        const inners = $$('[data-sd-magnetic-inner]', el);
        const move = (e) => {
          const r = el.getBoundingClientRect();
          const nx = (e.clientX - r.left) / el.offsetWidth - 0.5, ny = (e.clientY - r.top) / el.offsetHeight - 0.5;
          gsap.to(el, { x: nx * (strength / 16) + 'em', y: ny * (strength / 16) + 'em', rotate: '0.001deg', ease: 'power4.out', duration: 1.6 });
          inners.forEach((i) => gsap.to(i, { x: nx * (innerStrength / 16) + 'em', y: ny * (innerStrength / 16) + 'em', rotate: '0.001deg', ease: 'power4.out', duration: 2 }));
        };
        const leave = () => {
          gsap.to(el, { x: 0, y: 0, ease: 'elastic.out(1, 0.3)', duration: 1.6, clearProps: 'all' });
          inners.forEach((i) => gsap.to(i, { x: 0, y: 0, ease: 'elastic.out(1, 0.3)', duration: 2, clearProps: 'all' }));
        };
        el.addEventListener('mousemove', move);
        el.addEventListener('mouseleave', leave);
      });
    });
  }

  // Proximity pins: pins near the cursor swell (max 1.5x within 240px)
  function initProximity(root = document) {
    desktopOnly(() => {
      $$('[data-sd-proximity]', root).forEach((map) => {
        const pins = $$('[data-sd-pin]', map);
        const max = parseFloat(map.getAttribute('data-sd-proximity')) || 1.5, radius = 240;
        map.addEventListener('mousemove', (e) => pins.forEach((p) => {
          const r = p.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          gsap.to(p, { scale: d < radius ? max - (d / radius) * (max - 1) : 1, duration: T.L, ease: E.out });
        }));
        map.addEventListener('mouseleave', () => gsap.to(pins, { scale: 1, duration: T.L, ease: E.out }));
      });
    });
  }

  // Char-swap hover: two stacked labels; chars of #1 pop out up, #2 pop in from below, random order
  function initHoverSwap(root = document) {
    desktopOnly(() => {
      $$('[data-sd-hover-swap]', root).forEach((el) => {
        const labels = $$('[data-sd-hover-text]', el); if (labels.length < 2) return;
        const a = new SplitText(labels[0], { type: 'chars', tag: 'span', charsClass: 'sd-char', smartWrap: true }).chars;
        const b = new SplitText(labels[1], { type: 'chars', tag: 'span', charsClass: 'sd-char', smartWrap: true }).chars;
        const st = { each: T.stagger * 0.25, from: 'random' };
        gsap.set(b, { yPercent: 75, opacity: 0, scale: 0 });
        const trigger = el.closest('[data-sd-hover-swap-trigger]') || el;
        trigger.addEventListener('mouseenter', () => {
          gsap.fromTo(a, { opacity: 1, yPercent: 0, scale: 1 }, { opacity: 0, yPercent: -75, scale: 0, duration: T.M, ease: E.out, stagger: st, overwrite: true });
          gsap.fromTo(b, { opacity: 0, yPercent: 75, scale: 0 }, { opacity: 1, yPercent: 0, scale: 1, duration: T.M, delay: T.delay, ease: E.out, stagger: st, overwrite: true });
        });
        trigger.addEventListener('mouseleave', () => {
          gsap.to(a, { opacity: 1, yPercent: 0, scale: 1, duration: T.M, delay: T.delay, ease: E.out, stagger: st, overwrite: true });
          gsap.to(b, { opacity: 0, yPercent: 75, scale: 0, duration: T.M, ease: E.out, stagger: st, overwrite: true });
        });
      });
    });
  }

  // Dim siblings: hovering one item fades the others to 20%
  function initDimGroup(root = document) {
    desktopOnly(() => {
      $$('[data-sd-dim-group]', root).forEach((g) => {
        const items = Array.from(g.children);
        items.forEach((it) => {
          it.addEventListener('mouseenter', () => items.forEach((o) => o !== it
            ? gsap.to(o, { opacity: 0.2, duration: T.M, ease: E.out, overwrite: true })
            : gsap.to(o, { opacity: 1, duration: T.S * 0.25, ease: E.out, overwrite: true })));
          it.addEventListener('mouseleave', () => gsap.to(items, { opacity: 1, duration: T.S, ease: E.out, overwrite: true }));
        });
      });
    });
  }

  // Floating tips: a pill that pops open (clip from centre) and lazily follows the cursor
  //   tip: <div data-sd-tip="drag">Drag</div>   trigger: <div data-sd-tip-btn="drag">
  function initTips() {
    desktopOnly(() => {
      const tips = {}; const live = new Set();
      $$('[data-sd-tip]').forEach((t) => { tips[t.getAttribute('data-sd-tip')] = t; gsap.set(t, { display: 'none', position: 'fixed', left: 0, top: 0, pointerEvents: 'none', zIndex: 9000 }); });
      const off = 1.388 * parseFloat(getComputedStyle(document.documentElement).fontSize);
      const R = 'var(--sd-radius, 1.5rem)';
      document.addEventListener('mousemove', (e) => live.forEach((t) => gsap.to(t, { x: e.clientX + off, y: e.clientY + off, duration: T.L, ease: 'power3' })));
      $$('[data-sd-tip-btn]').forEach((btn) => {
        const tip = tips[btn.getAttribute('data-sd-tip-btn')]; if (!tip) return;
        btn.addEventListener('mouseenter', (e) => {
          live.add(tip); gsap.killTweensOf(tip);
          gsap.set(tip, { display: 'flex', scale: 2, opacity: 1, clipPath: `inset(0% 50% 0% 50% round ${R})`, x: e.clientX + off, y: e.clientY + off });
          gsap.to(tip, { scale: 1, clipPath: `inset(0% 0% 0% 0% round ${R})`, duration: T.M, ease: E.out });
        });
        btn.addEventListener('mouseleave', () => {
          live.delete(tip); gsap.killTweensOf(tip);
          gsap.to(tip, { scale: 0.5, opacity: 0, duration: T.S, ease: E.in, onComplete: () => (tip.style.display = 'none') });
        });
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 9. COMPONENTS
   * ------------------------------------------------------------------ */
  // Marquee whose speed (and direction!) follows scroll velocity
  function initMarquee(root = document) {
    $$('[data-sd-marquee]', root).forEach((m) => {
      const lists = $$('[data-sd-marquee-list]', m); if (!lists.length) return;
      const tl = gsap.timeline({ repeat: -1 }).to(lists, { duration: +m.getAttribute('data-sd-marquee') || 24, xPercent: -100, ease: 'none' });
      let settle;
      ScrollTrigger.create({ trigger: m, start: 'top bottom', end: 'bottom top',
        onToggle: (s) => (s.isActive ? tl.play() : tl.pause()),
        onUpdate: (s) => {
          tl.timeScale(1 + 0.01 * s.getVelocity());
          clearTimeout(settle); settle = setTimeout(() => gsap.to(tl, { timeScale: 1, duration: T.M, ease: E.out }), 120);
        } });
    });
  }

  // Expanding benefit card (click): info panel wipes down from the top
  function initExpandCards(root = document) {
    $$('[data-sd-expand]', root).forEach((card) => {
      const info = card.querySelector('[data-sd-expand-info]');
      const name = card.querySelector('[data-sd-expand-name]');
      const icon = card.querySelector('[data-sd-expand-icon]');
      const h = $$('[data-sd-expand-h]', card), p = $$('[data-sd-expand-p]', card), r = $$('[data-sd-expand-rule]', card);
      let open = false; gsap.set(info, { display: 'none' });
      card.addEventListener('click', () => {
        open = !open;
        if (open) {
          gsap.set(card, { zIndex: 16 }); name && name.classList.add('is-open', 'theme-dark');
          gsap.fromTo(info, { display: 'block', clipPath: 'inset(0% 0% 100% 0%)', scale: 1.1 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: T.L, ease: E.out, overwrite: true });
          icon && gsap.to(icon, { rotate: 90, duration: T.S, ease: E.inOut, overwrite: true });
          words(h, 'reveal'); lines(p, 'reveal'); rule(r, 'reveal');
        } else {
          gsap.set(card, { zIndex: '' }); name && name.classList.remove('is-open', 'theme-dark');
          gsap.to(info, { clipPath: 'inset(100% 0% 0% 0%)', scale: 0.75, duration: T.M, delay: T.delay, ease: E.inOut, overwrite: true, onComplete: () => gsap.set(info, { display: 'none' }) });
          icon && gsap.to(icon, { rotate: 0, duration: T.S, ease: E.inOut, overwrite: true });
          words(h, 'hide'); lines(p, 'hide'); rule(r, 'hide');
        }
      });
    });
  }

  // Accordion (one open at a time); the "+" vertical bar rotates 90 (open) / 180 (close)
  function initAccordion(root = document) {
    let current = null;
    $$('[data-sd-acc]', root).forEach((item) => {
      const btn = item.querySelector('[data-sd-acc-btn]'), body = item.querySelector('[data-sd-acc-body]');
      const icon = item.querySelector('[data-sd-acc-icon]'), paras = $$('[data-sd-acc-p]', item);
      if (!btn || !body) return;
      gsap.set(body, { height: 0, overflow: 'hidden' });
      const open = () => { gsap.to(body, { height: 'auto', duration: T.L, ease: E.out, onComplete: () => ScrollTrigger.refresh() });
        icon && gsap.fromTo(icon, { rotate: 0 }, { rotate: 90, duration: T.M, ease: E.inOut, overwrite: true }); lines(paras, 'reveal'); };
      const close = () => { gsap.to(body, { height: 0, duration: T.L, ease: E.out, overwrite: true, onComplete: () => ScrollTrigger.refresh() });
        icon && gsap.to(icon, { rotate: 180, duration: T.M, ease: E.inOut, overwrite: true }); lines(paras, 'hide'); };
      item._sdClose = close;
      btn.addEventListener('click', () => {
        if (current && current !== item) current._sdClose();
        if (current !== item) { open(); current = item; } else { close(); current = null; }
      });
    });
  }

  // Clip slider: next slide wipes in from the side while old image pushes to 1.5x and new settles 1.5→1
  function initClipSlider(root = document) {
    $$('[data-sd-slider]', root).forEach((s) => {
      const slides = $$('[data-sd-slide]', s), imgs = slides.map((sl) => sl.querySelector('img, video, canvas') || sl);
      const prev = s.querySelector('[data-sd-prev]'), next = s.querySelector('[data-sd-next]');
      const cur = s.querySelector('[data-sd-current]'), tot = s.querySelector('[data-sd-total]');
      if (slides.length < 2 || !prev || !next) return;
      const FROM_R = 'inset(0% 0% 0% 100%)', FROM_L = 'inset(0% 100% 0% 0%)', FULL = 'inset(0% 0% 0% 0%)';
      let i = 0, busy = false;
      gsap.set(slides, { clipPath: FROM_L }); gsap.set(slides[0], { clipPath: FULL });
      const count = () => { cur && (cur.textContent = String(i + 1).padStart(2, '0')); tot && (tot.textContent = String(slides.length).padStart(2, '0')); };
      const go = (dir) => {
        if (busy) return; busy = true;
        const p = i; i = (i + dir + slides.length) % slides.length; count();
        slides[p].style.zIndex = 1; slides[i].style.zIndex = 2;
        gsap.fromTo(imgs[p], { scale: 1 }, { scale: 1.5, duration: T.L, ease: E.ease });
        gsap.timeline({ onComplete: () => { slides[p].style.zIndex = ''; slides[i].style.zIndex = 1; busy = false; } })
          .fromTo(slides[i], { clipPath: dir > 0 ? FROM_R : FROM_L }, { clipPath: FULL, duration: T.L, ease: E.ease })
          .fromTo(imgs[i], { scale: 1.5 }, { scale: 1, duration: T.L, ease: E.ease }, '<');
      };
      prev.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1)); count();
    });
  }

  // Text slider w/ autoplay + SVG circle progress, pauses off-screen
  function initTextSlider(root = document) {
    $$('[data-sd-textslider]', root).forEach((s) => {
      const slides = $$('[data-sd-slide]', s);
      const H = slides.map((x) => $$('[data-sd-slide-h]', x)), P = slides.map((x) => $$('[data-sd-slide-p]', x));
      const C = slides.map((x) => x.querySelector('[data-sd-slide-circle]')), R = slides.map((x) => x.querySelector('[data-sd-slide-progress]'));
      const prev = s.querySelector('[data-sd-prev]'), next = s.querySelector('[data-sd-next]');
      const dur = +s.getAttribute('data-sd-textslider') || 6;
      if (slides.length < 2) return;
      let i = 0, busy = false, timer = null;
      gsap.set(slides, { display: 'none', position: 'absolute' }); gsap.set(slides[0], { display: 'block', position: 'relative' });
      const progress = () => { const c = R[i]; if (!c) return; const len = 2 * Math.PI * c.r.baseVal.value;
        c.style.strokeDasharray = len; gsap.fromTo(c, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: dur - T.M, ease: 'none', delay: T.M }); };
      const swap = (dir) => {
        const p = i; i = (i + dir + slides.length) % slides.length;
        gsap.timeline({ onComplete: () => (busy = false) })
          .call(() => { words(H[p], 'hide', 0); lines(P[p], 'hide', 0); }, null, 0)
          .to(C[p] || {}, { opacity: 0, scale: 1.25, duration: T.S, ease: E.in }, 0)
          .set(slides[p], { display: 'none', position: 'absolute', delay: 0.1 })
          .set(slides[i], { display: 'block', position: 'relative' })
          .call(() => { words(H[i], 'reveal', 0); lines(P[i], 'reveal', 0); })
          .fromTo(C[i] || {}, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: T.L, ease: E.out }, '<');
        progress();
      };
      const stop = () => { clearInterval(timer); timer = null; R[i] && gsap.killTweensOf(R[i]); };
      const start = () => { stop(); progress(); timer = setInterval(() => { if (!busy) { busy = true; swap(1); } }, dur * 1000); };
      new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(s);
      prev && prev.addEventListener('click', () => { if (busy) return; stop(); busy = true; swap(-1); start(); });
      next && next.addEventListener('click', () => { if (busy) return; stop(); busy = true; swap(1); start(); });
    });
  }

  // Swing tabs: old panel swings out left (rotate 15), new swings in from right (rotate -15)
  function initSwingTabs(root = document) {
    $$('[data-sd-tabs]', root).forEach((w) => {
      const btns = $$('[data-sd-tab]', w); if (!btns.length) return;
      let cur = btns[0].getAttribute('data-sd-tab'); btns[0].classList.add('is-active');
      const panel = (k) => w.querySelector(`[data-sd-tab-panel="${k}"]`);
      $$('[data-sd-tab-panel]', w).forEach((p, idx) => gsap.set(p, { display: idx ? 'none' : 'block' }));
      btns.forEach((b) => b.addEventListener('click', () => {
        const k = b.getAttribute('data-sd-tab'); if (k === cur) return;
        const a = panel(cur), n = panel(k); gsap.killTweensOf([a, n]);
        gsap.set(a, { display: 'block', position: 'absolute', transformOrigin: 'top bottom' });
        gsap.set(n, { display: 'block', position: 'relative', transformOrigin: 'top bottom', xPercent: 125, rotate: -15 });
        gsap.to(a, { xPercent: -125, rotate: 15, duration: T.L, ease: E.inOut, onComplete: () => (a.style.display = 'none') });
        gsap.to(n, { xPercent: 0, rotate: 0, duration: T.L, ease: E.inOut });
        btns.forEach((x) => x.classList.toggle('is-active', x === b)); cur = k; ScrollTrigger.refresh();
      }));
    });
  }

  // Text tabs: headline words pop out, new ones pop in
  function initTextTabs(root = document) {
    $$('[data-sd-texttabs]', root).forEach((w) => {
      const btns = $$('[data-sd-tab]', w); if (!btns.length) return;
      let cur = btns[0].getAttribute('data-sd-tab'); btns[0].classList.add('is-active');
      const panel = (k) => w.querySelector(`[data-sd-tab-panel="${k}"]`);
      $$('[data-sd-tab-panel]', w).forEach((p, idx) => gsap.set(p, { display: idx ? 'none' : 'block' }));
      btns.forEach((b) => b.addEventListener('click', () => {
        const k = b.getAttribute('data-sd-tab'); if (k === cur) return;
        const a = panel(cur), n = panel(k);
        gsap.timeline({ onComplete: () => ScrollTrigger.refresh() })
          .call(() => { words($$('[data-sd-tab-h]', a), 'hide', 0); block($$('[data-sd-tab-ctn]', a), 'hide', 0); })
          .set(a, { display: 'none', position: 'absolute', delay: T.M })
          .set(n, { display: 'block', position: 'relative' })
          .call(() => { words($$('[data-sd-tab-h]', n), 'reveal', 0); block($$('[data-sd-tab-ctn]', n), 'reveal', 0); });
        btns.forEach((x) => x.classList.toggle('is-active', x === b)); cur = k;
      }));
    });
  }

  // Sliding pill highlight behind the active tab
  function initPill(root = document) {
    $$('[data-sd-pill]', root).forEach((w) => {
      const btns = $$('[data-sd-tab], [data-sd-pill-btn]', w), pill = w.querySelector('[data-sd-pill-bg]');
      if (!btns.length || !pill) return;
      const move = (b, instant) => { if (!b) return;
        gsap.timeline().to(pill, { x: b.offsetLeft, width: b.offsetWidth, duration: instant ? 0 : T.M, ease: E.inOut })
          .add(() => { btns.forEach((x) => x.classList.remove('theme-light')); b.classList.add('theme-light'); }, '<50%'); };
      move(w.querySelector('.is-active') || btns[0], true);
      btns.forEach((b) => b.addEventListener('click', () => { btns.forEach((x) => x.classList.remove('is-active')); b.classList.add('is-active'); move(b); }));
      addEventListener('resize', () => move(w.querySelector('.is-active') || btns[0], true));
    });
  }

  // Path-drag switcher: drag a knob along an SVG path; snaps to either end; fires A/B
  //   <svg data-sd-pathswitch><path data-sd-path/><circle data-sd-knob/><circle data-sd-start/><circle data-sd-end/></svg>
  //   buttons elsewhere: [data-sd-pathswitch-a] [data-sd-pathswitch-b]
  function initPathSwitch(root = document) {
    $$('[data-sd-pathswitch]', root).forEach((svg) => {
      const path = svg.querySelector('[data-sd-path]'), knob = svg.querySelector('[data-sd-knob]');
      const A = $('[data-sd-pathswitch-a]'), B = $('[data-sd-pathswitch-b]');
      if (!path || !knob) return;
      const len = path.getTotalLength(); let t = 0, drag = false, side = null;
      const pt = (u) => path.getPointAtLength(u * len);
      const place = (u) => { const p = pt(u); gsap.set(knob, { attr: { cx: p.x, cy: p.y } }); };
      const fire = (u) => { const s = u < 0.4 ? 'a' : u > 0.5 ? 'b' : null; if (s && s !== side) { (s === 'a' ? A : B)?.click(); side = s; } };
      const tweenTo = (u) => { const o = { v: t }; gsap.to(o, { v: u, duration: T.M, ease: E.ease, onUpdate: () => { t = o.v; place(t); fire(t); } }); };
      place(0);
      const toLocal = (e) => { const pt0 = svg.createSVGPoint(); const c = e.touches ? e.touches[0] : e; pt0.x = c.clientX; pt0.y = c.clientY; return pt0.matrixTransform(svg.getScreenCTM().inverse()); };
      const move = (e) => { if (!drag) return; const m = toLocal(e); let best = 0, bd = Infinity;
        for (let k = 0; k <= 100; k++) { const p = pt(k / 100), d = Math.hypot(p.x - m.x, p.y - m.y); if (d < bd) { bd = d; best = k / 100; } }
        t = best; place(t); fire(t); };
      const up = () => { if (!drag) return; drag = false; knob.style.cursor = 'grab'; tweenTo(t < 0.5 ? 0 : 1); };
      knob.style.cursor = 'grab';
      ['mousedown', 'touchstart'].forEach((ev) => knob.addEventListener(ev, () => { drag = true; knob.style.cursor = 'grabbing'; }, { passive: true }));
      ['mousemove', 'touchmove'].forEach((ev) => document.addEventListener(ev, move, { passive: true }));
      ['mouseup', 'touchend'].forEach((ev) => document.addEventListener(ev, up));
      svg.querySelector('[data-sd-start]')?.addEventListener('click', () => tweenTo(0));
      svg.querySelector('[data-sd-end]')?.addEventListener('click', () => tweenTo(1));
    });
  }

  // Auto-numbering: 01, 02, 03…
  function initIndex(root = document) {
    $$('[data-sd-index]', root).forEach((w) => { let n = 0;
      Array.from(w.children).forEach((c) => { const t = c.querySelector('[data-sd-index-text]'); if (t) t.textContent = String(++n).padStart(2, '0'); }); });
  }

  // Sound toggle: ambient loop fades in/out; bars become a live equaliser
  function initSound() {
    const btns = $$('[data-sd-sound]'); if (!btns.length) return;
    const src = btns[0].getAttribute('data-sd-sound'); if (!src) return;
    const audio = global.__sdAudio || (global.__sdAudio = Object.assign(new Audio(src), { loop: true, volume: 0, preload: 'none' }));
    const target = 0.25;
    const bars = (b) => { const kids = Array.from(b.querySelector('[data-sd-sound-bars]')?.children || []); if (!kids.length) return;
      const on = b.classList.contains('is-playing'); gsap.killTweensOf(kids);
      kids.forEach((k, i) => { const mid = (kids.length - 1) / 2, h = on ? 100 - 15 * Math.abs(i - mid) : 25;
        gsap.timeline().to(k, { scaleY: h / 100, duration: T.M, ease: E.ease })
          .to(k, { scaleY: (h * 0.6) / 100, duration: 0.3 + 0.3 * Math.random(), ease: E.ease, delay: 0.5 * Math.random(), repeat: -1, yoyo: true, repeatDelay: 0.2 * Math.random() }, T.M); }); };
    btns.forEach((b) => { bars(b); b.addEventListener('click', () => {
      const on = !audio.paused && audio.volume > 0;
      if (on) gsap.to(audio, { volume: 0, duration: T.M, onComplete: () => audio.pause() });
      else { audio.play().catch(() => {}); gsap.to(audio, { volume: target, duration: T.M }); }
      btns.forEach((x) => { x.classList.toggle('is-playing', !on); bars(x); });
    }); });
  }

  /* ------------------------------------------------------------------ *
   * 10. MODALS
   * ------------------------------------------------------------------ */
  // CTA modal: card flips down out of the top (rotateX -90, rotate -25) and falls away on close
  function initCtaModal() {
    $$('[data-sd-modal-open]').forEach((opener) => {
      const id = opener.getAttribute('data-sd-modal-open');
      const modal = $(`[data-sd-modal="${id}"]`); if (!modal) return;
      const card = modal.querySelector('[data-sd-modal-card]'), over = modal.querySelector('[data-sd-modal-over]');
      const H = $$('[data-sd-modal-h]', modal), C = $$('[data-sd-modal-ctn]', modal), L = $$('[data-sd-modal-rule]', modal);
      gsap.set(modal, { display: 'none' }); gsap.set(card, { transformPerspective: 1000 });
      let open = false;
      opener.addEventListener('click', (e) => { e.preventDefault(); if (open) return; open = true;
        gsap.set(modal, { display: 'block' });
        gsap.fromTo(card, { scale: 0, rotateX: -90, yPercent: -100, rotate: -25 }, { scale: 1, rotateX: 0, yPercent: 0, rotate: 0, duration: T.L, ease: E.out, overwrite: true });
        over && gsap.fromTo(over, { opacity: 0 }, { opacity: 1, duration: T.L, ease: E.out, overwrite: true });
        words(H, 'reveal'); block(C, 'reveal', 0.3); rule(L, 'reveal', 0.3); lockScroll(); });
      $$('[data-sd-modal-close]', modal).forEach((c) => c.addEventListener('click', (e) => { e.preventDefault(); if (!open) return; open = false;
        gsap.to(card, { scale: 1, rotateX: 90, yPercent: 200, rotate: 25, duration: T.M, ease: E.in, overwrite: true });
        gsap.to(over || {}, { opacity: 0, duration: T.M, ease: E.in, overwrite: true, onComplete: () => gsap.set(modal, { display: 'none' }) });
        unlockScroll(); }));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) modal.querySelector('[data-sd-modal-close]')?.click(); });
    });
  }

  // Menu: full-screen panel revealed by a soft gradient mask sliding up (CSS vars --sd-mask-y)
  function initMenu() {
    const btn = $('[data-sd-menu-open]'), menu = $('[data-sd-menu]'); if (!btn || !menu) return;
    const top = btn.querySelector('[data-sd-burger="top"]'), mid = btn.querySelector('[data-sd-burger="mid"]'), bot = btn.querySelector('[data-sd-burger="bot"]');
    const H = $$('[data-sd-menu-h]', menu), C = $$('[data-sd-menu-ctn]', menu);
    const header = $('[data-sd-header]'); let open = false;
    gsap.set(menu, { display: 'none' });
    const toggle = (want) => { open = want ?? !open;
      header && header.classList.toggle('theme-navy', open); btn.classList.toggle('is-open', open);
      if (open) {
        gsap.fromTo(menu, { display: 'block', '--sd-mask-y': '200%', opacity: 1 }, { '--sd-mask-y': '0%', duration: 1.5 * T.L, ease: E.out, overwrite: true });
        const tl = gsap.timeline({ defaults: { duration: T.S, ease: E.inOut } });
        const centre = (el) => el ? el.offsetTop + el.offsetHeight / 2 : 0;
        const c = mid ? centre(mid) : (centre(top) + centre(bot)) / 2;
        tl.to(top, { y: c - centre(top), overwrite: true }).to(bot, { y: c - centre(bot), overwrite: true }, '<');
        mid && tl.to(mid, { scaleX: 0 }, '<');
        tl.to(top, { rotate: 45 }).to(bot, { rotate: -45 }, '<');
        words(H, 'reveal', 0.4); block(C, 'reveal', 0.4); lockScroll();
      } else {
        gsap.to(menu, { opacity: 0, duration: T.M, ease: E.out, delay: 0.4, overwrite: true, onComplete: () => gsap.set(menu, { display: 'none' }) });
        const tl = gsap.timeline({ defaults: { duration: T.S, ease: E.inOut } });
        tl.to([top, bot], { rotate: 0 }).to([top, bot], { y: 0 });
        mid && tl.to(mid, { scaleX: 1 }, '<');
        words(H, 'hide'); block(C, 'hide'); unlockScroll();
      } };
    btn.addEventListener('click', () => toggle());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) toggle(false); });
    $$('[data-sd-menu-close], [data-sd-menu] a[href^="#"]').forEach((c) => c.addEventListener('click', () => open && toggle(false)));
  }

  /* ------------------------------------------------------------------ *
   * 11. PAGE TRANSITION: 20×12 grid of cells, each scaleX 0→1, staggered from the corner
   *    <div class="sd-transition" data-sd-transition> (cells are generated) <div data-sd-transition-over></div></div>
   * ------------------------------------------------------------------ */
  const GRID = [20, 12];
  function buildTransition() {
    let t = $('[data-sd-transition]');
    if (!t) { t = document.createElement('div'); t.className = 'sd-transition'; t.setAttribute('data-sd-transition', ''); document.body.appendChild(t); }
    if (!t.querySelector('.sd-transition-cell')) {
      const grid = document.createElement('div'); grid.className = 'sd-transition-grid';
      for (let r = 0; r < GRID[1]; r++) { const row = document.createElement('div'); row.className = 'sd-transition-row';
        for (let c = 0; c < GRID[0]; c++) { const cell = document.createElement('div'); cell.className = 'sd-transition-cell'; row.appendChild(cell); }
        grid.appendChild(row); }
      t.prepend(grid);
    }
    return t;
  }
  function transition(mode) {
    const t = buildTransition(), cells = $$('.sd-transition-cell', t), over = $$('[data-sd-transition-over]', t);
    const st = { each: 0.03, from: 'end', grid: GRID };
    if (mode === 'init') { gsap.set(t, { display: 'flex' }); gsap.set(cells, { scaleX: 1 }); gsap.set(over, { opacity: 1 }); return gsap.timeline(); }
    if (mode === 'in') return gsap.timeline().set(t, { display: 'flex' })
      .fromTo(cells, { scaleX: 0 }, { scaleX: 1, duration: T.S, ease: E.inOut, stagger: st })
      .fromTo(over, { opacity: 0 }, { opacity: 1, duration: T.L, ease: E.inOut }, 0);
    return gsap.timeline({ onComplete: () => gsap.set(t, { display: 'none' }) }).set(t, { display: 'flex' })
      .fromTo(cells, { scaleX: 1 }, { scaleX: 0, duration: T.S, ease: E.inOut, stagger: st })
      .fromTo(over, { opacity: 1 }, { opacity: 0, duration: T.L, ease: E.inOut }, 0);
  }
  // Without Barba: intercept same-origin links, play "in", then navigate. On load the preloader plays "out".
  function initLinkTransitions() {
    if (global.barba) return initBarba();
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || a.hasAttribute('data-sd-no-transition') || a.hasAttribute('download')) return;
      e.preventDefault(); lockScroll(); transition('in').then(() => (location.href = url.href));
    });
  }
  function initBarba() {
    let isBack = false; addEventListener('popstate', () => (isBack = true));
    global.barba.init({ transitions: [{ name: 'sd-grid',
      async leave({ current }) { sessionStorage.setItem('sd-scroll:' + location.pathname, lenis ? lenis.scroll : scrollY);
        await transition('in'); ScrollTrigger.getAll().forEach((s) => s.kill()); SD.scenes.destroy(); current.container.remove(); },
      async enter() { await transition('out'); },
      beforeEnter({ next }) { const y = isBack ? +sessionStorage.getItem('sd-scroll:' + new URL(next.url.href).pathname) || 0 : 0;
        requestAnimationFrame(() => lenis && lenis.scrollTo(y, { immediate: true })); initModules(next.container); ScrollTrigger.refresh(); },
      afterEnter() { isBack = false; } }] });
  }

  /* ------------------------------------------------------------------ *
   * 12. PRELOADER  (first visit: logo + % counter + Flip into header; repeat visit: short wipe)
   *   <div data-sd-preloader>
   *     <div data-sd-preloader-logo>LOGO</div> <p data-sd-preloader-p>…</p> <span data-sd-preloader-percent>0%</span>
   *   </div>
   *   Header slot to land in: [data-sd-logo-slot]. Hero media to settle: [data-sd-intro-media]
   *   Hero copy: [data-sd-intro="h|p|ctn"]
   * ------------------------------------------------------------------ */
  function runPreloader(loadPromise) {
    const pre = $('[data-sd-preloader]');
    const introH = $$('[data-sd-intro="h"]'), introP = $$('[data-sd-intro="p"]'), introC = $$('[data-sd-intro="ctn"]');
    words(introH, 'initial'); lines(introP, 'initial'); block(introC, 'initial');
    const revealIntro = () => { words(introH, 'reveal'); lines(introP, 'reveal'); block(introC, 'reveal'); };
    let visited = false; try { visited = sessionStorage.getItem('sd-visited'); sessionStorage.setItem('sd-visited', '1'); } catch (e) {}
    const done = () => { if (pre) gsap.set(pre, { display: 'none' }); unlockScroll(); };
    lockScroll();
    if (!pre || visited || reduced) {
      transition('init');
      return Promise.resolve(loadPromise).then(() => new Promise((res) => { transition('out'); gsap.delayedCall(T.S, () => { done(); revealIntro(); res(); }); }));
    }
    const logo = pre.querySelector('[data-sd-preloader-logo]'), pct = pre.querySelector('[data-sd-preloader-percent]');
    const ps = $$('[data-sd-preloader-p]', pre), slot = $('[data-sd-logo-slot]'), media = $('[data-sd-intro-media]');
    transition('init'); lines(ps, 'reveal');
    return new Promise((resolve) => {
      gsap.timeline()
        .fromTo(pct, { opacity: 0 }, { opacity: 1, duration: T.L, delay: T.delay, ease: E.out })
        .fromTo(logo, { opacity: 0, yPercent: 25 }, { opacity: 1, yPercent: 0, duration: T.L, delay: T.delay, ease: E.out }, '<')
        .to({}, { duration: T.L })
        .add(() => {
          const tracked = SD.scenes.trackProgress((n, total) => pct && (pct.textContent = Math.round((n / total) * 100) + '%'));
          Promise.all([loadPromise, tracked, document.fonts ? document.fonts.ready : 0]).then(() => {
            pct && (pct.textContent = '100%');
            lines(ps, 'hide'); gsap.to(pct, { opacity: 0, duration: T.S, ease: E.in });
            transition('out');
            const tl = gsap.timeline({ onComplete: () => { done(); resolve(); } });
            if (media) tl.fromTo(media, { scale: 1.5 }, { scale: 1, duration: 2 * T.L, ease: E.out }, 0);
            if (logo && slot && Flip) { const state = Flip.getState(logo); slot.appendChild(logo); tl.add(Flip.from(state, { duration: 1.5 * T.L, ease: E.inOut }), 0); }
            tl.add(revealIntro, T.L);
          });
        });
    });
  }

  /* ------------------------------------------------------------------ *
   * 13. LINOCUT CANVAS — the signature WebGL "engraved line" renderer
   *     See references/linocut-canvas.md for the full explanation.
   * ------------------------------------------------------------------ */
  const DEFAULTS = { gamma: 1, blackPoint: 0, whitePoint: 255, threshold: 255, xSquares: 100, ySquares: 100,
    minSquareWidth: '-2%', maxSquareWidth: '102%', x: 0, y: 0, width: '100%', height: '100%', bgOpacity: 1, fillOpacity: 1 };
  const VERT = 'attribute vec2 a_position;attribute vec2 a_texCoord;varying vec2 v_uv;void main(){gl_Position=vec4(a_position,0.,1.);v_uv=a_texCoord;}';
  const makeFrag = (k) => {
    let probes = '';
    for (let dx = -k; dx <= k; dx++) for (let dy = -k; dy <= k; dy++) { if (!dx && !dy) continue;
      probes += `n=texture2D(u_tex,cc+vec2(${dx.toFixed(1)},${dy.toFixed(1)})*ts);if(n.a<.01||(n.r<.01&&n.g<.01&&n.b<.01))discard;`; }
    return `precision mediump float;
uniform sampler2D u_tex;uniform vec2 u_texSize,u_grid;uniform float u_minW,u_maxW,u_thr,u_gamma,u_bp,u_wp,u_bgA,u_fillA;
uniform vec3 u_bg,u_fill;uniform vec4 u_bounds;
void main(){
  vec2 p=gl_FragCoord.xy,b0=u_bounds.xy,b1=u_bounds.zw;
  if(p.x<b0.x||p.x>b1.x||p.y<b0.y||p.y>b1.y)discard;
  vec2 lc=(p-b0)/(b1-b0),cs=1./u_grid,ci=floor(lc/cs),cc=(ci+.5)*cs;
  vec4 tc=texture2D(u_tex,cc);
  if(tc.a<.01||(tc.r<.01&&tc.g<.01&&tc.b<.01))discard;   /* pure black / transparent = hole (keying) */
  vec2 ts=1./u_texSize;vec4 n;${probes}                     /* erode edges so cut-outs stay crisp */
  vec3 rgb=tc.rgb;if(u_gamma!=1.)rgb=pow(rgb,vec3(u_gamma));
  float range=u_wp-u_bp;if(range!=0.)rgb=clamp((rgb*255.-u_bp)/range,0.,1.);  /* levels; bp>wp inverts */
  float br=dot(rgb,vec3(.333))*tc.a;
  if(br>u_thr/255.){gl_FragColor=vec4(u_bg,u_bgA);return;}
  vec2 cl=(lc-ci*cs)/cs;                                     /* position inside the cell 0..1 */
  float lw=((1.-br)*(u_maxW-u_minW)+u_minW)/(b1.x-b0.x)*u_grid.x; /* darker = wider bar */
  gl_FragColor=abs(cl.x-.5)<lw*.5?vec4(u_fill,u_fillA):vec4(u_bg,u_bgA);
}`;
  };
  const hex = (h) => { h = (h || '#000').replace('#', '').trim(); if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };

  function linocut(canvas, layers, opts = {}) {
    if (!canvas) return null;
    const DPR_MAX = 1.5, ERODE = 2, FRAME = 1000 / (opts.fps || 60);
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    if (!gl) { canvas.classList.add('sd-no-webgl'); return null; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error('[sd] shader', gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, makeFrag(ERODE)));
    gl.linkProgram(prog); gl.useProgram(prog);
    const U = {}; ['u_tex', 'u_texSize', 'u_grid', 'u_minW', 'u_maxW', 'u_thr', 'u_gamma', 'u_bp', 'u_wp', 'u_bg', 'u_fill', 'u_bgA', 'u_fillA', 'u_bounds']
      .forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));
    const buf = (arr, attr) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, attr); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); return b; };
    const bPos = buf([-1, -1, 1, -1, -1, 1, 1, 1], 'a_position'), bUV = buf([0, 1, 1, 1, 0, 0, 1, 0], 'a_texCoord');
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.uniform1i(U.u_tex, 0);

    // Ink + paper come from CSS vars so the canvas follows the theme
    const colors = () => { const cs = getComputedStyle(canvas);
      gl.uniform3fv(U.u_bg, hex(cs.getPropertyValue('--sd-paper').trim() || '#fffcf6'));
      gl.uniform3fv(U.u_fill, hex(cs.getPropertyValue('--sd-ink').trim() || '#1d2b3a')); };
    colors();

    let W = 0, H = 0, cssW = 1, visible = false, raf = 0, lastT = 0, items = [];
    const resize = () => { const d = Math.min(devicePixelRatio || 1, DPR_MAX);
      W = Math.round(canvas.offsetWidth * d); H = Math.round(canvas.offsetHeight * d); cssW = canvas.offsetWidth;
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; gl.viewport(0, 0, W, H); } };
    resize();
    const ro = new ResizeObserver(() => { resize(); visible && render(); }); ro.observe(canvas);
    // unit parser: "40%" of axis, "45vw" relative to canvas width (keeps aspect ratio), plain number = device px
    const px = (v, axis) => typeof v !== 'string' ? v : v.endsWith('%') ? (parseFloat(v) / 100) * axis
      : v.endsWith('vw') ? (parseFloat(v) / 100) * cssW * Math.min(devicePixelRatio || 1, DPR_MAX) : parseFloat(v);

    const newTex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]
        .forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v)); return t; };
    const upload = (src) => gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);

    const load = (L) => new Promise((res) => {
      if (L.type === 'canvas') { const tex = newTex(); upload(L.el); return res({ ...L, tex, w: L.el.width, h: L.el.height }); }
      if (L.type === 'video') {
        const v = document.createElement('video'); Object.assign(v, { muted: true, playsInline: true, loop: L.loop !== false, preload: 'auto', crossOrigin: 'anonymous' });
        ['muted', 'playsinline', 'webkit-playsinline'].forEach((a) => v.setAttribute(a, ''));
        (L.sources || [{ src: L.src }]).forEach((s) => { const so = document.createElement('source'); so.src = s.src; if (s.type) so.type = s.type; v.appendChild(so); });
        const tex = newTex(); let ok = false;
        const ready = () => { if (ok || v.readyState < 2) return; ok = true; gl.bindTexture(gl.TEXTURE_2D, tex); upload(v); visible && v.play().catch(() => {});
          res({ ...L, el: v, tex, w: v.videoWidth || 1920, h: v.videoHeight || 1080, lastTime: -1 }); };
        v.addEventListener('loadeddata', ready); v.addEventListener('canplay', ready);
        v.addEventListener('error', () => res(null)); setTimeout(() => !ok && res(null), 5000); v.load(); return;
      }
      const im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
      im.onload = () => { const tex = newTex(); upload(im); res({ ...L, el: im, tex, w: im.width, h: im.height }); };
      im.onerror = () => res(null); im.src = L.src;
    });

    const draw = (it) => {
      const c = { ...DEFAULTS, ...it.config };
      gl.bindTexture(gl.TEXTURE_2D, it.tex);
      if (it.type === 'video' && it.el.currentTime !== it.lastTime) { it.lastTime = it.el.currentTime; try { gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, it.el); } catch (e) { upload(it.el); } }
      if (it.type === 'canvas' && it.live) upload(it.el);
      gl.uniform2f(U.u_texSize, it.w, it.h);
      gl.uniform2f(U.u_grid, c.xSquares, c.ySquares);
      const x = px(c.x, W), y = px(c.y, H), w = px(c.width, W), h = px(c.height, H), cellW = w / c.xSquares;
      gl.uniform1f(U.u_minW, px(c.minSquareWidth, cellW)); gl.uniform1f(U.u_maxW, px(c.maxSquareWidth, cellW));
      gl.uniform1f(U.u_thr, c.threshold); gl.uniform1f(U.u_gamma, c.gamma); gl.uniform1f(U.u_bp, c.blackPoint); gl.uniform1f(U.u_wp, c.whitePoint);
      gl.uniform1f(U.u_bgA, c.bgOpacity); gl.uniform1f(U.u_fillA, c.fillOpacity);
      const yb = H - y - h;   // GL origin is bottom-left
      gl.uniform4f(U.u_bounds, x, yb, x + w, yb + h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const render = () => { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); items.forEach(draw); };
    const loop = (t) => { if (t - lastT >= FRAME) { lastT = t; render(); } raf = requestAnimationFrame(loop); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting;
      items.forEach((it) => it.type === 'video' && (visible ? it.el.play().catch(() => {}) : it.el.pause()));
      cancelAnimationFrame(raf); if (visible) raf = requestAnimationFrame(loop); }, { threshold: 0.01, rootMargin: '20% 0px 20% 0px' });
    io.observe(canvas);

    // layers keep their order (first = bottom). config objects are live → gsap.to(api.layers[i].config, {...})
    // NOTE: we keep YOUR config objects (no copy) so tweens created before load still apply.
    const api = { layers: layers.filter((l) => !l.skip).map((l) => (l.config = l.config || {}, l)), recolor: colors, render,
      destroy: () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
        items.forEach((it) => { gl.deleteTexture(it.tex); if (it.type === 'video') { it.el.pause(); it.el.removeAttribute('src'); it.el.innerHTML = ''; it.el.load(); } });
        gl.deleteBuffer(bPos); gl.deleteBuffer(bUV); gl.deleteProgram(prog); items = []; } };
    api.loaded = Promise.all(api.layers.map(load)).then((arr) => {
      items = arr.map((it, i) => it && Object.assign(it, { config: api.layers[i].config })).filter(Boolean);   // same live object
      if (visible) render(); return api; });
    return api;
  }

  // Scene registry: lets the preloader count loaded scenes and lets page transitions destroy them
  const scenes = (() => { let map = new Map(), promises = [];
    return {
      add(id, inst) { if (!inst) return inst; map.set(id, inst); inst.loaded && promises.push(inst.loaded); return inst; },
      trackProgress(cb) { const n = promises.length; if (!n) return Promise.resolve(); let k = 0; promises.forEach((p) => p.then(() => cb(++k, n))); return Promise.all(promises); },
      ready: () => Promise.all(promises),
      destroy() { map.forEach((s) => s.destroy && s.destroy()); map = new Map(); promises = []; },
    }; })();

  /* ------------------------------------------------------------------ *
   * 14. TORN EDGE generator (the "ripped paper" section joins), seeded
   *     <div data-sd-torn="top|bottom" data-sd-torn-seed="7"></div>
   * ------------------------------------------------------------------ */
  function tornPath(seed = 1, teeth = 64, depth = 0.55) {
    let s = seed * 9301 + 49297; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    let d = 'M0,100 L0,' + (40 + r() * 20).toFixed(1);
    for (let i = 1; i <= teeth; i++) { const x = (i / teeth) * 1000;
      const y = 50 + (r() - 0.5) * 100 * depth + Math.sin(i * 0.35 + seed) * 12;
      d += ` L${(x - (1000 / teeth) * r() * 0.5).toFixed(1)},${(y + (r() - 0.5) * 18).toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)}`; }
    return d + ' L1000,100 Z';
  }
  function initTorn(root = document) {
    $$('[data-sd-torn]', root).forEach((el) => {
      const flip = el.getAttribute('data-sd-torn') === 'top';
      const seed = +el.getAttribute('data-sd-torn-seed') || 1;
      el.innerHTML = `<svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true" style="display:block;width:100%;height:100%;${flip ? 'transform:scaleY(-1)' : ''}"><path d="${tornPath(seed)}" fill="currentColor"/></svg>`;
    });
  }

  /* ------------------------------------------------------------------ *
   * 15. BOOT
   * ------------------------------------------------------------------ */
  function initModules(root = document) {
    initTorn(root); initIndex(root);
    initReveals(root); initHighlight(root); initParallax(root);
    initGrowTitle(root); initHScroll(root); initFooterZoom(root); initHeroOut(root);
    initThemeFlip(root); initHeaderHide();
    initMagnetic(root); initProximity(root); initHoverSwap(root); initDimGroup(root); initTips();
    initMarquee(root); initExpandCards(root); initAccordion(root); initClipSlider(root); initTextSlider(root);
    initSwingTabs(root); initTextTabs(root); initPill(root); initPathSwitch(root); initSound();
    initCtaModal(); initMenu();
    if (typeof SD.onScenes === 'function') SD.onScenes(root);   // your linocut scenes go here
    return initSequence(root);
  }
  let resizeT;
  addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => ScrollTrigger && ScrollTrigger.refresh(true), 40); });

  const SD = {
    T, E, words, lines, block, rule, transition, lockScroll, unlockScroll, linocut, scenes, tornPath,
    get lenis() { return lenis; },
    modules: { initReveals, initHighlight, initParallax, initGrowTitle, initHScroll, initFooterZoom, initHeroOut, initSequence,
      initThemeFlip, initHeaderHide, initMagnetic, initProximity, initHoverSwap, initDimGroup, initTips, initMarquee,
      initExpandCards, initAccordion, initClipSlider, initTextSlider, initSwingTabs, initTextTabs, initPill, initPathSwitch,
      initSound, initCtaModal, initMenu, initTorn, initIndex },
    onScenes: null,
    init(opts = {}) {
      Object.assign(T, opts.tokens || {});
      if (opts.onScenes) SD.onScenes = opts.onScenes;
      document.documentElement.classList.add('sd-js');
      initLenis();
      const loaded = initModules(document);
      const p = opts.preloader === false ? (transition('out'), Promise.resolve()) : runPreloader(loaded);
      initLinkTransitions();
      return p;
    },
  };
  global.SD = SD;
})(window);
