/* ══════════════════════════════════════════════════
   VORTXA ADMIN — JAVASCRIPT ENGINE
   ══════════════════════════════════════════════════ */

// ── STATE ──────────────────────────────────────────
let projects = [];
let currentFilter = 'all';
let currentPayFilter = 'all';
let currentSection = 'dashboard';
let editingId = null;
let deleteTargetId = null;
let paymentLogEntries = [];
let searchQuery = '';

// ── CONSTANTS ─────────────────────────────────────
const PROJECT_TYPES = {
  'Social Media Marketing': '📱',
  'Brand Identity':         '🎨',
  'Web Development':        '💻',
  'Content Production':     '🎬',
  'Full Package':           '📦',
  'SEO & Growth':           '📈',
  'Ad Campaigns':           '📣',
  'Other':                  '🔷'
};

const STATUS_LABELS = {
  'active':      { label: '🟢 Active',      cls: 'status-active'      },
  'in-progress': { label: '🔵 In Progress',  cls: 'status-in-progress' },
  'on-hold':     { label: '🟡 On Hold',      cls: 'status-on-hold'     },
  'completed':   { label: '✅ Completed',    cls: 'status-completed'   }
};

// ── INIT ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadProjects();
  setDefaultDate();
  refreshAll();

  // Sidebar toggle
  const sbToggle = document.getElementById('sidebarToggle');
  if (sbToggle) {
    sbToggle.addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('collapsed');
      document.body.classList.toggle('sidebar-collapsed');
    });
  }

  // Notification button opens Requests
  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => switchSection('requests'));
  }
});

// ── STORAGE ────────────────────────────────────────
function loadProjects() {
  try {
    projects = JSON.parse(localStorage.getItem('vortxa_projects') || '[]');
  } catch { projects = []; }
}

function saveProjects() {
  localStorage.setItem('vortxa_projects', JSON.stringify(projects));
}

