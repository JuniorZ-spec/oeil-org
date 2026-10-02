const WHATSAPP = '2290129261561';
// Colle ici ton lien Formspree (https://formspree.io/f/xxxxxxx) pour recevoir les demandes par e-mail.
// Laissé vide : le formulaire ouvre WhatsApp avec le message pré-rempli.
const FORM_ENDPOINT = '';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = v => Math.min(1, Math.max(0, v));
const ease = t => 1 - Math.pow(1 - t, 3);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- infinite loops (marquee, photo strip): duplicate content ---------- */
$$('[data-loop]').forEach(t => {
  [...t.children].map(c => c.cloneNode(true)).forEach(c => { c.setAttribute('aria-hidden', 'true'); t.append(c); });
});

/* ---------- split headings into words that rise from a mask ---------- */
function splitWords(root) {
  let i = 0;
  (function walk(node) {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
          w.append(s); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  })(root);
}
$$('[data-split]').forEach(el => {
  el.setAttribute('aria-label', el.textContent.trim());
  splitWords(el);
  if (el.dataset.base) el.style.setProperty('--base', el.dataset.base + 's');
});

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (!en.isIntersecting) return;
  en.target.classList.add('in');
  if (en.target.dataset.count) countUp(en.target);
  io.unobserve(en.target);
}), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
$$('[data-reveal], [data-split]:not([data-base]), [data-count]').forEach(el => io.observe(el));
// hero title plays right after the intro curtain
/* ---------- intro: leave as soon as the hero photo is ready, not after a fixed delay ---------- */
const heroTitle = $('[data-split][data-base]');
if (heroTitle) heroTitle.style.setProperty('--base', '0s');
const loader = $('.loader');
const seenIntro = document.documentElement.classList.contains('seen');
let introDone = false;
function loadDeferredHero() {   // 2nd hero photo: only after the first paint, so it never competes with the LCP image
  const phone = matchMedia('(max-width:700px)').matches;
  $$('img[data-src]').forEach(img => {
    const ss = (phone && img.dataset.srcsetM) || img.dataset.srcset;
    if (ss) img.srcset = ss;
    img.src = (phone && img.dataset.srcM) || img.dataset.src;
  });
}
function endIntro() {
  if (introDone) return;
  introDone = true;
  document.dispatchEvent(new Event('intro-end'));
  if (loader) { loader.classList.add('done'); setTimeout(() => loader.remove(), 900); }
  setTimeout(() => heroTitle && heroTitle.classList.add('in'), loader && !seenIntro ? 250 : 0);
  loadDeferredHero();
}
if (!loader || seenIntro) endIntro();
else {
  const first = $('.slide-bg.first img');
  const minWait = new Promise(r => setTimeout(r, 880));
  const imgReady = first && !first.complete ? new Promise(r => { first.addEventListener('load', r, { once: true }); first.addEventListener('error', r, { once: true }); }) : Promise.resolve();
  Promise.race([Promise.all([minWait, imgReady, document.fonts ? document.fonts.ready : 0]), new Promise(r => setTimeout(r, 3500))]).then(endIntro);
}

