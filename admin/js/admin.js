/* ============================================
   WoW FIESTA — ADMIN DASHBOARD
   admin.js handles everything:
   1.  Supabase connection
   2.  Auth — login, logout, session guard
   3.  Dashboard stats
   4.  Events management
   5.  Registrations — view, filter, export
   6.  Gallery — upload, delete, toggle
   7.  About/site settings editor
   8.  Blog posts — create, edit, delete
   9.  UI helpers — toast, sidebar, modal
============================================ */


/* ============================================
   SUPABASE SETUP
   Replace these with your actual keys
============================================ */
const SUPABASE_URL  = 'https://lnkdnmnrbxtqyhitqwvg.supabase.co';
const SUPABASE_ANON = 'sb_publishable_kcLdNDW2wPmFd2FDW4mSXA_LtBPugzW';

// Create Supabase client
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// Storage base URL for images
const STORAGE_URL =
  `${SUPABASE_URL}/storage/v1/object/public`;


/* ============================================
   1. AUTH — SESSION GUARD
   Runs on every admin page load.
   If user is not logged in, redirect to
   the login page immediately.
============================================ */
async function checkSession() {
  const { data: { session } } = await db.auth.getSession();

  const isLoginPage = window.location.pathname
    .includes('admin/index.html')
    || window.location.pathname.endsWith('admin/');

  if (!session && !isLoginPage) {
    // Not logged in — send to login
    window.location.href = 'index.html';
    return false;
  }

  if (session && isLoginPage) {
    // Already logged in — send to dashboard
    window.location.href = 'dashboard.html';
    return false;
  }

  return true;
}


/* ============================================
   2. LOGIN HANDLER
   Called when Sign In button is clicked
============================================ */
async function handleLogin() {
  const email    = document.getElementById('admin-email')?.value.trim();
  const password = document.getElementById('admin-password')?.value;
  const btn      = document.getElementById('login-btn');
  const errorEl  = document.getElementById('login-error');

  if (!email || !password) {
    showLoginError('Please enter your email and password');
    return;
  }

  // Show loading state
  btn.textContent = 'Signing in...';
  btn.disabled    = true;
  errorEl.classList.remove('show');

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Login successful — go to dashboard
    window.location.href = 'dashboard.html';

  } catch (err) {
    showLoginError('Incorrect email or password. Please try again.');
    btn.textContent = 'Sign In';
    btn.disabled    = false;
  }
}

function showLoginError(message) {
  const errorEl = document.getElementById('login-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
}

// Allow pressing Enter to submit login
function handleLoginKey(event) {
  if (event.key === 'Enter') handleLogin();
}

// Show/hide password toggle
function togglePassword() {
  const input = document.getElementById('admin-password');
  if (input) {
    input.type = input.type === 'password'
      ? 'text'
      : 'password';
  }
}


/* ============================================
   3. LOGOUT HANDLER
============================================ */
async function handleLogout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}


/* ============================================
   4. SIDEBAR TOGGLE
   Collapses and expands the sidebar
============================================ */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main    = document.querySelector('.admin-main');

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('collapsed');
    main?.classList.toggle('expanded');
  }
}


/* ============================================
   5. DASHBOARD — LOAD STATS
   Reads registrations table and calculates
   all the numbers shown on the dashboard
============================================ */
async function loadDashboardStats() {
  try {
    const { data, error } = await db
      .from('registrations')
      .select('*')
      .eq('payment_status', 'success');

    if (error) throw error;
    if (!data) return;

    // Total registrations
    const total = data.length;

    // Total revenue
    const revenue = data.reduce(
      (sum, r) => sum + (r.amount_paid || 0), 0
    );

    // Total children
    const children = data.reduce(
      (sum, r) => sum + (r.num_children || 0), 0
    );

    // Total adults
    const adults = data.reduce(
      (sum, r) => sum + (r.num_adults || 0), 0
    );

    // Update stat cards
    const statTotal = document.getElementById('stat-total');
    const statRev   = document.getElementById('stat-revenue');
    const statKids  = document.getElementById('stat-children');
    const statAdult = document.getElementById('stat-adults');

    if (statTotal) statTotal.textContent = total;
    if (statRev)   statRev.textContent   =
      `₦${revenue.toLocaleString()}`;
    if (statKids)  statKids.textContent  = children;
    if (statAdult) statAdult.textContent = adults;

    // City breakdown
    const lagosCount  = data.filter(
      r => r.city === 'Lagos'
    ).length;
    const ibadanCount = data.filter(
      r => r.city === 'Ibadan'
    ).length;

    const lagosEl  = document.getElementById('lagos-count');
    const ibadanEl = document.getElementById('ibadan-count');
    if (lagosEl)  lagosEl.textContent  = lagosCount;
    if (ibadanEl) ibadanEl.textContent = ibadanCount;

    // Load recent registrations table
    loadRecentRegistrations(data);

    console.log('✓ Dashboard stats loaded');

  } catch (err) {
    console.error('Dashboard stats error:', err.message);
  }
}

