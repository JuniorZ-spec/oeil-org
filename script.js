const WHATSAPP = '2290129261561';
// Colle ici ton lien Formspree (https://formspree.io/f/xxxxxxx) pour recevoir les demandes par e-mail.
// Laissé vide : le formulaire ouvre WhatsApp avec le message pré-rempli.
const FORM_ENDPOINT = '';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = v => Math.min(1, Math.max(0, v));
const ease = t => 1 - Math.pow(1 - t, 3);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- mobile nav ---------- */
const menuBtn = $('.menu-btn');
const nav = $('#nav');
menuBtn.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});
nav.addEventListener('click', e => {
  if (e.target.closest('a')) {
    menuBtn.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
  }
});

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
const heroTitle = $('[data-split][data-base]');
if (heroTitle) setTimeout(() => heroTitle.classList.add('in'), 900);

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

/* ---------- hero: photos + texts follow the scroll ---------- */
const hero = $('.hero');
const sticky = $('.hero-sticky');
const layers = $$('.layer', hero);
const copies = $$('.hero-copy', hero);
const tabs = $$('.hero-tabs button', hero);
const cnt = $('.cnt', hero);
const firstImg = $('.slide-bg.s1 img', hero);
const header = $('.site-header');
const hh = () => header.offsetHeight;
const range = s => (s ? s.split(',').map(Number) : null);

function heroProgress() {
  const total = hero.offsetHeight - sticky.offsetHeight;
  return { total, p: clamp((hh() - hero.getBoundingClientRect().top) / total) };
}

function updateHero() {
  const { p } = heroProgress();

  layers.forEach(l => {
    const t = ease(clamp((p - l.dataset.from) / (l.dataset.to - l.dataset.from)));
    const inset = (1 - t) * 100;
    l.style.clipPath = `inset(0 0 ${inset}% 0)`;
    l.firstElementChild.style.transform = `scale(${1 + (1 - t) * 0.2})`;
  });
  firstImg.style.transform = `scale(${1 + p * 0.07})`;

  copies.forEach(el => {
    const inn = range(el.dataset.in), out = range(el.dataset.out);
    const ti = inn ? ease(clamp((p - inn[0]) / (inn[1] - inn[0]))) : 1;
    const to = out ? clamp((p - out[0]) / (out[1] - out[0])) : 0;
    const vis = ti * (1 - to);
    const enter = (1 - ti) * -70;
    el.style.opacity = vis;
    el.style.transform = `translateY(${enter - to * 30}px)`;
    el.classList.toggle('on', vis > 0.5);
  });

  const bounds = [[0, .45], [.45, 1]];
  const active = p < .45 ? 0 : 1;
  tabs.forEach((b, i) => {
    b.classList.toggle('on', i === active);
    b.querySelector('i').style.setProperty('--f', clamp((p - bounds[i][0]) / (bounds[i][1] - bounds[i][0])));
  });
  cnt.textContent = '0' + (active + 1);
}
tabs.forEach(b => b.addEventListener('click', () => {
  const { total } = heroProgress();
  const y = scrollY + hero.getBoundingClientRect().top - hh() + total * parseFloat(b.dataset.go);
  scrollTo({ top: y + (b.dataset.go === '0' ? 0 : 1), behavior: 'smooth' });
}));

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
  updateHero();
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

/* ---------- testimonials ---------- */
const quotes = $$('[data-quotes] blockquote');
const qdots = $$('.qdots button');
let qi = 0, qTimer;
function showQuote(i) {
  qi = (i + quotes.length) % quotes.length;
  quotes.forEach((q, n) => q.classList.toggle('on', n === qi));
  qdots.forEach((d, n) => d.classList.toggle('on', n === qi));
}
function autoQuote() { clearInterval(qTimer); if (!reduced) qTimer = setInterval(() => showQuote(qi + 1), 6500); }
qdots.forEach((d, n) => d.addEventListener('click', () => { showQuote(n); autoQuote(); }));
autoQuote();

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
  const text = [
    'Bonjour Oeil Org,',
    `Nous sommes : ${f.noms.value.trim()}`,
    `Cérémonie : ${f.type.value}`,
    f.date.value && `Date prévue : ${f.date.value}`,
    f.ville.value && `Ville : ${f.ville.value}`,
    `Budget indicatif : ${f.budget.value}`,
    f.message.value && `Message : ${f.message.value}`,
  ].filter(Boolean).join('\n');
  const note = $('#form-note');
  const viaWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    note.textContent = 'Votre demande est prête dans WhatsApp, il ne reste qu\'à l\'envoyer.';
  };
  if (!FORM_ENDPOINT) return viaWhatsApp();

  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  fetch(FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ noms: f.noms.value, type: f.type.value, date: f.date.value, ville: f.ville.value, budget: f.budget.value, message: f.message.value }),
  })
    .then(r => { if (!r.ok) throw new Error(r.status); form.reset(); note.textContent = 'Merci ! Nous vous répondons sous 24 heures.'; })
    .catch(viaWhatsApp)
    .finally(() => { btn.disabled = false; });
});

/* ---------- video reels: play only what is on screen; click opens a player ---------- */
const reelsEl = $('.reels');
const reelVideos = $$('video', reelsEl);
const vio = new IntersectionObserver(entries => entries.forEach(en => {
  const v = en.target;
  if (en.isIntersecting && !reduced) {
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

