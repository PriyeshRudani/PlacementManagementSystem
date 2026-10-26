'use strict';

const API = {
  students: '/api/students',
  dashboard: '/api/dashboard/statistics',
  placements: '/api/placement-records'
};

const state = { students: [], placements: [], stats: {}, activeView: 'dashboard' };
const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}
function initials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase();
}
function labelize(value) {
  return String(value || '—').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}
function badgeClass(value) {
  const normalized = String(value || '').toUpperCase().replace(/_/g, '-');
  if (normalized === 'PLACED' || normalized === 'OFFERED') return 'badge-placed';
  if (normalized === 'PENDING' || normalized === 'APPLIED') return 'badge-pending';
  if (normalized === 'IN-PROGRESS') return 'badge-in-progress';
  if (normalized === 'REJECTED') return 'badge-rejected';
  return 'badge-pending';
}
function formatPackage(value) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  return Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })} LPA` : escapeHtml(value);
}
function showToast(message, isError = false) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.toggle('toast-error', isError);
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 3400);
}
function showNotice(id, message, type = 'error') {
  const element = $(id);
  element.textContent = message;
  element.className = `notice ${type}`;
}
function hideNotice(id) { $(id).classList.add('hidden'); }

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  const contentType = response.headers.get('content-type') || '';
  const body = response.status === 204 ? null : (contentType.includes('application/json') ? await response.json() : await response.text());
  if (!response.ok) {
    let message = typeof body === 'string' ? body : (body?.message || body?.error || 'Request failed');
    if (response.status === 0) message = 'Cannot connect to the backend.';
    throw new Error(message || `Request failed (${response.status})`);
  }
  return body;
}
function setApiStatus(isOnline) {
  $('apiDot').className = `status-dot ${isOnline ? 'online' : 'offline'}`;
  $('apiStatus').textContent = isOnline ? 'Backend connected' : 'Backend unavailable';
}

async function loadDashboard() {
  try {
    const stats = await apiRequest(API.dashboard);
    state.stats = stats || {};
    $('statTotal').textContent = stats.totalStudents ?? 0;
    $('statPlaced').textContent = stats.placedStudents ?? 0;
    $('statPending').textContent = stats.pendingStudents ?? 0;
    $('statRecords').textContent = state.placements.length;
    renderPreferences(stats);
    hideNotice('dashboardNotice');
    setApiStatus(true);
  } catch (error) {
    setApiStatus(false);
    ['statTotal', 'statPlaced', 'statPending', 'statRecords'].forEach(id => $(id).textContent = '—');
    $('preferenceBreakdown').innerHTML = '<div class="empty-state compact">Dashboard data could not be loaded. Check that Spring Boot is running on port 3000.</div>';
    showNotice('dashboardNotice', `Dashboard request failed: ${error.message}. Make sure the Spring Boot application is running.`, 'error');
  }
}
function renderPreferences(stats) {
  const items = [
    ['Internship and placement', 'internshipAndPlacement'],
    ['Internship only', 'internshipOnly'],
    ['Placement only', 'placementOnly'],
    ['Own business', 'ownBusiness']
  ];
  const total = Number(stats.totalStudents || 0);
  $('preferenceBreakdown').innerHTML = items.map(([label, key]) => {
    const count = Number(stats[key] || 0);
    const width = total > 0 ? Math.min(100, count / total * 100) : 0;
    return `<div class="preference-row"><div class="preference-meta"><span>${escapeHtml(label)}</span><strong>${count}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${width}%"></div></div></div>`;
  }).join('');
}

