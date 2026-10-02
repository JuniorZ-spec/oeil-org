const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  pfImg.src = (innerWidth <= 1000 && btn.dataset.mid) || btn.dataset.full; pfImg.alt = btn.dataset.cap;
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
const slowNet = !!(conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''));
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

/* swipe: left/right = previous/next photo, long swipe down = close */
let tx = 0, ty = 0;
pfBox.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
pfBox.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) pfShow(pfIdx + (dx < 0 ? 1 : -1));
  else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) pfBox.close();
}, { passive: true });



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
drift($('.reels'), 12);
