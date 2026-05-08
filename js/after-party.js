/* ============================================
   AFTER PARTY PAGE — after-party.js
   Handles countdown timer, navbar
   and hamburger menu
============================================ */

/* ── Countdown Timer ── */
window.EVENT_DATE = new Date('2026-05-27T10:00:00');

function updateCountdown() {
  const diff = window.EVENT_DATE - new Date();

  if (diff <= 0) {
    ['cd-days','cd-hours','cd-mins','cd-secs']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '00';
      });
    const tag = document.querySelector('.cd-tagline');
    if (tag) tag.textContent = '✦ THE MAGIC HAS BEGUN ✦';
    return;
  }

  const pad = n => String(n).padStart(2, '0');

  document.getElementById('cd-days').textContent =
    pad(Math.floor(diff / 86400000));
  document.getElementById('cd-hours').textContent =
    pad(Math.floor((diff % 86400000) / 3600000));
  document.getElementById('cd-mins').textContent =
    pad(Math.floor((diff % 3600000) / 60000));
  document.getElementById('cd-secs').textContent =
    pad(Math.floor((diff % 60000) / 1000));
}

updateCountdown();
setInterval(updateCountdown, 1000);


/* ── Navbar scroll shadow ── */
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  navbar.style.boxShadow = window.scrollY > 20
    ? '0 4px 20px rgba(91,45,142,0.15)'
    : '0 1px 3px rgba(0,0,0,0.08)';
});


/* ── Hamburger menu ── */
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  const ham  = document.getElementById('hamburger');
  menu.classList.toggle('open');
  ham.setAttribute(
    'aria-expanded',
    menu.classList.contains('open')
  );
}

function closeMenu() {
  const menu = document.getElementById('mobileMenu');
  const ham  = document.getElementById('hamburger');
  menu.classList.remove('open');
  ham.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', e => {
  const menu = document.getElementById('mobileMenu');
  const ham  = document.getElementById('hamburger');
  if (
    menu?.classList.contains('open') &&
    !menu.contains(e.target) &&
    !ham?.contains(e.target)
  ) closeMenu();
});