function loadRecentRegistrations(data) {
  const tbody = document.getElementById('recent-tbody');
  if (!tbody) return;

  // Show only the 10 most recent
  const recent = [...data]
    .sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    )
    .slice(0, 10);

  if (recent.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-loading">
          No registrations yet
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = recent.map(r => `
    <tr>
      <td><strong>${r.full_name}</strong></td>
      <td>${r.city}</td>
      <td>${r.num_children}</td>
      <td>${r.num_adults}</td>
      <td>
        ${r.amount_paid > 0
          ? `₦${r.amount_paid.toLocaleString()}`
          : '<span style="color:#10B981">FREE</span>'
        }
      </td>
      <td>
        <span class="status-badge ${r.payment_status}">
          ${r.payment_status}
        </span>
      </td>
      <td>${formatDate(r.created_at)}</td>
    </tr>
  `).join('');
}


/* ============================================
   6. REGISTRATIONS PAGE
   Full table with search, filter and CSV export
============================================ */
let allRegistrations = [];

async function loadAllRegistrations() {
  try {
    const { data, error } = await db
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allRegistrations = data || [];
    renderRegistrations(allRegistrations);

    console.log('✓ Registrations loaded:', data.length);

  } catch (err) {
    console.error('Registrations error:', err.message);
  }
}

function renderRegistrations(data) {
  const tbody    = document.getElementById('reg-tbody');
  const countEl  = document.getElementById('reg-count');
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="table-loading">
          No registrations found
        </td>
      </tr>
    `;
    if (countEl) countEl.textContent = '';
    return;
  }

  tbody.innerHTML = data.map(r => `
    <tr>
      <td>
        <code style="font-size:11px;color:#5B2D8E">
          ${r.booking_reference}
        </code>
      </td>
      <td><strong>${r.full_name}</strong></td>
      <td>${r.email}</td>
      <td>${r.phone}</td>
      <td>${r.city}</td>
      <td style="text-align:center">${r.num_children}</td>
      <td style="text-align:center">${r.num_adults}</td>
      <td>
        ${r.amount_paid > 0
          ? `₦${r.amount_paid.toLocaleString()}`
          : '<span style="color:#10B981;font-weight:700">FREE</span>'
        }
      </td>
      <td style="text-transform:capitalize">
        ${r.payment_method}
      </td>
      <td>
        <span class="status-badge ${r.payment_status}">
          ${r.payment_status}
        </span>
      </td>
      <td>${formatDate(r.created_at)}</td>
    </tr>
  `).join('');

  if (countEl) {
    countEl.textContent =
      `Showing ${data.length} registration${data.length !== 1 ? 's' : ''}`;
  }
}

function filterRegistrations() {
  const search  = document.getElementById('search-input')
    ?.value.toLowerCase() || '';
  const city    = document.getElementById('filter-city')
    ?.value || '';
  const status  = document.getElementById('filter-status')
    ?.value || '';

  const filtered = allRegistrations.filter(r => {
    const matchSearch =
      r.full_name.toLowerCase().includes(search) ||
      r.email.toLowerCase().includes(search) ||
      (r.booking_reference || '').toLowerCase().includes(search);
    const matchCity   = !city   || r.city === city;
    const matchStatus = !status || r.payment_status === status;
    return matchSearch && matchCity && matchStatus;
  });

  renderRegistrations(filtered);
}

// Export all registrations as a CSV file
function exportCSV() {
  if (!allRegistrations.length) {
    showAdminToast('No registrations to export', 'error');
    return;
  }

  const headers = [
    'Booking Ref', 'Name', 'Email', 'Phone',
    'City', 'Children', 'Adults', 'Amount',
    'Payment Method', 'Status', 'Date'
  ];

  const rows = allRegistrations.map(r => [
    r.booking_reference,
    r.full_name,
    r.email,
    r.phone,
    r.city,
    r.num_children,
    r.num_adults,
    r.amount_paid,
    r.payment_method,
    r.payment_status,
    formatDate(r.created_at)
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row =>
      row.map(val =>
        `"${String(val || '').replace(/"/g, '""')}"`
      ).join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `wow-fiesta-registrations-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showAdminToast('CSV exported successfully!', 'success');
}


/* ============================================
   7. EVENTS MANAGEMENT
   Load, edit and update event details
============================================ */
let currentEventId = null;

async function loadEvents() {
  try {
    const { data, error } = await db
      .from('events')
      .select('*')
      .order('event_date');

    if (error) throw error;

    const grid = document.getElementById('events-grid');
    if (!grid) return;

    if (!data || data.length === 0) {
      grid.innerHTML =
        '<p class="table-loading">No events found</p>';
      return;
    }

    grid.innerHTML = data.map(event => {
      const dateObj = new Date(
        event.event_date + 'T00:00:00'
      );
      const formatted = dateObj.toLocaleDateString('en-NG', {
        weekday: 'long',
        day:     'numeric',
        month:   'long',
        year:    'numeric'
      });

      return `
        <div class="event-card">
          <span class="event-active-badge ${event.is_active ? 'active' : 'inactive'}">
            ${event.is_active ? 'Active' : 'Hidden'}
          </span>
          <h3 class="event-card-city">${event.city}</h3>
          <p class="event-card-detail">
            📅 <strong>${formatted}</strong>
          </p>
          <p class="event-card-detail">
            ⏰ <strong>${event.event_time}</strong>
          </p>
          <p class="event-card-detail">
            📍 <strong>${event.venue_name}</strong>
          </p>
          <p class="event-card-detail">
            💰 Adults: <strong>
              ₦${event.adult_price.toLocaleString()}
            </strong>
          </p>
          <p class="event-card-detail">
            📋 ${event.venue_address}
          </p>
          <div class="event-card-actions">
            <button class="btn-edit"
              onclick="openEditEvent(${event.id})">
              Edit
            </button>
            <button class="btn-toggle-active"
              onclick="toggleEventActive(${event.id}, ${event.is_active})">
              ${event.is_active ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    console.log('✓ Events loaded');

  } catch (err) {
    console.error('Events load error:', err.message);
  }
}

