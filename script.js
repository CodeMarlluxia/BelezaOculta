const API_URL = 'https://script.google.com/macros/s/AKfycbyVNqoHcQUE9w8v1KDZGRuceuCgXGsiZRXFo3bIF5HOTdLiJpvgVaKs7vK4z3N8BoCF/exec';

const SHEETS = {
  AGENDAMENTOS: 'AGENDAMENTOS',
  VENDAS: 'VENDAS',
  ESTOQUE: 'ESTOQUE',
  CADASTROS: 'CADASTROS'
};

const STAFF_OPTIONS = ['Elane', 'Edila', 'Tété', 'Biatriz', 'Eduarda', 'Juliana'];
const LOW_STOCK_THRESHOLD = 5;
const THEME_STORAGE_KEY = 'beleza_manager_theme';

const state = {
  appointments: [],
  sales: [],
  inventory: [],
  clients: [],
  selectedAppointmentRow: null,
  currentUser: null,   // { usuario, nivel, unidade }
  activeUnitFilter: null  // null = todas; 'Sabiaguaba' | 'Icaraí' = filtrado
};

// Access level map: which sections each level can see
// Levels expected in spreadsheet: 'admin', 'gerente', 'colaboradora'
const ACCESS_MAP = {
  admin: ['dashboard', 'agendamentos', 'vendas', 'estoque', 'cadastros'],
  gerente: ['dashboard', 'agendamentos', 'vendas', 'estoque', 'cadastros'],
  colaboradora: ['dashboard-colab', 'agendamentos', 'vendas', 'estoque', 'cadastros']
};

// Levels that see ALL units (no unit filter)
const UNRESTRICTED_LEVELS = ['admin', 'gerente'];

// Returns the unit filter for the current user, or null if unrestricted
function getUnitFilter() {
  const user = state.currentUser;
  if (!user) return null;
  const nivel = String(user.nivel || '').toLowerCase().trim();
  // Admin/gerente: respect their manually chosen filter (or null = all)
  if (UNRESTRICTED_LEVELS.includes(nivel)) {
    return state.activeUnitFilter
      ? state.activeUnitFilter.trim().toLowerCase()
      : null;
  }
  return String(user.unidade || '').trim().toLowerCase();
}

// Filters an array of items by the current user's unit (if restricted)
function filterByUnit(items) {
  const unitFilter = getUnitFilter();
  if (!unitFilter) return items;
  return items.filter((item) =>
    String(item.unit || item.unidade || '').trim().toLowerCase() === unitFilter
  );
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const body = document.body;
const sections = document.querySelectorAll('.section');
const navButtons = document.querySelectorAll('.nav-button');
const pageTitle = document.getElementById('pageTitle');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeToggleLabel = document.getElementById('themeToggleLabel');
const feedbackBanner = document.getElementById('feedbackBanner');
const openAppointmentModalBtn = document.getElementById('openAppointmentModalBtn');
const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');

const appointmentModal = document.getElementById('appointmentModal');
const appointmentDetailsModal = document.getElementById('appointmentDetailsModal');
const appointmentForm = document.getElementById('appointmentForm');
const salesForm = document.getElementById('salesForm');
const inventoryForm = document.getElementById('inventoryForm');
const clientsForm = document.getElementById('clientsForm');

const closeAppointmentModalBtn = document.getElementById('closeAppointmentModalBtn');
const cancelAppointmentBtn = document.getElementById('cancelAppointmentBtn');
const closeAppointmentDetailsModalBtn = document.getElementById('closeAppointmentDetailsModalBtn');
const closeAppointmentDetailsBtn = document.getElementById('closeAppointmentDetailsBtn');
const completeAppointmentBtn = document.getElementById('completeAppointmentBtn');

const appointmentProfessional = document.getElementById('appointmentProfessional');
const saleSeller = document.getElementById('saleSeller');
const saleProductInput = document.getElementById('saleProduct');
const saleProductsList = document.getElementById('saleProductsList');
const salePriceInput = document.getElementById('salePrice');
const saleQuantityInput = document.getElementById('saleQuantity');
const inventoryPriceInput = document.getElementById('inventoryPrice');
const appointmentValueInput = document.getElementById('appointmentValue');
const clientPhoneInput = document.getElementById('clientPhone');

const waitingList = document.getElementById('waitingList');
const waitingEmptyState = document.getElementById('waitingEmptyState');
const waitingCount = document.getElementById('waitingCount');

const detailsClient = document.getElementById('detailsClient');
const detailsService = document.getElementById('detailsService');
const detailsProfessional = document.getElementById('detailsProfessional');
const detailsValue = document.getElementById('detailsValue');
const detailsUnit = document.getElementById('detailsUnit');
const detailsDateTime = document.getElementById('detailsDateTime');
const detailsStatus = document.getElementById('detailsStatus');

const appointmentsTableBody = document.getElementById('appointmentsTableBody');
const salesTableBody = document.getElementById('salesTableBody');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const clientsTableBody = document.getElementById('clientsTableBody');
const lowStockTableBody = document.getElementById('lowStockTableBody');

const appointmentsEmptyState = document.getElementById('appointmentsEmptyState');
const salesEmptyState = document.getElementById('salesEmptyState');
const inventoryEmptyState = document.getElementById('inventoryEmptyState');
const clientsEmptyState = document.getElementById('clientsEmptyState');
const lowStockEmptyState = document.getElementById('lowStockEmptyState');

const appointmentsCount = document.getElementById('appointmentsCount');
const salesCount = document.getElementById('salesCount');
const inventoryCount = document.getElementById('inventoryCount');
const clientsCount = document.getElementById('clientsCount');
const lowStockCount = document.getElementById('lowStockCount');

const dashboardTodayLabel = document.getElementById('dashboardTodayLabel');
const kpiAppointmentsDone = document.getElementById('kpiAppointmentsDone');
const kpiDailyRevenue = document.getElementById('kpiDailyRevenue');
const kpiStockAlert = document.getElementById('kpiStockAlert');
const kpiStockAlertText = document.getElementById('kpiStockAlertText');
const stockAlertCard = document.getElementById('stockAlertCard');
const topSellerName = document.getElementById('topSellerName');
const topSellerMeta = document.getElementById('topSellerMeta');
const topProviderName = document.getElementById('topProviderName');
const topProviderMeta = document.getElementById('topProviderMeta');

let weeklyRevenueChart = null;
let colabAttendanceChart = null;

// Sidebar drawer elements
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebar = document.querySelector('.sidebar');

// Product picker elements
const productPickerModal = document.getElementById('productPickerModal');
const productPickerSearch = document.getElementById('productPickerSearch');
const productPickerList = document.getElementById('productPickerList');
const productPickerEmpty = document.getElementById('productPickerEmpty');
const openProductPickerBtn = document.getElementById('openProductPickerBtn');
const closeProductPickerBtn = document.getElementById('closeProductPickerBtn');

// Login elements
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const logoutBtn = document.getElementById('logoutBtn');

function updateLucideIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

function updateThemeToggleUI(theme) {
  const isDark = theme === 'dark';
  if (themeToggleLabel) {
    themeToggleLabel.textContent = isDark ? 'Modo Claro' : 'Modo Escuro';
  }

  if (themeToggleBtn) {
    themeToggleBtn.setAttribute('aria-label', isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro');
    const iconTarget = themeToggleBtn.querySelector('[data-lucide]');
    if (iconTarget) {
      iconTarget.setAttribute('data-lucide', isDark ? 'sun-medium' : 'moon-star');
      updateLucideIcons();
    }
  }
}

function applyTheme(theme) {
  const selectedTheme = theme === 'dark' ? 'dark' : 'light';
  body.setAttribute('data-theme', selectedTheme);
  window.localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
  updateThemeToggleUI(selectedTheme);
  if (weeklyRevenueChart) renderWeeklyChart();
  if (colabAttendanceChart) renderColabAttendanceChart();
}

function initTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));
}

