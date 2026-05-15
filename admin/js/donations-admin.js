/* ============================================
   DONATIONS ADMIN — donations-admin.js
============================================ */

let allDonations = [];

async function loadDonations() {
  try {
    const { data, error } = await db
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allDonations = data || [];
    updateDonationStats(allDonations);
    renderDonations(allDonations);

    console.log('✓ Donations loaded:', allDonations.length);

  } catch (err) {
    console.error('Donations load error:', err.message);
    document.getElementById('don-tbody').innerHTML = `
      <tr>
        <td colspan="7" class="table-loading">
          Error loading donations: ${err.message}
        </td>
      </tr>
    `;
  }
}

function updateDonationStats(data) {
  const total   = data.length;
  const revenue = data.reduce((s, d) => s + (d.amount || 0), 0);
  const average = total > 0 ? Math.round(revenue / total) : 0;
  const highest = total > 0 ? Math.max(...data.map(d => d.amount || 0)) : 0;

  const el = id => document.getElementById(id);
  if (el('don-total'))   el('don-total').textContent   = total.toLocaleString();
  if (el('don-revenue')) el('don-revenue').textContent = `₦${revenue.toLocaleString()}`;
  if (el('don-average')) el('don-average').textContent = `₦${average.toLocaleString()}`;
  if (el('don-highest')) el('don-highest').textContent = `₦${highest.toLocaleString()}`;
}

function renderDonations(data) {
  const tbody   = document.getElementById('don-tbody');
  const countEl = document.getElementById('don-count');
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="table-loading">
          No donations found
        </td>
      </tr>
    `;
    if (countEl) countEl.textContent = '';
    return;
  }

  tbody.innerHTML = data.map((d, i) => `
    <tr>
      <td style="color:#9CA3AF;font-weight:700">${i + 1}</td>
      <td><strong>${d.full_name || '—'}</strong></td>
      <td style="color:#6B7280">${d.email || '—'}</td>
      <td>
        <strong style="color:#059669">
          ₦${(d.amount || 0).toLocaleString()}
        </strong>
      </td>
      <td>
        <code style="
          font-size:11px;
          background:#F3F4F6;
          color:#5B2D8E;
          padding:3px 8px;
          border-radius:6px;
        ">${d.payment_reference || '—'}</code>
      </td>
      <td>
        <span class="status-badge ${d.payment_status || 'success'}">
          ${d.payment_status || 'success'}
        </span>
      </td>
      <td style="color:#9CA3AF;white-space:nowrap">
        ${formatDate(d.created_at)}
      </td>
    </tr>
  `).join('');

  if (countEl) {
    countEl.textContent =
      `Showing ${data.length} donation${data.length !== 1 ? 's' : ''}`;
  }
}

function filterDonations() {
  const search = document.getElementById('don-search')
    ?.value.toLowerCase() || '';

  const filtered = allDonations.filter(d =>
    (d.full_name || '').toLowerCase().includes(search) ||
    (d.email     || '').toLowerCase().includes(search)
  );

  renderDonations(filtered);
}

function exportDonationsCSV() {
  if (!allDonations.length) {
    showAdminToast('No donations to export', 'error');
    return;
  }

  const headers = ['Name', 'Email', 'Amount', 'Payment Ref', 'Status', 'Date'];
  const rows = allDonations.map(d => [
    `"${d.full_name || ''}"`,
    `"${d.email || ''}"`,
    d.amount || 0,
    `"${d.payment_reference || ''}"`,
    `"${d.payment_status || ''}"`,
    `"${formatDate(d.created_at)}"`
  ]);

  const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `wow-fiesta-donations-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showAdminToast('Donations exported!', 'success');
}

// Load on page init
loadDonations();