// ── SECTION NAVIGATION ─────────────────────────────
function switchSection(name, filter) {
  currentSection = name;

  // Update sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`section-${name}`);
  if (target) target.classList.add('active');

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-section="${name}"]`);
  if (activeNav && !filter) activeNav.classList.add('active');

  // Page title
  const titles = { dashboard: 'Dashboard', projects: 'Projects', payments: 'Payments', team: 'Team', requests: 'Client Requests' };
  const subs   = { dashboard: 'Welcome back, Admin', projects: 'Manage all client projects', payments: 'Track payments & outstanding balances', team: 'Team workload overview', requests: 'Review, quote & confirm client inquiries' };
  document.getElementById('pageTitle').textContent = titles[name] || name;
  document.getElementById('pageSub').textContent   = subs[name] || '';

  // Apply filter if given
  if (filter && name === 'projects') {
    filterProjects(filter, null);
  }

  // Refresh content
  if (name === 'dashboard') renderDashboard();
  if (name === 'projects')  renderProjects();
  if (name === 'payments')  renderPaymentsTable();
  if (name === 'team')      renderTeam();
  if (name === 'requests')  renderRequests();
}

function refreshAll() {
  updateKPIs();
  updateBadges();
  renderDashboard();
  renderProjects();
  renderPaymentsTable();
  renderTeam();
}

// ── KPI ────────────────────────────────────────────
function updateKPIs() {
  const total       = projects.length;
  const active      = projects.filter(p => p.status === 'active').length;
  const revenue     = projects.reduce((s, p) => s + (parseFloat(p.totalPrice) || 0), 0);
  const paid        = projects.reduce((s, p) => s + (parseFloat(p.amountPaid) || 0), 0);
  const outstanding = revenue - paid;
  const unpaid      = projects.filter(p => getPayStatus(p) === 'unpaid').length;

  setText('kpi-total',       total);
  setText('kpi-active-sub',  `${active} active`);
  setText('kpi-revenue',     formatCurrency(revenue));
  setText('kpi-paid',        formatCurrency(paid));
  setText('kpi-outstanding', formatCurrency(outstanding));
  setText('kpi-unpaid-count',`${unpaid} unpaid`);
}

function updateBadges() {
  const unpaid = projects.filter(p => getPayStatus(p) !== 'paid').length;
  setText('projectsBadge', projects.length);
  const unpaidBadge = document.getElementById('unpaidBadge');
  unpaidBadge.textContent = unpaid;
  unpaidBadge.style.display = unpaid > 0 ? '' : 'none';

  // Notification dot
  const notifDot = document.getElementById('notifDot');
  notifDot.style.display = unpaid > 0 ? '' : 'none';

  // Requests badge
  updateRequestBadge();
}

// ── DASHBOARD RENDER ───────────────────────────────
function renderDashboard() {
  updateKPIs();
  renderRecentProjects();
  renderPaymentChart();
  renderStatusBars();
  renderWorkloadBars();
}

function renderRecentProjects() {
  const list = document.getElementById('recentProjectsList');
  const recent = [...projects].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  if (!recent.length) {
    list.innerHTML = `<div class="empty-state-mini"><i class="ri-folder-add-line"></i><span>No projects yet. Add your first project!</span></div>`;
    return;
  }

  list.innerHTML = recent.map(p => {
    const status = STATUS_LABELS[p.status] || STATUS_LABELS['active'];
    return `
    <div class="mini-project-row" onclick="openDetailModal('${p.id}')">
      <div class="mini-project-type-icon">${getTypeEmoji(p.type)}</div>
      <div class="mini-project-info">
        <div class="mini-project-name">${esc(p.projectName)}</div>
        <div class="mini-project-client">${esc(p.clientName)}</div>
      </div>
      <span class="mini-status-badge ${status.cls}">${status.label}</span>
    </div>`;
  }).join('');
}

function renderPaymentChart() {
  const total   = projects.reduce((s, p) => s + (parseFloat(p.totalPrice) || 0), 0);
  const paid    = projects.filter(p => getPayStatus(p) === 'paid').reduce((s, p) => s + (parseFloat(p.totalPrice) || 0), 0);
  const partial = projects.filter(p => getPayStatus(p) === 'partial').reduce((s, p) => s + (parseFloat(p.amountPaid) || 0), 0);
  const unpaid  = total - paid - partial;
  const pct     = total > 0 ? Math.round(((paid + partial) / total) * 100) : 0;
  const circ    = 2 * Math.PI * 45; // 283

  const paidDash    = total > 0 ? (paid / total) * circ : 0;
  const partialDash = total > 0 ? (partial / total) * circ : 0;

  const dp = document.getElementById('donutPaid');
  const dpr = document.getElementById('donutPartial');

  if (dp) { dp.style.strokeDasharray = `${paidDash.toFixed(1)} ${circ}`; }
  if (dpr) {
    dpr.style.strokeDasharray = `${partialDash.toFixed(1)} ${circ}`;
    dpr.style.strokeDashoffset = `-${paidDash.toFixed(1)}`;
    dpr.setAttribute('transform', `rotate(-90 60 60)`);
  }

  setText('donutPct',       `${pct}%`);
  setText('legendPaid',     formatCurrency(paid));
  setText('legendPartial',  formatCurrency(partial));
  setText('legendUnpaid',   formatCurrency(Math.max(0, unpaid)));
}

function renderStatusBars() {
  const total = projects.length || 1;
  const counts = {
    active: projects.filter(p => p.status === 'active').length,
    inprogress: projects.filter(p => p.status === 'in-progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    onhold: projects.filter(p => p.status === 'on-hold').length
  };

  Object.keys(counts).forEach(k => {
    const el = document.getElementById(`bar-${k}`);
    const cnt = document.getElementById(`count-${k}`);
    if (el) el.style.width = `${Math.round((counts[k] / total) * 100)}%`;
    if (cnt) cnt.textContent = counts[k];
  });
}

function renderWorkloadBars() {
  const roles = { dev: 0, editor: 0, creator: 0, designer: 0, social: 0 };
  projects.forEach(p => {
    if (p.team.dev.enabled)     roles.dev++;
    if (p.team.editor.enabled)  roles.editor++;
    if (p.team.creator.enabled) roles.creator++;
    if (p.team.designer.enabled)roles.designer++;
    if (p.team.social.enabled)  roles.social++;
  });

  const max = Math.max(...Object.values(roles), 1);
  Object.keys(roles).forEach(r => {
    const bar = document.getElementById(`wb-${r}`);
    const cnt = document.getElementById(`wc-${r}`);
    if (bar) bar.style.width = `${Math.round((roles[r] / max) * 100)}%`;
    if (cnt) cnt.textContent = roles[r];
  });
}

// ── PROJECTS RENDER ────────────────────────────────
function renderProjects() {
  const grid  = document.getElementById('projectsGrid');
  const empty = document.getElementById('projectsEmpty');

  let filtered = getFilteredProjects();

  if (!filtered.length) {
    grid.innerHTML  = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = filtered.map(p => buildProjectCard(p)).join('');
}

function getFilteredProjects() {
  let list = [...projects];
  if (currentFilter !== 'all') list = list.filter(p => p.status === currentFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(p =>
      p.projectName.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q)
    );
  }
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function buildProjectCard(p) {
  const status     = STATUS_LABELS[p.status] || STATUS_LABELS['active'];
  const payStatus  = getPayStatus(p);
  const payPct     = p.totalPrice > 0 ? Math.min(100, Math.round((p.amountPaid / p.totalPrice) * 100)) : 0;
  const payColor   = payStatus === 'paid' ? '#10b981' : payStatus === 'partial' ? '#f59e0b' : '#ef4444';
  const teamChips  = buildTeamChips(p.team);
  const outstanding = Math.max(0, (parseFloat(p.totalPrice) || 0) - (parseFloat(p.amountPaid) || 0));

  return `
  <div class="project-card" onclick="openDetailModal('${p.id}')">
    <div class="project-card-top">
      <div class="project-type-badge">${getTypeEmoji(p.type)} ${esc(p.type)}</div>
      <div class="project-card-actions" onclick="event.stopPropagation()">
        <button class="card-action-btn" title="Edit" onclick="openProjectModal('${p.id}')"><i class="ri-edit-fill"></i></button>
        <button class="card-action-btn delete" title="Delete" onclick="openDeleteModal('${p.id}')"><i class="ri-delete-bin-5-fill"></i></button>
      </div>
    </div>
    <div class="project-card-body">
      <span class="project-type-emoji">${getTypeEmoji(p.type)}</span>
      <div class="project-card-name">${esc(p.projectName)}</div>
      <div class="project-card-client"><i class="ri-user-3-line"></i> ${esc(p.clientName)}</div>
      <div class="project-card-meta">
        ${p.startDate ? `<span><i class="ri-calendar-line"></i>${formatDate(p.startDate)}</span>` : ''}
        ${p.deadline  ? `<span><i class="ri-calendar-close-line"></i>${formatDate(p.deadline)}</span>` : ''}
        <span><i class="ri-signal-wifi-fill" style="color:${payColor}"></i>${payBadgeLabel(payStatus)}</span>
      </div>
      <div class="project-team-chips">${teamChips}</div>
      <div class="project-card-footer">
        <div class="payment-mini">
          <div class="payment-mini-label">Payment Progress</div>
          <div class="payment-mini-bar-track">
            <div class="payment-mini-bar-fill" style="background:${payColor};width:${payPct}%"></div>
          </div>
          <div class="payment-mini-values">
            ${formatCurrency(p.amountPaid || 0)} <small>/ ${formatCurrency(p.totalPrice || 0)}</small>
          </div>
        </div>
        <span class="status-badge ${status.cls}">${status.label}</span>
      </div>
    </div>
  </div>`;
}

function buildTeamChips(team) {
  const roles = [
    { key: 'dev',     emoji: '💻', label: 'Dev'      },
    { key: 'editor',  emoji: '✏️', label: 'Editor'   },
    { key: 'creator', emoji: '🎬', label: 'Creator'  },
    { key: 'designer',emoji: '🎨', label: 'Designer' },
    { key: 'social',  emoji: '📱', label: 'Social'   }
  ];
  return roles
    .filter(r => team[r.key] && team[r.key].enabled)
    .map(r => `<span class="team-chip">${r.emoji} ${r.label}</span>`)
    .join('');
}

function filterProjects(filter, btn) {
  currentFilter = filter;
  if (btn) {
    document.querySelectorAll('#filterTabs .filter-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
  }
  renderProjects();
}

// ── PAYMENTS TABLE ─────────────────────────────────
function renderPaymentsTable() {
  const tbody = document.getElementById('paymentTableBody');
  let list = [...projects];

  if (currentPayFilter !== 'all') {
    list = list.filter(p => getPayStatus(p) === currentPayFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(p =>
      p.projectName.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q)
    );
  }

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:40px">No payment records found</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const total       = parseFloat(p.totalPrice)  || 0;
    const paid        = parseFloat(p.amountPaid)   || 0;
    const outstanding = Math.max(0, total - paid);
    const payStatus   = getPayStatus(p);
    const payBadge    = `<span class="pay-badge pay-${payStatus}">${payBadgeLabel(payStatus)}</span>`;

    return `
    <tr onclick="openDetailModal('${p.id}')">
      <td class="project-name-cell">${getTypeEmoji(p.type)} ${esc(p.projectName)}</td>
      <td>${esc(p.clientName)}</td>
      <td class="amount-cell">${formatCurrency(total)}</td>
      <td class="amount-cell" style="color:var(--green)">${formatCurrency(paid)}</td>
      <td class="outstanding-cell">${outstanding > 0 ? formatCurrency(outstanding) : '<span style="color:var(--green)">Clear ✅</span>'}</td>
      <td>${payBadge}</td>
      <td onclick="event.stopPropagation()">
        <button class="table-btn" onclick="openProjectModal('${p.id}')"><i class="ri-edit-fill"></i> Edit</button>
      </td>
    </tr>`;
  }).join('');
}

function filterPayments(filter, btn) {
  currentPayFilter = filter;
  document.querySelectorAll('#section-payments .filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderPaymentsTable();
}

// ── TEAM RENDER ────────────────────────────────────
function renderTeam() {
  const roleMap = {
    dev:     { countId: 'team-dev-count',     listId: 'team-dev-projects'     },
    editor:  { countId: 'team-editor-count',  listId: 'team-editor-projects'  },
    creator: { countId: 'team-creator-count', listId: 'team-creator-projects' },
    designer:{ countId: 'team-designer-count',listId: 'team-designer-projects'},
    social:  { countId: 'team-social-count',  listId: 'team-social-projects'  }
  };

  Object.keys(roleMap).forEach(role => {
    const roleProjects = projects.filter(p => p.team[role] && p.team[role].enabled);
    const { countId, listId } = roleMap[role];
    setText(countId, `${roleProjects.length} Project${roleProjects.length !== 1 ? 's' : ''}`);

    const list = document.getElementById(listId);
    if (!roleProjects.length) {
      list.innerHTML = `<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:12px">No projects assigned</div>`;
      return;
    }
    list.innerHTML = roleProjects.map(p => `
      <div class="team-project-pill" onclick="openDetailModal('${p.id}')">
        <span class="team-project-pill-name">${getTypeEmoji(p.type)} ${esc(p.projectName)}</span>
        <span class="team-project-pill-person">${esc(p.team[role].name || '—')}</span>
      </div>`).join('');
  });
}