function toggleTheme() {
  applyTheme(body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

function validateEndpoint() {
  if (!API_URL || API_URL === 'COLE_AQUI_SUA_URL_DO_GOOGLE_APPS_SCRIPT') {
    throw new Error('Defina a URL do Google Apps Script no arquivo script.js antes de utilizar a integração.');
  }
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = String(value || '').trim();
  if (!text) return 0;

  const normalized = text
    .replace(/R\$/gi, '')
    .replace(/\s+/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');

  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  return currencyFormatter.format(normalizeNumber(value));
}

function formatCurrencyInput(event) {
  const input = event.target;
  input.value = normalizeNumber(input.value).toFixed(2).replace('.', ',');
}

function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (_, ddd, first, second) => {
      let result = '';
      if (ddd) result += `(${ddd}`;
      if (ddd.length === 2) result += ') ';
      if (first) result += first;
      if (second) result += `-${second}`;
      return result;
    }).trim();
  }

  return digits.replace(/(\d{0,2})(\d{0,5})(\d{0,4})/, (_, ddd, first, second) => {
    let result = '';
    if (ddd) result += `(${ddd}`;
    if (ddd.length === 2) result += ') ';
    if (first) result += first;
    if (second) result += `-${second}`;
    return result;
  }).trim();
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === 'number') {
    const excelDate = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(excelDate.getTime()) ? null : excelDate;
  }

  const text = String(value).trim();
  const nativeDate = new Date(text);
  if (!Number.isNaN(nativeDate.getTime())) return nativeDate;

  const localMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (localMatch) {
    const [, dd, mm, yyyy, hh = '00', min = '00', ss = '00'] = localMatch;
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function toDateTimeLocalValue(value) {
  const date = parseDate(value);
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return normalizeText(value) || '-';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function formatTime(value) {
  const date = parseDate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function isSameDay(dateA, dateB) {
  return !!dateA && !!dateB &&
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate();
}

function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatStatus(status) {
  const current = normalizeText(status).toLowerCase();
  if (!current) return 'Em aguardo';
  if (current === 'encerrado') return 'Concluído';
  if (current === 'concluido') return 'Concluído';
  if (current === 'em aguardo') return 'Em aguardo';
  return normalizeText(status);
}

function isWaitingStatus(status) {
  return formatStatus(status).toLowerCase() === 'em aguardo';
}

function isCompletedStatus(status) {
  return formatStatus(status).toLowerCase() === 'concluído';
}

function updateCount(element, total, singular = 'registro', plural = 'registros') {
  if (element) {
    element.textContent = `${total} ${total === 1 ? singular : plural}`;
  }
}

function setFeedback(message, type = 'success') {
  if (!feedbackBanner) return;
  feedbackBanner.className = `feedback-banner ${type}`;
  feedbackBanner.textContent = message;
  window.clearTimeout(setFeedback.timeoutId);
  setFeedback.timeoutId = window.setTimeout(() => {
    feedbackBanner.className = 'feedback-banner';
    feedbackBanner.textContent = '';
  }, 4200);
}

async function requestAPI(method = 'GET', payload = null) {
  validateEndpoint();

  // Google Apps Script não suporta preflight CORS (OPTIONS).
  // GET: requisição simples sem headers customizados.
  // POST: envia como text/plain — evita o preflight e o Apps Script
  //       lê normalmente via e.postData.contents.
  const fetchOptions = method === 'GET'
    ? { method: 'GET', redirect: 'follow' }
    : {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload ? JSON.stringify(payload) : null
    };

  let response;
  try {
    response = await fetch(API_URL, fetchOptions);
  } catch (error) {
    throw new Error('Não foi possível conectar ao Google Apps Script. Verifique se a implantação está publicada como "Qualquer pessoa" e tente novamente.');
  }

  if (!response.ok) {
    throw new Error(`Falha de comunicação com a API. Código HTTP ${response.status}.`);
  }

  let result;
  try {
    const text = await response.text();
    result = JSON.parse(text);
  } catch (error) {
    throw new Error('A API retornou uma resposta inválida.');
  }

  if (!result || result.success === false) {
    throw new Error(result?.message || 'Não foi possível concluir a operação.');
  }

  return result;
}

async function loadAllData() {
  const result = await requestAPI('GET');
  const data = result.data || {};
  state.appointments = Array.isArray(data.AGENDAMENTOS) ? data.AGENDAMENTOS.map(mapAppointment) : [];
  state.sales = Array.isArray(data.VENDAS) ? data.VENDAS.map(mapSale) : [];
  state.inventory = Array.isArray(data.ESTOQUE) ? data.ESTOQUE.map(mapInventory) : [];
  state.clients = Array.isArray(data.CADASTROS) ? data.CADASTROS.map(mapClient) : [];
}

function mapAppointment(item) {
  return {
    rowNumber: Number(item._rowNumber || 0),
    client: normalizeText(item.CLIENTE),
    service: normalizeText(item['SERVIÇO'] || item.SERVICO),
    professional: normalizeText(item.PROFISSIONAL),
    value: normalizeNumber(item.VALOR),
    unit: normalizeText(item.UNIDADE),
    dateTime: normalizeText(item['DATA E HORA'] || item.DATA_HORA || item.DATAHORA || item.DATA_HORA_ATENDIMENTO),
    createdAt: normalizeText(item.DATA_REGISTRO),
    status: formatStatus(item.STATUS)
  };
}

function mapSale(item) {
  return {
    rowNumber: Number(item._rowNumber || 0),
    product: normalizeText(item.PRODUTO),
    client: normalizeText(item.CLIENTE),
    seller: normalizeText(item.VENDEDORA || item.VENDEDOR),
    quantity: normalizeNumber(item.QUANTIDADE),
    price: normalizeNumber(item['PREÇO'] || item.PRECO),
    unit: normalizeText(item.UNIDADE),
    createdAt: normalizeText(item.DATA_REGISTRO)
  };
}

function mapInventory(item) {
  return {
    rowNumber: Number(item._rowNumber || 0),
    product: normalizeText(item.PRODUTO),
    quantity: normalizeNumber(item.QUANTIDADE),
    price: normalizeNumber(item['PREÇO'] || item.PRECO),
    unit: normalizeText(item.UNIDADE),
    createdAt: normalizeText(item.DATA_REGISTRO)
  };
}

function mapClient(item) {
  return {
    rowNumber: Number(item._rowNumber || 0),
    name: normalizeText(item.CLIENTE),
    phone: normalizeText(item.TELEFONE),
    email: normalizeText(item['E-MAIL'] || item.EMAIL),
    unit: normalizeText(item.UNIDADE),
    createdAt: normalizeText(item.DATA_REGISTRO)
  };
}

function renderTableRows(items, tableBody, emptyState, rowTemplate) {
  tableBody.innerHTML = '';
  if (!items.length) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = rowTemplate(item);
    fragment.appendChild(row);
  });
  tableBody.appendChild(fragment);
}

function renderAppointments() {
  const filtered = filterByUnit(state.appointments);
  const sorted = [...filtered].sort((a, b) => (parseDate(b.dateTime)?.getTime() || 0) - (parseDate(a.dateTime)?.getTime() || 0));
  renderTableRows(sorted, appointmentsTableBody, appointmentsEmptyState, (item) => {
    const isCompleted = isCompletedStatus(item.status);
    return `
      <td>${item.client || '-'}</td>
      <td>${item.service || '-'}</td>
      <td>${item.professional || '-'}</td>
      <td>${formatCurrency(item.value)}</td>
      <td>${item.unit || '-'}</td>
      <td>${formatDateTime(item.dateTime)}</td>
      <td><span class="status-chip ${isCompleted ? 'done' : 'pending'}">${item.status}</span></td>
      <td>
        <button
          type="button"
          class="status-action-button"
          data-action="open-appointment-details"
          data-row="${item.rowNumber}"
        >Detalhes</button>
      </td>
    `;
  });
  updateCount(appointmentsCount, filtered.length);
}

function renderSales() {
  const filtered = filterByUnit(state.sales);
  const sorted = [...filtered].sort((a, b) => (parseDate(b.createdAt)?.getTime() || 0) - (parseDate(a.createdAt)?.getTime() || 0));
  renderTableRows(sorted, salesTableBody, salesEmptyState, (item) => `
    <td>${item.product || '-'}</td>
    <td>${item.client || '-'}</td>
    <td>${item.seller || '-'}</td>
    <td>${item.quantity}</td>
    <td>${formatCurrency(item.price)}</td>
    <td>${item.unit || '-'}</td>
  `);
  updateCount(salesCount, filtered.length);
}

function renderInventory() {
  const filtered = filterByUnit(state.inventory);
  const sorted = [...filtered].sort((a, b) => a.product.localeCompare(b.product, 'pt-BR'));
  renderTableRows(sorted, inventoryTableBody, inventoryEmptyState, (item) => `
    <td>${item.product || '-'}</td>
    <td>${item.quantity}</td>
    <td>${formatCurrency(item.price)}</td>
    <td>${item.unit || '-'}</td>
  `);
  updateCount(inventoryCount, filtered.length);
}

function renderClients() {
  const filtered = filterByUnit(state.clients);
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  renderTableRows(sorted, clientsTableBody, clientsEmptyState, (item) => `
    <td>${item.name || '-'}</td>
    <td>${item.phone || '-'}</td>
    <td>${item.email || '-'}</td>
    <td>${item.unit || '-'}</td>
  `);
  updateCount(clientsCount, filtered.length);
}

function getLowStockProducts() {
  return filterByUnit(state.inventory)
    .filter((item) => item.quantity <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.quantity - b.quantity || a.product.localeCompare(b.product, 'pt-BR'));
}

function renderLowStockTable() {
  const lowStockItems = getLowStockProducts();
  lowStockTableBody.innerHTML = '';
  if (!lowStockItems.length) {
    lowStockEmptyState.style.display = 'block';
    lowStockCount.textContent = '0 itens';
    return;
  }

  lowStockEmptyState.style.display = 'none';
  const fragment = document.createDocumentFragment();
  lowStockItems.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${item.product}</td><td>${item.quantity}</td>`;
    fragment.appendChild(row);
  });
  lowStockTableBody.appendChild(fragment);
  lowStockCount.textContent = `${lowStockItems.length} ${lowStockItems.length === 1 ? 'item' : 'itens'}`;
}

function getTodayAppointments(statusFilter = null) {
  const today = getToday();
  return filterByUnit(state.appointments).filter((item) => {
    const date = parseDate(item.dateTime || item.createdAt);
    if (!isSameDay(date, today)) return false;
    return statusFilter ? formatStatus(item.status).toLowerCase() === formatStatus(statusFilter).toLowerCase() : true;
  });
}

function getTodayClosedAppointments() {
  return getTodayAppointments('Concluído');
}

function getTodaySales() {
  const today = getToday();
  return filterByUnit(state.sales).filter((item) => isSameDay(parseDate(item.createdAt), today));
}

function getDailyRevenue() {
  const appointmentsTotal = getTodayClosedAppointments().reduce((total, item) => total + normalizeNumber(item.value), 0);
  const salesTotal = getTodaySales().reduce((total, item) => total + (normalizeNumber(item.price) * normalizeNumber(item.quantity)), 0);
  return appointmentsTotal + salesTotal;
}

function getTopProvider() {
  const counter = new Map();
  getTodayClosedAppointments().forEach((item) => {
    const key = item.professional || 'Não informado';
    counter.set(key, (counter.get(key) || 0) + 1);
  });

  const [name = '—', total = 0] = [...counter.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  return { name, total };
}

function getTopSeller() {
  const counter = new Map();
  getTodaySales().forEach((item) => {
    if (!item.seller) return;
    const total = normalizeNumber(item.price) * normalizeNumber(item.quantity);
    counter.set(item.seller, (counter.get(item.seller) || 0) + total);
  });

  if (!counter.size) return null;
  const [name, total] = [...counter.entries()].sort((a, b) => b[1] - a[1])[0];
  return { name, total };
}

function renderWaitingList() {
  const waitingAppointments = getTodayAppointments('Em aguardo')
    .sort((a, b) => (parseDate(a.dateTime)?.getTime() || 0) - (parseDate(b.dateTime)?.getTime() || 0));

  waitingList.innerHTML = '';
  if (!waitingAppointments.length) {
    waitingList.appendChild(waitingEmptyState);
    waitingEmptyState.style.display = 'block';
    waitingCount.textContent = '0';
    return;
  }

  waitingEmptyState.style.display = 'none';
  waitingCount.textContent = String(waitingAppointments.length);

  const fragment = document.createDocumentFragment();
  waitingAppointments.forEach((item) => {
    const initials = (item.client || '?')
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'waiting-item';
    button.dataset.row = String(item.rowNumber);
    button.innerHTML = `
      <span class="waiting-avatar">${initials}</span>
      <span class="waiting-info">
        <span class="waiting-name">${item.client || '-'}</span>
        <span class="waiting-meta">${item.service || '-'} · ${formatTime(item.dateTime)} · ${item.professional || '-'}</span>
      </span>
      <span class="waiting-action"><i data-lucide="chevron-right"></i></span>
    `;
    fragment.appendChild(button);
  });

  waitingList.appendChild(fragment);
  updateLucideIcons();
}

function getWeeklyRevenueSeries() {
  const labels = [];
  const values = [];
  const today = getToday();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);

    const appointmentsRevenue = filterByUnit(state.appointments)
      .filter((item) => isCompletedStatus(item.status) && isSameDay(parseDate(item.dateTime || item.createdAt), date))
      .reduce((sum, item) => sum + normalizeNumber(item.value), 0);

    const salesRevenue = filterByUnit(state.sales)
      .filter((item) => isSameDay(parseDate(item.createdAt), date))
      .reduce((sum, item) => sum + (normalizeNumber(item.price) * normalizeNumber(item.quantity)), 0);

    labels.push(new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', ''));
    values.push(appointmentsRevenue + salesRevenue);
  }

  return { labels, values };
}

function renderWeeklyChart() {
  const canvas = document.getElementById('weeklyRevenueChart');
  if (!canvas || typeof window.Chart === 'undefined') return;

  const context = canvas.getContext('2d');
  const { labels, values } = getWeeklyRevenueSeries();
  const styles = getComputedStyle(document.documentElement);
  const gridColor = styles.getPropertyValue('--chart-grid').trim();
  const chartBorder = styles.getPropertyValue('--chart-border').trim();
  const tickColor = styles.getPropertyValue('--text-soft').trim();
  const backgroundPalette = [
    styles.getPropertyValue('--chart-1').trim(),
    styles.getPropertyValue('--chart-2').trim(),
    styles.getPropertyValue('--chart-3').trim(),
    styles.getPropertyValue('--chart-4').trim(),
    styles.getPropertyValue('--chart-5').trim(),
    styles.getPropertyValue('--chart-6').trim(),
    styles.getPropertyValue('--chart-7').trim()
  ];

  if (weeklyRevenueChart) weeklyRevenueChart.destroy();

  weeklyRevenueChart = new Chart(context, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Faturamento',
        data: values,
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: backgroundPalette,
        borderColor: chartBorder,
        maxBarThickness: 44
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 320,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(contextTooltip) {
              return ` ${formatCurrency(contextTooltip.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: tickColor }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: tickColor,
            callback(value) {
              return formatCurrency(value);
            }
          },
          grid: { color: gridColor }
        }
      }
    }
  });
}