function countUp(el) {
  const target = +el.dataset.count;
  if (reduced) return;
  const t0 = performance.now(), dur = 1600;
  (function tick(now) {
    const p = clamp((now - t0) / dur);
    el.textContent = Math.round(target * ease(p));
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

/* ---------- hero: two slides that change by themselves ---------- */
const hero = $('.hero');
// on phones the 2nd photo (palmiers et bougies) is left out
if (matchMedia('(max-width:700px)').matches) {
  $$('.desk-only', hero).forEach(e => e.remove());
  $$('.hero-tabs button', hero).forEach((b, i) => { b.dataset.go = i; $('b', b).textContent = '0' + (i + 1); });
  const tot = $('.hero-top b.cnt'); if (tot && tot.nextSibling) tot.parentNode.lastChild.textContent = ' — 0' + $$('.hero-copy', hero).length;
}
const slidesBg = $$('.slide-bg', hero);
const copies = $$('.hero-copy', hero);
const tabs = $$('.hero-tabs button', hero);
const cnt = $('.cnt', hero);
const header = $('.site-header');
const hh = () => header.offsetHeight;
const SLIDE_MS = 4200;
let cur = -1, heroTimer, heroVisible = true;
hero.style.setProperty('--dur', SLIDE_MS + 'ms');
if (reduced) hero.classList.add('static');

function showSlide(i) {
  if (i === cur) return;
  cur = i;
  slidesBg.forEach((s, k) => s.classList.toggle('on', k === i));
  copies.forEach((c, k) => c.classList.toggle('on', k === i));
  tabs.forEach((t, k) => t.classList.toggle('on', k === i));
  if (cnt) cnt.textContent = '0' + (i + 1);
}
function nextSlide(step = 1) {
  const n = copies.length;
  const target = (cur + step + n) % n;
  const img = slidesBg[target].querySelector('img');
  if (img && !img.complete) return setTimeout(() => nextSlide(step), 400);   // wait for the photo instead of showing a blank
  showSlide(target);
}
function schedule() {
  clearTimeout(heroTimer);
  if (reduced) return;
  heroTimer = setTimeout(() => {
    if (document.hidden || !heroVisible) schedule();   // nobody is looking: stay on this slide
    else { nextSlide(1); schedule(); }
  }, SLIDE_MS);
}
tabs.forEach((b, k) => b.addEventListener('click', () => { showSlide(k); schedule(); }));
new IntersectionObserver(e => { heroVisible = e[0].isIntersecting; }, { threshold: 0.3 }).observe(hero);

// swipe left / right on the hero
let hx = 0, hy = 0;
hero.addEventListener('touchstart', e => { hx = e.touches[0].clientX; hy = e.touches[0].clientY; }, { passive: true });
hero.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - hx, dy = e.changedTouches[0].clientY - hy;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { nextSlide(dx < 0 ? 1 : -1); schedule(); }
}, { passive: true });

function beginHero() { showSlide(0); schedule(); }
if (introDone) beginHero(); else document.addEventListener('intro-end', beginHero, { once: true });

/* ---------- scroll loop: progress bar, header, parallax ---------- */
const bar = $('.progress');
const parallax = $$('[data-parallax]');
const bgPar = [];
let ticking = false;
function onScroll() {
  ticking = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  header.classList.toggle('stuck', scrollY > 10);
  if (reduced) return;
  parallax.forEach(m => {
    const r = m.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const k = (r.top + r.height / 2 - innerHeight / 2) / (innerHeight / 2 + r.height / 2);
    m.firstElementChild.style.transform = `translateY(${-k * r.height * 0.07}px)`;
  });
  bgPar.forEach(img => {
    const r = img.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const k = (r.top + r.height / 2 - innerHeight / 2) / (innerHeight / 2 + r.height / 2);
    img.style.transform = `translateY(${-k * r.height * 0.1}px)`;
  });
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', onScroll);
onScroll();

/* ---------- services: first card open, others expand on hover (CSS) ---------- */
$$('.svc-card').forEach(c => c.addEventListener('click', () => {
  $$('.svc-card').forEach(o => o.classList.toggle('open', o === c));
}));

/* ---------- pricing buttons preselect the plan ---------- */
const form = $('#devis');
$$('[data-plan]').forEach(a => a.addEventListener('click', () => {
  const msg = form.elements.message;
  if (!msg.value) msg.value = `Je suis intéressé(e) par la formule ${a.dataset.plan}.`;
}));

/* ---------- contact form ---------- */
form.addEventListener('submit', e => {
  e.preventDefault();
  const f = form.elements;
  if (!f.noms.value.trim()) { f.noms.focus(); return; }
  const types = [...form.querySelectorAll('input[name=type]:checked')].map(i => i.value);
  const data = {
    noms: f.noms.value.trim(), types: types.join(', '), date: f.date.value, ville: f.ville.value,
    invites: f.invites.value, budget: f.budget.value, source: f.source.value, message: f.message.value,
  };
  const text = [
    'Bonjour Oeil Org,',
    `Nous sommes : ${data.noms}`,
    types.length && `Cérémonie : ${data.types}`,
    data.date && `Date prévue : ${data.date}`,
    data.ville && `Ville : ${data.ville}`,
    data.invites && `Invités : ${data.invites}`,
    data.budget && `Budget indicatif : ${data.budget}`,
    data.source && `Vous nous avez connus par : ${data.source}`,
    data.message && `Message : ${data.message}`,
  ].filter(Boolean).join('\n');
  const thanks = $('#thanks');
  const done = msg => {
    if (msg) $('#thanks-msg').textContent = msg;
    form.hidden = true; thanks.hidden = false;
    thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const viaWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    done('Votre demande est prête dans WhatsApp : il ne reste qu\'à appuyer sur envoyer.');
  };
  if (!FORM_ENDPOINT) return viaWhatsApp();

  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  fetch(FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  })
    .then(r => { if (!r.ok) throw new Error(r.status); form.reset(); done('Nous vous répondons sous 24 heures, du lundi au samedi.'); })
    .catch(viaWhatsApp)
    .finally(() => { btn.disabled = false; });
});

/* ---------- video reels: play only what is on screen; click opens a player ---------- */

/* reels: the poster lives on the card itself, the video fades in only once it really plays
   (Safari hides the poster as soon as play() is called, which left black cards) */
/* duplicate the cards once so the row can loop without a visible jump */
(() => {
  const rc = $('.reels'); if (!rc) return;
  [...rc.children].forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); k.tabIndex = -1; rc.append(k); });
})();
$$('.reel').forEach(r => {
  const v = $('video', r);
  if (!v || !v.getAttribute('poster')) return;
  r.style.backgroundImage = `url(${v.getAttribute('poster')})`;
  v.removeAttribute('poster');
  v.addEventListener('playing', () => v.classList.add('on'));
});
const reelsEl = $('.reels');
const reelVideos = $$('video', reelsEl);
const conn = navigator.connection || {};
const slowNet = !!(conn.saveData || /(^|-)(2g|3g)$/.test(conn.effectiveType || ''));
if (slowNet) { document.documentElement.classList.add('slow'); $$('.reel').forEach(r => r.classList.add('still')); }
const vio = new IntersectionObserver(entries => entries.forEach(en => {
  const v = en.target;
  if (en.isIntersecting && !reduced && !slowNet) {
    if (!v.src) v.src = v.dataset.src;
    v.play().catch(() => {});
  } else v.pause();
}), { threshold: 0.55 });
reelVideos.forEach(v => vio.observe(v));