// ── MODAL: ADD / EDIT PROJECT ─────────────────────
function openProjectModal(id) {
  editingId = id || null;
  paymentLogEntries = [];

  const modal = document.getElementById('projectModal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (id) {
    // Edit mode
    const p = projects.find(x => x.id === id);
    if (!p) return;
    document.getElementById('modalTitle').textContent = 'Edit Project';
    document.getElementById('modalSub').textContent   = `Editing: ${p.projectName}`;
    populateForm(p);
  } else {
    // New mode
    document.getElementById('modalTitle').textContent = 'New Project';
    document.getElementById('modalSub').textContent   = 'Fill in the project details below';
    document.getElementById('projectForm').reset();
    resetTeamToggles();
    setDefaultDate();
    updatePaymentPreview();
    renderPaymentLogUI();
  }
}

function populateForm(p) {
  document.getElementById('projectId').value     = p.id;
  document.getElementById('clientName').value    = p.clientName;
  document.getElementById('projectName').value   = p.projectName;
  document.getElementById('projectType').value   = p.type;
  document.getElementById('projectStatus').value = p.status;
  document.getElementById('startDate').value     = p.startDate;
  document.getElementById('deadline').value      = p.deadline || '';
  document.getElementById('projectNotes').value  = p.notes || '';
  document.getElementById('totalPrice').value    = p.totalPrice || 0;
  document.getElementById('amountPaid').value    = p.amountPaid || 0;

  // Team
  const roles = ['dev', 'editor', 'creator', 'designer', 'social'];
  roles.forEach(role => {
    const t = p.team[role] || {};
    const checkbox = document.getElementById(`has${cap(role)}`);
    checkbox.checked = t.enabled || false;
    toggleRole(role);
    if (t.enabled) {
      const nameField = document.getElementById(`${role}Name`);
      const taskField = document.getElementById(`${role}Task`);
      if (nameField) nameField.value = t.name || '';
      if (taskField) taskField.value = t.task || '';
    }
  });

  // Payment log
  paymentLogEntries = p.paymentLog ? [...p.paymentLog] : [];
  renderPaymentLogUI();
  updatePaymentPreview();
}

function closeProjectModal() {
  document.getElementById('projectModal').classList.remove('open');
  document.body.style.overflow = '';
  editingId = null;
}

function resetTeamToggles() {
  ['dev', 'editor', 'creator', 'designer', 'social'].forEach(role => {
    const cb = document.getElementById(`has${cap(role)}`);
    if (cb) cb.checked = false;
    const body = document.getElementById(`${role}Body`);
    if (body) body.style.display = 'none';
  });
}

function toggleRole(role) {
  const cb   = document.getElementById(`has${cap(role)}`);
  const body = document.getElementById(`${role}Body`);
  if (body) body.style.display = cb.checked ? 'block' : 'none';
}