function renderDashboard() {
  const today = getToday();
  dashboardTodayLabel.textContent = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(today);

  const closedAppointments = getTodayClosedAppointments();
  const lowStockItems = getLowStockProducts();
  const topProvider = getTopProvider();
  const topSeller = getTopSeller();

  kpiAppointmentsDone.textContent = String(closedAppointments.length);
  kpiDailyRevenue.textContent = formatCurrency(getDailyRevenue());

  if (lowStockItems.length) {
    stockAlertCard.classList.add('is-critical');
    kpiStockAlert.textContent = `${lowStockItems.length} ${lowStockItems.length === 1 ? 'item crítico' : 'itens críticos'}`;
    kpiStockAlertText.textContent = lowStockItems
      .slice(0, 2)
      .map((item) => `${item.product} (${item.quantity})`)
      .join(' · ');
    setFeedback('Atenção: existem produtos com estoque em nível mínimo ou crítico.', 'warning');
  } else {
    stockAlertCard.classList.remove('is-critical');
    kpiStockAlert.textContent = 'Sem alertas';
    kpiStockAlertText.textContent = 'Nenhum item crítico no momento.';
  }

  if (topSeller) {
    topSellerName.textContent = topSeller.name;
    topSellerMeta.textContent = `${formatCurrency(topSeller.total)} em vendas hoje`;
  } else {
    topSellerName.textContent = '—';
    topSellerMeta.textContent = 'Sem vendas registradas hoje.';
  }

  topProviderName.textContent = topProvider.name;
  topProviderMeta.textContent = `${topProvider.total} ${topProvider.total === 1 ? 'serviço finalizado hoje' : 'serviços finalizados hoje'}`;

  renderWaitingList();
  renderLowStockTable();
  renderWeeklyChart();
}

