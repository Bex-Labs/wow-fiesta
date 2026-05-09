/* ============================================
   WoW CHILDREN'S DAY FIESTA — app.js
   
   1.  Countdown timer
   2.  Navbar scroll behaviour
   3.  Hamburger mobile menu
   4.  Smooth scrolling
   5.  Active nav link on scroll
   6.  Mobile bottom nav active state
   7.  Form validation
   8.  Paystack payment
   9.  Flutterwave payment
   10. Registration handler
   11. Free registration handler
   12. Payment success screen
   13. Toast notifications
   14. Fade-in animations
============================================ */


/* ============================================
   PAYMENT GATEWAY KEYS
   Replace these with your actual keys from
   paystack.com and flutterwave.com
============================================ */
const PAYSTACK_PUBLIC_KEY    = 'pk_test_da61808dbf2ddb885bc7a88ff6f56fa22e614d2b';

// ── EmailJS credentials ──
// Replace these with your actual values from emailjs.com
const EMAILJS_SERVICE_ID  = 'wow_fiesta_service';
const EMAILJS_TEMPLATE_ID = 'template_zct8vl2';
const EMAILJS_PUBLIC_KEY  = 'ZwmKZd9f4YobPndRb';

/* ============================================
   1. COUNTDOWN TIMER
   EVENT_DATE starts as a fallback.
   Supabase will override it with the real
   date once the events table loads.
============================================ */
window.EVENT_DATE = new Date('2026-05-27T10:00:00');

function updateCountdown() {
  const now  = new Date();
  const diff = window.EVENT_DATE - now;

  if (diff <= 0) {
    document.getElementById('cd-days').textContent  = '00';
    document.getElementById('cd-hours').textContent = '00';
    document.getElementById('cd-mins').textContent  = '00';
    document.getElementById('cd-secs').textContent  = '00';
    const tagline = document.querySelector('.cd-tagline');
    if (tagline) {
      tagline.textContent = '✦ THE MAGIC HAS BEGUN ✦';
    }
    return;
  }

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor(
    (diff % (1000 * 60 * 60)) / (1000 * 60)
  );
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = (n) => String(n).padStart(2, '0');

  document.getElementById('cd-days').textContent  = pad(days);
  document.getElementById('cd-hours').textContent = pad(hours);
  document.getElementById('cd-mins').textContent  = pad(minutes);
  document.getElementById('cd-secs').textContent  = pad(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);


/* ============================================
   2. NAVBAR SHADOW ON SCROLL
============================================ */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.style.boxShadow =
      '0 4px 20px rgba(91,45,142,0.15)';
  } else {
    navbar.style.boxShadow =
      '0 1px 3px rgba(0,0,0,0.08)';
  }
});


/* ============================================
   3. HAMBURGER MENU
============================================ */
function toggleMenu() {
  const menu      = document.getElementById('mobileMenu');
  const hamburger = document.getElementById('hamburger');
  const isOpen    = menu.classList.contains('open');

  if (isOpen) {
    menu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  } else {
    menu.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
  }
}

function closeMenu() {
  const menu      = document.getElementById('mobileMenu');
  const hamburger = document.getElementById('hamburger');
  menu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', (e) => {
  const menu      = document.getElementById('mobileMenu');
  const hamburger = document.getElementById('hamburger');
  if (
    menu &&
    menu.classList.contains('open') &&
    !menu.contains(e.target) &&
    !hamburger.contains(e.target)
  ) {
    closeMenu();
  }
});


/* ============================================
   4. SMOOTH SCROLLING
   Called by all Book Now / Join the Fun
   buttons across the page
============================================ */
function scrollToSection(sectionId) {
  const target = document.getElementById(sectionId);
  if (!target) return;

  const offset = 140;
  const top    = target.getBoundingClientRect().top
                 + window.pageYOffset
                 - offset;

  window.scrollTo({ top, behavior: 'smooth' });
}


/* ============================================
   5. ACTIVE NAV LINK ON SCROLL
   Highlights the correct nav link as the
   user scrolls through each section
============================================ */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => link.classList.remove('active'));
      const activeLink = document.querySelector(
        `.nav-link[href="#${id}"]`
      );
      if (activeLink) activeLink.classList.add('active');
      updateBottomNav(id);
    }
  });
}, {
  root:       null,
  rootMargin: '-40% 0px -55% 0px',
  threshold:  0
});

