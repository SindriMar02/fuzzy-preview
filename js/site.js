/* Fuzzy behaviour layer. Engine = the olympic.no clean-room rebuild (Lenis, split reveals, in-view toggles,
   header theme + collapse, menu curtain), trimmed to what this page uses, plus the Fuzzy devices
   (colour dive-swap, order picker). Parameters: 04-platform/sndr-teardowns/teardowns/olympic-2026-10-06/TEARDOWN.md */
(() => {
  const html = document.documentElement;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = () => innerWidth >= 1024;
  gsap.registerPlugin(SplitText, CustomEase);
  CustomEase.create('dive', '0.85,0,0.15,1');

  /* ---------- scroll engine: Lenis on fine pointers only (Olympic: duration 1.2, expo-out) */
  let lenis = null;
  if (fine && !reduced) {
    lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), autoResize: true,
      virtualScroll: ({ event }) => !('metaKey' in event && event.metaKey) });
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const lockScroll = on => { html.classList.toggle('no-scroll', on); if (lenis) on ? lenis.stop() : lenis.start(); };
  const onScroll = fn => addEventListener('scroll', fn, { passive: true });
  const headerH = () => desktop() ? 16 : document.querySelector('.hdr__row').offsetHeight + 12;
  const goTo = target => {
    const y = target.getBoundingClientRect().top + scrollY - headerH();
    if (lenis) lenis.scrollTo(y, { duration: 1.4, easing: t => 1 - Math.pow(1 - t, 3) });
    else scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  };

  /* ---------- split text (Olympic modes: chars / words / lines / lines3d) */
  const splits = [];
  function split(el) {
    const mode = el.dataset.split;
    if (mode === 'chars') { const s = new SplitText(el, { type: 'chars', charsClass: 'c' }); s.chars.forEach((c, i) => c.style.setProperty('--i', i)); return s; }
    if (mode === 'words') { const s = new SplitText(el, { type: 'words', wordsClass: 'w' }); s.words.forEach((w, i) => { w.innerHTML = `<span class="wi">${w.innerHTML}</span>`; w.style.setProperty('--i', i); }); return s; }
    const s = new SplitText(el, { type: 'lines', linesClass: 'l' });
    s.lines.forEach((l, i) => { l.innerHTML = `<span class="li">${l.innerHTML}</span>`; l.style.setProperty('--i', i); });
    return s;
  }
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
  }), { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  document.fonts.ready.then(() => {
    document.querySelectorAll('[data-split]').forEach(el => splits.push([el, split(el)]));
    document.querySelectorAll('[data-scrub]').forEach(el => {
      const s = new SplitText(el, { type: 'words', wordsClass: 'sw' });
      s.words.forEach((w, i) => w.style.setProperty('--i', i));
    });
    document.querySelectorAll('main [data-reveal], main [data-split]').forEach(el => io.observe(el));
  });
  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastW) return; lastW = innerWidth;
    splits.forEach(([el, s], k) => { const was = el.classList.contains('in'); s.revert(); splits[k][1] = split(el); if (was) el.classList.add('in'); });
  });

  /* ---------- header: theme under its midpoint + collapse on scroll down past half a viewport (desktop only;
     ≤1023 is the studio's constant glass bar, which never moves) */
  const hdr = document.getElementById('hdr');
  const themed = [...document.querySelectorAll('[data-theme]')];
  let lastY = 0;
  function headerState(y) {
    if (!desktop()) { hdr.classList.remove('is-collapsed', 'hdr--light', 'hdr--grey'); return; }
    const mid = hdr.querySelector('.hdr__row').offsetHeight / 2;
    let theme = '';
    for (const s of themed) { const r = s.getBoundingClientRect(); if (r.top < mid && r.bottom > mid) { theme = s.dataset.theme; break; } }
    hdr.classList.toggle('hdr--grey', theme === 'grey');
    hdr.classList.toggle('hdr--light', theme === 'dark');
    hdr.classList.toggle('is-collapsed', y > lastY && y > innerHeight / 2 && !html.classList.contains('menu-open'));
    lastY = y;
  }
  onScroll(() => headerState(scrollY));
  addEventListener('resize', () => headerState(scrollY));
  headerState(scrollY);

  /* ---------- menu: Olympic curtain (clip-path inset 1.2s dive), staggered links */
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const inertEls = [...document.querySelectorAll('main, footer')];
  function openMenu(e) {
    if (html.classList.contains('menu-open')) return;
    html.classList.add('menu-open'); burger.setAttribute('aria-expanded', 'true'); lockScroll(true);
    nav.inert = false; inertEls.forEach(el => el.inert = true);
    if (!e || e.detail === 0) document.getElementById('close').focus({ preventScroll: true }); // keyboard open: move focus; tap: no ring
  }
  function closeMenu(focusBurger = true) {
    if (!html.classList.contains('menu-open')) return;
    html.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); lockScroll(false);
    nav.inert = true; inertEls.forEach(el => el.inert = false);
    if (focusBurger) burger.focus({ preventScroll: true });
  }
  burger.addEventListener('click', openMenu);
  document.getElementById('close').addEventListener('click', () => closeMenu());
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- in-page links: eased jump with the header offset */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href').slice(1); const t = id ? document.getElementById(id) : null; if (!t) return;
    e.preventDefault();
    const wasOpen = html.classList.contains('menu-open');
    closeMenu(false);
    setTimeout(() => goTo(t), wasOpen ? 450 : 0);
  });

  /* ---------- anatomy: leader lines measured from the photo to each note (board A8), drawn by a view() timeline */
  const stage = document.querySelector('.fz-anat__stage');
  const leaders = stage && stage.querySelector('.fz-leaders');
  function layoutLeaders() {
    if (!leaders || !desktop()) return;
    const st = stage.getBoundingClientRect(), im = stage.querySelector('.fz-anat__img').getBoundingClientRect();
    leaders.setAttribute('viewBox', `0 0 ${st.width} ${st.height}`);
    leaders.querySelectorAll('path').forEach(p => {
      const [fx, fy] = p.dataset.a.split(',').map(Number), note = stage.querySelector('.fz-note--' + p.dataset.n);
      const nr = note.getBoundingClientRect(), right = note.classList.contains('fz-note--2') || note.classList.contains('fz-note--4');
      const ax = im.left - st.left + fx * im.width, ay = im.top - st.top + fy * im.height;
      const ey = nr.top - st.top + 9, ex = right ? nr.left - st.left - 16 : nr.right - st.left + 16;
      p.setAttribute('d', `M${ax.toFixed(1)} ${ay.toFixed(1)} V${ey.toFixed(1)} H${ex.toFixed(1)}`);
    });
  }
  if (leaders) {
    addEventListener('resize', layoutLeaders);
    document.fonts.ready.then(layoutLeaders);
    const img = stage.querySelector('.fz-anat__img');
    img.complete ? layoutLeaders() : img.addEventListener('load', layoutLeaders);
  }

  /* ---------- colours: swatch → Olympic dive swap (incoming rises from below, outgoing drifts up) */
  const frame = document.querySelector('[data-swap]');
  const nameEl = document.querySelector('[data-swap-name]');
  const sw = [...document.querySelectorAll('.fz-sw button')];
  let settle = null; // interruptible: a new pick settles the running swap at once, then starts its own
  function pickColour(btn) {
    const c = btn.dataset.c;
    if (settle) settle();
    const cur = frame.querySelector('img.is-on'), next = frame.querySelector(`img[data-c="${c}"]`);
    sw.forEach(b => b.setAttribute('aria-checked', b === btn));
    nameEl.textContent = btn.dataset.n;
    document.querySelectorAll('.fz-lineup [data-pick]').forEach(b => b.setAttribute('aria-pressed', b.dataset.pick === c));
    const radio = document.querySelector(`.fz-order__form input[name="gaera"][value="${btn.querySelector('.sr').textContent}"]`);
    if (radio) { radio.checked = true; updateOrder(); }
    if (next === cur) return;
    if (reduced) { cur.className = ''; next.className = 'is-on'; return; }
    cur.className = 'is-out'; next.className = 'is-in';
    let t = 0;
    settle = () => { clearTimeout(t); cur.className = ''; next.className = 'is-on'; settle = null; };
    t = setTimeout(settle, 920);
  }
  sw.forEach((b, i) => {
    b.addEventListener('click', () => pickColour(b));
    b.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return;
      e.preventDefault(); const n = sw[(i + d + sw.length) % sw.length]; n.focus(); pickColour(n);
    });
    b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
  });
  new MutationObserver(() => sw.forEach(b => b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1))
    .observe(document.querySelector('.fz-sw'), { attributes: true, subtree: true, attributeFilter: ['aria-checked'] });

  /* ---------- line-up: picking a stool picks its colour and brings the plate into view */
  const lineup = [...document.querySelectorAll('.fz-lineup [data-pick]')];
  const syncLineup = c => lineup.forEach(b => b.setAttribute('aria-pressed', b.dataset.pick === c));
  lineup.forEach(b => b.addEventListener('click', () => {
    const s = sw.find(x => x.dataset.c === b.dataset.pick); if (!s) return;
    pickColour(s); goTo(document.querySelector('.fz-col__grid'));
  }));
  syncLineup('hvitur');

  /* ---------- order picker: writes the line and the e-mail to the maker */
  const form = document.getElementById('orderForm');
  const line = document.getElementById('orderLine');
  const send = document.getElementById('orderSend');
  const qty = document.getElementById('fjoldi');
  const g = (n) => form.querySelector(`input[name="${n}"]:checked`).value;
  function updateOrder() {
    const q = Math.min(20, Math.max(1, parseInt(qty.value, 10) || 1));
    const gaera = g('gaera').toLowerCase(), faetur = g('faetur').toLowerCase(), nafn = form.nafn.value.trim();
    const text = `${q} × Fuzzy, ${gaera} gæra, ${faetur} fætur`;
    line.textContent = text;
    const body = `Góðan dag Sigurður,\n\nMig langar að panta:\n${text}\n\n${nafn ? 'Kveðja,\n' + nafn : 'Kveðja'}`;
    send.href = `mailto:modelhusgogn@simnet.is?subject=${encodeURIComponent('Pöntun: Fuzzy kollur')}&body=${encodeURIComponent(body)}`;
  }
  form.addEventListener('input', updateOrder);
  form.addEventListener('change', updateOrder);
  form.addEventListener('submit', e => e.preventDefault());
  form.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
    qty.value = Math.min(20, Math.max(1, (parseInt(qty.value, 10) || 1) + +b.dataset.q)); updateOrder();
  }));
  qty.addEventListener('blur', () => { qty.value = Math.min(20, Math.max(1, parseInt(qty.value, 10) || 1)); updateOrder(); });
  updateOrder();

  /* ---------- footer */
  document.getElementById('toTop').addEventListener('click', () => lenis ? lenis.scrollTo(0) : scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
})();