async function loadStudents() {
  try {
    const result = await apiRequest(API.students);
    state.students = Array.isArray(result) ? result : [];
    renderStudents();
    renderRecentStudents();
    populateStudentSelect();
    hideNotice('studentsNotice');
    setApiStatus(true);
  } catch (error) {
    $('studentsBody').innerHTML = `<tr><td colspan="6" class="empty-state">Could not load students: ${escapeHtml(error.message)}</td></tr>`;
    $('recentStudentsBody').innerHTML = `<tr><td colspan="3" class="empty-state">Could not load students.</td></tr>`;
    showNotice('studentsNotice', `Student request failed: ${error.message}`, 'error');
    setApiStatus(false);
  }
}
function filteredStudents() {
  const query = $('studentSearch').value.trim().toLowerCase();
  const status = $('studentStatusFilter').value.toUpperCase();
  return state.students.filter(student => {
    const haystack = [student.name, student.enrollmentNo, student.email, student.branch, student.careerPreference].join(' ').toLowerCase();
    return (!query || haystack.includes(query)) && (!status || String(student.placementStatus || '').toUpperCase() === status);
  });
}
function renderStudents() {
  const students = filteredStudents();
  $('studentCount').textContent = `${students.length} student${students.length === 1 ? '' : 's'}`;
  if (!students.length) {
    $('studentsBody').innerHTML = `<tr><td colspan="6" class="empty-state">${state.students.length ? 'No students match your filters.' : 'No students yet. Add your first student to get started.'}</td></tr>`;
    return;
  }
  $('studentsBody').innerHTML = students.map(student => `<tr>
    <td><div class="student-cell"><div class="student-avatar">${escapeHtml(initials(student.name))}</div><div><div class="student-primary">${escapeHtml(student.name)}</div><div class="student-secondary">${escapeHtml(student.email)}</div></div></div></td>
    <td>${escapeHtml(student.enrollmentNo || '—')}</td><td>${escapeHtml(student.branch || '—')}</td>
    <td>${escapeHtml(labelize(student.careerPreference))}</td>
    <td><span class="badge ${badgeClass(student.placementStatus)}">${escapeHtml(labelize(student.placementStatus))}</span></td>
    <td><div class="action-buttons"><button class="small-action" data-edit-student="${escapeHtml(student.id)}">Edit</button><button class="small-action danger" data-delete-student="${escapeHtml(student.id)}">Delete</button></div></td>
  </tr>`).join('');
}
function renderRecentStudents() {
  const students = [...state.students].sort((a, b) => Number(b.id || 0) - Number(a.id || 0)).slice(0, 5);
  if (!students.length) {
    $('recentStudentsBody').innerHTML = '<tr><td colspan="3" class="empty-state">No students registered yet.</td></tr>';
    return;
  }
  $('recentStudentsBody').innerHTML = students.map(student => `<tr><td><div class="student-cell"><div class="student-avatar">${escapeHtml(initials(student.name))}</div><div><div class="student-primary">${escapeHtml(student.name)}</div><div class="student-secondary">${escapeHtml(student.enrollmentNo || '')}</div></div></div></td><td>${escapeHtml(labelize(student.careerPreference))}</td><td><span class="badge ${badgeClass(student.placementStatus)}">${escapeHtml(labelize(student.placementStatus))}</span></td></tr>`).join('');
}
function populateStudentSelect() {
  const select = $('placementStudentId');
  const previous = select.value;
  select.innerHTML = '<option value="">Select a student</option>' + state.students.map(student => `<option value="${escapeHtml(student.id)}">${escapeHtml(student.name)} · ${escapeHtml(student.enrollmentNo || `ID ${student.id}`)}</option>`).join('');
  if (state.students.some(student => String(student.id) === previous)) select.value = previous;
}