sections.forEach(section => sectionObserver.observe(section));


/* ============================================
   6. MOBILE BOTTOM NAV ACTIVE STATE
============================================ */
function setActiveNav(clickedItem) {
  document.querySelectorAll('.bottom-nav-item')
    .forEach(item => item.classList.remove('active'));
  clickedItem.classList.add('active');
}

function updateBottomNav(sectionId) {
  document.querySelectorAll('.bottom-nav-item')
    .forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === `#${sectionId}`) {
        item.classList.add('active');
      }
    });
}


/* ============================================
   7. FORM VALIDATION
   Checks all fields before payment triggers.
   Returns true if valid, false if not.
   NOTE: Uses city-select, num-children and
   num-adults — NOT the old ticket-type field.
============================================ */
function validateForm() {
  clearErrors();
  let isValid = true;

  const city        = document.getElementById('city-select')?.value;
  const fullName    = document.getElementById('full-name')?.value.trim();
  const email       = document.getElementById('email')?.value.trim();
  const phone       = document.getElementById('phone')?.value.trim();
  const numChildren = parseInt(
    document.getElementById('num-children')?.value
  ) || 0;
  const numAdults   = parseInt(
    document.getElementById('num-adults')?.value
  ) || 0;

  if (!city) {
    showError('city-select', 'Please select your city');
    isValid = false;
  }

  if (!fullName) {
    showError('full-name', 'Please enter your full name');
    isValid = false;
  }

  if (!email || !isValidEmail(email)) {
    showError('email', 'Please enter a valid email address');
    isValid = false;
  }

  if (!phone || phone.length < 10) {
    showError('phone', 'Please enter a valid phone number');
    isValid = false;
  }

  if (numChildren === 0 && numAdults === 0) {
    showError(
      'num-children',
      'Please enter at least one child or adult'
    );
    isValid = false;
  }

  return isValid;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.style.borderColor = '#EF4444';

  let errorEl = field.parentElement.querySelector('.field-error');
  if (!errorEl) {
    errorEl           = document.createElement('p');
    errorEl.className = 'field-error';
    errorEl.style.cssText = `
      color: #EF4444;
      font-size: 12px;
      font-weight: 600;
      margin-top: 4px;
    `;
    field.parentElement.appendChild(errorEl);
  }
  errorEl.textContent = message;
}

function clearErrors() {
  document.querySelectorAll('.field-error')
    .forEach(el => el.remove());
  document.querySelectorAll(
    '.form-group input, .form-group select'
  ).forEach(el => {
    el.style.borderColor = '';
  });
}


/* ============================================
   8. GENERATE BOOKING REFERENCE
   Creates a unique WOW-XXXXX code for
   each registration
============================================ */
function generateBookingRef() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random    = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();
  return `WOW-${timestamp}-${random}`;
}


/* ============================================
   9. PAYSTACK PAYMENT
   Opens the Paystack popup.
   Amount is in KOBO (Naira × 100)
   
   To activate:
   1. Go to paystack.com → create account
   2. Settings → API Keys
   3. Copy your Test Public Key
   4. Replace YOUR_PAYSTACK_PUBLIC_KEY above
============================================ */
function payWithPaystack(formData) {
  const amountInKobo = (window.currentTotal || 0) * 100;

  const handler = PaystackPop.setup({
    key:      PAYSTACK_PUBLIC_KEY,
    email:    formData.email,
    amount:   amountInKobo,
    currency: 'NGN',
    ref:      formData.bookingRef,
    metadata: {
      custom_fields: [
        {
          display_name: 'Full Name',
          value:        formData.fullName
        },
        {
          display_name: 'Phone',
          value:        formData.phone
        },
        {
          display_name: 'City',
          value:        formData.city
        },
        {
          display_name: 'Number of Children',
          value:        formData.numChildren
        },
        {
          display_name: 'Number of Adults',
          value:        formData.numAdults
        },
        {
          display_name: 'Booking Reference',
          value:        formData.bookingRef
        }
      ]
    },
    callback: function (response) {
      console.log('✓ Paystack payment success:', response);
      onPaymentSuccess(
        formData,
        'paystack',
        response.reference
      );
    },
    onClose: function () {
      resetRegisterButton();
      showToast(
        'Payment cancelled. Your details are still saved.',
        'info'
      );
    }
  });

  handler.openIframe();
}

