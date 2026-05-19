/* ============================================
   AFTER PARTY PAGE — after-party.js
============================================ */

const AP_PAYSTACK_KEY = 'pk_live_067f3190cefbd0eff300e721342e112e57490a3f';
const AP_SUPABASE_URL  = 'https://lnkdnmnrbxtqyhitqwvg.supabase.co';
const AP_SUPABASE_ANON = 'sb_publishable_kcLdNDW2wPmFd2FDW4mSXA_LtBPugzW';

/* ── Load Paystack ── */
(function () {
  const s   = document.createElement('script');
  s.src     = 'https://js.paystack.co/v1/inline.js';
  s.onload  = () => console.log('✓ Paystack ready');
  s.onerror = () => console.error('✗ Paystack failed');
  document.head.appendChild(s);
})();

/* ── Countdown Timer ── */
window.EVENT_DATE = new Date('2026-05-27T19:00:00');

function updateCountdown() {
  const diff = window.EVENT_DATE - new Date();
  if (diff <= 0) {
    ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '00';
    });
    const tag = document.querySelector('.cd-tagline');
    if (tag) tag.textContent = '✦ THE MAGIC HAS BEGUN ✦';
    return;
  }
  const pad = n => String(n).padStart(2, '0');
  document.getElementById('cd-days').textContent  = pad(Math.floor(diff / 86400000));
  document.getElementById('cd-hours').textContent = pad(Math.floor((diff % 86400000) / 3600000));
  document.getElementById('cd-mins').textContent  = pad(Math.floor((diff % 3600000) / 60000));
  document.getElementById('cd-secs').textContent  = pad(Math.floor((diff % 60000) / 1000));
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ── Navbar scroll ── */
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
  ham.setAttribute('aria-expanded', menu.classList.contains('open'));
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
  if (menu?.classList.contains('open') && !menu.contains(e.target) && !ham?.contains(e.target)) closeMenu();
});

/* ── Carousel ── */
let currentSlide = 0;
const totalSlides = 3;

function moveCarousel(direction) {
  currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
  updateCarousel();
}
function goToSlide(index) {
  currentSlide = index;
  updateCarousel();
}
function updateCarousel() {
  const track = document.getElementById('carouselTrack');
  const dots  = document.querySelectorAll('.carousel-dot');
  if (track) track.style.transform = `translateX(-${currentSlide * 100}%)`;
  dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
}
setInterval(() => moveCarousel(1), 4000);

/* ── General Access ticket quantity ── */
let gaQty = 1;

function changeAPQty(type, delta) {
  if (type === 'ga') {
    gaQty = Math.max(1, gaQty + delta);
    document.getElementById('ga-qty').textContent  = gaQty;
    document.getElementById('ga-total').textContent = `₦${(gaQty * 5000).toLocaleString()}`;
    document.getElementById('ga-pay-btn').textContent = `💳 Pay ₦${(gaQty * 5000).toLocaleString()}`;
  }
}

/* ── Generate booking ref ── */
function generateAPRef() {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `IBPP-${ts}-${rnd}`;
}

