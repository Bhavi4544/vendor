
const rowsBody = document.querySelector('#vendor-rows');
const tableWrap = document.querySelector('#table-wrap');
const emptyNone = document.querySelector('#empty-none');
const emptyFiltered = document.querySelector('#empty-filtered');
const resultsLine = document.querySelector('#results-line');
const searchInput = document.querySelector('#search');
const serviceSelect = document.querySelector('#filter-service');
const statusSelect = document.querySelector('#filter-status');
const sortSelect = document.querySelector('#sort');
const statButtons = document.querySelectorAll('.stat');

const drawerRoot = document.querySelector('#drawer-root');
const drawer = drawerRoot.querySelector('.drawer');
const drawerTitle = document.querySelector('#drawer-title');
const drawerRef = document.querySelector('#drawer-ref');
const drawerBody = document.querySelector('#drawer-body');
const toast = document.querySelector('#toast');

const filters = { query: '', service: '', status: '', sort: 'newest' };

let openVendorId = null;
let lastFocused = null;
let toastTimer = null;

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ));

const initials = (name) =>
  String(name).trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || '?';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });

const isWebLink = (value) => /^https?:\/\//i.test(value);

const badge = (status) =>
  `<span class="badge badge--${escapeHtml(status.toLowerCase())}">${escapeHtml(status)}</span>`;

const countLabel = (count) => `${count} ${count === 1 ? 'vendor' : 'vendors'}`;

// ---------- Filtering and sorting ----------

const applyFilters = (vendors) => {
  const query = filters.query.trim().toLowerCase();

  const matches = vendors.filter((vendor) =>
    (query === '' || vendor.companyName.toLowerCase().includes(query)) &&
    (filters.service === '' || vendor.services.includes(filters.service)) &&
    (filters.status === '' || vendor.status === filters.status)
  );

  const sorters = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
    name: (a, b) => a.companyName.localeCompare(b.companyName),
    team: (a, b) => b.teamSize - a.teamSize,
  };

  return matches.sort(sorters[filters.sort]);
};

// ---------- Rendering the list ----------

const renderRow = (vendor) => {
  const [mainService, ...otherServices] = vendor.services;

  return `
    <tr data-id="${escapeHtml(vendor.id)}">
      <td data-label="Company">
        <div class="company">
          <span class="avatar" aria-hidden="true">${escapeHtml(initials(vendor.companyName))}</span>
          <div class="company__text">
            <button type="button" class="row-link">${escapeHtml(vendor.companyName)}</button>
            <span class="sub">${escapeHtml(vendor.id)}</span>
          </div>
        </div>
      </td>
      <td data-label="Contact">
        <div class="cell">
          <span class="cell-main">${escapeHtml(vendor.contactPerson)}</span>
          <span class="sub">${escapeHtml(vendor.email)}</span>
        </div>
      </td>
      <td data-label="Location">${escapeHtml(vendor.city)}, ${escapeHtml(vendor.country)}</td>
      <td data-label="Main service">
        <div class="cell">
          ${escapeHtml(mainService)}
          ${otherServices.length ? `<span class="more" title="${escapeHtml(otherServices.join(', '))}">+${otherServices.length}</span>` : ''}
        </div>
      </td>
      <td data-label="Team">${escapeHtml(vendor.teamSize)}</td>
      <td data-label="Status">${badge(vendor.status)}</td>
    </tr>`;
};

const renderStats = (vendors) => {
  const countOf = (status) => vendors.filter((vendor) => vendor.status === status).length;

  document.querySelector('#count-all').textContent = vendors.length;
  document.querySelector('#count-pending').textContent = countOf('Pending');
  document.querySelector('#count-approved').textContent = countOf('Approved');
  document.querySelector('#count-rejected').textContent = countOf('Rejected');

  statButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.status === filters.status));
  });
};

const renderList = () => {
  const vendors = readVendors();
  const visible = applyFilters(vendors);

  renderStats(vendors);

  const hasAny = vendors.length > 0;
  const hasVisible = visible.length > 0;

  tableWrap.hidden = !hasVisible;
  emptyNone.hidden = hasAny;
  emptyFiltered.hidden = !hasAny || hasVisible;
  resultsLine.hidden = !hasAny;

  resultsLine.textContent = hasVisible
    ? `Showing ${visible.length} of ${countLabel(vendors.length)}`
    : `No matches among ${countLabel(vendors.length)}`;

  rowsBody.innerHTML = visible.map(renderRow).join('');
};

// ---------- Details panel ----------

const detailRow = (label, valueHtml) => `
  <div class="detail">
    <dt>${label}</dt>
    <dd>${valueHtml || '<span class="muted">Not provided</span>'}</dd>
  </div>`;

const linkOrText = (value, href = value) =>
  value
    ? `<a href="${escapeHtml(href)}" ${isWebLink(href) ? 'target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(value)}</a>`
    : '';