/* ============================================
   11. MAIN REGISTRATION HANDLER
   Called when Book Now button is clicked.
   Validates → collects data → pays or
   handles free registration directly.
============================================ */
function handleRegistration() {

  // Step 1: Validate all fields
  if (!validateForm()) return;

  // Step 2: Collect all form values
  const citySelect     = document.getElementById('city-select');
  const selectedOption = citySelect.options[citySelect.selectedIndex];

  const formData = {
    fullName:      document.getElementById('full-name').value.trim(),
    email:         document.getElementById('email').value.trim(),
    phone:         document.getElementById('phone').value.trim(),
    numChildren:   document.getElementById('num-children').value,
    numAdults:     document.getElementById('num-adults').value,
    city:          selectedOption.dataset.city        || '',
    venue:         selectedOption.dataset.venue       || '',
    date:          selectedOption.dataset.date        || '',
    adultPrice:    parseInt(
                     selectedOption.dataset.adultPrice
                   ) || 0,
    totalAmount:   window.currentTotal                || 0,
    bookingRef:    generateBookingRef(),
    paymentMethod: 'paystack'
  };

  // Step 3: If no adults — registration is free
  // skip payment and confirm directly
  if (formData.totalAmount === 0) {
    handleFreeRegistration(formData);
    return;
  }

  // Step 4: Show loading state on button
  const btn       = document.getElementById('register-btn');
  btn.textContent = 'Processing...';
  btn.disabled    = true;

  // Step 5: Trigger Paystack
  payWithPaystack(formData);
}

/* ============================================
   12. FREE REGISTRATION HANDLER
   Called when total is ₦0 — children/PWDs
   only, no adults. Saves directly to Supabase
   without going through a payment gateway.
============================================ */
async function handleFreeRegistration(formData) {
  const btn       = document.getElementById('register-btn');
  btn.textContent = 'Registering...';
  btn.disabled    = true;

  const citySelect     = document.getElementById('city-select');
  const selectedOption = citySelect.options[citySelect.selectedIndex];

  try {
    if (window.db) {
      await window.db.from('registrations').insert([{
        full_name:         formData.fullName,
        email:             formData.email,
        phone:             formData.phone,
        city:              formData.city,
        venue_address:     selectedOption?.dataset.venue || '',
        event_date:        selectedOption?.dataset.date  || '',
        num_children:      parseInt(formData.numChildren) || 0,
        num_adults:        0,
        adult_price_each:  0,
        amount_paid:       0,
        payment_method:    'free',
        payment_reference: 'FREE-' + formData.bookingRef,
        payment_status:    'success',
        booking_reference: formData.bookingRef
      }]);
      console.log('✓ Free registration saved to Supabase');
    }
  } catch (err) {
    console.error('Free registration error:', err.message);
  }

  onPaymentSuccess(formData, 'free', 'FREE');
}