/* ── Save to Supabase ── */
async function saveAPBooking(data) {
  try {
    const res = await fetch(`${AP_SUPABASE_URL}/rest/v1/after_party_bookings`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        AP_SUPABASE_ANON,
        'Authorization': `Bearer ${AP_SUPABASE_ANON}`,
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    console.log('✓ After party booking saved');
  } catch (err) {
    console.error('✗ Save error:', err.message);
  }
}

/* ── Main payment handler ── */
function handleAPPayment(type, pricePerUnit, ticketType) {
  const name  = document.getElementById(`${type}-name`).value.trim();
  const email = document.getElementById(`${type}-email`).value.trim();
  const phone = document.getElementById(`${type}-phone`).value.trim();
  const qty   = type === 'ga' ? gaQty : 1;
  const total = pricePerUnit * qty;
  const ref   = generateAPRef();
  const btn   = document.getElementById(`${type}-pay-btn`);

  // Validate
  if (!name)  { alert('Please enter your full name.'); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Please enter a valid email address.'); return;
  }
  if (!phone || phone.length < 10) {
    alert('Please enter a valid phone number.'); return;
  }

  btn.textContent = 'Processing...';
  btn.disabled    = true;

  if (typeof PaystackPop === 'undefined') {
    alert('Payment is still loading, please try again.');
    btn.textContent = '💳 Pay Now';
    btn.disabled    = false;
    return;
  }

  PaystackPop.setup({
    key:      AP_PAYSTACK_KEY,
    email:    email,
    amount:   total * 100,
    currency: 'NGN',
    ref:      ref,
    metadata: {
      custom_fields: [
        { display_name: 'Full Name',   value: name        },
        { display_name: 'Phone',       value: phone       },
        { display_name: 'Ticket Type', value: ticketType  },
        { display_name: 'Quantity',    value: qty         },
        { display_name: 'Booking Ref', value: ref         }
      ]
    },
    callback: function (response) {
      // Save to Supabase
    saveAPBooking({
        full_name:         name,
        email:             email,
        phone:             phone,
        ticket_type:       ticketType,
        quantity:          qty,
        amount_paid:       total,
        payment_reference: response.reference || ref,
        payment_status:    'success',
        booking_reference: ref
      });

      // Show success popup
      showAPSuccessPopup(name, email, ref, ticketType, qty, total);

      btn.textContent = '💳 Pay Now';
      btn.disabled    = false;
    },
    onClose: function () {
      btn.textContent = type === 'vip'
        ? '💳 Pay Now — ₦200,000'
        : `💳 Pay ₦${total.toLocaleString()}`;
      btn.disabled = false;
    }
  }).openIframe();
}

/* ── Success popup ── */
function showAPSuccessPopup(name, email, ref, ticketType, qty, total) {
  const modal = document.createElement('div');
  modal.id    = 'ap-success-modal';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    padding: 20px;
    animation: apFadeIn 0.3s ease;
  `;

  modal.innerHTML = `
    <div style="
      background: #fff;
      border-radius: 24px;
      padding: 48px 36px;
      max-width: 460px;
      width: 100%;
      text-align: center;
      box-shadow: 0 24px 80px rgba(0,0,0,0.35);
      animation: apSlideUp 0.4s ease;
    ">
      <div style="font-size:48px;margin-bottom:16px;">🎉</div>

      <div style="
        width:72px;height:72px;
        background:#D1FAE5;border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        margin:0 auto 20px;font-size:32px;color:#065F46;font-weight:800;
      ">✓</div>

      <h2 style="
        font-family:'Fredoka One',cursive;
        font-size:30px;color:#5B2D8E;margin-bottom:8px;
      ">Payment Successful!</h2>

      <p style="font-size:15px;color:#6B7280;margin-bottom:24px;line-height:1.7;">
        Thank you, <strong>${name}</strong>!<br/>
        Your ticket to I Be Person Pikin is confirmed! 🥳
      </p>

      <div style="
        background:#F9F5FF;border:1.5px solid #E9D5FF;
        border-radius:14px;padding:16px 20px;
        margin-bottom:20px;text-align:left;
      ">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E9D5FF">
          <span style="color:#9CA3AF;font-size:13px;font-weight:600">Booking Ref</span>
          <span style="font-family:monospace;font-weight:800;color:#5B2D8E;font-size:13px">${ref}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E9D5FF">
          <span style="color:#9CA3AF;font-size:13px;font-weight:600">Ticket Type</span>
          <span style="font-weight:700;font-size:13px">${ticketType}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E9D5FF">
          <span style="color:#9CA3AF;font-size:13px;font-weight:600">Quantity</span>
          <span style="font-weight:700;font-size:13px">${qty} ticket${qty > 1 ? 's' : ''}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E9D5FF">
          <span style="color:#9CA3AF;font-size:13px;font-weight:600">Event</span>
          <span style="font-weight:700;font-size:13px">Wed, 27 May 2026 · 7PM</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0">
          <span style="color:#9CA3AF;font-size:13px;font-weight:600">Amount Paid</span>
          <span style="font-weight:800;font-size:15px;color:#059669">₦${total.toLocaleString()}</span>
        </div>
      </div>

      <p style="font-size:12px;color:#9CA3AF;margin-bottom:16px;">
        📧 Confirmation sent to <strong>${email}</strong>
      </p>

      <p style="font-size:13px;color:#5B2D8E;font-weight:700;margin-bottom:20px;" id="ap-countdown">
        Returning to home page in 8 seconds...
      </p>

      <div style="display:flex;flex-direction:column;gap:10px;">
        <button onclick="apGoHome()" style="
          background:linear-gradient(135deg,#5B2D8E,#7C3AED);
          color:#fff;font-family:'Fredoka One',cursive;
          font-size:18px;padding:14px 40px;
          border-radius:999px;border:none;cursor:pointer;width:100%;
          box-shadow:0 4px 16px rgba(91,45,142,0.3);
        ">🏠 Go to Home Page</button>
        <button onclick="apCloseModal()" style="
          background:transparent;color:#5B2D8E;
          font-family:'Fredoka One',cursive;font-size:16px;
          padding:12px;border-radius:999px;
          border:2px solid #E9D5FF;cursor:pointer;width:100%;
        ">✕ Close</button>
      </div>
    </div>

    <style>
      @keyframes apFadeIn  { from{opacity:0} to{opacity:1} }
      @keyframes apSlideUp {
        from{transform:translateY(50px);opacity:0}
        to{transform:translateY(0);opacity:1}
      }
      @keyframes apFadeOut { from{opacity:1} to{opacity:0} }
    </style>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // Countdown
  let seconds  = 8;
  const countEl = document.getElementById('ap-countdown');
  const timer   = setInterval(() => {
    seconds--;
    if (countEl) {
      countEl.textContent = `Returning to home page in ${seconds} second${seconds !== 1 ? 's' : ''}...`;
    }
    if (seconds <= 0) { clearInterval(timer); apGoHome(); }
  }, 1000);
  modal._timer = timer;
}

function apGoHome() {
  const modal = document.getElementById('ap-success-modal');
  if (modal) {
    if (modal._timer) clearInterval(modal._timer);
    modal.style.animation = 'apFadeOut 0.3s ease forwards';
    document.body.style.overflow = '';
    setTimeout(() => { modal.remove(); window.location.href = 'index.html'; }, 300);
  } else {
    window.location.href = 'index.html';
  }
}

function apCloseModal() {
  const modal = document.getElementById('ap-success-modal');
  if (modal) {
    if (modal._timer) clearInterval(modal._timer);
    modal.style.animation = 'apFadeOut 0.3s ease forwards';
    document.body.style.overflow = '';
    setTimeout(() => modal.remove(), 300);
  }
}