(() => {
  const b = document.querySelector('.menu-btn'), n = document.getElementById('nav');
  if (!b || !n) return;
  const set = o => {
    b.setAttribute('aria-expanded', String(o));
    n.classList.toggle('open', o);
    document.documentElement.classList.toggle('menu-open', o);
  };
  b.addEventListener('click', () => set(b.getAttribute('aria-expanded') !== 'true'));
  n.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('click', e => { if (!n.contains(e.target) && !b.contains(e.target)) set(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  addEventListener('resize', () => { if (innerWidth > 1000) set(false); });
})();