function openAddEvent() {
  currentEventId = null;
  document.getElementById('modal-title').textContent =
    'Add New Event';
  document.getElementById('event-id').value      = '';
  document.getElementById('event-city').value    = '';
  document.getElementById('event-venue-name').value = '';
  document.getElementById('event-venue-address').value = '';
  document.getElementById('event-date').value    = '';
  document.getElementById('event-time').value    =
    '10:00 AM – 6:00 PM';
  document.getElementById('event-price').value   = '';
  document.getElementById('event-active').value  = 'true';
  document.getElementById('event-modal')
    .classList.add('open');
}

async function openEditEvent(eventId) {
  try {
    const { data, error } = await db
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) throw error;

    currentEventId = eventId;
    document.getElementById('modal-title').textContent =
      `Edit — ${data.city}`;
    document.getElementById('event-id').value           = data.id;
    document.getElementById('event-city').value         = data.city;
    document.getElementById('event-venue-name').value   = data.venue_name;
    document.getElementById('event-venue-address').value = data.venue_address;
    document.getElementById('event-date').value         = data.event_date;
    document.getElementById('event-time').value         = data.event_time;
    document.getElementById('event-price').value        = data.adult_price;
    document.getElementById('event-active').value       =
      String(data.is_active);

    document.getElementById('event-modal')
      .classList.add('open');

  } catch (err) {
    showAdminToast('Could not load event', 'error');
  }
}

function closeEventModal() {
  document.getElementById('event-modal')
    .classList.remove('open');
}

async function saveEvent() {
  const id      = document.getElementById('event-id').value;
  const payload = {
    city:          document.getElementById('event-city').value.trim(),
    venue_name:    document.getElementById('event-venue-name').value.trim(),
    venue_address: document.getElementById('event-venue-address').value.trim(),
    event_date:    document.getElementById('event-date').value,
    event_time:    document.getElementById('event-time').value.trim(),
    adult_price:   parseInt(
                     document.getElementById('event-price').value
                   ) || 0,
    is_active:     document.getElementById('event-active').value === 'true'
  };

  try {
    let error;

    if (id) {
      // Update existing event
      ({ error } = await db
        .from('events')
        .update(payload)
        .eq('id', id));
    } else {
      // Insert new event
      ({ error } = await db
        .from('events')
        .insert([payload]));
    }

    if (error) throw error;

    showAdminToast('Event saved successfully!', 'success');
    closeEventModal();
    loadEvents();

  } catch (err) {
    showAdminToast('Could not save event: ' + err.message, 'error');
  }
}