// ── SAVE PROJECT ───────────────────────────────────
function saveProject(e) {
  e.preventDefault();

  const totalPrice  = parseFloat(document.getElementById('totalPrice').value) || 0;
  const amountPaid  = parseFloat(document.getElementById('amountPaid').value) || 0;

  const project = {
    id:          editingId || genId(),
    clientName:  document.getElementById('clientName').value.trim(),
    projectName: document.getElementById('projectName').value.trim(),
    type:        document.getElementById('projectType').value,
    status:      document.getElementById('projectStatus').value,
    startDate:   document.getElementById('startDate').value,
    deadline:    document.getElementById('deadline').value,
    notes:       document.getElementById('projectNotes').value.trim(),
    totalPrice,
    amountPaid,
    paymentLog:  paymentLogEntries.filter(e => e.amount),
    team: {
      dev:     getTeamRole('dev'),
      editor:  getTeamRole('editor'),
      creator: getTeamRole('creator'),
      designer:getTeamRole('designer'),
      social:  getTeamRole('social')
    },
    createdAt: editingId
      ? (projects.find(p => p.id === editingId)?.createdAt || new Date().toISOString())
      : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (editingId) {
    const idx = projects.findIndex(p => p.id === editingId);
    if (idx !== -1) projects[idx] = project;
    showToast('Project updated successfully!', 'success', '✅');
  } else {
    projects.push(project);
    showToast('Project created successfully!', 'success', '🚀');
  }

  saveProjects();
  closeProjectModal();
  refreshAll();
}

function getTeamRole(role) {
  const enabled = document.getElementById(`has${cap(role)}`)?.checked || false;
  return {
    enabled,
    name: document.getElementById(`${role}Name`)?.value.trim() || '',
    task: document.getElementById(`${role}Task`)?.value.trim() || ''
  };
}

// ── PAYMENT PREVIEW ────────────────────────────────
function updatePaymentPreview() {
  const total  = parseFloat(document.getElementById('totalPrice')?.value) || 0;
  const paid   = parseFloat(document.getElementById('amountPaid')?.value) || 0;
  const outstanding = Math.max(0, total - paid);
  const pct    = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  let status, cls;
  if (paid >= total && total > 0) { status = '✅ Paid';    cls = 'pay-paid'; }
  else if (paid > 0)              { status = '🟡 Partial'; cls = 'pay-partial'; }
  else                            { status = '🔴 Unpaid';  cls = 'pay-unpaid'; }

  const ppOutstanding = document.getElementById('pp-outstanding');
  const ppBadge       = document.getElementById('pp-badge');
  const ppProgress    = document.getElementById('pp-progress');
  const ppPct         = document.getElementById('pp-pct');

  if (ppOutstanding) ppOutstanding.textContent = formatCurrency(outstanding);
  if (ppBadge)       { ppBadge.textContent = status; ppBadge.className = `pp-badge ${cls}`; }
  if (ppProgress)    ppProgress.style.width = `${pct}%`;
  if (ppPct)         ppPct.textContent = `${pct}% collected`;
}

// ── PAYMENT LOG ────────────────────────────────────
function addPaymentEntry() {
  paymentLogEntries.push({ date: new Date().toISOString().slice(0, 10), amount: '', note: '' });
  renderPaymentLogUI();
}

function removePaymentEntry(i) {
  paymentLogEntries.splice(i, 1);
  renderPaymentLogUI();
}

function renderPaymentLogUI() {
  const list = document.getElementById('paymentLogList');
  if (!list) return;

  if (!paymentLogEntries.length) {
    list.innerHTML = `<div class="payment-log-empty">No payment entries yet</div>`;
    return;
  }

  list.innerHTML = paymentLogEntries.map((entry, i) => `
    <div class="payment-log-entry">
      <input type="date" class="form-input" value="${entry.date || ''}" onchange="updateLogEntry(${i},'date',this.value)">
      <input type="number" class="form-input" placeholder="Amount ($)" value="${entry.amount || ''}" onchange="updateLogEntry(${i},'amount',this.value)" min="0" step="0.01">
      <input type="text" class="form-input" placeholder="Note (e.g. 1st installment)" value="${esc(entry.note || '')}" oninput="updateLogEntry(${i},'note',this.value)">
      <button type="button" class="remove-entry-btn" onclick="removePaymentEntry(${i})" title="Remove"><i class="ri-delete-bin-5-line"></i></button>
    </div>`).join('');
}

function updateLogEntry(i, field, val) {
  if (paymentLogEntries[i]) paymentLogEntries[i][field] = val;
}

// ── DETAIL MODAL ───────────────────────────────────
let currentDetailId = null;

function openDetailModal(id) {
  const p = projects.find(x => x.id === id);
  if (!p) return;
  currentDetailId = id;

  document.getElementById('detailProjectName').textContent = p.projectName;
  document.getElementById('detailClientName').textContent  = p.clientName;
  document.getElementById('detailTypeIcon').textContent    = getTypeEmoji(p.type);

  const body = document.getElementById('detailModalBody');
  const total       = parseFloat(p.totalPrice) || 0;
  const paid        = parseFloat(p.amountPaid)  || 0;
  const outstanding = Math.max(0, total - paid);
  const pct         = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const payStatus   = getPayStatus(p);
  const status      = STATUS_LABELS[p.status] || STATUS_LABELS['active'];
  const payColor    = payStatus === 'paid' ? '#10b981' : payStatus === 'partial' ? '#f59e0b' : '#ef4444';

  // Build team section
  const teamRoles = [
    { key: 'dev',     emoji: '💻', label: 'Developer'         },
    { key: 'editor',  emoji: '✏️', label: 'Content Editor'    },
    { key: 'creator', emoji: '🎬', label: 'Content Creator'   },
    { key: 'designer',emoji: '🎨', label: 'Graphic Designer'  },
    { key: 'social',  emoji: '📱', label: 'Social Media Mgr'  }
  ];

  const teamHTML = teamRoles
    .filter(r => p.team[r.key]?.enabled)
    .map(r => `
      <div class="detail-team-role">
        <div class="detail-team-emoji">${r.emoji}</div>
        <div class="detail-team-info">
          <div class="detail-team-role-name">${r.label}</div>
          <div class="detail-team-person">${esc(p.team[r.key].name || 'Not specified')}</div>
          ${p.team[r.key].task ? `<div class="detail-team-task">${esc(p.team[r.key].task)}</div>` : ''}
        </div>
      </div>`).join('') || `<div style="color:var(--text-muted);font-size:13px">No team assigned</div>`;

  // Payment log
  const logHTML = p.paymentLog && p.paymentLog.length
    ? `<table class="detail-log-table">
        <thead><tr><th>Date</th><th>Amount</th><th>Note</th></tr></thead>
        <tbody>
          ${p.paymentLog.map(e => `
            <tr>
              <td>${formatDate(e.date)}</td>
              <td style="color:var(--green);font-weight:700">${formatCurrency(e.amount)}</td>
              <td style="color:var(--text-muted)">${esc(e.note || '—')}</td>
            </tr>`).join('')}
        </tbody>
       </table>`
    : `<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:12px">No payment history</div>`;

  body.innerHTML = `
    <div class="detail-grid">
      <div class="detail-block">
        <div class="detail-block-title"><i class="ri-information-fill"></i> Project Info</div>
        <div class="detail-row">
          <span class="detail-row-label">Type</span>
          <span class="detail-row-val">${getTypeEmoji(p.type)} ${esc(p.type)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-row-label">Status</span>
          <span class="status-badge ${status.cls}">${status.label}</span>
        </div>
        <div class="detail-row">
          <span class="detail-row-label">Start Date</span>
          <span class="detail-row-val">${p.startDate ? formatDate(p.startDate) : '—'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-row-label">Deadline</span>
          <span class="detail-row-val">${p.deadline ? formatDate(p.deadline) : '—'}</span>
        </div>
        ${p.notes ? `<div class="detail-row" style="flex-direction:column;align-items:flex-start;gap:4px">
          <span class="detail-row-label">Notes</span>
          <span class="detail-row-val" style="font-weight:400;color:var(--text-secondary)">${esc(p.notes)}</span>
        </div>` : ''}
      </div>

      <div class="detail-block">
        <div class="detail-block-title"><i class="ri-team-fill"></i> Team</div>
        <div class="detail-team-grid">${teamHTML}</div>
      </div>
    </div>

    <div class="detail-payment-summary">
      <div class="detail-block-title"><i class="ri-money-dollar-circle-fill"></i> Payment Summary</div>
      <div class="payment-mini-bar-track" style="height:8px;max-width:100%;margin-bottom:8px">
        <div class="payment-mini-bar-fill" style="background:${payColor};width:${pct}%;height:100%"></div>
      </div>
      <div style="text-align:right;font-size:11px;color:var(--text-muted);margin-bottom:12px">${pct}% collected</div>
      <div class="detail-payment-bars">
        <div class="detail-pay-stat">
          <div class="dps-val">${formatCurrency(total)}</div>
          <div class="dps-label">Total Contract</div>
        </div>
        <div class="detail-pay-stat">
          <div class="dps-val" style="color:var(--green)">${formatCurrency(paid)}</div>
          <div class="dps-label">Amount Paid</div>
        </div>
        <div class="detail-pay-stat">
          <div class="dps-val" style="color:${outstanding > 0 ? 'var(--red)' : 'var(--green)'}">${outstanding > 0 ? formatCurrency(outstanding) : 'Clear ✅'}</div>
          <div class="dps-label">Outstanding</div>
        </div>
      </div>
    </div>

    <div class="detail-block" style="margin-top:0">
      <div class="detail-block-title"><i class="ri-history-line"></i> Payment History</div>
      ${logHTML}
    </div>
  `;

  document.getElementById('detailModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function editFromDetail() {
  closeDetailModal();
  setTimeout(() => openProjectModal(currentDetailId), 100);
}

function closeDetailModal() {
  document.getElementById('detailModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ── DELETE MODAL ───────────────────────────────────
function openDeleteModal(id) {
  deleteTargetId = id;
  const p = projects.find(x => x.id === id);
  if (!p) return;
  document.getElementById('deleteProjectName').textContent = p.projectName;
  document.getElementById('deleteModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('open');
  document.body.style.overflow = '';
  deleteTargetId = null;
}

function confirmDelete() {
  if (!deleteTargetId) return;
  projects = projects.filter(p => p.id !== deleteTargetId);
  saveProjects();
  closeDeleteModal();
  refreshAll();
  showToast('Project deleted successfully', 'info', '🗑️');
}

// ── SEARCH ─────────────────────────────────────────
function handleSearch(q) {
  searchQuery = q.trim();
  if (currentSection === 'projects')  renderProjects();
  if (currentSection === 'payments')  renderPaymentsTable();
  if (currentSection === 'dashboard') renderDashboard();
}

// ── CLOSE ON BACKDROP ──────────────────────────────
function closeOnBackdrop(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
    if (e.target.id === 'requestModal') {
      currentRequestId = null;
      renderRequests();
    }
  }
}

// ── MOBILE SIDEBAR ─────────────────────────────────
function toggleMobileSidebar() {
  document.querySelector('.sidebar').classList.toggle('mobile-open');
}

// ── EXPORT ─────────────────────────────────────────
function exportData() {
  const data = JSON.stringify(projects, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `vortxa-projects-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully!', 'success', '📥');
}

// ── TOAST ──────────────────────────────────────────
function showToast(msg, type = 'info', icon = 'ℹ️') {
  const container = document.getElementById('toastContainer');
  const toast     = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ── HELPERS ────────────────────────────────────────
function genId() {
  return 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

function getTypeEmoji(type) {
  return PROJECT_TYPES[type] || '🔷';
}

function getPayStatus(p) {
  const total = parseFloat(p.totalPrice) || 0;
  const paid  = parseFloat(p.amountPaid)  || 0;
  if (total === 0)     return 'unpaid';
  if (paid >= total)   return 'paid';
  if (paid > 0)        return 'partial';
  return 'unpaid';
}

function payBadgeLabel(status) {
  return { paid: '✅ Paid', partial: '🟡 Partial', unpaid: '🔴 Unpaid' }[status] || 'Unknown';
}

function formatCurrency(val) {
  const n = parseFloat(val) || 0;
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function setDefaultDate() {
  const today = new Date().toISOString().slice(0, 10);
  const sd = document.getElementById('startDate');
  if (sd) sd.value = today;
}


/* ══════════════════════════════════════════════════
   CLIENT REQUESTS ENGINE
══════════════════════════════════════════════════ */

let requests          = [];
let currentReqFilter  = 'all';
let currentRequestId  = null;
let quoteRowData      = [];   // [{ serviceName, deliverables, price }]

const REQ_STATUS = {
  'new':       { label: '🔴 New',        cls: 'req-new'       },
  'in-review': { label: '🔵 In Review',  cls: 'req-in-review' },
  'quoted':    { label: '🟡 Quoted',     cls: 'req-quoted'    },
  'confirmed': { label: '✅ Confirmed',  cls: 'req-confirmed' },
  'rejected':  { label: '❌ Rejected',   cls: 'req-rejected'  }
};

// ── Storage ──
function getDemoRequests() {
  return [
    {
      id: 'req_demo_1',
      status: 'new',
      createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      client: {
        name: 'كريم الشناوي (Karim El-Shennawy)',
        phone: '01012345678',
        email: 'karim@elpatio-eg.com',
        company: 'El Patio Eateries'
      },
      services: [
        { name: 'Website Development', pillar: '💻 Digital' },
        { name: 'Meta Ads (FB & IG)', pillar: '📱 Marketing' },
        { name: 'Reels & Short-Form', pillar: '🎥 Content' }
      ],
      budget: '15,000 – 50,000 جنيه',
      timeline: 'خلال شهر (Within 1 month)',
      notes: 'نحتاج موقع سريع لعرض الفروع وقائمة الطعام + حملة إعلانات ممولة على إنستجرام وتيك توك مع 8 فيديوهات ريلز للمنتجات الجديدة.',
      quote: {
        items: [
          { serviceName: 'Website Development', deliverables: 'موقع ديناميكي 5 صفحات + منيو تفاعلي + ربط جوجل مابس', price: 18000 },
          { serviceName: 'Meta Ads (FB & IG)', deliverables: 'إدارة حملات لشهر كامل + 6 تصميمات إعلانية + تقرير أسبوعي', price: 7000 },
          { serviceName: 'Reels & Short-Form', deliverables: '8 فيديوهات ريلز وتيك توك (تصوير + مونتاج + سكريبت)', price: 12000 }
        ],
        adminNotes: 'دفعة أولى 50% عند التعاقد والباقي 50% بعد التسليم والمراجعة النهائية.',
        totalPrice: 37000,
        sentAt: null
      }
    },
    {
      id: 'req_demo_2',
      status: 'quoted',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      client: {
        name: 'مريم عثمان (Mariam Othman)',
        phone: '01123456789',
        email: 'mariam@bloomstudio.net',
        company: 'Bloom Fashion Studio'
      },
      services: [
        { name: 'Brand Strategy', pillar: '⚡ Strategy' },
        { name: 'Visual Identity & Logo', pillar: '⚡ Strategy' },
        { name: 'Social Media Management', pillar: '📱 Marketing' }
      ],
      budget: '50,000 – 150,000 جنيه',
      timeline: 'خلال 3 أشهر (Within 3 months)',
      notes: 'إعادة إطلاق الهوية البصرية للبراند بالكامل مع إدارة حسابات السوشيال ميديا لمدة 3 شهور.',
      quote: {
        items: [
          { serviceName: 'Brand Strategy', deliverables: 'دراسة السوق والمنافسين وتحديد التموضع واستراتيجية البراند', price: 15000 },
          { serviceName: 'Visual Identity & Logo', deliverables: 'لوجو كامل + دليل الهوية البصرية Brand Guidelines + التصاميم المطبوعة', price: 20000 },
          { serviceName: 'Social Media Management', deliverables: 'إدارة شهرية (20 بوست + 30 ستوري شهرياً)', price: 12000 }
        ],
        adminNotes: 'مدة تنفيذ استراتيجية البراند والهوية 4 أسابيع.',
        totalPrice: 47000,
        sentAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
      }
    }
  ];
}

function loadRequests() {
  try {
    const raw = localStorage.getItem('vortxa_requests');
    if (!raw) {
      requests = getDemoRequests();
      saveRequests();
    } else {
      requests = JSON.parse(raw);
    }
  } catch {
    requests = [];
  }
}

function saveRequests() {
  localStorage.setItem('vortxa_requests', JSON.stringify(requests));
}

function updateRequestBadge() {
  loadRequests();
  const newCount = requests.filter(r => r.status === 'new').length;
  const badge = document.getElementById('requestsBadge');
  if (!badge) return;
  badge.textContent = newCount;
  badge.style.display = newCount > 0 ? '' : 'none';
  // Also flash notification dot if there are new requests
  const notifDot = document.getElementById('notifDot');
  if (notifDot && newCount > 0) notifDot.style.display = '';
}

// ── Render Requests Grid ──
function renderRequests() {
  loadRequests();
  const grid  = document.getElementById('requestsGrid');
  const empty = document.getElementById('requestsEmpty');
  if (!grid) return;

  let filtered = [...requests];
  if (currentReqFilter !== 'all') {
    filtered = filtered.filter(r => r.status === currentReqFilter);
  }

  if (!filtered.length) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = filtered.map(r => buildRequestCard(r)).join('');
}

function buildRequestCard(req) {
  const st      = REQ_STATUS[req.status] || REQ_STATUS['new'];
  const date    = new Date(req.createdAt);
  const timeStr = date.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) +
                  ' ' + date.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
  const svcCount = req.services ? req.services.length : 0;
  const svcPills = (req.services || []).slice(0, 4)
    .map(s => `<span class="req-svc-pill">${esc(s.name)}</span>`).join('');
  const hasMore  = svcCount > 4 ? `<span class="req-svc-pill req-svc-more">+${svcCount - 4} more</span>` : '';
  const total    = req.quote && req.quote.totalPrice ? req.quote.totalPrice.toLocaleString() + ' EGP' : '—';

  return `
  <div class="req-card req-card-${req.status}" onclick="openRequestModal('${req.id}')">
    <div class="req-card-top">
      <span class="req-card-status ${st.cls}">${st.label}</span>
      <span class="req-card-time">${timeStr}</span>
    </div>
    <div class="req-card-client">
      <div class="req-card-avatar"><i class="ri-user-3-fill"></i></div>
      <div>
        <div class="req-card-name">${esc(req.client.name)}</div>
        <div class="req-card-phone"><i class="ri-whatsapp-line"></i> ${esc(req.client.phone)}</div>
      </div>
    </div>
    <div class="req-card-services">${svcPills}${hasMore}</div>
    <div class="req-card-footer">
      <span><i class="ri-service-fill"></i> ${svcCount} service${svcCount !== 1 ? 's' : ''}</span>
      ${total !== '—' ? `<span class="req-card-price"><i class="ri-money-dollar-circle-line"></i> ${total}</span>` : ''}
      ${req.client.budget ? `<span><i class="ri-wallet-3-line"></i> ${esc(req.client.budget)}</span>` : ''}
    </div>
  </div>`;
}

function filterRequests(filter, btn) {
  currentReqFilter = filter;
  document.querySelectorAll('#reqFilterTabs .filter-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderRequests();
}

function clearAllRequests() {
  if (!confirm('Delete ALL client requests? This cannot be undone.')) return;
  requests = [];
  saveRequests();
  renderRequests();
  updateRequestBadge();
  showToast('All requests cleared', 'info', '🗑️');
}

// ── Request Review Modal ──
function openRequestModal(id) {
  loadRequests();
  const req = requests.find(r => r.id === id);
  if (!req) return;
  currentRequestId = id;

  // Mark as in-review if new
  if (req.status === 'new') {
    req.status = 'in-review';
    saveRequests();
    updateRequestBadge();
  }

  // Header
  const st = REQ_STATUS[req.status] || REQ_STATUS['new'];
  document.getElementById('reqModalTitle').textContent = req.client.name + (req.client.company ? ' — ' + req.client.company : '');
  document.getElementById('reqModalSub').textContent   = 'Received: ' + new Date(req.createdAt).toLocaleString('en-GB');
  const badge = document.getElementById('reqStatusBadge');
  badge.textContent  = st.label;
  badge.className    = 'req-status-badge ' + st.cls;

  // Status selector
  const sel = document.getElementById('reqStatusSelect');
  if (sel) sel.value = req.status;

  // Client info panel
  const infoRows = [
    { icon: 'ri-user-3-fill',        label: 'Name',    val: req.client.name    },
    { icon: 'ri-whatsapp-line',      label: 'WhatsApp',val: req.client.phone   },
    { icon: 'ri-mail-fill',          label: 'Email',   val: req.client.email   },
    { icon: 'ri-building-2-fill',    label: 'Company', val: req.client.company },
  ].filter(r => r.val);

  document.getElementById('reqClientInfo').innerHTML = infoRows.map(r =>
    `<div class="req-info-row">
       <span class="req-info-icon"><i class="${r.icon}"></i></span>
       <div>
         <div class="req-info-label">${r.label}</div>
         <div class="req-info-val">${esc(r.val)}</div>
       </div>
     </div>`
  ).join('');

  // Services list
  const byPillar = {};
  (req.services || []).forEach(s => {
    if (!byPillar[s.pillar]) byPillar[s.pillar] = [];
    byPillar[s.pillar].push(s.name);
  });
  document.getElementById('reqServicesList').innerHTML = Object.entries(byPillar).map(([pillar, svcs]) =>
    `<div class="req-pillar-block">
       <div class="req-pillar-label">${esc(pillar)}</div>
       ${svcs.map(s => `<div class="req-svc-item"><i class="ri-checkbox-circle-fill" style="color:#10b981"></i> ${esc(s)}</div>`).join('')}
     </div>`
  ).join('');

  // Details block
  const details = [
    { icon: 'ri-wallet-3-fill',     label: 'Budget',   val: req.budget   },
    { icon: 'ri-time-fill',         label: 'Timeline', val: req.timeline },
    { icon: 'ri-chat-4-fill',       label: 'Notes',    val: req.notes    },
  ].filter(d => d.val);
  document.getElementById('reqDetailsBlock').innerHTML = details.map(d =>
    `<div class="req-detail-row">
       <span class="req-info-label"><i class="${d.icon}"></i> ${d.label}</span>
       <span class="req-info-val">${esc(d.val)}</span>
     </div>`
  ).join('') || '<div style="color:var(--text-muted);font-size:13px">No additional details provided</div>';

  // Quote table
  quoteRowData = (req.services || []).map(s => {
    const existing = req.quote && req.quote.items ? req.quote.items.find(i => i.serviceName === s.name) : null;
    return {
      serviceName:  s.name,
      pillar:       s.pillar,
      deliverables: existing ? existing.deliverables : '',
      price:        existing ? existing.price : ''
    };
  });

  renderQuoteTable();

  // Admin notes
  const notesEl = document.getElementById('reqAdminNotes');
  if (notesEl) notesEl.value = (req.quote && req.quote.adminNotes) || '';

  document.getElementById('requestModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeRequestModal() {
  document.getElementById('requestModal').classList.remove('open');
  document.body.style.overflow = '';
  currentRequestId = null;
  renderRequests();
}

// ── Quote Table ──
function renderQuoteTable() {
  const tbody = document.getElementById('quoteTableBody');
  if (!tbody) return;
  tbody.innerHTML = quoteRowData.map((row, i) => `
    <tr class="quote-row">
      <td>
        <div class="quote-svc-name">${esc(row.serviceName)}</div>
        <div class="quote-svc-pillar">${esc(row.pillar)}</div>
      </td>
      <td>
        <input class="quote-input" type="text"
          placeholder="e.g. 15 posts, 4 videos, 5-page site..."
          value="${esc(row.deliverables)}"
          oninput="quoteRowData[${i}].deliverables=this.value">
      </td>
      <td>
        <input class="quote-input price-input" type="number"
          placeholder="0"
          value="${row.price || ''}"
          oninput="quoteRowData[${i}].price=parseFloat(this.value)||0;recalcTotal()">
      </td>
    </tr>`).join('');
  recalcTotal();
}

function recalcTotal() {
  const total = quoteRowData.reduce((s, r) => s + (parseFloat(r.price) || 0), 0);
  const el = document.getElementById('quoteTotalDisplay');
  if (el) el.textContent = total.toLocaleString() + ' EGP';
}

// ── Update Status ──
function updateReqStatus() {
  if (!currentRequestId) return;
  const sel = document.getElementById('reqStatusSelect');
  const req = requests.find(r => r.id === currentRequestId);
  if (!req || !sel) return;
  req.status = sel.value;
  const st = REQ_STATUS[req.status] || REQ_STATUS['new'];
  const badge = document.getElementById('reqStatusBadge');
  if (badge) { badge.textContent = st.label; badge.className = 'req-status-badge ' + st.cls; }
  saveRequests();
}

// ── Save Quote ──
function saveQuote() {
  if (!currentRequestId) return;
  const req = requests.find(r => r.id === currentRequestId);
  if (!req) return;

  const total = quoteRowData.reduce((s, r) => s + (parseFloat(r.price) || 0), 0);
  req.quote = {
    items:      quoteRowData.map(r => ({ serviceName: r.serviceName, deliverables: r.deliverables, price: parseFloat(r.price) || 0 })),
    adminNotes: (document.getElementById('reqAdminNotes')?.value || '').trim(),
    totalPrice: total,
    sentAt:     req.quote ? req.quote.sentAt : null
  };

  if (req.status === 'in-review') req.status = 'quoted';
  const sel = document.getElementById('reqStatusSelect');
  if (sel) sel.value = req.status;
  const st = REQ_STATUS[req.status];
  const badge = document.getElementById('reqStatusBadge');
  if (badge && st) { badge.textContent = st.label; badge.className = 'req-status-badge ' + st.cls; }

  saveRequests();
  showToast('Quote saved successfully!', 'success', '💾');
}

// ── Send Proposal via WhatsApp ──
function sendProposalWA() {
  if (!currentRequestId) return;
  const req = requests.find(r => r.id === currentRequestId);
  if (!req) return;

  // Auto-save quote first
  saveQuote();

  let phone = (req.client.phone || '').replace(/\D/g, '');
  if (phone.startsWith('0')) {
    phone = '2' + phone;
  } else if (!phone.startsWith('20') && phone.length === 10) {
    phone = '20' + phone;
  }

  const total = quoteRowData.reduce((s, r) => s + (parseFloat(r.price) || 0), 0);
  const adminNotes = (document.getElementById('reqAdminNotes')?.value || '').trim();

  const sep = '\u2501'.repeat(22);
  const lines = [
    '\uD83C\uDF1F vortxAgencie \u2014 Your Project Proposal',
    '\u0639\u0631\u0636 \u0645\u0634\u0631\u0648\u0639\u0643 \u0645\u0646 vortxAgencie',
    '',
    sep,
    '\uD83D\uDC4B Dear ' + req.client.name + ',',
    '\u0634\u0643\u0631\u064b\u0627 \u0644\u062a\u0648\u0627\u0635\u0644\u0643 \u0645\u0639\u0646\u0627 \u060c \u0625\u0644\u064a\u0643 \u0639\u0631\u0636\u0646\u0627 \u0628\u0646\u0627\u0621 \u0639\u0644\u0649 \u0637\u0644\u0628\u0643.',
    '',
    sep,
    '\uD83C\uDFAF SERVICES & PRICING / \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631',
    sep,
    ...quoteRowData.map(r =>
      '\u2705 ' + r.serviceName + '\n' +
      (r.deliverables ? '   \uD83D\uDCE6 ' + r.deliverables + '\n' : '') +
      '   \uD83D\uDCB0 ' + (parseFloat(r.price) || 0).toLocaleString() + ' EGP'
    ),
    '',
    sep,
    '\uD83D\uDCB0 TOTAL / \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a: ' + total.toLocaleString() + ' EGP',
    req.timeline ? '\u23F1 TIMELINE / \u0627\u0644\u0645\u062f\u0629: ' + req.timeline : '',
    '',
  ];

  if (adminNotes) {
    lines.push(sep);
    lines.push('\uD83D\uDCDD NOTES / \u0645\u0644\u0627\u062d\u0638\u0627\u062a:');
    lines.push(adminNotes);
    lines.push('');
  }

  lines.push(sep);
  lines.push('\uD83D\uDCDE \u0644\u0644\u062a\u0623\u0643\u064a\u062f \u060c \u0631\u062f \u0628\u0640 \u0646\u0639\u0645 / Reply YES to confirm');
  lines.push('\u2728 vortxAgencie \u2014 We Build Brands That Command');

  const msg = lines.filter(l => l !== '').join('\n');
  const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);

  window.open(url, '_blank');

  // Update sent timestamp
  const r = requests.find(x => x.id === currentRequestId);
  if (r && r.quote) r.quote.sentAt = new Date().toISOString();
  saveRequests();
  showToast('Proposal sent on WhatsApp!', 'success', '\uD83D\uDCF2');
}

// ── Confirm → Convert to Project ──
function confirmRequest() {
  if (!currentRequestId) return;
  const req = requests.find(r => r.id === currentRequestId);
  if (!req) return;

  saveQuote();
  const total = quoteRowData.reduce((s, r) => s + (parseFloat(r.price) || 0), 0);

  // Build services summary for notes
  const svcSummary = quoteRowData.map(r =>
    r.serviceName + (r.deliverables ? ': ' + r.deliverables : '') + (r.price ? ' (' + parseFloat(r.price).toLocaleString() + ' EGP)' : '')
  ).join('\n');

  const adminNotes = (document.getElementById('reqAdminNotes')?.value || '').trim();

  const project = {
    id:          'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    clientName:  req.client.name + (req.client.company ? ' (' + req.client.company + ')' : ''),
    projectName: (req.services && req.services.length ? req.services[0].name : 'New Project') +
                 (req.services && req.services.length > 1 ? ' + ' + (req.services.length - 1) + ' more' : ''),
    type:        detectProjectType(req.services),
    status:      'active',
    startDate:   new Date().toISOString().slice(0, 10),
    deadline:    '',
    notes:       '--- FROM CLIENT REQUEST ---\n' +
                 'Phone: ' + req.client.phone + '\n' +
                 (req.client.email ? 'Email: ' + req.client.email + '\n' : '') +
                 '\nServices:\n' + svcSummary +
                 (adminNotes ? '\n\nAdmin Notes:\n' + adminNotes : '') +
                 (req.notes ? '\n\nClient Notes:\n' + req.notes : ''),
    totalPrice:  total,
    amountPaid:  0,
    paymentLog:  [],
    team:        { dev: { enabled: false, name: '', task: '' }, editor: { enabled: false, name: '', task: '' }, creator: { enabled: false, name: '', task: '' }, designer: { enabled: false, name: '', task: '' }, social: { enabled: false, name: '', task: '' } },
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
    fromRequest: req.id
  };

  projects.push(project);
  saveProjects();

  // Mark request as confirmed
  req.status = 'confirmed';
  saveRequests();

  closeRequestModal();
  refreshAll();
  showToast(req.client.name + ' confirmed! Project created.', 'success', '\u2705');
}

function detectProjectType(services) {
  if (!services || !services.length) return 'Other';
  const names = services.map(s => (s.name || '').toLowerCase()).join(' ');
  if (names.includes('web') || names.includes('site') || names.includes('app')) return 'Web Development';
  if (names.includes('brand') || names.includes('logo') || names.includes('identity')) return 'Brand Identity';
  if (names.includes('video') || names.includes('production') || names.includes('creator')) return 'Content Production';
  if (names.includes('ads') || names.includes('meta') || names.includes('tiktok') || names.includes('campaign')) return 'Ad Campaigns';
  if (names.includes('social') || names.includes('media')) return 'Social Media Marketing';
  if (names.includes('seo') || names.includes('growth')) return 'SEO & Growth';
  return 'Full Package';
}

// Auto-load requests on init
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(updateRequestBadge, 100);
});

// ── Generate Printable Contract ──────────────────────────
function generateContract() {
  if (!currentRequestId) return;
  const req = requests.find(r => r.id === currentRequestId);
  if (!req) return;

  // Auto-save quote first
  saveQuote();

  const total    = quoteRowData.reduce((s, r) => s + (parseFloat(r.price) || 0), 0);
  const deposit  = total * 0.5;
  const finalPay = total * 0.5;
  const adminNotes = (document.getElementById('reqAdminNotes')?.value || '').trim();

  // Contract number: VX-YYYYMMDD-XXXX
  const now   = new Date();
  const pad   = n => String(n).padStart(2, '0');
  const cNum  = 'VX-' + now.getFullYear() + pad(now.getMonth()+1) + pad(now.getDate()) +
                '-' + Math.floor(1000 + Math.random() * 9000);
  const cDate = now.toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });

  // Fill header fields
  document.getElementById('c-number').textContent = cNum;
  document.getElementById('c-date').textContent   = cDate;

  // Fill client info
  document.getElementById('c-client-name').textContent    = req.client.name || '—';
  document.getElementById('c-client-company').textContent = req.client.company || '';
  document.getElementById('c-client-phone').textContent   = req.client.phone  || '';
  document.getElementById('c-client-email').textContent   = req.client.email  || '';
  document.getElementById('c-sig-client').textContent     = req.client.name   || '';

  // Fill services table
  const tbody = document.getElementById('c-services-body');
  tbody.innerHTML = '';
  if (quoteRowData.length > 0) {
    quoteRowData.forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align:center;color:#64748b;">${i + 1}</td>
        <td><strong>${row.serviceName || '—'}</strong></td>
        <td style="color:#475569;">${row.deliverables || '—'}</td>
        <td style="text-align:right;font-weight:600;">${(parseFloat(row.price)||0).toLocaleString()} EGP</td>
      `;
      tbody.appendChild(tr);
    });
  } else if (req.services && req.services.length) {
    // Fallback if no quote rows — use raw services
    req.services.forEach((svc, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align:center;color:#64748b;">${i + 1}</td>
        <td><strong>${svc.name || svc}</strong></td>
        <td style="color:#475569;">—</td>
        <td style="text-align:right;font-weight:600;">—</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Totals
  const fmt = n => n > 0 ? n.toLocaleString() + ' EGP' : '—';
  document.getElementById('c-total').textContent   = fmt(total);
  document.getElementById('c-total-2').textContent = fmt(total);
  document.getElementById('c-deposit').textContent = fmt(deposit);
  document.getElementById('c-final-pay').textContent = fmt(finalPay);

  // Admin notes
  const notesWrap = document.getElementById('c-admin-notes-wrap');
  if (adminNotes) {
    document.getElementById('c-admin-notes').textContent = adminNotes;
    notesWrap.style.display = 'block';
  } else {
    notesWrap.style.display = 'none';
  }

  // Timeline
  const timelineSection = document.getElementById('c-timeline-section');
  if (req.timeline) {
    document.getElementById('c-timeline').textContent = req.timeline;
    timelineSection.style.display = 'block';
  } else {
    timelineSection.style.display = 'none';
  }

  // Show overlay and scroll to top
  const overlay = document.getElementById('contract-overlay');
  overlay.style.display = 'flex';
  overlay.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeContract() {
  document.getElementById('contract-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

