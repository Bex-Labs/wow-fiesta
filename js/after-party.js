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

/* ============================================
   AFTER PARTY REGISTRATION
   Paystack payment for adult-only tickets
   ₦3,000 per adult — Lagos only
============================================ */

// ── Paste your Paystack public key here ──
const AP_PAYSTACK_KEY = 'pk_test_da61808dbf2ddb885bc7a88ff6f56fa22e614d2b';

// Load Paystack script
(function loadAPPaystack() {
  const s   = document.createElement('script');
  s.src     = 'https://js.paystack.co/v1/inline.js';
  s.onload  = () => console.log('✓ Paystack ready');
  document.head.appendChild(s);
})();

// Update live total when adult count changes
function updateAPTotal() {
  const adults      = parseInt(
    document.getElementById('ap-adults')?.value
  ) || 1;
  const total       = adults * 5000;
  const totalEl     = document.getElementById('ap-total-display');
  const btnEl       = document.getElementById('ap-register-btn');

  if (totalEl) {
    totalEl.textContent = `₦${total.toLocaleString()}`;
  }
  if (btnEl) {
    btnEl.textContent =
      `PAY ₦${total.toLocaleString()} & GET TICKETS`;
  }
}

// Call once on load to set initial state
updateAPTotal();

// Generate booking ref
function generateAPRef() {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36)
    .substring(2, 6).toUpperCase();
  return `IBPP-${ts}-${rnd}`;
}

// Validate form fields
function validateAPForm() {
  const name  = document.getElementById('ap-name')?.value.trim();
  const email = document.getElementById('ap-email')?.value.trim();
  const phone = document.getElementById('ap-phone')?.value.trim();
  const adults = parseInt(
    document.getElementById('ap-adults')?.value
  ) || 0;

  // Clear previous errors
  document.querySelectorAll('#ibpp-form input')
    .forEach(el => el.classList.remove('error'));

  let valid = true;

  if (!name) {
    document.getElementById('ap-name')
      .classList.add('error');
    valid = false;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('ap-email')
      .classList.add('error');
    valid = false;
  }
  if (!phone || phone.length < 10) {
    document.getElementById('ap-phone')
      .classList.add('error');
    valid = false;
  }
  if (adults < 1) {
    document.getElementById('ap-adults')
      .classList.add('error');
    valid = false;
  }

  return valid;
}

// Main handler — called when Pay button clicked
function handleAfterPartyRegistration() {
  if (!validateAPForm()) return;

  const name    = document.getElementById('ap-name').value.trim();
  const email   = document.getElementById('ap-email').value.trim();
  const phone   = document.getElementById('ap-phone').value.trim();
  const adults  = parseInt(
    document.getElementById('ap-adults').value
  ) || 1;
  const total   = adults * 5000;
  const ref     = generateAPRef();

  // Show loading state
  const btn       = document.getElementById('ap-register-btn');
  btn.textContent = 'Processing...';
  btn.disabled    = true;

  // Open Paystack
  const handler = PaystackPop.setup({
    key:      AP_PAYSTACK_KEY,
    email:    email,
    amount:   total * 100,
    currency: 'NGN',
    ref:      ref,
    metadata: {
      custom_fields: [
        { display_name: 'Full Name',  value: name  },
        { display_name: 'Phone',      value: phone },
        { display_name: 'Event',      value: 'I Be Person Pikin' },
        { display_name: 'Adults',     value: adults },
        { display_name: 'Booking Ref', value: ref  }
      ]
    },
    callback: function (response) {
      console.log('✓ After party payment success:', response);
      showAPSuccess(name, email, ref, adults, total);
    },
    onClose: function () {
      btn.textContent = `PAY ₦${total.toLocaleString()} & GET TICKETS`;
      btn.disabled    = false;
    }
  });

  handler.openIframe();
}

// Show success confirmation
function showAPSuccess(name, email, ref, adults, total) {
  const form    = document.getElementById('ibpp-form');
  const success = document.getElementById('ap-success');

  if (form)    form.style.display    = 'none';
  if (success) success.style.display = 'block';

  const refEl   = document.getElementById('ap-success-ref');
  const emailEl = document.getElementById('ap-success-email');

  if (refEl) {
    refEl.innerHTML = `
      <strong style="
        font-family: 'Fredoka One', cursive;
        font-size: 18px;
        color: #F59E0B;
        letter-spacing: 1px;
        display: block;
        margin: 8px 0;
      ">${ref}</strong>
      ${adults} adult ticket${adults > 1 ? 's' : ''} ·
      ₦${total.toLocaleString()} paid
    `;
  }

  if (emailEl) {
    emailEl.textContent =
      `Confirmation details sent to ${email}`;
  }
}