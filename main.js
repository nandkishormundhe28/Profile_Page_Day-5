/* index.js — interactions for your profile page */

/* ===== helpers ===== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* quick sanity check in Console */
console.log('index.js loaded');

/* ===== cache DOM ===== */
const header = $('.top-header');
const navLinks = $$('.nav a');
const toTop = $('.to-top');

/* build section list from your nav hrefs */
const sections = navLinks
  .map(a => (a.getAttribute('href') || '').replace('#', ''))
  .filter(Boolean)
  .map(id => ({ id, el: document.getElementById(id) }))
  .filter(s => s.el);

/* ===== smooth scroll with sticky-header offset ===== */
function scrollToTarget(el) {
  const headerH = header ? header.getBoundingClientRect().height : 0;
  const top = el.getBoundingClientRect().top + window.pageYOffset - (headerH + 12);
  const opts = { top: Math.max(top, 0), behavior: prefersReduced ? 'auto' : 'smooth' };
  window.scrollTo(opts);
}

navLinks.forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
    history.replaceState(null, '', href); // keep hash without jump
  });
});

/* ===== scroll spy (active link) ===== */
const linkById = navLinks.reduce((m, a) => {
  const id = (a.getAttribute('href') || '').replace('#', '');
  if (id) m[id] = a;
  return m;
}, {});

let lastActive = null;
const spy = new IntersectionObserver(
  entries => {
    const vis = entries.filter(e => e.isIntersecting);
    if (!vis.length) return;
    vis.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    const id = vis[0].target.id;
    if (id === lastActive) return;
    lastActive = id;
    navLinks.forEach(a => a.classList.remove('active'));
    linkById[id]?.classList.add('active');
  },
  {
    root: null,
    rootMargin: `-${(header?.offsetHeight || 0) + 24}px 0px -60% 0px`,
    threshold: [0.1, 0.25, 0.5, 0.75, 1]
  }
);
sections.forEach(s => spy.observe(s.el));

/* ===== <details class="item"> open/close animation ===== */
const detailsEls = $$('details.item');
function animateDetails(el, open) {
  if (prefersReduced) { el.open = open; return; }
  const content = el.querySelector(':scope > *:not(summary)');
  if (!content) { el.open = open; return; }

  const start = content.getBoundingClientRect().height;
  el.open = open;
  const end = content.getBoundingClientRect().height;

  el.open = !open;
  content.style.overflow = 'hidden';
  content.style.height = `${start}px`;

  requestAnimationFrame(() => {
    el.open = open;
    content.animate(
      [{ height: `${start}px` }, { height: `${end}px` }],
      { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' }
    ).onfinish = () => {
      content.style.height = '';
      content.style.overflow = '';
    };
  });
}
detailsEls.forEach(d => {
  d.addEventListener('toggle', e => {
    if (!e.isTrusted) return;
    e.preventDefault();
    animateDetails(d, d.open);
  });
});

/* ===== back-to-top show/hide + smooth scroll ===== */
function updateToTop() {
  const show = window.scrollY > 300;
  if (!toTop) return;
  toTop.style.opacity = show ? '1' : '0';
  toTop.style.pointerEvents = show ? 'auto' : 'none';
}
updateToTop();
window.addEventListener('scroll', updateToTop);

toTop?.addEventListener('click', e => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
});

/* ===== footer year ===== */
(function setYear() {
  const footer = $('.footer');
  if (footer) {
    footer.textContent = `© ${new Date().getFullYear()} Nandkishor Mundhe · Built with HTML & CSS only`;
  }
})();

/* ===== deep link offset on load ===== */
window.addEventListener('load', () => {
  const id = location.hash.replace('#', '');
  const target = id && document.getElementById(id);
  if (target) setTimeout(() => scrollToTarget(target), 10);
});
