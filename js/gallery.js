/* ============================================
   GALLERY PAGE — gallery.js
   Handles:
   1. Countdown timer
   2. Navbar scroll
   3. Hamburger menu
   4. Load all gallery photos from Supabase
   5. Filter by city
   6. Load more pagination
   7. Lightbox zoom
============================================ */


/* ============================================
   1. COUNTDOWN TIMER
============================================ */
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
  const el  = id => document.getElementById(id);

  if (el('cd-days'))
    el('cd-days').textContent =
      pad(Math.floor(diff / 86400000));
  if (el('cd-hours'))
    el('cd-hours').textContent =
      pad(Math.floor((diff % 86400000) / 3600000));
  if (el('cd-mins'))
    el('cd-mins').textContent =
      pad(Math.floor((diff % 3600000) / 60000));
  if (el('cd-secs'))
    el('cd-secs').textContent =
      pad(Math.floor((diff % 60000) / 1000));
}

updateCountdown();
setInterval(updateCountdown, 1000);


/* ============================================
   2. NAVBAR SCROLL SHADOW
============================================ */
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  navbar.style.boxShadow = window.scrollY > 20
    ? '0 4px 20px rgba(91,45,142,0.15)'
    : '0 1px 3px rgba(0,0,0,0.08)';
});


/* ============================================
   3. HAMBURGER MENU
============================================ */
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
   4. LOAD ALL GALLERY PHOTOS
   Reads all active photos from gallery_images
   table in Supabase and renders them
============================================ */
let allPhotos       = [];
let filteredPhotos  = [];
let displayedCount  = 0;
const PAGE_SIZE     = 12;
let currentFilter   = 'all';

async function loadAllGalleryPhotos() {
  try {
    const { data, error } = await window.db
      .from('gallery_images')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    // Hide loading spinner
    const loading = document.getElementById('gallery-loading');
    if (loading) loading.style.display = 'none';

    if (error) throw error;

    if (!data || data.length === 0) {
      showEmptyState();
      return;
    }

    allPhotos      = data;
    filteredPhotos = data;

    renderPhotos(true);
    buildFilterTabs();

    console.log('✓ Gallery loaded:', data.length, 'photos');

  } catch (err) {
    console.error('Gallery load error:', err.message);
    const loading = document.getElementById('gallery-loading');
    if (loading) {
      loading.innerHTML = `
        <p style="color:#EF4444;font-weight:700">
          Could not load photos. Please refresh the page.
        </p>
      `;
    }
  }
}

/* ============================================
   5. RENDER PHOTOS TO THE GRID
============================================ */
function renderPhotos(reset = false) {
  const grid = document.getElementById('gallery-page-grid');
  if (!grid) return;

  if (reset) {
    grid.innerHTML  = '';
    displayedCount  = 0;
  }

  const nextBatch = filteredPhotos.slice(
    displayedCount,
    displayedCount + PAGE_SIZE
  );

  nextBatch.forEach((photo, i) => {
    const item       = document.createElement('div');
    item.className   = 'gallery-page-item';
    item.dataset.city = photo.city || 'General';
    item.innerHTML   = `
      <img
        src="${photo.image_url}"
        alt="${photo.caption || 'WoW Fiesta photo'}"
        loading="lazy"
      />
      ${photo.caption
        ? `<div class="gallery-item-caption">
             ${photo.caption}
           </div>`
        : ''
      }
    `;

    // Click opens lightbox
    item.addEventListener('click', () => {
      const globalIndex = displayedCount - nextBatch.length + i;
      openGalleryLightbox(displayedCount + i - nextBatch.length);
    });

    grid.appendChild(item);
  });

  displayedCount += nextBatch.length;

  // Show or hide Load More button
  const loadMoreWrap =
    document.getElementById('load-more-wrap');
  if (loadMoreWrap) {
    loadMoreWrap.style.display =
      displayedCount < filteredPhotos.length
        ? 'block'
        : 'none';
  }

  // Show empty state if nothing rendered
  if (filteredPhotos.length === 0) {
    showEmptyState();
  } else {
    hideEmptyState();
  }

  // Re-initialise lightbox images
  buildLightboxImages();
}

function showEmptyState() {
  const empty = document.getElementById('gallery-empty');
  const grid  = document.getElementById('gallery-page-grid');
  if (empty) empty.style.display = 'block';
  if (grid)  grid.style.display  = 'none';
}

function hideEmptyState() {
  const empty = document.getElementById('gallery-empty');
  const grid  = document.getElementById('gallery-page-grid');
  if (empty) empty.style.display = 'none';
  if (grid)  grid.style.display  = 'grid';
}