async function toggleEventActive(eventId, currentStatus) {
  try {
    const { error } = await db
      .from('events')
      .update({ is_active: !currentStatus })
      .eq('id', eventId);

    if (error) throw error;

    showAdminToast(
      `Event ${!currentStatus ? 'shown' : 'hidden'} on site`,
      'success'
    );
    loadEvents();

  } catch (err) {
    showAdminToast('Could not update event', 'error');
  }
}


/* ============================================
   8. GALLERY MANAGEMENT
   Upload photos to Supabase Storage,
   save URLs to gallery_images table,
   delete photos
============================================ */
let selectedFiles = [];

function handleGalleryUpload(event) {
  selectedFiles = Array.from(event.target.files);
  if (!selectedFiles.length) return;

  // Show the upload form
  document.getElementById('upload-form').style.display = 'flex';

  // Show image previews
  const previewEl = document.getElementById('upload-preview');
  previewEl.innerHTML = selectedFiles.map(file => {
    const url = URL.createObjectURL(file);
    return `<img src="${url}" class="preview-thumb"
      alt="Preview" />`;
  }).join('');
}

async function uploadGalleryPhoto() {
  if (!selectedFiles.length) return;

  const caption   = document.getElementById('upload-caption')
    .value.trim();
  const city      = document.getElementById('upload-city').value;
  const uploadBtn = document.getElementById('upload-btn');

  uploadBtn.textContent = 'Uploading...';
  uploadBtn.disabled    = true;

  let uploadCount = 0;

  for (const file of selectedFiles) {
    try {
      // Create unique filename
      const ext      = file.name.split('.').pop();
      const fileName =
        `gallery-${Date.now()}-${Math.random()
          .toString(36).substring(2, 7)}.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await db.storage
        .from('gallery')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert:       false
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const imageUrl =
        `${STORAGE_URL}/gallery/${fileName}`;

      // Get current max sort order
      const { data: existing } = await db
        .from('gallery_images')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      const nextOrder = (existing?.sort_order || 0) + 1;

      // Save to gallery_images table
      const { error: dbError } = await db
        .from('gallery_images')
        .insert([{
          image_url:  imageUrl,
          caption:    caption || null,
          city:       city,
          sort_order: nextOrder,
          is_active:  true
        }]);

      if (dbError) throw dbError;

      uploadCount++;

    } catch (err) {
      console.error('Upload error:', err.message);
      showAdminToast(
        `Failed to upload ${file.name}`, 'error'
      );
    }
  }

  if (uploadCount > 0) {
    showAdminToast(
      `${uploadCount} photo${uploadCount > 1 ? 's' : ''} uploaded!`,
      'success'
    );
  }

  // Reset form
  uploadBtn.textContent = 'Upload Photo';
  uploadBtn.disabled    = false;
  selectedFiles         = [];
  document.getElementById('upload-form').style.display = 'none';
  document.getElementById('upload-preview').innerHTML  = '';
  document.getElementById('upload-caption').value      = '';
  document.getElementById('gallery-upload').value      = '';

  // Reload gallery
  loadAdminGallery();
}

async function loadAdminGallery() {
  try {
    const { data, error } = await db
      .from('gallery_images')
      .select('*')
      .order('sort_order');

    if (error) throw error;

    const grid = document.getElementById('gallery-admin-grid');
    if (!grid) return;

    if (!data || data.length === 0) {
      grid.innerHTML =
        '<p class="table-loading">No photos yet. Upload your first photo above.</p>';
      return;
    }

    grid.innerHTML = data.map(img => `
      <div class="gallery-admin-item">
        <img
          src="${img.image_url}"
          alt="${img.caption || 'Gallery photo'}"
          loading="lazy"
        />
        <div class="gallery-admin-overlay">
          <p class="gallery-admin-caption">
            ${img.caption || 'No caption'}
          </p>
          <button class="btn-toggle-active"
            onclick="toggleGalleryItem(${img.id}, ${img.is_active})">
            ${img.is_active ? 'Hide' : 'Show'}
          </button>
          <button class="btn-delete"
            onclick="deleteGalleryItem(${img.id})">
            Delete
          </button>
        </div>
      </div>
    `).join('');

    console.log('✓ Admin gallery loaded');

  } catch (err) {
    console.error('Gallery load error:', err.message);
  }
}

async function toggleGalleryItem(imageId, currentStatus) {
  try {
    const { error } = await db
      .from('gallery_images')
      .update({ is_active: !currentStatus })
      .eq('id', imageId);

    if (error) throw error;

    showAdminToast(
      `Photo ${!currentStatus ? 'shown' : 'hidden'}`,
      'success'
    );
    loadAdminGallery();

  } catch (err) {
    showAdminToast('Could not update photo', 'error');
  }
}

async function deleteGalleryItem(imageId) {
  if (!confirm(
    'Are you sure you want to delete this photo? This cannot be undone.'
  )) return;

  try {
    const { error } = await db
      .from('gallery_images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;

    showAdminToast('Photo deleted', 'success');
    loadAdminGallery();

  } catch (err) {
    showAdminToast('Could not delete photo', 'error');
  }
}


/* ============================================
   9. ABOUT / SITE SETTINGS EDITOR
   Loads and saves the site_settings table
============================================ */
async function loadAboutContent() {
  try {
    const { data, error } = await db
      .from('site_settings')
      .select('*');

    if (error) throw error;
    if (!data) return;

    const settings = {};
    data.forEach(row => { settings[row.key] = row.value; });

    const heroDesc    = document.getElementById('hero-description');
    const aboutHead   = document.getElementById('about-heading');
    const aboutBody   = document.getElementById('about-body');

    if (heroDesc && settings.hero_description) {
      heroDesc.value  = settings.hero_description;
    }
    if (aboutHead && settings.about_heading) {
      aboutHead.value = settings.about_heading;
    }
    if (aboutBody && settings.about_body) {
      aboutBody.value = settings.about_body;
    }

    console.log('✓ About content loaded');

  } catch (err) {
    console.error('About content error:', err.message);
  }
}

async function saveAboutContent() {
  const updates = [
    {
      key:   'hero_description',
      value: document.getElementById('hero-description')
               ?.value.trim()
    },
    {
      key:   'about_heading',
      value: document.getElementById('about-heading')
               ?.value.trim()
    },
    {
      key:   'about_body',
      value: document.getElementById('about-body')
               ?.value.trim()
    }
  ];

  const statusEl = document.getElementById('save-status');

  try {
    for (const update of updates) {
      if (!update.value) continue;

      const { error } = await db
        .from('site_settings')
        .update({
          value:      update.value,
          updated_at: new Date().toISOString()
        })
        .eq('key', update.key);

      if (error) throw error;
    }

    showAdminToast('Content saved!', 'success');
    if (statusEl) {
      statusEl.textContent = '✓ Saved';
      setTimeout(() => {
        statusEl.textContent = '';
      }, 3000);
    }

  } catch (err) {
    showAdminToast('Could not save content', 'error');
  }
}


/* ============================================
   10. BLOG POSTS
   Create, edit, publish and delete posts
============================================ */
async function loadBlogPosts() {
  try {
    const { data, error } = await db
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const listEl = document.getElementById('posts-list');
    if (!listEl) return;

    if (!data || data.length === 0) {
      listEl.innerHTML = `
        <p class="table-loading">
          No blog posts yet. Click + New Post to create your first post.
        </p>
      `;
      return;
    }

    listEl.innerHTML = data.map(post => `
      <div class="post-item">
        ${post.cover_image_url
          ? `<img src="${post.cover_image_url}"
               class="post-item-cover"
               alt="${post.title}" />`
          : `<div class="post-item-cover"
               style="background:var(--purple-light);
               display:flex;align-items:center;
               justify-content:center;font-size:24px">
               ✍️</div>`
        }
        <div class="post-item-info">
          <p class="post-item-title">${post.title}</p>
          <p class="post-item-meta">
            <span class="status-badge ${post.status}">
              ${post.status}
            </span>
            &nbsp;·&nbsp; ${formatDate(post.created_at)}
          </p>
        </div>
        <div class="post-item-actions">
          <button class="btn-edit"
            onclick="editPost(${post.id})">
            Edit
          </button>
          <button class="btn-delete"
            onclick="deletePost(${post.id})">
            Delete
          </button>
        </div>
      </div>
    `).join('');

    console.log('✓ Blog posts loaded');

  } catch (err) {
    console.error('Blog posts error:', err.message);
  }
}

function openNewPost() {
  document.getElementById('post-id').value       = '';
  document.getElementById('post-title').value    = '';
  document.getElementById('post-cover').value    = '';
  document.getElementById('post-excerpt').value  = '';
  document.getElementById('post-content').value  = '';
  document.getElementById('post-status').value   = 'draft';
  document.getElementById('editor-title')
    .textContent = 'New Post';

  document.getElementById('posts-list-section')
    .style.display = 'none';
  document.getElementById('post-editor')
    .style.display = 'block';
}

async function editPost(postId) {
  try {
    const { data, error } = await db
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;

    document.getElementById('post-id').value      = data.id;
    document.getElementById('post-title').value   = data.title;
    document.getElementById('post-cover').value   =
      data.cover_image_url || '';
    document.getElementById('post-excerpt').value = data.excerpt || '';
    document.getElementById('post-content').value = data.content || '';
    document.getElementById('post-status').value  = data.status;
    document.getElementById('editor-title')
      .textContent = 'Edit Post';

    document.getElementById('posts-list-section')
      .style.display = 'none';
    document.getElementById('post-editor')
      .style.display = 'block';

  } catch (err) {
    showAdminToast('Could not load post', 'error');
  }
}

function closePostEditor() {
  document.getElementById('posts-list-section')
    .style.display = 'block';
  document.getElementById('post-editor')
    .style.display = 'none';
  loadBlogPosts();
}

async function savePost() {
  const id      = document.getElementById('post-id').value;
  const title   = document.getElementById('post-title')
    .value.trim();

  if (!title) {
    showAdminToast('Please enter a post title', 'error');
    return;
  }

  // Auto-generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60);

  const payload = {
    title,
    slug,
    cover_image_url: document.getElementById('post-cover')
                       .value.trim() || null,
    excerpt:         document.getElementById('post-excerpt')
                       .value.trim() || null,
    content:         document.getElementById('post-content')
                       .value.trim(),
    status:          document.getElementById('post-status').value,
    published_at:
      document.getElementById('post-status').value === 'published'
        ? new Date().toISOString()
        : null
  };

  const statusEl = document.getElementById('post-save-status');

  try {
    let error;

    if (id) {
      ({ error } = await db
        .from('blog_posts')
        .update(payload)
        .eq('id', id));
    } else {
      ({ error } = await db
        .from('blog_posts')
        .insert([payload]));
    }

    if (error) throw error;

    showAdminToast('Post saved!', 'success');
    if (statusEl) {
      statusEl.textContent = '✓ Saved';
      setTimeout(() => {
        statusEl.textContent = '';
      }, 3000);
    }

  } catch (err) {
    showAdminToast('Could not save post: ' + err.message, 'error');
  }
}

async function deletePost(postId) {
  if (!confirm(
    'Delete this post? This cannot be undone.'
  )) return;

  try {
    const { error } = await db
      .from('blog_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;

    showAdminToast('Post deleted', 'success');
    loadBlogPosts();

  } catch (err) {
    showAdminToast('Could not delete post', 'error');
  }
}


/* ============================================
   11. UI HELPERS
============================================ */

// Toast notification
function showAdminToast(message, type = 'info') {
  const existing = document.getElementById('admin-toast');
  if (existing) existing.remove();

  const toast       = document.createElement('div');
  toast.id          = 'admin-toast';
  toast.className   = `admin-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 3500);
}

// Format date nicely
function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-NG', {
    day:   'numeric',
    month: 'short',
    year:  'numeric'
  });
}


/* ============================================
   12. PAGE ROUTER
   Detects which admin page is open and
   runs the correct data loading function
============================================ */
async function initAdminPage() {
  // First check the user is logged in
  const isValid = await checkSession();
  if (!isValid) return;

  const path = window.location.pathname;

  if (path.includes('dashboard')) {
    loadDashboardStats();
  } else if (path.includes('registrations')) {
    loadAllRegistrations();
  } else if (path.includes('events')) {
    loadEvents();
  } else if (path.includes('gallery')) {
    loadAdminGallery();
  } else if (path.includes('about')) {
    loadAboutContent();
  } else if (path.includes('blog')) {
    loadBlogPosts();
  }
}

// Run on every page load
initAdminPage();