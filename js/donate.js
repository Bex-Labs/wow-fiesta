/* ============================================
   DONATE PAGE — donate.js
============================================ */

const DONATE_PAYSTACK_KEY = 'pk_test_da61808dbf2ddb885bc7a88ff6f56fa22e614d2b';

// Load Paystack
(function () {
  const s = document.createElement('script');
  s.src = 'https://js.paystack.co/v1/inline.js';
  document.head.appendChild(s);
})();

// Countdown
window.EVENT_DATE = new Date('2026-05-27T10:00:00');
function updateCountdown() {
  const diff = window.EVENT_DATE - new Date();
  if (diff <= 0) return;
  const pad = n => String(n).padStart(2, '0');
  document.getElementById('cd-days').textContent = pad(Math.floor(diff / 86400000));
  document.getElementById('cd-hours').textContent = pad(Math.floor((diff % 86400000) / 3600000));
  document.getElementById('cd-mins').textContent = pad(Math.floor((diff % 3600000) / 60000));
  document.getElementById('cd-secs').textContent = pad(Math.floor((diff % 60000) / 1000));
}
updateCountdown();
setInterval(updateCountdown, 1000);

// Navbar scroll
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  navbar.style.boxShadow = window.scrollY > 20
    ? '0 4px 20px rgba(91,45,142,0.15)'
    : '0 1px 3px rgba(0,0,0,0.08)';
});

// Hamburger
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  const ham = document.getElementById('hamburger');
  menu.classList.toggle('open');
  ham.setAttribute('aria-expanded', menu.classList.contains('open'));
}
function closeMenu() {
  const menu = document.getElementById('mobileMenu');
  const ham = document.getElementById('hamburger');
  menu.classList.remove('open');
  ham.setAttribute('aria-expanded', 'false');
}
document.addEventListener('click', e => {
  const menu = document.getElementById('mobileMenu');
  const ham = document.getElementById('hamburger');
  if (menu?.classList.contains('open') && !menu.contains(e.target) && !ham?.contains(e.target)) closeMenu();
});

// Amount selection
let selectedAmount = 0;

function selectAmount(btn, amount) {
  document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedAmount = amount;
  document.getElementById('custom-amount').value = '';
}

function setCustomAmount(val) {
  document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
  selectedAmount = parseInt(val) || 0;
}

// Generate ref
function generateDonateRef() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DONATE-${ts}-${rnd}`;
}

// Handle donation
function handleDonation() {
  const name = document.getElementById('donor-name').value.trim();
  const email = document.getElementById('donor-email').value.trim();
  const customVal = parseInt(document.getElementById('custom-amount').value) || 0;
  const amount = selectedAmount || customVal;

  if (!name) {
    alert('Please enter your name.');
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }
  if (amount < 100) {
    alert('Minimum donation is ₦100.');
    return;
  }

  const ref = generateDonateRef();
  const btn = document.getElementById('donate-btn');
  btn.textContent = 'Processing...';
  btn.disabled = true;

  const handler = PaystackPop.setup({
    key: DONATE_PAYSTACK_KEY,
    email: email,
    amount: amount * 100,
    currency: 'NGN',
    ref: ref,
    metadata: {
      custom_fields: [
        { display_name: 'Full Name', value: name },
        { display_name: 'Type', value: 'Donation' },
        { display_name: 'Reference', value: ref }
      ]
    },
    callback: function (response) {
      document.querySelector('.donate-card').innerHTML = `
        <div style="
          padding: 80px 40px;
          text-align: center;
          width: 100%;
        ">
          <div style="
            font-size: 64px;
            margin-bottom: 20px;
          ">💛</div>
          <h2 style="
            font-family: 'Fredoka One', cursive;
            font-size: 36px;
            color: var(--purple);
            margin-bottom: 12px;
          ">Thank You, ${name}!</h2>
          <p style="
            font-size: 16px;
            color: var(--text-muted);
            line-height: 1.8;
            max-width: 500px;
            margin: 0 auto 20px;
          ">
            Your donation of <strong>₦${amount.toLocaleString()}</strong> has been received.
            You are helping make the magic real for children across Lagos.
          </p>
          <p style="
            font-size: 13px;
            color: var(--text-muted);
          ">Confirmation sent to <strong>${email}</strong></p>
          <p style="
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 8px;
          ">Reference: ${ref}</p>
        </div>
      `;
    },
    onClose: function () {
      btn.textContent = '💛 DONATE NOW';
      btn.disabled = false;
    }
  });

  handler.openIframe();
}