function renderAll() {
  renderAppointments();
  renderSales();
  renderInventory();
  renderClients();
  renderDashboard();
  renderColabDashboard();
}

function setModalVisibility(modal, visible) {
  if (!modal) return;
  modal.classList.toggle('active', visible);
  modal.setAttribute('aria-hidden', visible ? 'false' : 'true');
  document.body.style.overflow = visible ? 'hidden' : '';
}

function openAppointmentModal() {
  appointmentForm.reset();
  setModalVisibility(appointmentModal, true);
}

function closeAppointmentModal() {
  appointmentForm.reset();
  setModalVisibility(appointmentModal, false);
}

function openAppointmentDetails(rowNumber) {
  const appointment = state.appointments.find((item) => item.rowNumber === Number(rowNumber));
  if (!appointment) {
    setFeedback('Agendamento não encontrado.', 'error');
    return;
  }

  state.selectedAppointmentRow = appointment.rowNumber;
  detailsClient.textContent = appointment.client || '-';
  detailsService.textContent = appointment.service || '-';
  detailsProfessional.textContent = appointment.professional || '-';
  detailsValue.textContent = formatCurrency(appointment.value);
  detailsUnit.textContent = appointment.unit || '-';
  detailsDateTime.textContent = formatDateTime(appointment.dateTime);
  detailsStatus.textContent = appointment.status;
  completeAppointmentBtn.disabled = isCompletedStatus(appointment.status);
  setModalVisibility(appointmentDetailsModal, true);
}

function closeAppointmentDetailsModal() {
  state.selectedAppointmentRow = null;
  setModalVisibility(appointmentDetailsModal, false);
}

function switchSection(sectionId) {
  sections.forEach((section) => {
    section.classList.toggle('active', section.id === sectionId);
  });

  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.section === sectionId);
  });

  const selectedButton = Array.from(navButtons).find((button) => button.dataset.section === sectionId);
  pageTitle.textContent = selectedButton ? selectedButton.textContent.trim() : 'Painel';
  openAppointmentModalBtn.style.display = sectionId === 'agendamentos' ? 'inline-flex' : 'none';
}

function lockSubmitButton(form, isLoading, loadingLabel = 'Enviando...') {
  const submitButton = form.querySelector('button[type="submit"]');
  if (!submitButton) return;
  submitButton.disabled = isLoading;
  const label = submitButton.querySelector('span');
  if (label) label.textContent = isLoading ? loadingLabel : 'Confirmar';
}

function buildAppointmentPayload(formData) {
  return {
    CLIENTE: normalizeText(formData.get('client')),
    'SERVIÇO': normalizeText(formData.get('service')),
    PROFISSIONAL: normalizeText(formData.get('professional')),
    VALOR: normalizeNumber(formData.get('value')),
    UNIDADE: normalizeText(formData.get('unit')),
    'DATA E HORA': normalizeText(formData.get('dateTime')),
    STATUS: 'Em aguardo'
  };
}

function buildInventoryPayload(formData) {
  return {
    PRODUTO: normalizeText(formData.get('product')),
    QUANTIDADE: normalizeNumber(formData.get('quantity')),
    'PREÇO': normalizeNumber(formData.get('price')),
    UNIDADE: normalizeText(formData.get('unit'))
  };
}

function buildClientPayload(formData) {
  return {
    CLIENTE: normalizeText(formData.get('name')),
    TELEFONE: formatPhone(formData.get('phone')),
    'E-MAIL': normalizeText(formData.get('email')),
    UNIDADE: normalizeText(formData.get('unit'))
  };
}

function buildSalePayload(formData) {
  return {
    PRODUTO: normalizeText(formData.get('product')),
    CLIENTE: normalizeText(formData.get('client')),
    VENDEDORA: normalizeText(formData.get('seller')),
    QUANTIDADE: normalizeNumber(formData.get('quantity')),
    'PREÇO': normalizeNumber(formData.get('price')),
    UNIDADE: normalizeText(formData.get('unit'))
  };
}

function findInventoryProduct(productName, unit = '') {
  const targetProduct = normalizeText(productName).toLowerCase();
  const targetUnit = normalizeText(unit).toLowerCase();
  return filterByUnit(state.inventory).find((item) => {
    const sameProduct = normalizeText(item.product).toLowerCase() === targetProduct;
    const sameUnit = !targetUnit || normalizeText(item.unit).toLowerCase() === targetUnit;
    return sameProduct && sameUnit;
  }) || null;
}

function populateProductsDatalist() {
  saleProductsList.innerHTML = '';
  const seen = new Set();
  filterByUnit(state.inventory)
    .filter((item) => normalizeText(item.product))
    .forEach((item) => {
      const key = `${item.product}__${item.unit}`;
      if (seen.has(key)) return;
      seen.add(key);
      const option = document.createElement('option');
      option.value = item.product;
      option.label = item.unit ? `${item.product} · ${item.unit}` : item.product;
      saleProductsList.appendChild(option);
    });
}

function applySalePriceByProduct() {
  const unit = salesForm?.querySelector('[name="unit"]')?.value || '';
  const product = saleProductInput.value;
  const inventoryItem = findInventoryProduct(product, unit) || findInventoryProduct(product);
  if (inventoryItem) {
    salePriceInput.value = inventoryItem.price.toFixed(2).replace('.', ',');
  }
}

async function createRecord(sheetName, payload) {
  return requestAPI('POST', {
    action: 'append',
    sheet: sheetName,
    data: payload
  });
}

async function registerSale(payload) {
  return requestAPI('POST', {
    action: 'registerSale',
    sheet: SHEETS.VENDAS,
    stockSheet: SHEETS.ESTOQUE,
    data: payload
  });
}