/* ============================================
   13. ON PAYMENT SUCCESS
   Called by Paystack, Flutterwave and the
   free registration handler after a successful
   booking. Saves to Supabase and shows the
   confirmation card.
============================================ */
async function onPaymentSuccess(formData, gateway, transactionRef) {
  console.log(`✓ Payment complete via ${gateway}. Ref: ${transactionRef}`);

  // Save to Supabase for paid bookings
  if (gateway !== 'free' && window.db) {
    try {
      const citySelect     = document.getElementById('city-select');
      const selectedOption = citySelect?.options[citySelect.selectedIndex];

      await window.db.from('registrations').insert([{
        full_name:         formData.fullName,
        email:             formData.email,
        phone:             formData.phone,
        city:              formData.city,
        venue_address:     selectedOption?.dataset.venue || '',
        event_date:        selectedOption?.dataset.date  || '',
        num_children:      parseInt(formData.numChildren) || 0,
        num_adults:        parseInt(formData.numAdults)   || 0,
        adult_price_each:  formData.adultPrice            || 0,
        amount_paid:       formData.totalAmount           || 0,
        payment_method:    gateway,
        payment_reference: transactionRef,
        payment_status:    'success',
        booking_reference: formData.bookingRef
      }]);

      console.log('✓ Registration saved to Supabase');
    } catch (err) {
      console.error('Save error:', err.message);
    }
  }

  // Get event details for the receipt
  const citySelect     = document.getElementById('city-select');
  const selectedOption = citySelect?.options[citySelect?.selectedIndex];
  const eventDate      = selectedOption?.dataset.date || '';
  const venue          = selectedOption?.dataset.venue || '';

  // Format the date nicely
  const dateObj       = eventDate
    ? new Date(eventDate + 'T00:00:00') : new Date();
  const formattedDate = dateObj.toLocaleDateString('en-NG', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric'
  });

  const amountDisplay = formData.totalAmount > 0
    ? `₦${formData.totalAmount.toLocaleString()}`
    : 'FREE';

  // Build QR code data — everything encoded
  const qrData = JSON.stringify({
    ref:      formData.bookingRef,
    name:     formData.fullName,
    city:     formData.city,
    date:     formattedDate,
    venue:    venue,
    children: formData.numChildren,
    adults:   formData.numAdults,
    amount:   amountDisplay,
    phone:    formData.phone
  });

  // Replace form with receipt
  const formCard = document.getElementById('register-form-card');
  if (!formCard) return;

  formCard.innerHTML = `
    <div id="receipt-card" style="
      text-align: center;
      padding: 20px 0;
      font-family: 'Nunito', sans-serif;
    ">

      <!-- Logo -->
      <img
        src="assets/logo.png"
        alt="WoW Fiesta Logo"
        style="
          width: 72px;
          height: 72px;
          object-fit: contain;
          margin: 0 auto 8px;
          border-radius: 12px;
        "
      />

      <!-- Event name -->
      <p style="
        font-size: 13px;
        font-weight: 700;
        color: #7B3FBE;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin-bottom: 4px;
      ">WoW Children's Day Fiesta</p>

      <!-- Success icon -->
      <div style="
        width: 64px;
        height: 64px;
        background: #D1FAE5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 12px auto 16px;
        font-size: 28px;
      ">✓</div>

      <!-- Title -->
      <h3 style="
        font-family: 'Fredoka One', cursive;
        font-size: 26px;
        color: #5B2D8E;
        margin-bottom: 6px;
      ">Booking Confirmed!</h3>

      <p style="
        font-size: 14px;
        color: #6B7280;
        margin-bottom: 20px;
        line-height: 1.6;
      ">
        You're all set! Present this receipt at the gate.
      </p>

      <!-- Booking reference -->
      <div style="
        background: #F5F0FF;
        border-radius: 10px;
        padding: 14px 20px;
        margin-bottom: 16px;
      ">
        <p style="
          font-size: 11px;
          color: #7B3FBE;
          font-weight: 700;
          letter-spacing: 1.5px;
          margin-bottom: 4px;
        ">BOOKING REFERENCE</p>
        <p style="
          font-size: 22px;
          font-weight: 800;
          color: #5B2D8E;
          letter-spacing: 2px;
          font-family: 'Courier New', monospace;
        ">${formData.bookingRef}</p>
      </div>

      <!-- QR Code -->
      <div style="margin-bottom: 16px;">
        <p style="
          font-size: 11px;
          color: #6B7280;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 8px;
          text-transform: uppercase;
        ">Scan at Event Gate</p>
        <div style="
          display: inline-block;
          padding: 12px;
          background: white;
          border: 2px solid #EDE9FE;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(91,45,142,0.1);
        ">
          <canvas id="qr-canvas"></canvas>
        </div>
      </div>

      <!-- Booking details -->
      <div style="
        background: #F9FAFB;
        border-radius: 10px;
        padding: 14px 18px;
        margin-bottom: 16px;
        text-align: left;
        font-size: 13px;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #F3F4F6;
        ">
          <span style="color:#6B7280;">Name</span>
          <span style="font-weight:700;color:#1F1F2E;">
            ${formData.fullName}
          </span>
        </div>
        <div style="
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #F3F4F6;
        ">
          <span style="color:#6B7280;">City</span>
          <span style="font-weight:700;color:#1F1F2E;">
            ${formData.city}
          </span>
        </div>
        <div style="
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #F3F4F6;
        ">
          <span style="color:#6B7280;">Date</span>
          <span style="font-weight:700;color:#1F1F2E;">
            ${formattedDate}
          </span>
        </div>
        <div style="
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #F3F4F6;
        ">
          <span style="color:#6B7280;">Venue</span>
          <span style="
            font-weight:700;
            color:#1F1F2E;
            text-align:right;
            max-width:180px;
          ">${venue}</span>
        </div>
        <div style="
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #F3F4F6;
        ">
          <span style="color:#6B7280;">Children / PWDs</span>
          <span style="font-weight:700;color:#10B981;">
            ${formData.numChildren} — FREE
          </span>
        </div>
        <div style="
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #F3F4F6;
        ">
          <span style="color:#6B7280;">Adults</span>
          <span style="font-weight:700;color:#1F1F2E;">
            ${formData.numAdults}
          </span>
        </div>
        <div style="
          display: flex;
          justify-content: space-between;
          padding: 8px 0 4px;
        ">
          <span style="
            color:#5B2D8E;
            font-weight:800;
            font-size:14px;
          ">Total Paid</span>
          <span style="
            font-weight:800;
            font-size:16px;
            color:#5B2D8E;
          ">${amountDisplay}</span>
        </div>
      </div>

      <!-- Confirmation email note -->
      <p style="
        font-size: 12px;
        color: #6B7280;
        margin-bottom: 16px;
        line-height: 1.6;
      " id="email-status-msg">
        📧 Sending confirmation to
        <strong>${formData.email}</strong>...
      </p>

      <!-- Action buttons -->
      <div style="
        display: flex;
        flex-direction: column;
        gap: 10px;
      ">

        <!-- Print / Save button -->
        <button
          onclick="printReceipt()"
          style="
            background: #5B2D8E;
            color: white;
            font-family: 'Nunito', sans-serif;
            font-weight: 800;
            font-size: 14px;
            padding: 13px;
            border-radius: 999px;
            border: none;
            cursor: pointer;
            transition: opacity 0.2s;
          ">
          🖨️ Print / Save Receipt
        </button>

       <button
          onclick="window.open('https://wa.me/?text=I%20just%20registered%20for%20WoW%20Fiesta%20${encodeURIComponent(formData.city)}!%20%F0%9F%8E%89%20Booking%20ref%3A%20${formData.bookingRef}', '_blank')"
          style="width:100%;background:#25D366;color:white;font-family:'Nunito',sans-serif;font-weight:800;font-size:15px;padding:14px;border-radius:999px;border:none;cursor:pointer;text-align:center;">
          📲 Share on WhatsApp
        </button>
       </div> 
    </div>
  `;

  // Generate QR code into the canvas
  const canvas = document.getElementById('qr-canvas');
  if (canvas && typeof QRCode !== 'undefined') {
    QRCode.toCanvas(canvas, qrData, {
      width:           180,
      margin:          1,
      color: {
        dark:  '#5B2D8E',
        light: '#FFFFFF'
      }
    }, (err) => {
      if (err) console.error('QR error:', err);
      else console.log('✓ QR code generated');
    });
  }

  // Send confirmation email via EmailJS
  sendConfirmationEmail(formData, formattedDate, venue, amountDisplay);
}