$$('.arrows[data-for] button').forEach(btn => btn.addEventListener('click', () => {
  const box = $(btn.parentElement.dataset.for);
  box.scrollBy({ left: (box.firstElementChild.offsetWidth + 18) * 2 * Number(btn.dataset.dir), behavior: 'smooth' });
}));

const lb = $('.lightbox');
const lbVideo = $('video', lb);
$$('.reel').forEach(r => r.addEventListener('click', () => {
  lbVideo.src = r.dataset.src;
  $('.lb-title', lb).textContent = r.dataset.title;
  lb.showModal();
  lbVideo.play().catch(() => {});
}));
const closeLb = () => { lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load(); lb.close(); };
$('.lb-close', lb).addEventListener('click', closeLb);
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
lb.addEventListener('cancel', () => { lbVideo.pause(); });

/* ---------- phone button steps aside while the form / map are on screen ---------- */
const fab = $('.fab');
const fabHide = new Set();
const fio = new IntersectionObserver(entries => {
  entries.forEach(en => en.isIntersecting ? fabHide.add(en.target) : fabHide.delete(en.target));
  applyFab();
}, { threshold: 0.15 });
const phoneScreen = matchMedia('(max-width:700px)');
// on a phone the hero already has its own buttons and tab bar, so the round button stays out of the way there too
function applyFab() { fab.classList.toggle('hide', [...fabHide].some(el => !el.classList.contains('hero') || phoneScreen.matches)); }
phoneScreen.addEventListener('change', applyFab);
$$('#contact, #localisation, .site-footer, .hero').forEach(el => fio.observe(el));


/* after a reload, always start from the top (browsers restore the old position after load) */
if (window.__top) {
  const top = () => scrollTo(0, 0);
  top();
  addEventListener('load', () => { top(); setTimeout(top, 60); setTimeout(top, 400); });
  addEventListener('pageshow', top);
}





/* formulaire replié : s'ouvre au clic (ou depuis un bouton de formule) */
const fold = $('#fold'), foldBtn = $('#open-form'), foldCta = $('#fold-cta');
function openForm(scroll = true) {
  fold.classList.add('open'); foldBtn.setAttribute('aria-expanded', 'true'); foldCta.classList.add('gone');
  if (scroll) setTimeout(() => fold.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
}
foldBtn.addEventListener('click', () => openForm());
$$('[data-plan]').forEach(a => a.addEventListener('click', () => openForm(false)));

/* ---------- défilement continu, lent, sans arrêt (vidéos et avis) ---------- */
function drift(box, pxPerSec) {
  if (!box || reduced) return;
  box.style.scrollSnapType = 'none';
  let x = box.scrollLeft, last = 0, touching = false, resume = 0, visible = false;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { threshold: 0.05 }).observe(box);
  const hold = () => { touching = true; clearTimeout(resume); };
  const free = () => { clearTimeout(resume); resume = setTimeout(() => { touching = false; x = box.scrollLeft; }, 1200); };
  box.addEventListener('touchstart', hold, { passive: true });
  box.addEventListener('touchend', free, { passive: true });
  box.addEventListener('pointerdown', hold, { passive: true });
  box.addEventListener('pointerup', free, { passive: true });
  box.addEventListener('wheel', () => { hold(); free(); }, { passive: true });
  (function tick(t) {
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
    if (visible && !touching && !document.hidden && !document.querySelector('dialog[open]')) {
      const half = box.scrollWidth / 2;
      x += pxPerSec * dt;
      if (x >= half) x -= half;
      box.scrollLeft = x;
    } else x = box.scrollLeft;
    requestAnimationFrame(tick);
  })(0);
}
drift($('.reels'), 38);
(() => { const rv = $('.rvs'); if (!rv) return; [...rv.children].forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); rv.append(k); }); drift(rv, 34); })();
