/* ============================================
   register.js — WoW Fiesta Registration Page

   1.  Supabase connection & data loading
   2.  Countdown timer
   3.  Navbar scroll behaviour
   4.  Hamburger mobile menu
   5.  Ticket quantity stepper
   6.  City selector & price update
   7.  Form validation
   8.  Paystack payment
   9.  Free registration handler
   10. Payment success / receipt
   11. Email confirmation (EmailJS)
   12. Print receipt
   13. Toast notifications
   14. Fade-in animations
============================================ */


/* ============================================
   CREDENTIALS
============================================ */
const PAYSTACK_PUBLIC_KEY = 'pk_live_067f3190cefbd0eff300e721342e112e57490a3f';
const EMAILJS_SERVICE_ID  = 'wow_fiesta_service';
const EMAILJS_TEMPLATE_ID = 'template_zct8vl2';
const EMAILJS_PUBLIC_KEY  = 'ZwmKZd9f4YobPndRb';

const SUPABASE_URL  = 'https://lnkdnmnrbxtqyhitqwvg.supabase.co';
const SUPABASE_ANON = 'sb_publishable_kcLdNDW2wPmFd2FDW4mSXA_LtBPugzW';


/* ============================================
   1. SUPABASE — connect and load events
============================================ */
(function loadSupabase() {
  const script   = document.createElement('script');
  script.src     = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload  = function () {
    window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    console.log('✓ Supabase connected');
    loadEvents();
  };
  script.onerror = function () {
    console.error('✗ Could not load Supabase library');
  };
  document.head.appendChild(script);
})();

async function loadEvents() {
  try {
    const { data, error } = await window.db
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('event_date');

    if (error) throw error;
    if (!data || data.length === 0) return;

    window.activeEvents = data;

    // Update countdown to first event
    const firstEvent = data[0];
    const dt         = new Date(firstEvent.event_date + 'T10:00:00');
    if (!isNaN(dt)) window.EVENT_DATE = dt;

    // Populate city dropdown
    populateCitySelector(data);

    // Update event detail cards in the header
    updateEventCards(data);

    console.log('✓ Events loaded:', data.map(e => e.city).join(', '));
  } catch (err) {
    console.warn('Events load error:', err.message);
  }
}


/* ============================================
   POPULATE CITY SELECTOR
============================================ */
function populateCitySelector(events) {
  const sel = document.getElementById('city-select');
  if (!sel) return;

  sel.innerHTML = '<option value="">— Choose your city —</option>';

  events.forEach(ev => {
    const opt  = document.createElement('option');
    opt.value  = ev.id;

    const d    = new Date(ev.event_date + 'T00:00:00');
    const fmtd = d.toLocaleDateString('en-NG', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    opt.textContent          = `${ev.city} — ${fmtd}`;
    opt.dataset.city         = ev.city;
    opt.dataset.date         = ev.event_date;
    opt.dataset.venue        = ev.venue_address;
    opt.dataset.adultPrice   = ev.adult_price;
    sel.appendChild(opt);
  });

  sel.addEventListener('change', onCityChange);
}

function onCityChange() {
  const sel      = document.getElementById('city-select');
  const opt      = sel.options[sel.selectedIndex];
  const label    = document.getElementById('adult-price-label');
  const hint     = document.getElementById('adults-hint');

  if (opt && opt.dataset.adultPrice) {
    const price        = parseInt(opt.dataset.adultPrice);
    if (label) {
      label.textContent = `₦${price.toLocaleString()} each`;
      label.classList.remove('hidden');
    }
    if (hint) {
      hint.textContent = `${opt.dataset.city} adult price: ₦${price.toLocaleString()} per person`;
    }
  } else {
    if (label) { label.textContent = ''; label.classList.add('hidden'); }
    if (hint)  { hint.textContent  = 'Select your city first to see the adult price'; }
  }

  updatePriceSummary();
}


/* ============================================
   UPDATE EVENT CARDS IN HEADER
============================================ */
function updateEventCards(events) {
  const container = document.getElementById('event-cards-container');
  if (!container) return;

  const icons = ['📍', '📍'];
  container.innerHTML = events.map((ev, i) => {
    const d   = new Date(ev.event_date + 'T00:00:00');
    const fmt = d.toLocaleDateString('en-NG', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    return `
      <div class="event-card">
        <div class="event-card-icon">${icons[i] || '📍'}</div>
        <div class="event-card-info">
          <div class="city">${ev.city}</div>
          <div class="date">${fmt}</div>
          <div class="venue">${ev.venue_name || ev.venue_address || ''}</div>
        </div>
      </div>
    `;
  }).join('');
}


/* ============================================
   2. COUNTDOWN TIMER
============================================ */
window.EVENT_DATE = new Date('2026-05-27T10:00:00');

function updateCountdown() {
  const now  = new Date();
  const diff = window.EVENT_DATE - now;

  const pad = n => String(n).padStart(2, '0');

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = pad(val);
  };

  if (diff <= 0) {
    ['cd-days','cd-hours','cd-mins','cd-secs',
     'icd-days','icd-hours','icd-mins'].forEach(id => set(id, 0));
    const tag = document.querySelector('.cd-tagline');
    if (tag) tag.textContent = '✦ THE MAGIC HAS BEGUN ✦';
    return;
  }

  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000)  / 60000);
  const seconds = Math.floor((diff % 60000)    / 1000);

  // Top banner countdown
  set('cd-days',  days);
  set('cd-hours', hours);
  set('cd-mins',  minutes);
  set('cd-secs',  seconds);

  // Mini image countdown (days / hrs / min only)
  set('icd-days',  days);
  set('icd-hours', hours);
  set('icd-mins',  minutes);
}