/* ============================================
   SEND CONFIRMATION EMAIL
   Uses EmailJS to send a confirmation
   email to the attendee after booking
============================================ */
async function sendConfirmationEmail(
  formData, formattedDate, venue, amountDisplay
) {
  const statusMsg = document.getElementById('email-status-msg');

  try {
    // Initialise EmailJS with your public key
    emailjs.init(EMAILJS_PUBLIC_KEY);

    // Send the email using your template
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        attendee_name:  formData.fullName,
        attendee_email: formData.email,
        booking_ref:    formData.bookingRef,
        city:           formData.city,
        event_date:     formattedDate,
        venue:          venue,
        num_children:   formData.numChildren,
        num_adults:     formData.numAdults,
        amount_paid:    amountDisplay,
        phone:          formData.phone
      }
    );

    console.log('✓ Confirmation email sent');

    if (statusMsg) {
      statusMsg.innerHTML = `
        ✅ Confirmation sent to
        <strong>${formData.email}</strong>
      `;
      statusMsg.style.color = '#065F46';
    }

  } catch (err) {
    console.error('Email error:', err);
    if (statusMsg) {
      statusMsg.innerHTML = `
        Receipt shown above.
        Check your email at
        <strong>${formData.email}</strong>
      `;
    }
  }
}