async function updateAppointmentStatus(rowNumber, status) {
  return requestAPI('POST', {
    action: 'updateStatus',
    sheet: SHEETS.AGENDAMENTOS,
    rowNumber,
    status
  });
}

function updateLocalAppointmentStatus(rowNumber, status) {
  const appointment = state.appointments.find((item) => item.rowNumber === Number(rowNumber));
  if (appointment) {
    appointment.status = formatStatus(status);
  }
}

async function handleRefreshData(showFeedback = true) {
  const previousLabel = refreshDashboardBtn.querySelector('span')?.textContent || 'Atualizar';
  try {
    refreshDashboardBtn.disabled = true;
    const label = refreshDashboardBtn.querySelector('span');
    if (label) label.textContent = 'Atualizando...';
    await loadAllData();
    populateProductsDatalist();
    renderAll();
    if (showFeedback) setFeedback('Dados atualizados com sucesso.', 'success');
  } catch (error) {
    setFeedback(error.message, 'error');
  } finally {
    refreshDashboardBtn.disabled = false;
    const label = refreshDashboardBtn.querySelector('span');
    if (label) label.textContent = previousLabel;
  }
}

function renderLoadingState() {
  appointmentsTableBody.innerHTML = '<tr><td colspan="8" class="loading-state">Carregando dados...</td></tr>';
  salesTableBody.innerHTML = '<tr><td colspan="6" class="loading-state">Carregando dados...</td></tr>';
  inventoryTableBody.innerHTML = '<tr><td colspan="4" class="loading-state">Carregando dados...</td></tr>';
  clientsTableBody.innerHTML = '<tr><td colspan="4" class="loading-state">Carregando dados...</td></tr>';
  lowStockTableBody.innerHTML = '<tr><td colspan="2" class="loading-state">Carregando produtos...</td></tr>';
}

function setupStaffSelects() {
  [appointmentProfessional, saleSeller].forEach((select) => {
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = '<option value="">Selecione</option>' + STAFF_OPTIONS.map((name) => `<option value="${name}">${name}</option>`).join('');
    select.value = currentValue;
  });
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => switchSection(button.dataset.section));
});

openAppointmentModalBtn?.addEventListener('click', openAppointmentModal);
closeAppointmentModalBtn?.addEventListener('click', closeAppointmentModal);
cancelAppointmentBtn?.addEventListener('click', closeAppointmentModal);
closeAppointmentDetailsModalBtn?.addEventListener('click', closeAppointmentDetailsModal);
closeAppointmentDetailsBtn?.addEventListener('click', closeAppointmentDetailsModal);
refreshDashboardBtn?.addEventListener('click', () => handleRefreshData(true));
themeToggleBtn?.addEventListener('click', toggleTheme);

[appointmentModal, appointmentDetailsModal].forEach((modal) => {
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) {
      setModalVisibility(modal, false);
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (appointmentDetailsModal?.classList.contains('active')) closeAppointmentDetailsModal();
  else if (appointmentModal?.classList.contains('active')) closeAppointmentModal();
});

clientPhoneInput?.addEventListener('input', (event) => {
  event.target.value = formatPhone(event.target.value);
});

[salePriceInput, inventoryPriceInput, appointmentValueInput].forEach((input) => {
  input?.addEventListener('blur', formatCurrencyInput);
});

saleProductInput?.addEventListener('change', applySalePriceByProduct);
salesForm?.querySelector('[name="unit"]')?.addEventListener('change', applySalePriceByProduct);

waitingList?.addEventListener('click', (event) => {
  const button = event.target.closest('.waiting-item');
  if (!button) return;
  openAppointmentDetails(button.dataset.row);
});

document.getElementById('colabWaitingList')?.addEventListener('click', (event) => {
  const button = event.target.closest('.waiting-item');
  if (!button) return;
  openAppointmentDetails(button.dataset.row);
});

appointmentsTableBody?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="open-appointment-details"]');
  if (!button) return;
  openAppointmentDetails(button.dataset.row);
});

completeAppointmentBtn?.addEventListener('click', async () => {
  const rowNumber = Number(state.selectedAppointmentRow || 0);
  if (!rowNumber) {
    setFeedback('Não foi possível identificar o agendamento selecionado.', 'error');
    return;
  }

  const originalLabel = completeAppointmentBtn.querySelector('span')?.textContent || 'Encerrar Atendimento';

  try {
    completeAppointmentBtn.disabled = true;
    const label = completeAppointmentBtn.querySelector('span');
    if (label) label.textContent = 'Encerrando...';
    await updateAppointmentStatus(rowNumber, 'Concluído');
    updateLocalAppointmentStatus(rowNumber, 'Concluído');
    renderAll();
    closeAppointmentDetailsModal();
    setFeedback('Atendimento encerrado com sucesso.', 'success');
  } catch (error) {
    setFeedback(error.message, 'error');
  } finally {
    const label = completeAppointmentBtn.querySelector('span');
    if (label) label.textContent = originalLabel;
    completeAppointmentBtn.disabled = false;
  }
});

appointmentForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!appointmentForm.reportValidity()) return;

  lockSubmitButton(appointmentForm, true);
  const payload = buildAppointmentPayload(new FormData(appointmentForm));

  try {
    const result = await createRecord(SHEETS.AGENDAMENTOS, payload);
    state.appointments.unshift({
      rowNumber: Number(result.rowNumber || 0),
      client: payload.CLIENTE,
      service: payload['SERVIÇO'],
      professional: payload.PROFISSIONAL,
      value: payload.VALOR,
      unit: payload.UNIDADE,
      dateTime: payload['DATA E HORA'],
      createdAt: result.createdAt || '',
      status: 'Em aguardo'
    });
    renderAll();
    closeAppointmentModal();
    setFeedback('Agendamento enviado com sucesso.', 'success');
  } catch (error) {
    setFeedback(error.message, 'error');
  } finally {
    lockSubmitButton(appointmentForm, false);
  }
});

salesForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!salesForm.reportValidity()) return;

  lockSubmitButton(salesForm, true);
  const payload = buildSalePayload(new FormData(salesForm));
  const inventoryItem = findInventoryProduct(payload.PRODUTO, payload.UNIDADE) || findInventoryProduct(payload.PRODUTO);

  if (!inventoryItem) {
    lockSubmitButton(salesForm, false);
    setFeedback('Produto não encontrado no estoque para realizar a dedução automática.', 'error');
    return;
  }

  if (payload.QUANTIDADE <= 0) {
    lockSubmitButton(salesForm, false);
    setFeedback('Informe uma quantidade válida para a venda.', 'error');
    return;
  }

  if (inventoryItem.quantity < payload.QUANTIDADE) {
    lockSubmitButton(salesForm, false);
    setFeedback(`Estoque insuficiente para ${inventoryItem.product}. Disponível: ${inventoryItem.quantity}.`, 'error');
    return;
  }

  try {
    const result = await registerSale(payload);
    state.sales.unshift({
      rowNumber: Number(result.rowNumber || 0),
      product: payload.PRODUTO,
      client: payload.CLIENTE,
      seller: payload.VENDEDORA,
      quantity: payload.QUANTIDADE,
      price: payload['PREÇO'],
      unit: payload.UNIDADE,
      createdAt: result.createdAt || ''
    });

    const localInventoryItem = state.inventory.find((item) => item.rowNumber === Number(result.inventoryRowNumber || inventoryItem.rowNumber));
    if (localInventoryItem) {
      localInventoryItem.quantity = Number(result.updatedQuantity ?? (localInventoryItem.quantity - payload.QUANTIDADE));
    }

    populateProductsDatalist();
    renderAll();
    salesForm.reset();
    setFeedback('Venda registrada com sucesso e estoque atualizado automaticamente.', 'success');
  } catch (error) {
    setFeedback(error.message, 'error');
  } finally {
    lockSubmitButton(salesForm, false);
  }
});

inventoryForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!inventoryForm.reportValidity()) return;

  lockSubmitButton(inventoryForm, true);
  const payload = buildInventoryPayload(new FormData(inventoryForm));

  try {
    const result = await createRecord(SHEETS.ESTOQUE, payload);
    state.inventory.unshift({
      rowNumber: Number(result.rowNumber || 0),
      product: payload.PRODUTO,
      quantity: payload.QUANTIDADE,
      price: payload['PREÇO'],
      unit: payload.UNIDADE,
      createdAt: result.createdAt || ''
    });
    populateProductsDatalist();
    renderAll();
    inventoryForm.reset();
    setFeedback('Item de estoque salvo com sucesso.', 'success');
  } catch (error) {
    setFeedback(error.message, 'error');
  } finally {
    lockSubmitButton(inventoryForm, false);
  }
});

clientsForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!clientsForm.reportValidity()) return;

  lockSubmitButton(clientsForm, true);
  const payload = buildClientPayload(new FormData(clientsForm));

  try {
    const result = await createRecord(SHEETS.CADASTROS, payload);
    state.clients.unshift({
      rowNumber: Number(result.rowNumber || 0),
      name: payload.CLIENTE,
      phone: payload.TELEFONE,
      email: payload['E-MAIL'],
      unit: payload.UNIDADE,
      createdAt: result.createdAt || ''
    });
    renderAll();
    clientsForm.reset();
    setFeedback('Cliente cadastrado com sucesso.', 'success');
  } catch (error) {
    setFeedback(error.message, 'error');
  } finally {
    lockSubmitButton(clientsForm, false);
  }
});

// ─── UNIT FILTER (ADMIN/GERENTE) ────────────────────────────────────────────

const UNIT_OPTIONS = ['Sabiaguaba', 'Icaraí'];

const unitFilterBtn = document.getElementById('unitFilterBtn');
const unitFilterLabel = document.getElementById('unitFilterLabel');

function updateUnitFilterUI() {
  if (!unitFilterBtn || !unitFilterLabel) return;
  const active = state.activeUnitFilter;
  unitFilterLabel.textContent = active ? active : 'Todas as Unidades';
  unitFilterBtn.classList.toggle('is-filtering', !!active);
  unitFilterBtn.setAttribute('aria-label', active ? `Filtro: ${active}` : 'Filtrar por unidade');
}

function cycleUnitFilter() {
  // Cycle: null → Sabiaguaba → Icaraí → null → ...
  const options = [null, ...UNIT_OPTIONS];
  const current = state.activeUnitFilter;
  const currentIdx = options.findIndex(
    (o) => (o === null && current === null) ||
      (o && current && o.toLowerCase() === current.toLowerCase())
  );
  const nextIdx = (currentIdx + 1) % options.length;
  state.activeUnitFilter = options[nextIdx];
  updateUnitFilterUI();
  renderAll();
  const label = state.activeUnitFilter
    ? `Exibindo apenas: ${state.activeUnitFilter}`
    : 'Exibindo todas as unidades.';
  setFeedback(label, state.activeUnitFilter ? 'warning' : 'success');
}

unitFilterBtn?.addEventListener('click', cycleUnitFilter);

function showUnitFilterForAdmins() {
  if (!unitFilterBtn) return;
  const nivel = String(state.currentUser?.nivel || '').toLowerCase().trim();
  unitFilterBtn.style.display = UNRESTRICTED_LEVELS.includes(nivel) ? '' : 'none';
}

// ────────────────────────────────────────────────────────────────────────────


// ─── SIDEBAR DRAWER (MOBILE) ────────────────────────────────────────────────

function openSidebar() {
  sidebar?.classList.add('open');
  sidebarOverlay?.classList.add('active');
  sidebarOverlay?.removeAttribute('aria-hidden');
  sidebarToggleBtn?.setAttribute('aria-expanded', 'true');
  const icon = sidebarToggleBtn?.querySelector('[data-lucide]');
  if (icon) { icon.setAttribute('data-lucide', 'x'); updateLucideIcons(); }
}

function closeSidebar() {
  sidebar?.classList.remove('open');
  sidebarOverlay?.classList.remove('active');
  sidebarOverlay?.setAttribute('aria-hidden', 'true');
  sidebarToggleBtn?.setAttribute('aria-expanded', 'false');
  const icon = sidebarToggleBtn?.querySelector('[data-lucide]');
  if (icon) { icon.setAttribute('data-lucide', 'menu'); updateLucideIcons(); }
}

function isMobile() {
  return window.innerWidth <= 1024;
}

sidebarToggleBtn?.addEventListener('click', () => {
  sidebar?.classList.contains('open') ? closeSidebar() : openSidebar();
});

sidebarOverlay?.addEventListener('click', closeSidebar);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sidebar?.classList.contains('open')) closeSidebar();
});

// Close drawer when a nav item is tapped on mobile
navButtons.forEach((btn) => {
  btn.addEventListener('click', () => { if (isMobile()) closeSidebar(); });
});

// ────────────────────────────────────────────────────────────────────────────


// ─── PRODUCT PICKER ─────────────────────────────────────────────────────────

function renderProductPickerList(filter = '') {
  const term = filter.trim().toLowerCase();
  const items = filterByUnit(state.inventory)
    .filter((item) => item.product && (!term || item.product.toLowerCase().includes(term)))
    .sort((a, b) => a.product.localeCompare(b.product, 'pt-BR'));

  productPickerList.innerHTML = '';

  if (!items.length) {
    productPickerEmpty.style.display = 'block';
    return;
  }

  productPickerEmpty.style.display = 'none';
  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const outOfStock = item.quantity <= 0;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'product-picker-item' + (outOfStock ? ' out-of-stock' : '');
    btn.dataset.product = item.product;
    btn.dataset.price = item.price;
    btn.dataset.unit = item.unit;
    btn.innerHTML = `
      <div class="product-picker-item-info">
        <span class="product-picker-item-name">${item.product}</span>
        <span class="product-picker-item-meta">
          Estoque: ${item.quantity} ${item.unit ? '· ' + item.unit : ''}${outOfStock ? ' · <strong>Sem estoque</strong>' : ''}
        </span>
      </div>
      <span class="product-picker-item-price">${formatCurrency(item.price)}</span>
    `;
    fragment.appendChild(btn);
  });

  productPickerList.appendChild(fragment);
}

function openProductPicker() {
  if (productPickerSearch) productPickerSearch.value = '';
  renderProductPickerList('');
  setModalVisibility(productPickerModal, true);
  setTimeout(() => productPickerSearch?.focus(), 80);
}

function closeProductPicker() {
  setModalVisibility(productPickerModal, false);
}

function selectProductFromPicker(product, price, unit) {
  // Fill the sales form fields
  if (saleProductInput) saleProductInput.value = product;
  if (salePriceInput) salePriceInput.value = normalizeNumber(price).toFixed(2).replace('.', ',');

  // Set unit select if it matches an option
  const unitSelect = salesForm?.querySelector('[name="unit"]');
  if (unitSelect && unit) {
    const option = [...unitSelect.options].find(
      (o) => o.value.toLowerCase() === unit.toLowerCase()
    );
    if (option) unitSelect.value = option.value;
  }

  closeProductPicker();
  // Focus quantity after selection
  document.getElementById('saleQuantity')?.focus();
}

// Product picker events
openProductPickerBtn?.addEventListener('click', openProductPicker);
closeProductPickerBtn?.addEventListener('click', closeProductPicker);