updateCountdown();
setInterval(updateCountdown, 1000);


/* ============================================
   3. NAVBAR SCROLL SHADOW
============================================ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (!navbar) return;
  navbar.style.boxShadow = window.scrollY > 20
    ? '0 4px 20px rgba(91,45,142,0.15)'
    : '0 1px 3px rgba(0,0,0,0.08)';
});


/* ============================================
   4. HAMBURGER MENU
============================================ */
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  const ham  = document.getElementById('hamburger');
  if (!menu) return;
  const open = menu.classList.toggle('open');
  ham?.setAttribute('aria-expanded', String(open));
}

function closeMenu() {
  const menu = document.getElementById('mobileMenu');
  const ham  = document.getElementById('hamburger');
  menu?.classList.remove('open');
  ham?.setAttribute('aria-expanded', 'false');
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
   5. TICKET QUANTITY STEPPERS
   +/- buttons for children and adults
============================================ */
function stepTicket(fieldId, delta) {
  const input = document.getElementById(fieldId);
  if (!input) return;
  const min = parseInt(input.min ?? 0);
  const max = parseInt(input.max ?? 999);
  let val = (parseInt(input.value) || 0) + delta;
  val = Math.min(max, Math.max(min, val));
  input.value = val;
  updatePriceSummary();
}


/* ============================================
   6. LIVE PRICE SUMMARY
============================================ */
function updatePriceSummary() {
  const sel      = document.getElementById('city-select');
  const opt      = sel?.options[sel.selectedIndex];
  const adults   = parseInt(document.getElementById('num-adults')?.value)   || 0;
  const children = parseInt(document.getElementById('num-children')?.value) || 0;
  const box      = document.getElementById('price-summary');
  const btn      = document.getElementById('book-btn');

  if (!opt || !opt.dataset.adultPrice) {
    if (box) box.classList.remove('visible');
    return;
  }

  const price       = parseInt(opt.dataset.adultPrice);
  const adultTotal  = adults * price;

  if (box) {
    box.classList.add('visible');
    box.innerHTML = `
      <div class="price-row">
        <span>Children / PWDs (${children})</span>
        <span class="price-free">FREE</span>
      </div>
      <div class="price-row">
        <span>Adults (${adults} × ₦${price.toLocaleString()})</span>
        <span>₦${adultTotal.toLocaleString()}</span>
      </div>
      <div class="price-row price-total">
        <span>Total</span>
        <span>₦${adultTotal.toLocaleString()}</span>
      </div>
    `;
  }

  if (btn) {
    btn.textContent = adultTotal > 0
      ? `Book Now — Pay ₦${adultTotal.toLocaleString()}`
      : 'Book Now — Secure My Spot (Free)';
  }

  window.currentTotal      = adultTotal;
  window.currentAdultPrice = price;
}


/* ============================================
   7. FORM VALIDATION
============================================ */
function validateForm() {
  clearErrors();
  let valid = true;

  const city     = document.getElementById('city-select')?.value;
  const name     = document.getElementById('full-name')?.value.trim();
  const email    = document.getElementById('email')?.value.trim();
  const phone    = document.getElementById('phone')?.value.trim();
  const children = parseInt(document.getElementById('num-children')?.value) || 0;
  const adults   = parseInt(document.getElementById('num-adults')?.value)   || 0;

  if (!city)                          { showError('city-select', 'Please select your city'); valid = false; }
  if (!name)                          { showError('full-name',   'Please enter your full name'); valid = false; }
  if (!email || !isValidEmail(email)) { showError('email',       'Please enter a valid email address'); valid = false; }
  if (!phone || phone.length < 10)    { showError('phone',       'Please enter a valid phone number'); valid = false; }
  if (children === 0 && adults === 0) { showError('num-children','Please add at least one child or adult'); valid = false; }

  return valid;
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('error');

  let err = field.parentElement.querySelector('.field-error');
  if (!err) {
    err           = document.createElement('p');
    err.className = 'field-error';
    field.parentElement.appendChild(err);
  }
  err.textContent = message;
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.remove());
  document.querySelectorAll('.form-group input, .form-group select')
    .forEach(el => el.classList.remove('error'));
}