async function loadPlacements() {
  try {
    const result = await apiRequest(API.placements);
    state.placements = Array.isArray(result) ? result : [];
    renderPlacements();
    $('statRecords').textContent = state.placements.length;
    hideNotice('placementsNotice');
    setApiStatus(true);
  } catch (error) {
    $('placementsBody').innerHTML = `<tr><td colspan="7" class="empty-state">Could not load placement records: ${escapeHtml(error.message)}</td></tr>`;
    showNotice('placementsNotice', `Placement request failed: ${error.message}`, 'error');
    setApiStatus(false);
  }
}
function filteredPlacements() {
  const query = $('placementSearch').value.trim().toLowerCase();
  const status = $('placementStatusFilter').value.toUpperCase();
  return state.placements.filter(record => {
    const student = record.student || {};
    const haystack = [student.name, student.enrollmentNo, record.companyName, record.jobRole, record.applicationStatus].join(' ').toLowerCase();
    return (!query || haystack.includes(query)) && (!status || String(record.applicationStatus || '').toUpperCase() === status);
  });
}
function renderPlacements() {
  const records = filteredPlacements();
  $('placementCount').textContent = `${records.length} record${records.length === 1 ? '' : 's'}`;
  if (!records.length) {
    $('placementsBody').innerHTML = `<tr><td colspan="7" class="empty-state">${state.placements.length ? 'No records match your filters.' : 'No placement records yet. Add an application to get started.'}</td></tr>`;
    return;
  }
  $('placementsBody').innerHTML = records.map(record => {
    const student = record.student || {};
    return `<tr><td><div class="student-primary">${escapeHtml(student.name || 'Unknown student')}</div><div class="student-secondary">${escapeHtml(student.enrollmentNo || `Student ID ${student.id ?? '—'}`)}</div></td>
      <td>${escapeHtml(record.companyName || '—')}</td><td>${escapeHtml(record.jobRole || '—')}</td><td>${formatPackage(record.packageAmount)}</td>
      <td><span class="badge ${badgeClass(record.applicationStatus)}">${escapeHtml(labelize(record.applicationStatus))}</span></td><td>${escapeHtml(record.offerDate || '—')}</td>
      <td><div class="action-buttons"><button class="small-action danger" data-delete-placement="${escapeHtml(record.id)}">Delete</button></div></td></tr>`;
  }).join('');
}