const chips = (items) =>
  items.length
    ? `<ul class="tag-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '';

const toolList = (tools) =>
  chips(String(tools || '').split(',').map((tool) => tool.trim()).filter(Boolean));

const statusControl = (vendor) => `
  <div class="status-box">
    <div class="status-box__top">
      <span class="status-box__label" id="status-label">Review status</span>
      ${badge(vendor.status)}
    </div>
    <div class="segmented" role="group" aria-labelledby="status-label">
      ${STATUSES.map((status) => `
        <button type="button" class="segmented__option segmented__option--${status.toLowerCase()}"
                data-set-status="${status}" aria-pressed="${status === vendor.status}">${status}</button>
      `).join('')}
    </div>
  </div>`;

const renderDrawer = (vendor) => {
  drawerTitle.textContent = vendor.companyName;
  drawerRef.textContent = `${vendor.id} · Received ${formatDate(vendor.createdAt)}`;

  drawerBody.innerHTML = `
    ${statusControl(vendor)}

    <section class="detail-group" aria-labelledby="d-company">
      <h3 id="d-company">Company</h3>
      <dl>
        ${detailRow('Location', `${escapeHtml(vendor.city)}, ${escapeHtml(vendor.country)}`)}
        ${detailRow('Website', linkOrText(vendor.website))}
      </dl>
    </section>

    <section class="detail-group" aria-labelledby="d-contact">
      <h3 id="d-contact">Contact</h3>
      <dl>
        ${detailRow('Contact person', escapeHtml(vendor.contactPerson))}
        ${detailRow('Email', linkOrText(vendor.email, `mailto:${vendor.email}`))}
        ${detailRow('Phone', linkOrText(vendor.phone, `tel:${vendor.phone.replace(/[^\d+]/g, '')}`))}
      </dl>
    </section>

    <section class="detail-group" aria-labelledby="d-services">
      <h3 id="d-services">Services</h3>
      ${chips(vendor.services)}
    </section>

    <section class="detail-group" aria-labelledby="d-team">
      <h3 id="d-team">Team and tools</h3>
      <dl>
        ${detailRow('Team size', escapeHtml(vendor.teamSize))}
        ${detailRow('Years of experience', vendor.yearsExperience === null ? '' : escapeHtml(vendor.yearsExperience))}
        ${detailRow('Software', toolList(vendor.tools))}
      </dl>
    </section>

    <section class="detail-group" aria-labelledby="d-work">
      <h3 id="d-work">About the work</h3>
      <dl>
        ${detailRow('Summary', escapeHtml(vendor.summary))}
        ${detailRow('Portfolio', linkOrText(vendor.portfolioUrl))}
      </dl>
    </section>`;
};

const getFocusable = () =>
  [...drawer.querySelectorAll('a[href], button:not([disabled])')].filter((el) => el.offsetParent !== null);

const openDrawer = (id) => {
  const vendor = readVendors().find((item) => item.id === id);
  if (!vendor) return;

  lastFocused = document.activeElement;
  openVendorId = id;
  renderDrawer(vendor);

  drawerRoot.hidden = false;
  document.body.classList.add('is-locked');
  drawer.focus();
};

const closeDrawer = () => {
  drawerRoot.hidden = true;
  document.body.classList.remove('is-locked');
  openVendorId = null;
  if (lastFocused) lastFocused.focus();
};

// ---------- Status changes ----------

const showToast = (message, isError = false) => {
  toast.textContent = message;
  toast.classList.toggle('toast--error', isError);
  toast.hidden = false;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
};

const changeStatus = (status) => {
  const vendor = readVendors().find((item) => item.id === openVendorId);
  if (!vendor || vendor.status === status) return;

  if (!updateVendorStatus(vendor.id, status)) {
    showToast('The status could not be saved. Check that browser storage is allowed.', true);
    return;
  }

  renderDrawer({ ...vendor, status });
  renderList();

  // Keep keyboard focus on the button that was just used.
  drawerBody.querySelector(`[data-set-status="${status}"]`)?.focus();
  showToast(`${vendor.companyName} is now ${status.toLowerCase()}.`);
};

// ---------- Filter controls ----------

const fillSelect = (select, allLabel, options) => {
  select.replaceChildren(
    new Option(allLabel, ''),
    ...options.map((option) => new Option(option, option))
  );
};

const setStatusFilter = (status) => {
  filters.status = status;
  statusSelect.value = status;
  renderList();
};

const clearFilters = () => {
  Object.assign(filters, { query: '', service: '', status: '' });
  searchInput.value = '';
  serviceSelect.value = '';
  statusSelect.value = '';
  renderList();
};

// ---------- Events ----------

searchInput.addEventListener('input', () => { filters.query = searchInput.value; renderList(); });
serviceSelect.addEventListener('change', () => { filters.service = serviceSelect.value; renderList(); });
statusSelect.addEventListener('change', () => setStatusFilter(statusSelect.value));
sortSelect.addEventListener('change', () => { filters.sort = sortSelect.value; renderList(); });

statButtons.forEach((button) => {
  button.addEventListener('click', () => setStatusFilter(button.dataset.status));
});

rowsBody.addEventListener('click', (event) => {
  const row = event.target.closest('tr[data-id]');
  if (row) openDrawer(row.dataset.id);
});

document.querySelector('#clear-filters').addEventListener('click', clearFilters);

document.querySelector('#add-samples').addEventListener('click', () => {
  if (addSampleVendors()) renderList();
  else showToast('Sample vendors could not be saved. Check that browser storage is allowed.', true);
});

drawerRoot.addEventListener('click', (event) => {
  if (event.target.closest('[data-close]')) closeDrawer();

  const statusButton = event.target.closest('[data-set-status]');
  if (statusButton) changeStatus(statusButton.dataset.setStatus);
});

document.addEventListener('keydown', (event) => {
  if (drawerRoot.hidden) return;

  if (event.key === 'Escape') {
    closeDrawer();
    return;
  }

  // Keep Tab inside the open panel.
  if (event.key === 'Tab') {
    const focusable = getFocusable();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && (document.activeElement === first || document.activeElement === drawer)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// Refresh when a vendor registers in another tab.
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) renderList();
});

fillSelect(serviceSelect, 'All services', SERVICES);
fillSelect(statusSelect, 'All statuses', STATUSES);
renderList();