productPickerModal?.addEventListener('click', (e) => {
  if (e.target === productPickerModal) closeProductPicker();
});

productPickerSearch?.addEventListener('input', (e) => {
  renderProductPickerList(e.target.value);
});

productPickerList?.addEventListener('click', (e) => {
  const btn = e.target.closest('.product-picker-item');
  if (!btn) return;
  selectProductFromPicker(btn.dataset.product, btn.dataset.price, btn.dataset.unit);
});

// ────────────────────────────────────────────────────────────────────────────


// ─── DASHBOARD COLABORADORA ─────────────────────────────────────────────────

function getColabTopSeller() {
  // Returns top seller by quantity of products sold today
  const counter = new Map();
  getTodaySales().forEach((item) => {
    if (!item.seller) return;
    counter.set(item.seller, (counter.get(item.seller) || 0) + (item.quantity || 1));
  });
  if (!counter.size) return null;
  const [name, total] = [...counter.entries()].sort((a, b) => b[1] - a[1])[0];
  return { name, total };
}

function getAttendanceByProfessional() {
  // Count today's closed appointments grouped by professional
  const counter = new Map();
  getTodayClosedAppointments().forEach((item) => {
    const key = item.professional || 'Não informado';
    counter.set(key, (counter.get(key) || 0) + 1);
  });
  const entries = [...counter.entries()].sort((a, b) => b[1] - a[1]);
  return {
    labels: entries.map(([name]) => name),
    values: entries.map(([, count]) => count)
  };
}