/* ============================================
   8. BOOKING REFERENCE GENERATOR
============================================ */
function generateBookingRef() {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WOW-${ts}-${rnd}`;
}


/* ============================================
   9. MAIN REGISTRATION HANDLER
============================================ */
function handleRegistration() {
  if (!validateForm()) return;

  const sel  = document.getElementById('city-select');
  const opt  = sel.options[sel.selectedIndex];
  const btn  = document.getElementById('book-btn');

  const formData = {
    fullName:    document.getElementById('full-name').value.trim(),
    email:       document.getElementById('email').value.trim(),
    phone:       document.getElementById('phone').value.trim(),
    numChildren: document.getElementById('num-children').value,
    numAdults:   document.getElementById('num-adults').value,
    city:        opt.dataset.city      || '',
    venue:       opt.dataset.venue     || '',
    date:        opt.dataset.date      || '',
    adultPrice:  parseInt(opt.dataset.adultPrice) || 0,
    totalAmount: window.currentTotal   || 0,
    bookingRef:  generateBookingRef(),
    paymentMethod: 'paystack'
  };

  if (formData.totalAmount === 0) {
    handleFreeRegistration(formData);
    return;
  }

  btn.textContent = 'Processing...';
  btn.disabled    = true;
  payWithPaystack(formData);
}


/* ============================================
   10. PAYSTACK PAYMENT
============================================ */
function payWithPaystack(formData) {
  const handler = PaystackPop.setup({
    key:      PAYSTACK_PUBLIC_KEY,
    email:    formData.email,
    amount:   formData.totalAmount * 100,
    currency: 'NGN',
    ref:      formData.bookingRef,
    metadata: {
      custom_fields: [
        { display_name: 'Full Name',          value: formData.fullName    },
        { display_name: 'Phone',              value: formData.phone       },
        { display_name: 'City',               value: formData.city        },
        { display_name: 'Number of Children', value: formData.numChildren },
        { display_name: 'Number of Adults',   value: formData.numAdults   },
        { display_name: 'Booking Reference',  value: formData.bookingRef  }
      ]
    },
    callback: response => {
      console.log('✓ Paystack success:', response);
      onPaymentSuccess(formData, 'paystack', response.reference);
    },
    onClose: () => {
      resetBookBtn();
      showToast('Payment cancelled. Your details are still saved.', 'info');
    }
  });
  handler.openIframe();
}

function resetBookBtn() {
  const btn = document.getElementById('book-btn');
  if (btn) { btn.textContent = 'Book Now — Secure My Spot'; btn.disabled = false; }
}


/* ============================================
   11. FREE REGISTRATION
============================================ */
async function handleFreeRegistration(formData) {
  const btn = document.getElementById('book-btn');
  btn.textContent = 'Registering...';
  btn.disabled    = true;

  try {
    if (window.db) {
      await window.db.from('registrations').insert([{
        full_name:         formData.fullName,
        email:             formData.email,
        phone:             formData.phone,
        city:              formData.city,
        venue_address:     formData.venue,
        event_date:        formData.date,
        num_children:      parseInt(formData.numChildren) || 0,
        num_adults:        0,
        adult_price_each:  0,
        amount_paid:       0,
        payment_method:    'free',
        payment_reference: 'FREE-' + formData.bookingRef,
        payment_status:    'success',
        booking_reference: formData.bookingRef
      }]);
      console.log('✓ Free registration saved');
    }
  } catch (err) {
    console.error('Free reg error:', err.message);
  }

  onPaymentSuccess(formData, 'free', 'FREE');
}


/* ============================================
   12. ON PAYMENT SUCCESS — SHOW RECEIPT
============================================ */
async function onPaymentSuccess(formData, gateway, txRef) {
  // Save paid booking to Supabase
  if (gateway !== 'free' && window.db) {
    try {
      await window.db.from('registrations').insert([{
        full_name:         formData.fullName,
        email:             formData.email,
        phone:             formData.phone,
        city:              formData.city,
        venue_address:     formData.venue,
        event_date:        formData.date,
        num_children:      parseInt(formData.numChildren) || 0,
        num_adults:        parseInt(formData.numAdults)   || 0,
        adult_price_each:  formData.adultPrice            || 0,
        amount_paid:       formData.totalAmount           || 0,
        payment_method:    gateway,
        payment_reference: txRef,
        payment_status:    'success',
        booking_reference: formData.bookingRef
      }]);
      console.log('✓ Registration saved to Supabase');
    } catch (err) {
      console.error('Save error:', err.message);
    }
  }

  // Format date
  const dateObj   = formData.date
    ? new Date(formData.date + 'T00:00:00') : new Date();
  const fmtDate   = dateObj.toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const amtDisplay = formData.totalAmount > 0
    ? `₦${formData.totalAmount.toLocaleString()}` : 'FREE';

  // Show success popup modal first
  showSuccessPopup(formData, amtDisplay);

  // Replace form card with receipt
  const card = document.getElementById('reg-form-card');
  if (!card) return;

  card.innerHTML = `
    <div class="receipt-wrap" id="receipt-card">

      <!-- Logo -->
      <img
        src="assets/logo.png"
        alt="WoW Fiesta"
        style="width:72px;height:72px;object-fit:contain;margin:0 auto 8px;border-radius:12px;display:block;"
      />
      <p style="font-size:12px;font-weight:700;color:var(--purple-mid);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">
        WoW Children's Day Fiesta
      </p>

      <!-- Success icon -->
      <div class="receipt-success-icon">✓</div>

      <!-- Title -->
      <h3 style="font-family:'Fredoka One',cursive;font-size:26px;color:var(--purple);margin-bottom:6px;">
        Booking Confirmed!
      </h3>
      <p style="font-size:14px;color:var(--text-muted);margin-bottom:20px;line-height:1.6;">
        You're all set! Present this receipt at the gate.
      </p>

      <!-- Booking reference -->
      <div class="receipt-booking-ref">
        <p class="receipt-ref-label">BOOKING REFERENCE</p>
        <p class="receipt-ref-value">${formData.bookingRef}</p>
      </div>

      <!-- Details table -->
      <div class="receipt-details">
        <div class="receipt-row">
          <span class="r-label">Name</span>
          <span class="r-value">${formData.fullName}</span>
        </div>
        <div class="receipt-row">
          <span class="r-label">City</span>
          <span class="r-value">${formData.city}</span>
        </div>
        <div class="receipt-row">
          <span class="r-label">Date</span>
          <span class="r-value">${fmtDate}</span>
        </div>
        <div class="receipt-row">
          <span class="r-label">Venue</span>
          <span class="r-value">${formData.venue}</span>
        </div>
        <div class="receipt-row">
          <span class="r-label">Children / PWDs</span>
          <span class="r-value green">${formData.numChildren} — FREE</span>
        </div>
        <div class="receipt-row">
          <span class="r-label">Adults</span>
          <span class="r-value">${formData.numAdults}</span>
        </div>
        <div class="receipt-row total-row">
          <span class="r-label">Total Paid</span>
          <span class="r-value">${amtDisplay}</span>
        </div>
      </div>

      <!-- Email status -->
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px;line-height:1.6;" id="email-status-msg">
        📧 Sending confirmation to <strong>${formData.email}</strong>…
      </p>

      <!-- Action buttons -->
      <div class="receipt-actions">
        <button class="btn-print" onclick="printReceipt()">
          🖨️ Print / Save Receipt
        </button>
        <button
          class="btn-whatsapp"
          onclick="window.open('https://wa.me/?text=I%20just%20registered%20for%20WoW%20Fiesta%20${encodeURIComponent(formData.city)}!%20%F0%9F%8E%89%20Booking%20ref%3A%20${formData.bookingRef}','_blank')">
          📲 Share on WhatsApp
        </button>
      </div>
    </div>
  `;

  sendConfirmationEmail(formData, fmtDate, formData.venue, amtDisplay);
}


/* ============================================
   13. SEND CONFIRMATION EMAIL (EmailJS)
============================================ */
async function sendConfirmationEmail(formData, fmtDate, venue, amtDisplay) {
  const statusMsg = document.getElementById('email-status-msg');
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      attendee_name:  formData.fullName,
      attendee_email: formData.email,
      booking_ref:    formData.bookingRef,
      city:           formData.city,
      event_date:     fmtDate,
      venue:          venue,
      num_children:   formData.numChildren,
      num_adults:     formData.numAdults,
      amount_paid:    amtDisplay,
      phone:          formData.phone
    });
    console.log('✓ Confirmation email sent');
    if (statusMsg) {
      statusMsg.innerHTML = `✅ Confirmation sent to <strong>${formData.email}</strong>`;
      statusMsg.style.color = '#065F46';
    }
  } catch (err) {
    console.error('Email error:', err);
    if (statusMsg) {
      statusMsg.textContent = `Receipt shown above. Check your email at ${formData.email}`;
    }
  }
}


/* ============================================
   14. PRINT RECEIPT
============================================ */
function printReceipt() {
  const card = document.getElementById('reg-form-card');
  if (!card) return;

  const pw = window.open('', '_blank');
  pw.document.write(`
    <!DOCTYPE html><html><head>
    <title>WoW Fiesta Booking Receipt</title>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet"/>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Nunito',sans-serif;background:#fff;padding:32px;max-width:520px;margin:0 auto;color:#374151}
      .header{text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #EDE9FE}
      .logo{width:64px;height:64px;object-fit:contain;border-radius:10px;margin:0 auto 8px;display:block}
      .event-name{font-size:12px;font-weight:700;color:#7B3FBE;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px}
      .tick{width:52px;height:52px;background:#D1FAE5;border-radius:50%;font-size:24px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;line-height:1}
      h2{font-family:'Fredoka One',cursive;font-size:28px;color:#5B2D8E;margin-bottom:4px;text-align:center}
      .sub{font-size:13px;color:#6B7280;text-align:center;margin-bottom:16px}
      .ref-box{background:#F5F0FF;border-radius:10px;padding:12px 16px;text-align:center;margin-bottom:16px}
      .ref-lbl{font-size:10px;color:#7B3FBE;font-weight:700;letter-spacing:1.5px;margin-bottom:4px}
      .ref-val{font-family:'Courier New',monospace;font-size:20px;font-weight:800;color:#5B2D8E;letter-spacing:2px}
      table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px}
      tr{border-bottom:1px solid #F3F4F6}
      tr:last-child{border-bottom:none}
      td{padding:8px 4px;vertical-align:top}
      td:first-child{color:#6B7280;width:45%}
      td:last-child{font-weight:700;color:#1F1F2E;text-align:right}
      .total-row td{font-size:15px;font-weight:800;color:#5B2D8E;padding-top:12px}
      .green{color:#10B981}
      .footer{text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #EDE9FE;font-size:11px;color:#9CA3AF;line-height:1.6}
      @media print{body{padding:16px}}
    </style>
    </head><body>
    <div class="header">
      <img src="${window.location.origin}/assets/logo.png" class="logo" alt="WoW Fiesta"/>
      <p class="event-name">WoW Children's Day Fiesta</p>
      <div class="tick">✓</div>
      <h2>Booking Confirmed!</h2>
      <p class="sub">Present this receipt at the event gate</p>
    </div>
    <div class="ref-box">
      <p class="ref-lbl">BOOKING REFERENCE</p>
      <p class="ref-val" id="print-ref">Loading…</p>
    </div>
    <table id="print-table"><tr><td colspan="2">Loading…</td></tr></table>
    <div class="footer">
      <p>✅ Confirmation sent to your email</p>
      <p style="margin-top:6px">WoW Children's Day Fiesta · Celebrating Childhood Wonder Since 2015</p>
    </div>
    </body></html>
  `);
  pw.document.close();

  setTimeout(() => {
    try {
      // Copy booking ref
      const refEl   = document.querySelector('#receipt-card .receipt-ref-value');
      const printRef = pw.document.getElementById('print-ref');
      if (refEl && printRef) printRef.textContent = refEl.textContent.trim();

      // Copy detail rows
      const rows = document.querySelectorAll('#receipt-card .receipt-row');
      const tbl  = pw.document.getElementById('print-table');
      if (rows.length && tbl) {
        tbl.innerHTML = Array.from(rows).map(row => {
          const lbl = row.querySelector('.r-label')?.textContent || '';
          const val = row.querySelector('.r-value')?.innerHTML || '';
          return `<tr><td>${lbl}</td><td class="${row.querySelector('.r-value')?.classList.contains('green') ? 'green' : ''}">${val}</td></tr>`;
        }).join('');
      }
    } catch (e) { console.log('Print copy note:', e.message); }

    setTimeout(() => pw.print(), 600);
  }, 400);
}


/* ============================================
   15. TOAST NOTIFICATION
============================================ */
function showToast(message, type = 'info') {
  const old = document.getElementById('wow-toast');
  if (old) old.remove();

  const colors = {
    info:    { bg: '#EDE9FE', text: '#5B2D8E' },
    success: { bg: '#D1FAE5', text: '#065F46' },
    error:   { bg: '#FEE2E2', text: '#991B1B' }
  };
  const c = colors[type] || colors.info;

  const t = document.createElement('div');
  t.id    = 'wow-toast';
  Object.assign(t.style, {
    background: c.bg, color: c.text
  });
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.parentElement && t.remove(), 4000);
}


/* ============================================
   16. LAZY LOAD PAYSTACK SCRIPT
============================================ */
let paystackLoaded = false;

function loadPaystackScript() {
  if (paystackLoaded) return;
  const s   = document.createElement('script');
  s.src     = 'https://js.paystack.co/v1/inline.js';
  s.onload  = () => { paystackLoaded = true; console.log('✓ Paystack ready'); };
  document.head.appendChild(s);
}

const formSection = document.getElementById('reg-form-card');
if (formSection) {
  new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { loadPaystackScript(); } });
  }, { threshold: 0.1 }).observe(formSection);
} else {
  // Load immediately if card is always visible
  window.addEventListener('load', loadPaystackScript);
}


/* ============================================
   17. URGENCY CTA SCROLL
============================================ */
function scrollToForm() {
  const card = document.getElementById('reg-form-card');
  if (!card) return;
  const top = card.getBoundingClientRect().top + window.pageYOffset - 160;
  window.scrollTo({ top, behavior: 'smooth' });
}


/* ============================================
   18. FADE-IN ANIMATIONS
============================================ */
const fadeStyle       = document.createElement('style');
fadeStyle.textContent = `
  .fade-section {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .fade-section.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(fadeStyle);

document.querySelectorAll('.reg-page-header, .event-cards-strip, .reg-main, .faq-strip')
  .forEach(el => el.classList.add('fade-section'));

new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.08 }).observe(
  ...Array.from(document.querySelectorAll('.fade-section'))
);

// Re-apply observer as forEach is cleaner
document.querySelectorAll('.fade-section').forEach(el => {
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
      }
    });
  }, { threshold: 0.08 }).observe(el);
});

/* ============================================
   SUCCESS POPUP MODAL
   Shows after payment — auto redirects home
============================================ */
function showSuccessPopup(formData, amtDisplay) {

  const modal = document.createElement('div');
  modal.id    = 'success-popup';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    padding: 20px;
    animation: spFadeIn 0.3s ease;
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
      animation: spSlideUp 0.4s ease;
      position: relative;
    ">

      <!-- Confetti emoji top -->
      <div style="font-size:48px;margin-bottom:16px;">🎉</div>

      <!-- Green tick circle -->
      <div style="
        width: 72px;
        height: 72px;
        background: #D1FAE5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        font-size: 32px;
        font-weight: 800;
        color: #065F46;
      ">✓</div>

      <!-- Title -->
      <h2 style="
        font-family: 'Fredoka One', cursive;
        font-size: 32px;
        color: #5B2D8E;
        margin-bottom: 8px;
      ">Payment Successful!</h2>

      <p style="
        font-size: 15px;
        color: #6B7280;
        margin-bottom: 24px;
        line-height: 1.7;
      ">
        Thank you, <strong>${formData.fullName}</strong>!<br/>
        Your spot at WoW Fiesta 2026 is confirmed. 🌟
      </p>

      <!-- Booking details box -->
      <div style="
        background: #F9F5FF;
        border: 1.5px solid #E9D5FF;
        border-radius: 14px;
        padding: 16px 20px;
        margin-bottom: 20px;
        text-align: left;
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #E9D5FF">
          <span style="color:#9CA3AF;font-size:13px;font-weight:600">Booking Ref</span>
          <span style="font-family:monospace;font-weight:800;color:#5B2D8E;font-size:13px">${formData.bookingRef}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #E9D5FF">
          <span style="color:#9CA3AF;font-size:13px;font-weight:600">City</span>
          <span style="font-weight:700;font-size:13px;color:#1F1F2E">${formData.city}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #E9D5FF">
          <span style="color:#9CA3AF;font-size:13px;font-weight:600">Adults</span>
          <span style="font-weight:700;font-size:13px;color:#1F1F2E">${formData.numAdults}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #E9D5FF">
          <span style="color:#9CA3AF;font-size:13px;font-weight:600">Children</span>
          <span style="font-weight:700;font-size:13px;color:#1F1F2E">${formData.numChildren}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0">
          <span style="color:#9CA3AF;font-size:13px;font-weight:600">Amount Paid</span>
          <span style="font-weight:800;font-size:15px;color:#059669">${amtDisplay}</span>
        </div>
      </div>

      <p style="font-size:12px;color:#9CA3AF;margin-bottom:16px;">
        📧 Confirmation being sent to <strong>${formData.email}</strong>
      </p>

      <!-- Countdown -->
      <p style="
        font-size:13px;
        color:#5B2D8E;
        font-weight:700;
        margin-bottom:20px;
      " id="sp-countdown">
        Returning to home page in 8 seconds...
      </p>

      <!-- Buttons -->
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button onclick="spGoHome()" style="
          background: linear-gradient(135deg, #5B2D8E, #7C3AED);
          color: #fff;
          font-family: 'Fredoka One', cursive;
          font-size: 18px;
          padding: 14px 40px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          width: 100%;
          box-shadow: 0 4px 16px rgba(91,45,142,0.3);
          transition: transform 0.2s;
        " onmouseover="this.style.transform='translateY(-2px)'"
           onmouseout="this.style.transform='translateY(0)'">
          🏠 Go to Home Page
        </button>
        <button onclick="spViewReceipt()" style="
          background: transparent;
          color: #5B2D8E;
          font-family: 'Fredoka One', cursive;
          font-size: 16px;
          padding: 12px;
          border-radius: 999px;
          border: 2px solid #E9D5FF;
          cursor: pointer;
          width: 100%;
          transition: all 0.2s;
        " onmouseover="this.style.background='#F9F5FF'"
           onmouseout="this.style.background='transparent'">
          📄 View Full Receipt
        </button>
      </div>

    </div>

    <style>
      @keyframes spFadeIn  { from{opacity:0} to{opacity:1} }
      @keyframes spSlideUp {
        from{transform:translateY(50px);opacity:0}
        to{transform:translateY(0);opacity:1}
      }
      @keyframes spFadeOut { from{opacity:1} to{opacity:0} }
    </style>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // Countdown timer — 8 seconds
  let seconds = 8;
  const countEl = document.getElementById('sp-countdown');

  const timer = setInterval(() => {
    seconds--;
    if (countEl) {
      countEl.textContent = `Returning to home page in ${seconds} second${seconds !== 1 ? 's' : ''}...`;
    }
    if (seconds <= 0) {
      clearInterval(timer);
      spGoHome();
    }
  }, 1000);

  // Store timer on modal so buttons can clear it
  modal._timer = timer;
}

function spGoHome() {
  const modal = document.getElementById('success-popup');
  if (modal) {
    if (modal._timer) clearInterval(modal._timer);
    modal.style.animation = 'spFadeOut 0.3s ease forwards';
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.remove();
      window.location.href = 'index.html';
    }, 300);
  } else {
    window.location.href = 'index.html';
  }
}

function spViewReceipt() {
  const modal = document.getElementById('success-popup');
  if (modal) {
    if (modal._timer) clearInterval(modal._timer);
    modal.style.animation = 'spFadeOut 0.3s ease forwards';
    document.body.style.overflow = '';
    setTimeout(() => modal.remove(), 300);
  }
}
