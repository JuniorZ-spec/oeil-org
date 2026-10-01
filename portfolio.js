const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* mobile nav */
const menuBtn = $('.menu-btn');
const nav = $('#nav');
menuBtn.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});

/* ---------- portfolio: filter + lightbox with prev/next ---------- */
const pfItems = $$('.pf');
$$('.chips button').forEach(b => b.addEventListener('click', () => {
  $$('.chips button').forEach(o => o.classList.toggle('on', o === b));
  pfItems.forEach(f => f.classList.toggle('off', b.dataset.f !== 'all' && f.dataset.cat !== b.dataset.f));
}));
const pfBox = $('.pfbox');
const pfImg = $('img', pfBox);
let pfIdx = 0;
const pfVisible = () => pfItems.filter(f => !f.classList.contains('off'));
function pfShow(i) {
  const list = pfVisible();
  pfIdx = (i + list.length) % list.length;
  const btn = $('button', list[pfIdx]);
  pfImg.src = btn.dataset.full; pfImg.alt = btn.dataset.cap;
  $('.lb-title', pfBox).textContent = btn.dataset.cap;
}
pfItems.forEach(f => $('button', f).addEventListener('click', () => {
  pfShow(pfVisible().indexOf(f)); pfBox.showModal();
}));
$('.pf-nav.prev', pfBox).addEventListener('click', () => pfShow(pfIdx - 1));
$('.pf-nav.next', pfBox).addEventListener('click', () => pfShow(pfIdx + 1));
$('.lb-close', pfBox).addEventListener('click', () => pfBox.close());
pfBox.addEventListener('click', e => { if (e.target === pfBox) pfBox.close(); });
pfBox.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') pfShow(pfIdx - 1);
  if (e.key === 'ArrowRight') pfShow(pfIdx + 1);
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

const lb = $('.lightbox:not(.pfbox)');
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
