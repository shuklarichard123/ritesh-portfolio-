/* ── API base URL — injected by api-config.js ─────────────────────────────
   Falls back to localhost for local development                            */
const API_BASE = (typeof window.USER_TRACKER_API !== 'undefined')
  ? window.USER_TRACKER_API
  : 'http://localhost:3000';

/* ── Utility helpers ────────────────────────────────────────────────────── */
function showResult(el, message, type) {
  el.textContent = message;
  el.className = `result result-${type}`;
  el.hidden = false;
}

function hideResult(el) {
  el.hidden = true;
  el.className = 'result';
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function truncate(str, n = 60) {
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

/* ── Tab switching ──────────────────────────────────────────────────────── */
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.remove('tab-active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.hidden = true;
    });
    tab.classList.add('tab-active');
    tab.setAttribute('aria-selected', 'true');
    const panel = document.getElementById(`tab-${tab.dataset.tab}`);
    if (panel) panel.hidden = false;
  });
});

/* ── Submit form ────────────────────────────────────────────────────────── */
const submitForm = document.getElementById('submit-form');
const submitBtn  = document.getElementById('submit-btn');
const submitResult = document.getElementById('submit-result');

submitForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideResult(submitResult);

  const username       = document.getElementById('username').value.trim();
  const requested_data = document.getElementById('requested_data').value.trim();
  const rawParams      = document.getElementById('input_parameters').value.trim();

  // Validate
  if (!username) { showResult(submitResult, 'Username is required.', 'error'); return; }
  if (!requested_data) { showResult(submitResult, 'Requested Data is required.', 'error'); return; }

  let input_parameters = {};
  if (rawParams) {
    try {
      input_parameters = JSON.parse(rawParams);
    } catch {
      showResult(submitResult, 'Input Parameters must be valid JSON.', 'error');
      return;
    }
  }

  // Loading state
  submitBtn.disabled = true;
  submitBtn.querySelector('.btn-text').hidden = true;
  submitBtn.querySelector('.btn-loader').hidden = false;

  try {
    const data = await apiFetch('/records', {
      method: 'POST',
      body: JSON.stringify({ username, requested_data, input_parameters }),
    });
    showResult(submitResult, `✅ Submitted! Request ID: ${data.request_id}`, 'success');
    submitForm.reset();
  } catch (err) {
    showResult(submitResult, `❌ Error: ${err.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').hidden = false;
    submitBtn.querySelector('.btn-loader').hidden = true;
  }
});

/* ── View records ───────────────────────────────────────────────────────── */
const loadBtn       = document.getElementById('load-btn');
const filterInput   = document.getElementById('filter-username');
const recordsResult = document.getElementById('records-result');
const tableWrap     = document.getElementById('records-table-wrap');
const tbody         = document.getElementById('records-tbody');

function renderTable(records) {
  tbody.innerHTML = '';

  if (records.length === 0) {
    showResult(recordsResult, 'No records found.', 'error');
    tableWrap.hidden = true;
    return;
  }

  hideResult(recordsResult);
  records.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="request-id-cell" title="Click to copy" data-id="${r.request_id}">${r.request_id.slice(0, 8)}…</td>
      <td>${r.username || '—'}</td>
      <td>${truncate(r.requested_data, 50)}</td>
      <td>${truncate(r.input_parameters)}</td>
      <td>${formatDate(r.created_at)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Click request ID cell to copy full ID
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
    showResult(recordsResult, `Loaded ${data.count} record(s).`, 'success');
  } catch (err) {
    showResult(recordsResult, `❌ Error: ${err.message}`, 'error');
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = 'Load Records';
  }
});

/* ── Lookup by ID ───────────────────────────────────────────────────────── */
const lookupBtn    = document.getElementById('lookup-btn');
const lookupInput  = document.getElementById('lookup-id');
const lookupResult = document.getElementById('lookup-result');
const lookupDetail = document.getElementById('lookup-detail');

function renderDetail(record) {
  lookupDetail.innerHTML = '';
  const fields = [
    ['Request ID',        record.request_id],
    ['Username',          record.username],
    ['Requested Data',    record.requested_data],
    ['Input Parameters',  JSON.stringify(record.input_parameters, null, 2)],
    ['Created At',        formatDate(record.created_at)],
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
