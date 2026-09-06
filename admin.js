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
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed');
  });
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
  const titles = { dashboard: 'Dashboard', projects: 'Projects', payments: 'Payments', team: 'Team' };
  const subs   = { dashboard: 'Welcome back, Admin', projects: 'Manage all client projects', payments: 'Track payments & outstanding balances', team: 'Team workload overview' };
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