/* ============================================
   PRINT RECEIPT
   Opens a clean print view of the receipt
   so the user can print or save as PDF
============================================ */
function printReceipt() {
  // Get the QR code canvas and convert to image
  // before opening the print window
  const canvas   = document.getElementById('qr-canvas');
  const qrImage  = canvas
    ? canvas.toDataURL('image/png')
    : null;

  const formCard = document.getElementById('register-form-card');
  if (!formCard) return;

  // Get current receipt data from the DOM
  const bookingRef = formCard.querySelector(
    '[style*="letter-spacing: 2px"]'
  )?.textContent || '';

  // Open a new clean print window
  const printWindow = window.open('', '_blank');

  // Build the receipt HTML for printing
  // using an <img> tag for the QR code
  // instead of a canvas element
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WoW Fiesta Booking Receipt</title>
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Nunito', sans-serif;
          background: white;
          padding: 32px;
          max-width: 520px;
          margin: 0 auto;
          color: #374151;
        }
        .receipt-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #EDE9FE;
        }
        .receipt-logo {
          width: 64px;
          height: 64px;
          object-fit: contain;
          border-radius: 10px;
          margin: 0 auto 8px;
          display: block;
        }
        .event-name {
          font-size: 12px;
          font-weight: 700;
          color: #7B3FBE;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .tick {
          width: 52px;
          height: 52px;
          background: #D1FAE5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin: 0 auto 10px;
          line-height: 52px;
          text-align: center;
        }
        .confirmed-title {
          font-family: 'Fredoka One', cursive;
          font-size: 28px;
          color: #5B2D8E;
          margin-bottom: 4px;
        }
        .confirmed-sub {
          font-size: 13px;
          color: #6B7280;
          margin-bottom: 0;
        }
        .booking-ref-box {
          background: #F5F0FF;
          border-radius: 10px;
          padding: 12px 16px;
          text-align: center;
          margin: 16px 0;
        }
        .ref-label {
          font-size: 10px;
          color: #7B3FBE;
          font-weight: 700;
          letter-spacing: 1.5px;
          margin-bottom: 4px;
        }
        .ref-value {
          font-family: 'Courier New', monospace;
          font-size: 20px;
          font-weight: 800;
          color: #5B2D8E;
          letter-spacing: 2px;
        }
        .qr-section {
          text-align: center;
          margin: 16px 0;
        }
        .qr-label {
          font-size: 10px;
          color: #6B7280;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .qr-wrap {
          display: inline-block;
          padding: 10px;
          border: 2px solid #EDE9FE;
          border-radius: 10px;
        }
        .qr-wrap img {
          display: block;
          width: 160px;
          height: 160px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin: 16px 0;
        }
        .details-table tr {
          border-bottom: 1px solid #F3F4F6;
        }
        .details-table tr:last-child {
          border-bottom: none;
        }
        .details-table td {
          padding: 8px 4px;
          vertical-align: top;
        }
        .details-table td:first-child {
          color: #6B7280;
          width: 45%;
        }
        .details-table td:last-child {
          font-weight: 700;
          color: #1F1F2E;
          text-align: right;
        }
        .total-row td {
          font-size: 15px;
          font-weight: 800;
          color: #5B2D8E;
          padding-top: 12px;
        }
        .free-text { color: #10B981; }
        .receipt-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #EDE9FE;
          font-size: 11px;
          color: #9CA3AF;
          line-height: 1.6;
        }
        @media print {
          body { padding: 16px; }
        }
      </style>
    </head>
    <body>

      <div class="receipt-header">
        <img
          src="${window.location.origin}/assets/logo.png"
          alt="WoW Fiesta"
          class="receipt-logo"
        />
        <p class="event-name">WoW Children's Day Fiesta</p>
        <div class="tick">✓</div>
        <h2 class="confirmed-title">Booking Confirmed!</h2>
        <p class="confirmed-sub">
          Present this receipt at the event gate
        </p>
      </div>

      <div class="booking-ref-box">
        <p class="ref-label">BOOKING REFERENCE</p>
        <p class="ref-value" id="print-ref">Loading...</p>
      </div>

      <div class="qr-section">
        <p class="qr-label">Scan at Event Gate</p>
        <div class="qr-wrap">
          ${qrImage
            ? `<img src="${qrImage}" alt="QR Code" />`
            : '<p style="color:#6B7280;font-size:12px;padding:20px;">QR Code</p>'
          }
        </div>
      </div>

      <table class="details-table" id="print-details">
        <tr>
          <td>Loading details...</td>
          <td></td>
        </tr>
      </table>

      <div class="receipt-footer">
        <p>✅ Confirmation sent to your email</p>
        <p style="margin-top:6px;">
          WoW Children's Day Fiesta &nbsp;·&nbsp;
          Celebrating Childhood Wonder Since 2015
        </p>
      </div>

    </body>
    </html>
  `);

  printWindow.document.close();

  // Pass data to the print window from the
  // original receipt card on the main page
  setTimeout(() => {
    try {
      // Copy booking reference
      const refEl = document.querySelector(
        '#receipt-card [style*="letter-spacing: 2px"]'
      );
      const printRef = printWindow.document.getElementById('print-ref');
      if (refEl && printRef) {
        printRef.textContent = refEl.textContent;
      }

      // Copy the details table rows
      const detailRows = document.querySelectorAll(
        '#receipt-card [style*="justify-content: space-between"]'
      );
      const printDetails = printWindow.document.getElementById('print-details');
      if (detailRows.length && printDetails) {
        printDetails.innerHTML = Array.from(detailRows).map(row => {
          const cells = row.querySelectorAll('span');
          if (cells.length < 2) return '';
          return `
            <tr>
              <td>${cells[0].textContent}</td>
              <td>${cells[1].innerHTML}</td>
            </tr>
          `;
        }).join('');
      }
    } catch (e) {
      console.log('Print data copy note:', e.message);
    }

    // Print after fonts load
    setTimeout(() => {
      printWindow.print();
    }, 600);
  }, 400);
}
/* ============================================
   14. RESET REGISTER BUTTON
   Called when payment popup is closed
   without completing payment
============================================ */
function resetRegisterButton() {
  const btn = document.getElementById('register-btn');
  if (btn) {
    btn.textContent = 'Book Now — Secure My Spot';
    btn.disabled    = false;
  }
}


/* ============================================
   15. TOAST NOTIFICATION
   Small message at the bottom of screen
============================================ */
function showToast(message, type = 'info') {
  const existing = document.getElementById('wow-toast');
  if (existing) existing.remove();

  const colors = {
    info:    { bg: '#EDE9FE', text: '#5B2D8E' },
    success: { bg: '#D1FAE5', text: '#065F46' },
    error:   { bg: '#FEE2E2', text: '#991B1B' }
  };

  const color = colors[type] || colors.info;

  const toast       = document.createElement('div');
  toast.id          = 'wow-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%);
    background: ${color.bg};
    color: ${color.text};
    font-family: 'Nunito', sans-serif;
    font-size: 14px;
    font-weight: 700;
    padding: 12px 24px;
    border-radius: 999px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    z-index: 9999;
    white-space: nowrap;
    max-width: 90vw;
    text-align: center;
    animation: fadeInUp 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4000);
}


/* ============================================
   16. LAZY LOAD PAYMENT SCRIPTS
   Only loads Paystack and Flutterwave
   scripts when user scrolls to the
   register section — faster page load
============================================ */
let paystackLoaded    = false;
let flutterwaveLoaded = false;

function loadPaystackScript() {
  if (paystackLoaded) return;
  const script  = document.createElement('script');
  script.src    = 'https://js.paystack.co/v1/inline.js';
  script.onload = () => {
    paystackLoaded = true;
    console.log('✓ Paystack script loaded');
  };
  document.head.appendChild(script);
}

const registerSection = document.getElementById('register');
if (registerSection) {
  const paymentObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadPaystackScript();
          paymentObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  paymentObserver.observe(registerSection);
}

/* ============================================
   17. FADE-IN ANIMATIONS ON SCROLL
   Sections gently fade up into view
   as the user scrolls down the page
============================================ */
const fadeStyle       = document.createElement('style');
fadeStyle.textContent = `
  .fade-in-section {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .fade-in-section.visible {
    opacity: 1;
    transform: translateY(0);
  }
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`;
document.head.appendChild(fadeStyle);

document.querySelectorAll('section').forEach(section => {
  section.classList.add('fade-in-section');
});

const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.fade-in-section').forEach(el => {
  fadeObserver.observe(el);
});

/* ============================================
   GALLERY LIGHTBOX
   Opens when any gallery image is clicked.
   Supports keyboard navigation and swiping.
============================================ */

// Stores all current gallery images
let lightboxImages  = [];
let lightboxIndex   = 0;

// Initialise lightbox on all gallery items
function initLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  if (!galleryItems.length) return;

  // Build the images array from all gallery items
  lightboxImages = [];
  galleryItems.forEach((item, index) => {
    const img     = item.querySelector('img');
    if (!img) return;

    lightboxImages.push({
      src:     img.src,
      alt:     img.alt || 'WoW Fiesta photo',
      caption: img.alt || ''
    });

    // Add click handler to each gallery item
    item.addEventListener('click', () => {
      openLightbox(index);
    });
  });
}

// Open the lightbox at a specific image index
function openLightbox(index) {
  if (!lightboxImages.length) return;

  lightboxIndex = index;
  updateLightboxImage();

  const overlay = document.getElementById('lightbox');
  overlay.classList.add('active');

  // Prevent body from scrolling while lightbox is open
  document.body.style.overflow = 'hidden';
}

// Close the lightbox
function closeLightbox() {
  const overlay = document.getElementById('lightbox');
  overlay.classList.remove('active');

  // Restore body scrolling
  document.body.style.overflow = '';
}

// Navigate to previous or next image
// direction: -1 for previous, +1 for next
function lightboxNav(direction) {
  lightboxIndex = lightboxIndex + direction;

  // Wrap around — if past the last go to first
  if (lightboxIndex >= lightboxImages.length) {
    lightboxIndex = 0;
  }

  // Wrap around — if before the first go to last
  if (lightboxIndex < 0) {
    lightboxIndex = lightboxImages.length - 1;
  }

  updateLightboxImage();
}

// Update the lightbox to show the current image
function updateLightboxImage() {
  const img     = document.getElementById('lightbox-img');
  const caption = document.getElementById('lightbox-caption');
  const counter = document.getElementById('lightbox-counter');
  const prev    = document.getElementById('lightbox-prev');
  const next    = document.getElementById('lightbox-next');

  if (!img) return;

  const current = lightboxImages[lightboxIndex];
  if (!current)  return;

  // Fade out then update then fade back in
  img.style.opacity   = '0';
  img.style.transform = 'scale(0.92)';

  setTimeout(() => {
    img.src             = current.src;
    img.alt             = current.alt;
    img.style.opacity   = '1';
    img.style.transform = 'scale(1)';
    img.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
  }, 180);

  // Update caption
  if (caption) {
    caption.textContent = current.caption || '';
  }

  // Update counter — e.g. "2 / 6"
  if (counter) {
    counter.textContent =
      `${lightboxIndex + 1} / ${lightboxImages.length}`;
  }

  // Hide arrows if only one image
  if (lightboxImages.length <= 1) {
    if (prev) prev.classList.add('hidden');
    if (next) next.classList.add('hidden');
  } else {
    if (prev) prev.classList.remove('hidden');
    if (next) next.classList.remove('hidden');
  }
}

// Close lightbox when clicking the dark overlay
document.getElementById('lightbox')
  ?.addEventListener('click', function (e) {
    if (e.target === this) closeLightbox();
  });

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  const overlay = document.getElementById('lightbox');
  if (!overlay?.classList.contains('active')) return;

  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  lightboxNav(-1);
  if (e.key === 'ArrowRight') lightboxNav(1);
});

// Touch/swipe support for mobile
let touchStartX = 0;
let touchEndX   = 0;

document.getElementById('lightbox')
  ?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

document.getElementById('lightbox')
  ?.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;

    // Swipe left — go to next
    if (diff > 50)  lightboxNav(1);

    // Swipe right — go to previous
    if (diff < -50) lightboxNav(-1);
  }, { passive: true });


// ── Re-initialise lightbox after Supabase
//    loads gallery images dynamically ──
// This ensures click handlers are attached
// to dynamically loaded images too

const originalLoadGallery = window.loadGalleryPreview;

// Watch for when gallery grid gets populated
const galleryGrid = document.querySelector('.gallery-grid');
if (galleryGrid) {
  const galleryObserver = new MutationObserver(() => {
    initLightbox();
  });
  galleryObserver.observe(galleryGrid, {
    childList: true
  });
}

// Also run on page load for local images
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initLightbox, 500);
});