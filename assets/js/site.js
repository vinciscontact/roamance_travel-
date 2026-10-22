/* Roamance — page glue: placeholder art, business details, hero scene, form, SD.init */
(function () {
  'use strict';
  const B = window.ROAMANCE || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  /* ---------------------------------------------------------------- *
   * 1. Placeholder art — only drawn when a photo in /assets/img is missing.
   *    Duotone "printed" scenes so the layout reads right before real photos arrive.
   * ---------------------------------------------------------------- */
  const hexRgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rng = (seed) => { let s = seed * 9301 + 49297; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
  const seedOf = (str) => { let h = 7; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % 99991; return h; };

  function paint(kind, seed, w, h, paper, ink) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'), r = rng(seed);
    const P = hexRgb(paper), I = hexRgb(ink);
    const mix = (t, a = 1) => `rgba(${P.map((p, i) => Math.round(p + (I[i] - p) * t)).join(',')},${a})`;
    const horizon = h * ({ snow: .62, alps: .64, city: .7, plan: 1, desert: .66 }[kind] || .58);

    // sky
    const g = x.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, mix(.08)); g.addColorStop(1, mix(0));
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    if (kind === 'plan') return planArt(x, w, h, r, mix);

    // sun
    x.fillStyle = mix(.22); x.beginPath(); x.arc(w * (.2 + r() * .6), h * (.16 + r() * .14), Math.min(w, h) * (.06 + r() * .05), 0, 7); x.fill();

    // ridges
    const ridgeCount = kind === 'city' ? 1 : 3;
    for (let L = 0; L < ridgeCount; L++) {
      const base = horizon - (ridgeCount - L) * h * .06, amp = h * (kind === 'snow' || kind === 'alps' ? .26 - L * .05 : .08 - L * .015);
      x.fillStyle = mix(.25 + L * .14); x.beginPath(); x.moveTo(0, horizon + 2);
      for (let i = 0; i <= 48; i++) {
        const px = i / 48 * w;
        const py = kind === 'snow' || kind === 'alps'
          ? base - Math.abs(((i * (3 + L)) % 16) - 8) / 8 * amp - r() * h * .015
          : base - Math.abs(Math.sin(i * .28 + seed + L * 1.7)) * amp - r() * h * .01;
        x.lineTo(px, py);
      }
      x.lineTo(w, horizon + 2); x.closePath(); x.fill();
      if ((kind === 'snow' || kind === 'alps') && L === 0) { x.save(); x.clip(); x.fillStyle = mix(.02); x.fillRect(0, 0, w, base - amp * .55); x.restore(); }
    }

    if (kind === 'city') {
      for (let i = 0; i < 26; i++) {
        const bw = w * (.025 + r() * .04), bx = r() * w, bh = h * (.12 + r() * (i % 5 === 0 ? .5 : .25));
        x.fillStyle = mix(.55 + r() * .3); x.fillRect(bx, horizon - bh, bw, bh + 2);
        x.fillStyle = mix(.05, .6);
        for (let wy = horizon - bh + 8; wy < horizon - 6; wy += 9) for (let wx = bx + 4; wx < bx + bw - 4; wx += 7) if (r() > .55) x.fillRect(wx, wy, 2.5, 3.5);
      }
    }

    // ground or water
    const water = ['backwater', 'beach', 'sea', 'island', 'city'].includes(kind);
    x.fillStyle = water ? mix(.35) : mix(.6); x.fillRect(0, horizon, w, h - horizon);
    if (water) {
      x.strokeStyle = mix(.12, .7); x.lineWidth = 1.2;
      for (let y = horizon + 6; y < h; y += 5 + (y - horizon) * .04) { x.beginPath(); const o = r() * w * .3; x.moveTo(o, y); x.lineTo(o + w * (.2 + r() * .5), y); x.stroke(); }
    }
    if (kind === 'beach' || kind === 'island') { x.fillStyle = mix(.12); x.beginPath(); x.moveTo(0, h * .82); x.quadraticCurveTo(w * .5, h * .74, w, h * .86); x.lineTo(w, h); x.lineTo(0, h); x.fill(); }
    if (kind === 'desert') { for (let i = 0; i < 3; i++) { x.fillStyle = mix(.3 + i * .15); x.beginPath(); x.moveTo(0, h); x.quadraticCurveTo(w * (.3 + r() * .4), horizon + h * (i * .1 - .02), w, h * (.8 + i * .05)); x.lineTo(w, h); x.fill(); } }

    // palms
    if (['backwater', 'beach', 'island'].includes(kind)) {
      const n = kind === 'island' ? 3 : 6;
      for (let i = 0; i < n; i++) palm(x, (i % 2 ? w * (.75 + r() * .2) : w * r() * .25) + (kind === 'island' ? w * .3 : 0) * (i % 2 ? 0 : 1), kind === 'backwater' ? horizon + h * .02 : h * .84, h * (.28 + r() * .2), (r() - .5) * .5, mix(.82));
    }
    if (kind === 'backwater') boat(x, w * (.35 + r() * .2), horizon + h * .12, w * .26, mix(.85), mix(.1));
    if (kind === 'island') { x.fillStyle = mix(.7); for (let i = 0; i < 5; i++) { const bx = w * (.08 + i * .1), by = horizon + h * .04; x.fillRect(bx, by, w * .055, h * .03); x.beginPath(); x.moveTo(bx - 4, by); x.lineTo(bx + w * .0275, by - h * .05); x.lineTo(bx + w * .055 + 4, by); x.fill(); x.fillRect(bx + w * .025, by + h * .03, 2, h * .05); } }
    if (kind === 'family' || kind === 'couple') {
      x.fillStyle = mix(.12); x.fillRect(0, horizon, w, h - horizon);
      x.strokeStyle = mix(.3, .6); for (let y = horizon + 8; y < horizon + h * .08; y += 6) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
      const people = kind === 'family' ? [1, .62, 1.08, .5] : [1, .94];
      let px = w * (.32 + r() * .1);
      people.forEach((s) => { figure(x, px, h * .9, h * .34 * s, mix(.85)); px += h * .34 * s * .42 + 6; });
    }
    if (kind === 'snow') { x.fillStyle = mix(.85); for (let i = 0; i < 14; i++) pine(x, r() * w, h * (.8 + r() * .2), h * (.12 + r() * .1)); }
    if (kind === 'hills') { x.fillStyle = mix(.8); for (let i = 0; i < 10; i++) pine(x, r() * w, horizon + h * (.05 + r() * .3), h * (.08 + r() * .12)); }

    // print texture: fine paper-coloured scan lines
    x.fillStyle = mix(0, .14); for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 1);
    return c;
  }
  function palm(x, px, base, hgt, lean, col) {
    x.strokeStyle = col; x.fillStyle = col; x.lineWidth = Math.max(3, hgt * .035); x.lineCap = 'round';
    const tx = px + lean * hgt, ty = base - hgt;
    x.beginPath(); x.moveTo(px, base); x.quadraticCurveTo(px + lean * hgt * .2, base - hgt * .5, tx, ty); x.stroke();
    for (let i = 0; i < 7; i++) { const a = -Math.PI + (i / 6) * Math.PI + (Math.random() - .5) * .2, L = hgt * (.32 + Math.random() * .1);
      x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(tx + Math.cos(a) * L * .6, ty + Math.sin(a) * L * .6 - L * .25, tx + Math.cos(a) * L, ty + Math.sin(a) * L * .4 + L * .25);
      x.lineWidth = Math.max(2, hgt * .02); x.stroke(); }
  }
  function boat(x, bx, by, bw, col, lite) {
    x.fillStyle = col; x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + bw, by); x.quadraticCurveTo(bx + bw * .9, by + bw * .1, bx + bw * .75, by + bw * .1); x.lineTo(bx + bw * .2, by + bw * .1); x.quadraticCurveTo(bx + bw * .05, by + bw * .08, bx, by); x.fill();
    x.beginPath(); x.moveTo(bx + bw * .12, by); x.quadraticCurveTo(bx + bw * .5, by - bw * .28, bx + bw * .88, by); x.fill();
    x.fillStyle = lite; for (let i = 0; i < 5; i++) x.fillRect(bx + bw * (.22 + i * .12), by - bw * .1, bw * .06, bw * .05);
  }
  function figure(x, px, base, hgt, col) {
    x.fillStyle = col; const hw = hgt * .14;
    x.beginPath(); x.arc(px, base - hgt + hw, hw, 0, 7); x.fill();
    x.beginPath(); x.moveTo(px - hw * 1.3, base - hgt + hw * 2.3); x.lineTo(px + hw * 1.3, base - hgt + hw * 2.3); x.lineTo(px + hw * 1.1, base - hgt * .45); x.lineTo(px - hw * 1.1, base - hgt * .45); x.fill();
    x.fillRect(px - hw * .9, base - hgt * .46, hw * .7, hgt * .46); x.fillRect(px + hw * .2, base - hgt * .46, hw * .7, hgt * .46);
  }
  function pine(x, px, base, hgt) { x.beginPath(); x.moveTo(px, base - hgt); x.lineTo(px - hgt * .22, base); x.lineTo(px + hgt * .22, base); x.fill(); }
  function planArt(x, w, h, r, mix) {
    x.fillStyle = mix(.1); x.fillRect(0, 0, w, h);
    x.strokeStyle = mix(.35, .6); x.lineWidth = 1;
    for (let i = 0; i < w; i += 40) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
    for (let j = 0; j < h; j += 40) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); }
    x.fillStyle = mix(.4); x.beginPath(); x.moveTo(w * .1, h * .2);
    for (let i = 0; i < 14; i++) x.lineTo(w * (.1 + r() * .5), h * (.15 + r() * .7)); x.fill();
    const pts = Array.from({ length: 5 }, (_, i) => [w * (.15 + i * .17 + r() * .05), h * (.3 + r() * .45)]);
    x.setLineDash([6, 8]); x.strokeStyle = mix(.85); x.lineWidth = 2.5; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke(); x.setLineDash([]);
    x.fillStyle = mix(.85); pts.forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 9, 0, 7); x.fill(); });
    x.fillStyle = mix(0, .14); for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 1);
    return x.canvas;
  }
  function placeholder(img) {
    if (img.dataset.painted) return; img.dataset.painted = '1';
    const box = img.parentElement.getBoundingClientRect();
    const ratio = box.width && box.height ? box.width / box.height : 4 / 3;
    const w = 900, h = Math.round(w / Math.min(Math.max(ratio, .5), 2.4));
    const cs = getComputedStyle(img);
    const paper = cs.getPropertyValue('--sd-paper').trim() || '#d8a967', ink = cs.getPropertyValue('--sd-ink').trim() || '#16302a';
    img.src = paint(img.dataset.art || 'hills', seedOf(img.getAttribute('src') || img.alt), w, h, paper, ink).toDataURL('image/jpeg', .82);
  }
  $$('img[data-art]').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) placeholder(img);
    else if (img.dataset.missing) placeholder(img);
    else img.addEventListener('error', () => placeholder(img), { once: true });
  });

  /* ---------------------------------------------------------------- *
   * 2. Business details — fill verified values, hide anything still empty
   * ---------------------------------------------------------------- */
  const fullAddress = [B.address, B.area, B.city, B.state, B.pin].filter(Boolean).join(', ');
  const values = { ...B, fullAddress, location: [B.city, B.state].filter(Boolean).join(', ') };
  const hrefs = {
    phone: B.phone && 'tel:' + B.phone.replace(/[^\d+]/g, ''),
    whatsapp: B.whatsapp && 'https://wa.me/' + B.whatsapp.replace(/\D/g, ''),
    email: B.email && 'mailto:' + B.email,
    mapUrl: B.mapUrl,
  };
  $$('[data-biz]').forEach((el) => { const v = values[el.dataset.biz]; if (v) el.textContent = v; else if (el.dataset.fallback) el.textContent = el.dataset.fallback; });
  $$('[data-biz-href]').forEach((el) => { const v = hrefs[el.dataset.bizHref]; if (v) { el.href = v; if (/^https?:/.test(v)) { el.target = '_blank'; el.rel = 'noopener'; el.setAttribute('data-sd-no-transition', ''); } } });
  $$('[data-biz-wrap]').forEach((el) => { const keys = el.dataset.bizWrap.split(' '); if (!keys.some((k) => values[k])) el.remove(); });   // removed, not hidden: keeps empty dark bands out of the theme-flip triggers
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  // Structured data — verified fields only, never placeholders
  const ld = { '@context': 'https://schema.org', '@type': 'TravelAgency', name: B.name, slogan: B.tagline,
    description: 'Thoughtfully planned domestic and international holidays, with personal care at every step.' };
  if (B.website) ld.url = B.website;
  if (B.phone) ld.telephone = B.phone;
  if (B.email) ld.email = B.email;
  if (B.city) ld.address = Object.fromEntries(Object.entries({ '@type': 'PostalAddress', streetAddress: [B.address, B.area].filter(Boolean).join(', '),
    addressLocality: B.city, addressRegion: B.state, postalCode: B.pin, addressCountry: 'IN' }).filter(([, v]) => v));
  if (B.social && B.social.length) ld.sameAs = B.social;
  if (B.mapUrl) ld.hasMap = B.mapUrl;
  const s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(ld); document.head.appendChild(s);

  /* ---------------------------------------------------------------- *
   * 3. Logo: on repeat visits the preloader is skipped, so place the wordmark directly
   * ---------------------------------------------------------------- */
  let visited = false; try { visited = !!sessionStorage.getItem('sd-visited'); } catch (e) {}
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const logo = $('[data-sd-preloader-logo]'), slot = $('[data-sd-logo-slot]');
  if ((visited || reduced) && logo && slot) slot.appendChild(logo);

  /* ---------------------------------------------------------------- *
   * 4. Enquiry form — success is shown only after a real submission
   * ---------------------------------------------------------------- */
  const form = $('#enquiry');
  if (form) {
    const status = $('.form-status', form);
    const say = (t) => { status.textContent = t; };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form).entries());
      const lines = [
        'Holiday enquiry — Roamance website', '',
        `Name: ${data.name}`, `Phone: ${data.phone}`, `Email: ${data.email}`,
        `Departure city: ${data.departure || '-'}`, `Destination: ${data.destination || '-'}`,
        `Travel dates: ${data.dates || '-'}${data.flexible ? ' (flexible)' : ''}`,
        `Travellers: ${data.adults || 0} adults, ${data.children || 0} children`,
        `Budget: ${data.budget ? '₹' + data.budget + ' ' + data.budgetBasis : '-'}`,
        `Preferences: ${data.notes || '-'}`,
      ];
      const btn = $('button[type=submit]', form);
      if (B.formEndpoint) {
        btn.disabled = true; say('Sending your enquiry…');
        try {
          const res = await fetch(B.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
          if (!res.ok) throw new Error(res.status);
          form.reset(); say('Thank you — your enquiry has reached us. Our team will get in touch soon.');
        } catch (err) { say('Sorry, your enquiry could not be sent. Please try again, or call or message us directly.'); }
        btn.disabled = false; return;
      }
      const text = encodeURIComponent(lines.join('\n'));
      if (B.whatsapp) { window.open('https://wa.me/' + B.whatsapp.replace(/\D/g, '') + '?text=' + text, '_blank', 'noopener'); say('WhatsApp has opened with your enquiry — press send there to share it with us.'); return; }
      if (B.email) { location.href = 'mailto:' + B.email + '?subject=' + encodeURIComponent('Holiday enquiry') + '&body=' + text; say('Your email app has opened with your enquiry — press send there to share it with us.'); return; }
      say('Online enquiries are being set up. Please check back shortly.');
    });
  }

  /* 5. Home hero lives in hero.js (dotted map + eagle). */

  /* ---------------------------------------------------------------- *
   * 6. Boot + smooth anchor scrolling (incl. arriving at /tour-packages/#family)
   * ---------------------------------------------------------------- */
  const goTo = (hash, immediate) => { const t = hash && document.getElementById(hash.slice(1)); if (!t) return false;
    if (SD.lenis) SD.lenis.scrollTo(t, { offset: -90, immediate }); else t.scrollIntoView(); return true; };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]'); if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    if (goTo(url.hash)) { e.preventDefault(); history.replaceState(null, '', url.hash); }
  });

  // Header starts in the theme of whatever section sits under it (the engine only flips on scroll)
  const hdr = $('[data-sd-header]'), first = $('main [data-sd-bg]');
  if (hdr && first && !hdr.className.includes('theme-')) hdr.classList.add('theme-' + first.dataset.sdBg);

  const ready = SD.init();
  Promise.resolve(ready).then(() => {
    if (location.hash) setTimeout(() => { ScrollTrigger.refresh(); goTo(location.hash); }, 60);
  });
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