/* ============================================
   6. FILTER GALLERY BY CITY
============================================ */
function filterGallery(filter, buttonEl) {
  currentFilter = filter;

  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  if (buttonEl) buttonEl.classList.add('active');

  // Filter the photos
  if (filter === 'all') {
    filteredPhotos = allPhotos;
  } else {
    filteredPhotos = allPhotos.filter(
      p => p.city === filter
    );
  }

  // Re-render from scratch
  renderPhotos(true);
}

// Build filter tabs dynamically based on
// which cities actually have photos
function buildFilterTabs() {
  const cities = [...new Set(
    allPhotos.map(p => p.city).filter(Boolean)
  )];

  const filtersEl =
    document.getElementById('gallery-filters');
  if (!filtersEl) return;

  // Only show tabs for cities that have photos
  // Keep "All Photos" always visible
  filtersEl.innerHTML = `
    <button class="filter-tab active"
      data-filter="all"
      onclick="filterGallery('all', this)">
      All Photos (${allPhotos.length})
    </button>
    ${cities.map(city => `
      <button class="filter-tab"
        data-filter="${city}"
        onclick="filterGallery('${city}', this)">
        ${city} (${allPhotos.filter(p => p.city === city).length})
      </button>
    `).join('')}
  `;
}


/* ============================================
   7. LOAD MORE PHOTOS
============================================ */
function loadMorePhotos() {
  renderPhotos(false);
}


/* ============================================
   8. LIGHTBOX FOR GALLERY PAGE
   Separate from the homepage lightbox
============================================ */
let galleryLightboxImages = [];
let galleryLightboxIndex  = 0;

function buildLightboxImages() {
  const items = document.querySelectorAll(
    '.gallery-page-item img'
  );
  galleryLightboxImages = Array.from(items).map(img => ({
    src:     img.src,
    caption: img.alt || ''
  }));
}

function openGalleryLightbox(index) {
  galleryLightboxIndex = index;
  updateGalleryLightbox();

  const overlay = document.getElementById('lightbox');
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function updateGalleryLightbox() {
  const img     = document.getElementById('lightbox-img');
  const caption =
    document.getElementById('lightbox-caption');
  const counter =
    document.getElementById('lightbox-counter');
  const prev    =
    document.getElementById('lightbox-prev');
  const next    =
    document.getElementById('lightbox-next');

  if (!img) return;

  const current =
    galleryLightboxImages[galleryLightboxIndex];
  if (!current) return;

  img.style.opacity   = '0';
  img.style.transform = 'scale(0.92)';

  setTimeout(() => {
    img.src              = current.src;
    img.alt              = current.caption;
    img.style.opacity    = '1';
    img.style.transform  = 'scale(1)';
    img.style.transition =
      'opacity 0.25s ease, transform 0.25s ease';
  }, 180);

  if (caption) caption.textContent = current.caption || '';
  if (counter) {
    counter.textContent =
      `${galleryLightboxIndex + 1} / ${galleryLightboxImages.length}`;
  }

  if (galleryLightboxImages.length <= 1) {
    prev?.classList.add('hidden');
    next?.classList.add('hidden');
  } else {
    prev?.classList.remove('hidden');
    next?.classList.remove('hidden');
  }
}

function closeLightbox() {
  const overlay = document.getElementById('lightbox');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function lightboxNav(direction) {
  galleryLightboxIndex += direction;

  if (galleryLightboxIndex >= galleryLightboxImages.length) {
    galleryLightboxIndex = 0;
  }
  if (galleryLightboxIndex < 0) {
    galleryLightboxIndex = galleryLightboxImages.length - 1;
  }

  updateGalleryLightbox();
}

// Close on overlay click
document.getElementById('lightbox')
  ?.addEventListener('click', function (e) {
    if (e.target === this) closeLightbox();
  });

// Keyboard navigation
document.addEventListener('keydown', e => {
  const overlay = document.getElementById('lightbox');
  if (!overlay?.classList.contains('active')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  lightboxNav(-1);
  if (e.key === 'ArrowRight') lightboxNav(1);
});

// Swipe support
let touchStartX = 0;
document.getElementById('lightbox')
  ?.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

document.getElementById('lightbox')
  ?.addEventListener('touchend', e => {
    const diff =
      touchStartX - e.changedTouches[0].screenX;
    if (diff > 50)  lightboxNav(1);
    if (diff < -50) lightboxNav(-1);
  }, { passive: true });


/* ============================================
   INITIALISE PAGE
   Wait for Supabase to connect then
   load all gallery photos
============================================ */
function initGalleryPage() {
  // Poll until Supabase db is ready
  const check = setInterval(() => {
    if (window.db) {
      clearInterval(check);
      loadAllGalleryPhotos();
    }
  }, 100);
}

initGalleryPage();