function renderColabAttendanceChart() {
  const canvas = document.getElementById('colabAttendanceChart');
  if (!canvas || typeof window.Chart === 'undefined') return;

  const context = canvas.getContext('2d');
  const { labels, values } = getAttendanceByProfessional();
  const styles = getComputedStyle(document.documentElement);
  const gridColor = styles.getPropertyValue('--chart-grid').trim();
  const chartBorder = styles.getPropertyValue('--chart-border').trim();
  const tickColor = styles.getPropertyValue('--text-soft').trim();
  const backgroundPalette = [
    styles.getPropertyValue('--chart-1').trim(),
    styles.getPropertyValue('--chart-2').trim(),
    styles.getPropertyValue('--chart-3').trim(),
    styles.getPropertyValue('--chart-4').trim(),
    styles.getPropertyValue('--chart-5').trim(),
    styles.getPropertyValue('--chart-6').trim(),
    styles.getPropertyValue('--chart-7').trim()
  ];

  if (colabAttendanceChart) colabAttendanceChart.destroy();

  // Show empty state message inside chart area when no data
  const emptyLabels = labels.length ? labels : ['Sem atendimentos hoje'];
  const emptyValues = values.length ? values : [0];

  colabAttendanceChart = new Chart(context, {
    type: 'bar',
    data: {
      labels: emptyLabels,
      datasets: [{
        label: 'Atendimentos',
        data: emptyValues,
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: backgroundPalette,
        borderColor: chartBorder,
        maxBarThickness: 44
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 320, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              return ` ${ctx.parsed.y} atendimento${ctx.parsed.y !== 1 ? 's' : ''}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: tickColor }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: tickColor,
            stepSize: 1,
            callback(value) { return Number.isInteger(value) ? value : ''; }
          },
          grid: { color: gridColor }
        }
      }
    }
  });
}

function renderColabWaitingList() {
  const colabWaitingList = document.getElementById('colabWaitingList');
  const colabWaitingEmptyState = document.getElementById('colabWaitingEmptyState');
  const colabWaitingCount = document.getElementById('colabWaitingCount');
  if (!colabWaitingList) return;

  const waitingAppointments = getTodayAppointments('Em aguardo')
    .sort((a, b) => (parseDate(a.dateTime)?.getTime() || 0) - (parseDate(b.dateTime)?.getTime() || 0));

  colabWaitingList.innerHTML = '';
  if (colabWaitingEmptyState) colabWaitingList.appendChild(colabWaitingEmptyState);

  if (!waitingAppointments.length) {
    if (colabWaitingEmptyState) colabWaitingEmptyState.style.display = 'block';
    colabWaitingCount.textContent = '0';
    return;
  }

  if (colabWaitingEmptyState) colabWaitingEmptyState.style.display = 'none';
  colabWaitingCount.textContent = String(waitingAppointments.length);

  const fragment = document.createDocumentFragment();
  waitingAppointments.forEach((item) => {
    const initials = (item.client || '?')
      .split(/\s+/).slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase()).join('') || '?';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'waiting-item';
    button.dataset.row = String(item.rowNumber);
    button.innerHTML = `
      <span class="waiting-avatar">${initials}</span>
      <span class="waiting-info">
        <span class="waiting-name">${item.client || '-'}</span>
        <span class="waiting-meta">${item.service || '-'} · ${formatTime(item.dateTime)} · ${item.professional || '-'}</span>
      </span>
      <span class="waiting-action"><i data-lucide="chevron-right"></i></span>
    `;
    fragment.appendChild(button);
  });

  colabWaitingList.appendChild(fragment);
  updateLucideIcons();
}

function renderColabLowStockTable() {
  const colabLowStockTableBody = document.getElementById('colabLowStockTableBody');
  const colabLowStockEmptyState = document.getElementById('colabLowStockEmptyState');
  const colabLowStockCount = document.getElementById('colabLowStockCount');
  if (!colabLowStockTableBody) return;

  const lowStockItems = getLowStockProducts();
  colabLowStockTableBody.innerHTML = '';

  if (!lowStockItems.length) {
    colabLowStockEmptyState.style.display = 'block';
    colabLowStockCount.textContent = '0 itens';
    return;
  }

  colabLowStockEmptyState.style.display = 'none';
  const fragment = document.createDocumentFragment();
  lowStockItems.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${item.product}</td><td>${item.quantity}</td>`;
    fragment.appendChild(row);
  });
  colabLowStockTableBody.appendChild(fragment);
  colabLowStockCount.textContent = `${lowStockItems.length} ${lowStockItems.length === 1 ? 'item' : 'itens'}`;
}

function renderColabDashboard() {
  const colabTodayLabel = document.getElementById('colabTodayLabel');
  const colabKpiDone = document.getElementById('colabKpiAppointmentsDone');
  const colabStockAlertCard = document.getElementById('colabStockAlertCard');
  const colabKpiStockAlert = document.getElementById('colabKpiStockAlert');
  const colabKpiStockAlertText = document.getElementById('colabKpiStockAlertText');
  const colabTopSellerName = document.getElementById('colabTopSellerName');
  const colabTopSellerMeta = document.getElementById('colabTopSellerMeta');
  const colabTopProviderName = document.getElementById('colabTopProviderName');
  const colabTopProviderMeta = document.getElementById('colabTopProviderMeta');

  const today = getToday();
  if (colabTodayLabel) {
    colabTodayLabel.textContent = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(today);
  }

  const closedAppointments = getTodayClosedAppointments();
  const lowStockItems = getLowStockProducts();
  const topProvider = getTopProvider();
  const topSeller = getColabTopSeller();

  if (colabKpiDone) colabKpiDone.textContent = String(closedAppointments.length);

  if (colabStockAlertCard && colabKpiStockAlert && colabKpiStockAlertText) {
    if (lowStockItems.length) {
      colabStockAlertCard.classList.add('is-critical');
      colabKpiStockAlert.textContent = `${lowStockItems.length} ${lowStockItems.length === 1 ? 'item crítico' : 'itens críticos'}`;
      colabKpiStockAlertText.textContent = lowStockItems.slice(0, 2).map((i) => `${i.product} (${i.quantity})`).join(' · ');
    } else {
      colabStockAlertCard.classList.remove('is-critical');
      colabKpiStockAlert.textContent = 'Sem alertas';
      colabKpiStockAlertText.textContent = 'Nenhum item crítico no momento.';
    }
  }

  if (colabTopSellerName && colabTopSellerMeta) {
    if (topSeller) {
      colabTopSellerName.textContent = topSeller.name;
      colabTopSellerMeta.textContent = `${topSeller.total} ${topSeller.total === 1 ? 'produto vendido hoje' : 'produtos vendidos hoje'}`;
    } else {
      colabTopSellerName.textContent = '—';
      colabTopSellerMeta.textContent = 'Sem vendas registradas hoje.';
    }
  }

  if (colabTopProviderName && colabTopProviderMeta) {
    colabTopProviderName.textContent = topProvider.name;
    colabTopProviderMeta.textContent = `${topProvider.total} ${topProvider.total === 1 ? 'serviço finalizado hoje' : 'serviços finalizados hoje'}`;
  }

  renderColabWaitingList();
  renderColabLowStockTable();
  renderColabAttendanceChart();
}

// ────────────────────────────────────────────────────────────────────────────


// ─── LOGIN / SESSION ────────────────────────────────────────────────────────

function showLoginError(msg) {
  loginError.textContent = msg;
  loginError.classList.add('visible');
}

function hideLoginError() {
  loginError.textContent = '';
  loginError.classList.remove('visible');
}

function openLoginModal() {
  loginForm.reset();
  hideLoginError();
  setModalVisibility(loginModal, true);
  loginModal.classList.add('active');
  document.getElementById('loginUser').focus();
}

function closeLoginModal() {
  loginModal.classList.remove('active');
  loginModal.setAttribute('aria-hidden', 'true');
}

function applyAccessLevel(nivel) {
  const nivelKey = String(nivel || '').toLowerCase().trim();
  const isColab = nivelKey === 'colaboradora';
  const allowed = ACCESS_MAP[nivelKey] || ACCESS_MAP['colaboradora'];

  // STEP 1: Swap the dashboard button's data-section BEFORE checking visibility
  // so the allowed list ('dashboard-colab') matches the button's section correctly
  const dashNavBtn = document.querySelector(
    '.nav-button[data-section="dashboard"], .nav-button[data-section="dashboard-colab"]'
  );
  if (dashNavBtn) {
    dashNavBtn.dataset.section = isColab ? 'dashboard-colab' : 'dashboard';
  }

  // STEP 2: Show/hide buttons based on allowed sections
  navButtons.forEach((btn) => {
    const section = btn.dataset.section;
    if (allowed.includes(section)) {
      btn.removeAttribute('data-access');
      btn.style.display = '';
    } else {
      btn.setAttribute('data-access', 'hidden');
    }
  });

  // STEP 3: Navigate to first allowed section
  const firstAllowed = isColab ? 'dashboard-colab' : (allowed[0] || 'dashboard');
  switchSection(firstAllowed);
}

function setLoggedInUser(user) {
  state.currentUser = user;
  const nameEl = document.getElementById('sidebarUserName');
  const roleEl = document.getElementById('sidebarUserRole');
  const mobileNameEl = document.getElementById('mobileUserName');
  if (nameEl) nameEl.textContent = user.usuario || 'Usuária';
  if (roleEl) roleEl.textContent = capitalizeFirst(user.nivel || 'Colaboradora');
  if (mobileNameEl) mobileNameEl.textContent = user.usuario || 'Usuária';
  state.activeUnitFilter = null;
  showUnitFilterForAdmins();
  updateUnitFilterUI();
  applyAccessLevel(user.nivel);
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function handleLogout() {
  state.currentUser = null;
  sessionStorage.removeItem('beleza_session');
  // Reset sidebar
  const nameEl = document.getElementById('sidebarUserName');
  const roleEl = document.getElementById('sidebarUserRole');
  if (nameEl) nameEl.textContent = 'Usuária';
  if (roleEl) roleEl.textContent = 'Colaboradora';
  // Show all nav buttons again and restore dashboard nav
  navButtons.forEach((btn) => {
    btn.removeAttribute('data-access');
    btn.style.display = '';
  });
  state.activeUnitFilter = null;
  if (unitFilterBtn) unitFilterBtn.style.display = 'none';
  const dashNavBtn = document.querySelector('.nav-button[data-section="dashboard-colab"]');
  if (dashNavBtn) dashNavBtn.dataset.section = 'dashboard';
  openLoginModal();
}

async function authenticateUser(usuario, senha) {
  // Load all data first (GET), then check LOGIN sheet
  const result = await requestAPI('GET');
  const loginRows = Array.isArray(result.data?.LOGIN) ? result.data.LOGIN : [];

  const match = loginRows.find((row) => {
    const rowUser = String(row.USUARIO || '').trim().toLowerCase();
    const rowSenha = String(row.SENHA || '').trim();
    return rowUser === usuario.trim().toLowerCase() && rowSenha === senha.trim();
  });

  if (!match) {
    throw new Error('Usuário ou senha incorretos.');
  }

  return {
    usuario: String(match.USUARIO || '').trim(),
    nivel: String(match['NÍVEL'] || match.NIVEL || 'colaboradora').trim().toLowerCase(),
    unidade: String(match.UNIDADE || '').trim()
  };
}

// ────────────────────────────────────────────────────────────────────────────


async function init() {
  updateLucideIcons();
  initTheme();
  setupStaffSelects();

  // Try to restore session
  const savedSession = sessionStorage.getItem('beleza_session');
  if (savedSession) {
    try {
      const user = JSON.parse(savedSession);
      setLoggedInUser(user);
      closeLoginModal();
      renderLoadingState();
      await loadAllData();
      populateProductsDatalist();
      renderAll();
      return;
    } catch (_) {
      sessionStorage.removeItem('beleza_session');
    }
  }

  // Show login modal
  switchSection('dashboard');
  openLoginModal();
}

// Login form submit
loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideLoginError();

  const usuario = loginForm.querySelector('[name="usuario"]').value;
  const senha = loginForm.querySelector('[name="senha"]').value;

  if (!usuario || !senha) {
    showLoginError('Preencha usuário e senha.');
    return;
  }

  loginSubmitBtn.disabled = true;
  const label = loginSubmitBtn.querySelector('span');
  if (label) label.textContent = 'Entrando...';

  try {
    const user = await authenticateUser(usuario, senha);
    sessionStorage.setItem('beleza_session', JSON.stringify(user));
    setLoggedInUser(user);
    closeLoginModal();

    // Now load app data
    renderLoadingState();
    const result = await requestAPI('GET');
    const data = result.data || {};
    state.appointments = Array.isArray(data.AGENDAMENTOS) ? data.AGENDAMENTOS.map(mapAppointment) : [];
    state.sales = Array.isArray(data.VENDAS) ? data.VENDAS.map(mapSale) : [];
    state.inventory = Array.isArray(data.ESTOQUE) ? data.ESTOQUE.map(mapInventory) : [];
    state.clients = Array.isArray(data.CADASTROS) ? data.CADASTROS.map(mapClient) : [];
    populateProductsDatalist();
    renderAll();
  } catch (error) {
    showLoginError(error.message);
  } finally {
    loginSubmitBtn.disabled = false;
    if (label) label.textContent = 'Entrar';
  }
});

// Toggle password visibility
togglePasswordBtn?.addEventListener('click', () => {
  const input = document.getElementById('loginPassword');
  const icon = togglePasswordBtn.querySelector('[data-lucide]');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    if (icon) icon.setAttribute('data-lucide', 'eye');
  }
  updateLucideIcons();
});

// Logout
logoutBtn?.addEventListener('click', handleLogout);

init();