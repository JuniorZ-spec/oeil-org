// Renseigner le numéro WhatsApp (format international sans +, ex. '22901XXXXXXXX') pour activer tous les boutons WhatsApp.
window.SITE_WA = '';
document.addEventListener('DOMContentLoaded', () => {
  const home = /(^|\/)(index\.html)?$/.test(location.pathname) || location.pathname.endsWith('/');
  document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
    if (window.SITE_WA) { a.href = a.href.replace(/wa\.me\/\d+/, 'wa.me/' + window.SITE_WA); return; }
    if (a.classList.contains('fab') || a.classList.contains('ghost') || a.matches('.shop-note a, .wa-only')) { a.hidden = true; a.style.display = 'none'; return; }
    a.removeAttribute('target'); a.removeAttribute('rel');
    a.href = (home ? '' : 'index.html') + '#contact';
  });
});
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
