/* ============================================
   SUPABASE CLIENT — WoW Children's Day Fiesta
   This file connects your website to Supabase.
   It must always load BEFORE app.js
============================================ */

// ---- PASTE YOUR KEYS HERE ----
const SUPABASE_URL  = 'https://lnkdnmnrbxtqyhitqwvg.supabase.co';
const SUPABASE_ANON = 'sb_publishable_kcLdNDW2wPmFd2FDW4mSXA_LtBPugzW';
// ------------------------------

// This is the base URL for all your
// storage images — used later for gallery
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public`;

// Load the Supabase library from the internet
(function loadSupabase() {
  const script  = document.createElement('script');
  script.src    = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

  script.onload = function () {
    // Create the Supabase client
    // and make it available everywhere
    window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    console.log('✓ Supabase connected');

    // Once connected, load all page data
    initSiteData();
  };

  script.onerror = function () {
    console.error('✗ Could not load Supabase library. Check your internet connection.');
  };

  document.head.appendChild(script);
})();


/* ============================================
   LOAD ALL SITE DATA
   This runs once Supabase is ready.
   It loads everything the page needs
   from the database in the correct order.
============================================ */
async function initSiteData() {
  await loadSiteSettings();
  await loadEvents();
  await loadGalleryPreview();
}


/* ============================================
   1. LOAD SITE SETTINGS
   Reads your site_settings table and updates
   the hero text and about section on the page
============================================ */
async function loadSiteSettings() {
  try {
    const { data, error } = await window.db
      .from('site_settings')
      .select('*');

    if (error) throw error;
    if (!data)  return;

    // Turn array of rows into a simple
    // key:value object for easy access
    const settings = {};
    data.forEach(row => {
      settings[row.key] = row.value;
    });

    // Update hero description
    const heroDesc = document.querySelector('.hero-desc');
    if (heroDesc && settings.hero_description) {
      heroDesc.textContent = settings.hero_description;
    }

    // Update about section heading
    const aboutHeading = document.querySelector('.about .section-title');
    if (aboutHeading && settings.about_heading) {
      aboutHeading.textContent = settings.about_heading;
    }

    // Update about section body text
    const aboutBody = document.querySelector('.about-desc');
    if (aboutBody && settings.about_body) {
      aboutBody.textContent = settings.about_body;
    }

    console.log('✓ Site settings loaded');

  } catch (err) {
    console.warn('Site settings error:', err.message);
  }
}


/* ============================================
   2. LOAD EVENTS — LAGOS + IBADAN
   Reads your events table and:
   - Updates the countdown timer date
   - Populates the city dropdown in the form
   - Updates the hero date/venue strip
============================================ */
async function loadEvents() {
  try {
    const { data, error } = await window.db
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('event_date');

    if (error) throw error;
    if (!data || data.length === 0) return;

    // Save events globally so the
    // form and payment can access them
    window.activeEvents = data;

    // Point countdown to the earliest event
    const firstEvent    = data[0];
    const eventDateTime = new Date(
      firstEvent.event_date + 'T10:00:00'
    );
    if (!isNaN(eventDateTime)) {
      window.EVENT_DATE = eventDateTime;
    }

    // Fill the city dropdown in the form
    populateCitySelector(data);

    // Update the hero meta strip
    updateHeroMeta(firstEvent);

    console.log(
      '✓ Events loaded:',
      data.map(e => e.city).join(', ')
    );

  } catch (err) {
    console.warn('Events load error:', err.message);
  }
}


/* ============================================
   POPULATE CITY SELECTOR
   Fills the dropdown with Lagos and Ibadan
   including their dates and adult prices
============================================ */
function populateCitySelector(events) {
  const citySelect = document.getElementById('city-select');
  if (!citySelect) return;

  // Clear any hardcoded options
  citySelect.innerHTML =
    '<option value="">— Select your city —</option>';

  events.forEach(event => {
    const option = document.createElement('option');
    option.value = event.id;

    // Format date nicely: May 27, 2026
    const dateObj = new Date(
      event.event_date + 'T00:00:00'
    );
    const formattedDate = dateObj.toLocaleDateString('en-NG', {
      day:   'numeric',
      month: 'long',
      year:  'numeric'
    });

    option.textContent         = `${event.city} — ${formattedDate}`;
    option.dataset.city        = event.city;
    option.dataset.date        = event.event_date;
    option.dataset.venue       = event.venue_address;
    option.dataset.adultPrice  = event.adult_price;

    citySelect.appendChild(option);
  });

  // Update adult price label when city changes
  citySelect.addEventListener('change', function () {
    const selected   = citySelect.options[citySelect.selectedIndex];
    const priceLabel = document.getElementById('adult-price-label');
    const hint       = document.getElementById('adults-hint');

    if (selected && selected.dataset.adultPrice) {
      const price          = parseInt(selected.dataset.adultPrice);
      priceLabel.textContent = `₦${price.toLocaleString()} each`;
      priceLabel.classList.remove('hidden');
      if (hint) {
        hint.textContent = `${selected.dataset.city} adult price: ₦${price.toLocaleString()} per person`;
      }
    } else {
      priceLabel.textContent = '';
      priceLabel.classList.add('hidden');
      if (hint) {
        hint.textContent = 'Select your city first to see the adult price';
      }
    }

    updatePriceSummary();
  });
}


/* ============================================
   UPDATE PRICE SUMMARY BOX
   Called when city, children or adults
   field changes. Shows live total.
============================================ */
function updatePriceSummary() {
  const citySelect  = document.getElementById('city-select');
  const numAdults   = parseInt(
    document.getElementById('num-adults')?.value
  ) || 0;
  const numChildren = parseInt(
    document.getElementById('num-children')?.value
  ) || 0;
  const summaryBox  = document.getElementById('price-summary');
  const btnEl       = document.getElementById('register-btn');

  const selectedOption =
    citySelect?.options[citySelect.selectedIndex];

  if (!selectedOption || !selectedOption.dataset.adultPrice) {
    if (summaryBox) summaryBox.style.display = 'none';
    return;
  }

  const adultPrice = parseInt(selectedOption.dataset.adultPrice);
  const adultTotal = numAdults * adultPrice;

  // Show the price summary box
  if (summaryBox) {
    summaryBox.style.display = 'block';
    summaryBox.innerHTML = `
      <div class="price-row">
        <span>Children / PWDs (${numChildren})</span>
        <span class="price-free">FREE</span>
      </div>
      <div class="price-row">
        <span>Adults (${numAdults} × ₦${adultPrice.toLocaleString()})</span>
        <span>₦${adultTotal.toLocaleString()}</span>
      </div>
      <div class="price-row price-total">
        <span>Total</span>
        <span>₦${adultTotal.toLocaleString()}</span>
      </div>
    `;
  }

  // Update button text with total
  if (btnEl) {
    if (adultTotal > 0) {
      btnEl.textContent =
        `Book Now — Pay ₦${adultTotal.toLocaleString()}`;
    } else {
      btnEl.textContent =
        'Book Now — Secure My Spot (Free)';
    }
  }

  // Save total globally for payment
  window.currentTotal      = adultTotal;
  window.currentAdultPrice = adultPrice;
}


/* ============================================
   UPDATE HERO META STRIP
   Updates the date, time and venue text
   in the hero section from Supabase data
============================================ */
function updateHeroMeta(event) {
  const dateObj = new Date(
    event.event_date + 'T00:00:00'
  );
  const formatted = dateObj.toLocaleDateString('en-NG', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric'
  });

  const metaItems = document.querySelectorAll(
    '.hero-meta-item span:last-child'
  );
  if (metaItems[0]) metaItems[0].textContent = formatted;
  if (metaItems[1]) metaItems[1].textContent = event.event_time;
  if (metaItems[2]) metaItems[2].textContent = event.venue_name;
}


/* ============================================
   3. LOAD GALLERY PREVIEW
   Loads up to 6 photos from gallery_images
   table and displays them in the gallery grid
============================================ */
async function loadGalleryPreview() {
  try {
    const { data, error } = await window.db
      .from('gallery_images')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .limit(6);

    if (error) throw error;

    // If no photos in database yet
    // keep the local placeholder images
    if (!data || data.length === 0) {
      console.log('ℹ No gallery images in database yet — using local images');
      return;
    }

    const grid = document.querySelector('.gallery-grid');
    if (!grid) return;

    // Replace placeholders with real images
    grid.innerHTML = '';
    data.forEach(img => {
      const item       = document.createElement('div');
      item.className   = 'gallery-item';
      item.innerHTML   = `
        <img
          src="${img.image_url}"
          alt="${img.caption || 'WoW Fiesta event photo'}"
          loading="lazy"
        />
      `;
      grid.appendChild(item);
    });

    console.log('✓ Gallery loaded:', data.length, 'images');

  } catch (err) {
    console.warn('Gallery load error:', err.message);
  }
}


/* ============================================
   4. SAVE REGISTRATION TO SUPABASE
   Called by app.js after payment succeeds.
   Saves the complete booking to the
   registrations table in your database.
============================================ */
async function saveRegistration(formData, gateway, transactionRef) {
  try {
    const citySelect     = document.getElementById('city-select');
    const selectedOption =
      citySelect?.options[citySelect.selectedIndex];

    const { error } = await window.db
      .from('registrations')
      .insert([{
        full_name:         formData.fullName,
        email:             formData.email,
        phone:             formData.phone,
        city:              selectedOption?.dataset.city        || '',
        venue_address:     selectedOption?.dataset.venue       || '',
        event_date:        selectedOption?.dataset.date        || '',
        num_children:      parseInt(formData.numChildren)      || 0,
        num_adults:        parseInt(formData.numAdults)        || 0,
        adult_price_each:  parseInt(
                             selectedOption?.dataset.adultPrice
                           )                                   || 0,
        amount_paid:       window.currentTotal                 || 0,
        payment_method:    gateway,
        payment_reference: transactionRef,
        payment_status:    'success',
        booking_reference: formData.bookingRef
      }]);

    if (error) throw error;

    console.log('✓ Registration saved to Supabase');
    return true;

  } catch (err) {
    console.error('✗ Registration save error:', err.message);
    return false;
  }
}