function openModal(id) { $(id).classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { $(id).classList.add('hidden'); document.body.style.overflow = ''; }
function showFormError(id, message) { $(id).textContent = message; $(id).classList.remove('hidden'); }
function clearFormError(id) { $(id).textContent = ''; $(id).classList.add('hidden'); }
function setButtonLoading(buttonId, loading, label) { const button = $(buttonId); button.disabled = loading; button.textContent = loading ? 'Saving…' : label; }

function openStudentForm(student = null) {
  $('studentForm').reset();
  clearFormError('studentFormError');
  $('studentId').value = student?.id ?? '';
  $('studentModalTitle').textContent = student ? 'Edit student' : 'Add student';
  $('saveStudentBtn').textContent = student ? 'Update student' : 'Save student';
  $('enrollmentNo').value = student?.enrollmentNo ?? '';
  $('studentName').value = student?.name ?? '';
  $('studentEmail').value = student?.email ?? '';
  $('studentBranch').value = student?.branch ?? '';
  $('careerPreference').value = student?.careerPreference ?? 'INTERNSHIP_AND_PLACEMENT';
  $('placementStatus').value = student?.placementStatus ?? 'PENDING';
  openModal('studentModalBackdrop');
  $('enrollmentNo').focus();
}
async function saveStudent(event) {
  event.preventDefault();
  clearFormError('studentFormError');
  const id = $('studentId').value;
  const student = {
    enrollmentNo: $('enrollmentNo').value.trim(), name: $('studentName').value.trim(),
    email: $('studentEmail').value.trim(), branch: $('studentBranch').value.trim(),
    careerPreference: $('careerPreference').value, placementStatus: $('placementStatus').value
  };
  setButtonLoading('saveStudentBtn', true, id ? 'Update student' : 'Save student');
  try {
    await apiRequest(id ? `${API.students}/${encodeURIComponent(id)}` : API.students, {
      method: id ? 'PUT' : 'POST', body: JSON.stringify(student)
    });
    closeModal('studentModalBackdrop');
    showToast(id ? 'Student updated successfully.' : 'Student added successfully.');
    await Promise.all([loadStudents(), loadPlacements(), loadDashboard()]);
  } catch (error) {
    showFormError('studentFormError', error.message || 'Could not save student.');
  } finally {
    setButtonLoading('saveStudentBtn', false, id ? 'Update student' : 'Save student');
  }
}
async function deleteStudent(id) {
  const student = state.students.find(item => String(item.id) === String(id));
  if (!confirm(`Delete ${student?.name || 'this student'}? This action cannot be undone.`)) return;
  try {
    await apiRequest(`${API.students}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    showToast('Student deleted successfully.');
    await Promise.all([loadStudents(), loadPlacements(), loadDashboard()]);
  } catch (error) {
    showToast(`Could not delete student: ${error.message}`, true);
  }
}

function openPlacementForm() {
  $('placementForm').reset();
  clearFormError('placementFormError');
  populateStudentSelect();
  if (!state.students.length) {
    showToast('Add a student before creating a placement record.', true);
    return;
  }
  openModal('placementModalBackdrop');
  $('placementStudentId').focus();
}
async function savePlacement(event) {
  event.preventDefault();
  clearFormError('placementFormError');
  const studentId = $('placementStudentId').value;
  const packageRaw = $('packageAmount').value;
  const record = {
    student: { id: Number(studentId) },
    companyName: $('companyName').value.trim(),
    jobRole: $('jobRole').value.trim(),
    applicationStatus: $('applicationStatus').value,
    packageAmount: packageRaw === '' ? null : Number(packageRaw),
    offerDate: $('offerDate').value || null
  };
  setButtonLoading('savePlacementBtn', true, 'Save record');
  try {
    await apiRequest(API.placements, { method: 'POST', body: JSON.stringify(record) });
    closeModal('placementModalBackdrop');
    showToast('Placement record added successfully.');
    await Promise.all([loadPlacements(), loadStudents(), loadDashboard()]);
  } catch (error) {
    showFormError('placementFormError', error.message || 'Could not save placement record.');
  } finally {
    setButtonLoading('savePlacementBtn', false, 'Save record');
  }
}
async function deletePlacement(id) {
  if (!confirm('Delete this placement record? This action cannot be undone.')) return;
  try {
    await apiRequest(`${API.placements}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    showToast('Placement record deleted successfully.');
    await Promise.all([loadPlacements(), loadDashboard()]);
  } catch (error) {
    showToast(`Could not delete record: ${error.message}`, true);
  }
}

function navigate(view) {
  if (!['dashboard', 'students', 'placements'].includes(view)) return;
  state.activeView = view;
  document.querySelectorAll('.view').forEach(element => element.classList.toggle('active', element.id === `${view}View`));
  document.querySelectorAll('.nav-item').forEach(element => element.classList.toggle('active', element.dataset.view === view));
  $('breadcrumbCurrent').textContent = view === 'placements' ? 'Placement records' : view.charAt(0).toUpperCase() + view.slice(1);
  $('sidebar').classList.remove('open');
  if (view === 'dashboard') refreshAll();
  if (view === 'students') loadStudents();
  if (view === 'placements') Promise.all([loadPlacements(), loadStudents()]);
}
async function refreshAll() {
  await Promise.all([loadStudents(), loadPlacements()]);
  await loadDashboard();
}

function bindEvents() {
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.go)));
  $('dashboardAddStudent').addEventListener('click', () => openStudentForm());
  $('addStudentBtn').addEventListener('click', () => openStudentForm());
  $('addPlacementBtn').addEventListener('click', openPlacementForm);
  $('studentForm').addEventListener('submit', saveStudent);
  $('placementForm').addEventListener('submit', savePlacement);
  $('studentSearch').addEventListener('input', renderStudents);
  $('studentStatusFilter').addEventListener('change', renderStudents);
  $('placementSearch').addEventListener('input', renderPlacements);
  $('placementStatusFilter').addEventListener('change', renderPlacements);
  $('refreshStudents').addEventListener('click', loadStudents);
  $('refreshPlacements').addEventListener('click', loadPlacements);
  $('mobileMenu').addEventListener('click', () => $('sidebar').classList.toggle('open'));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeModal(button.dataset.close)));
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.addEventListener('click', event => {
    if (event.target === backdrop) closeModal(backdrop.id);
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(modal => closeModal(modal.id));
  });
  $('studentsBody').addEventListener('click', event => {
    const editButton = event.target.closest('[data-edit-student]');
    const deleteButton = event.target.closest('[data-delete-student]');
    if (editButton) {
      const student = state.students.find(item => String(item.id) === editButton.dataset.editStudent);
      if (student) openStudentForm(student);
    }
    if (deleteButton) deleteStudent(deleteButton.dataset.deleteStudent);
  });
  $('placementsBody').addEventListener('click', event => {
    const deleteButton = event.target.closest('[data-delete-placement]');
    if (deleteButton) deletePlacement(deleteButton.dataset.deletePlacement);
  });
}

function init() {
  $('todayLabel').textContent = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
  bindEvents();
  refreshAll();
}

document.addEventListener('DOMContentLoaded', init);
