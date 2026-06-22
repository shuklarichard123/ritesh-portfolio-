/* ── API base URL — injected by api-config.js ────────────────────────────── */
const API_BASE = (typeof window.USER_TRACKER_API !== 'undefined')
  ? window.USER_TRACKER_API
  : 'http://localhost:3000';

/* ── Utility helpers ─────────────────────────────────────────────────────── */
function showResult(el, message, type) {
  el.innerHTML = message;
  el.className = `result result-${type}`;
  el.hidden = false;
}

function hideResult(el) {
  el.hidden = true;
  el.className = 'result';
}

function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function truncate(str, n = 55) {
  if (!str) return '—';
  const s = typeof str === 'object' ? JSON.stringify(str) : String(str);
  return s.length > n ? s.slice(0, n) + '…' : s;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

/* ── Tab switching ───────────────────────────────────────────────────────── */
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.remove('tab-active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach((p) => { p.hidden = true; });
    tab.classList.add('tab-active');
    tab.setAttribute('aria-selected', 'true');
    const panel = document.getElementById(`tab-${tab.dataset.tab}`);
    if (panel) panel.hidden = false;
  });
});

/* ── Submit form ─────────────────────────────────────────────────────────── */
const submitForm   = document.getElementById('submit-form');
const submitBtn    = document.getElementById('submit-btn');
const submitResult = document.getElementById('submit-result');

submitForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideResult(submitResult);

  // Collect requester fields
  const username             = document.getElementById('username').value.trim();
  const requester_email      = document.getElementById('requester_email').value.trim();
  const requested_data       = document.getElementById('requested_data').value.trim();

  // Collect IP & access fields
  const ip_address           = document.getElementById('ip_address').value.trim();
  const port                 = document.getElementById('port').value.trim();
  const environment          = document.getElementById('environment').value;
  const access_duration      = document.getElementById('access_duration').value;
  const application_name     = document.getElementById('application_name').value.trim();
  const protocols            = [...document.querySelectorAll('input[name="protocol"]:checked')]
                                  .map((cb) => cb.value);

  // Collect justification fields
  const business_justification = document.getElementById('business_justification').value.trim();
  const approver_name          = document.getElementById('approver_name').value.trim();

  // Validate required fields
  const errors = [];
  if (!username)              errors.push('Full Name is required.');
  if (!requester_email)       errors.push('Email Address is required.');
  if (!requested_data)        errors.push('Organisation / Team is required.');
  if (!ip_address)            errors.push('IP Address is required.');
  if (!port)                  errors.push('Port is required.');
  if (!environment)           errors.push('Target Environment is required.');
  if (!access_duration)       errors.push('Access Duration is required.');
  if (!application_name)      errors.push('Application / Service Name is required.');
  if (!business_justification) errors.push('Business Justification is required.');
  if (!approver_name)         errors.push('Approver Name is required.');

  if (errors.length > 0) {
    showResult(submitResult, '⚠️ ' + errors.join('<br>⚠️ '), 'error');
    return;
  }

  // Build structured input_parameters object from human fields
  const input_parameters = {
    ip_address,
    port,
    environment,
    access_duration,
    application_name,
    protocols: protocols.length > 0 ? protocols : ['HTTPS'],
    business_justification,
    approver_name,
    requester_email,
  };

  // Loading state
  submitBtn.disabled = true;
  submitBtn.querySelector('.btn-text').hidden = true;
  submitBtn.querySelector('.btn-loader').hidden = false;

  try {
    const data = await apiFetch('/records', {
      method: 'POST',
      body: JSON.stringify({ username, requested_data, input_parameters }),
    });
    showResult(
      submitResult,
      `✅ Request submitted successfully!<br><strong>Request ID:</strong> <code>${data.request_id}</code><br>Save this ID to track your request.`,
      'success'
    );
    submitForm.reset();
    // Re-check HTTPS by default after reset
    const httpsBox = document.querySelector('input[name="protocol"][value="HTTPS"]');
    if (httpsBox) httpsBox.checked = true;
  } catch (err) {
    showResult(submitResult, `❌ Submission failed: ${err.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').hidden = false;
    submitBtn.querySelector('.btn-loader').hidden = true;
  }
});

/* ── View records ────────────────────────────────────────────────────────── */
const loadBtn       = document.getElementById('load-btn');
const filterInput   = document.getElementById('filter-username');
const recordsResult = document.getElementById('records-result');
const tableWrap     = document.getElementById('records-table-wrap');
const tbody         = document.getElementById('records-tbody');

function statusBadge(params) {
  // Default to Pending — extend later if you add a status field
  const s = (params && params.status) ? params.status : 'Pending';
  const cls = { Approved: 'badge-green', Rejected: 'badge-red', Pending: 'badge-orange' }[s] || 'badge-orange';
  return `<span class="status-badge ${cls}">${s}</span>`;
}

function renderTable(records) {
  tbody.innerHTML = '';
  if (records.length === 0) {
    showResult(recordsResult, 'No requests found.', 'error');
    tableWrap.hidden = true;
    return;
  }

  hideResult(recordsResult);
  records.forEach((r) => {
    const p = r.input_parameters || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="request-id-cell" title="Click to copy full ID" data-id="${r.request_id}">${r.request_id.slice(0, 8)}…</td>
      <td>${r.username || '—'}</td>
      <td>${truncate(r.requested_data, 30)}</td>
      <td><code class="ip-code">${p.ip_address || '—'}</code></td>
      <td>${p.environment || '—'}</td>
      <td>${p.access_duration || '—'}</td>
      <td>${statusBadge(p)}</td>
      <td>${formatDate(r.created_at)}</td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.request-id-cell').forEach((cell) => {
    cell.addEventListener('click', () => {
      navigator.clipboard.writeText(cell.dataset.id).then(() => {
        const orig = cell.textContent;
        cell.textContent = 'Copied!';
        setTimeout(() => { cell.textContent = orig; }, 1500);
      });
    });
  });

  tableWrap.hidden = false;
}

loadBtn.addEventListener('click', async () => {
  hideResult(recordsResult);
  tableWrap.hidden = true;
  loadBtn.disabled = true;
  loadBtn.textContent = 'Loading…';

  try {
    const username = filterInput.value.trim();
    const path = username ? `/records?username=${encodeURIComponent(username)}` : '/records';
    const data = await apiFetch(path);
    renderTable(data.records || []);
    showResult(recordsResult, `Loaded ${data.count} request(s).`, 'success');
  } catch (err) {
    showResult(recordsResult, `❌ Error: ${err.message}`, 'error');
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = 'Load Requests';
  }
});

/* ── Lookup by ID ────────────────────────────────────────────────────────── */
const lookupBtn    = document.getElementById('lookup-btn');
const lookupInput  = document.getElementById('lookup-id');
const lookupResult = document.getElementById('lookup-result');
const lookupDetail = document.getElementById('lookup-detail');

function renderDetail(record) {
  lookupDetail.innerHTML = '';
  const p = record.input_parameters || {};

  const fields = [
    ['Request ID',             record.request_id],
    ['Full Name',              record.username],
    ['Email Address',          p.requester_email],
    ['Organisation / Team',    record.requested_data],
    ['IP Address / CIDR',      p.ip_address],
    ['Port',                   p.port],
    ['Target Environment',     p.environment],
    ['Access Duration',        p.access_duration],
    ['Application / Service',  p.application_name],
    ['Protocols',              Array.isArray(p.protocols) ? p.protocols.join(', ') : p.protocols],
    ['Business Justification', p.business_justification],
    ['Approver',               p.approver_name],
    ['Status',                 p.status || 'Pending'],
    ['Submitted At',           formatDate(record.created_at)],
  ];

  fields.forEach(([key, val]) => {
    const row = document.createElement('div');
    row.className = 'detail-row';
    row.innerHTML = `<span class="detail-key">${key}</span><span class="detail-val">${val ?? '—'}</span>`;
    lookupDetail.appendChild(row);
  });
  lookupDetail.hidden = false;
}

lookupBtn.addEventListener('click', async () => {
  const id = lookupInput.value.trim();
  if (!id) { showResult(lookupResult, 'Please enter a Request ID.', 'error'); return; }

  hideResult(lookupResult);
  lookupDetail.hidden = true;
  lookupBtn.disabled = true;
  lookupBtn.textContent = 'Looking up…';

  try {
    const data = await apiFetch(`/records/${encodeURIComponent(id)}`);
    renderDetail(data);
    hideResult(lookupResult);
  } catch (err) {
    showResult(lookupResult, `❌ ${err.message}`, 'error');
  } finally {
    lookupBtn.disabled = false;
    lookupBtn.textContent = 'Lookup';
  }
});
