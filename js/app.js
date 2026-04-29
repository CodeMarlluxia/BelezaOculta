import {
  ACCESS_MAP,
  LOW_STOCK_THRESHOLD,
  RECORD_RETENTION_DAYS,
  REPORT_PERIODS,
  SHEETS,
  STAFF_OPTIONS,
  THEME_STORAGE_KEY,
  UNRESTRICTED_LEVELS,
} from './core/config.js';
import { state } from './core/state.js';
import { filterByUnit, getUnitFilter } from './core/access.js';
import * as dom from './core/dom.js';
import { requestAPI } from './services/api.service.js';
import {
  formatCurrency,
  formatCurrencyInput,
  formatPhone,
  normalizeNumber,
  normalizeText,
} from './utils/formatters.js';
import {
  formatDateTime,
  formatTime,
  getDateRangeForLastDays,
  getToday,
  isDateWithinRange,
  isSameDay,
  parseDate,
  toDateTimeLocalValue,
} from './utils/dates.js';
import { formatStatus, isCompletedStatus, isWaitingStatus } from './utils/status.js';
import { updateCount, updateLucideIcons } from './utils/dom-utils.js';
import { mapAppointment, mapClient, mapInventory, mapSale } from './services/records.mapper.js';
import { renderTableRows } from './utils/render.js';
import {
  getDailyRevenue,
  getLatestLowStockProduct,
  getLowStockProducts,
  getServicesRevenueReport,
  getTodayAppointments,
  getTodayClosedAppointments,
  getTodaySales,
  getTopProvider,
  getTopSeller,
  getWeeklyRevenueSeries,
} from './services/metrics.service.js';
import {
  buildAppointmentPayload,
  buildClientPayload,
  buildInventoryPayload,
  buildSalePayload,
} from './services/payloads.service.js';

const {
  body,
  sections,
  navButtons,
  pageTitle,
  themeToggleBtn,
  themeToggleLabel,
  feedbackBanner,
  openAppointmentModalBtn,
  refreshDashboardBtn,
  appointmentModal,
  appointmentDetailsModal,
  inventoryEditModal,
  clientEditModal,
  appointmentForm,
  salesForm,
  inventoryForm,
  inventoryEditForm,
  clientEditForm,
  clientsForm,
  closeAppointmentModalBtn,
  cancelAppointmentBtn,
  closeAppointmentDetailsModalBtn,
  closeAppointmentDetailsBtn,
  completeAppointmentBtn,
  closeInventoryEditModalBtn,
  cancelInventoryEditBtn,
  closeClientEditModalBtn,
  cancelClientEditBtn,
  appointmentProfessional,
  saleSeller,
  saleProductInput,
  saleProductsList,
  salePriceInput,
  saleQuantityInput,
  inventoryPriceInput,
  inventoryEditProductInput,
  inventoryEditQuantityInput,
  inventoryEditPriceInput,
  inventoryEditUnitInput,
  appointmentValueInput,
  clientPhoneInput,
  clientEditNameInput,
  clientEditPhoneInput,
  clientEditEmailInput,
  clientEditUnitInput,
  inventorySearchInput,
  waitingList,
  waitingEmptyState,
  waitingCount,
  detailsClient,
  detailsService,
  detailsProfessional,
  detailsValue,
  detailsUnit,
  detailsDateTime,
  detailsStatus,
  appointmentsTableBody,
  salesTableBody,
  inventoryTableBody,
  clientsTableBody,
  lowStockTableBody,
  appointmentsEmptyState,
  salesEmptyState,
  inventoryEmptyState,
  clientsEmptyState,
  lowStockEmptyState,
  appointmentsCount,
  salesCount,
  inventoryCount,
  clientsCount,
  lowStockCount,
  reportsCount,
  reportsTableBody,
  reportsEmptyState,
  reportRevenue7Days,
  reportAppointments7Days,
  reportServicesCount7Days,
  reportPeriodLabel,
  reportRevenueDescription,
  reportPeriodButtons,
  dashboardTodayLabel,
  kpiAppointmentsDone,
  kpiDailyRevenue,
  kpiStockAlert,
  kpiStockAlertText,
  stockAlertCard,
  topSellerName,
  topSellerMeta,
  topProviderName,
  topProviderMeta,
  sidebarToggleBtn,
  sidebarOverlay,
  sidebar,
  productPickerModal,
  productPickerSearch,
  productPickerList,
  productPickerEmpty,
  openProductPickerBtn,
  closeProductPickerBtn,
  loginModal,
  loginForm,
  loginError,
  loginSubmitBtn,
  togglePasswordBtn,
  logoutBtn,
} = dom;

let weeklyRevenueChart = null;
let colabAttendanceChart = null;

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

const FEEDBACK_ICONS = {
  success: 'circle-check',
  error: 'circle-x',
  warning: 'triangle-alert'
};

function setFeedback(message, type = 'success') {
  if (!feedbackBanner) return;

  // If already showing, animate out first then back in
  const wasVisible = feedbackBanner.classList.contains('success') ||
    feedbackBanner.classList.contains('error') ||
    feedbackBanner.classList.contains('warning');

  window.clearTimeout(setFeedback.timeoutId);
  window.clearTimeout(setFeedback.hideId);

  const icon = FEEDBACK_ICONS[type] || 'info';
  feedbackBanner.innerHTML = `
    <span class="feedback-banner-icon"><i data-lucide="${icon}"></i></span>
    <span class="feedback-banner-text">${message}</span>
  `;

  const show = () => {
    feedbackBanner.className = `feedback-banner ${type}`;
    updateLucideIcons();
    setFeedback.timeoutId = window.setTimeout(() => hideFeedback(), 4200);
  };

  if (wasVisible) {
    feedbackBanner.classList.add('hiding');
    setFeedback.hideId = window.setTimeout(show, 200);
  } else {
    show();
  }
}

function hideFeedback() {
  if (!feedbackBanner) return;
  feedbackBanner.classList.add('hiding');
  window.setTimeout(() => {
    feedbackBanner.className = 'feedback-banner';
    feedbackBanner.innerHTML = '';
  }, 320);
}

function getReportPeriodConfig(periodKey = state.reportPeriod) {
  return REPORT_PERIODS[periodKey] || REPORT_PERIODS.weekly;
}

function isWithinLastDays(value, days = RECORD_RETENTION_DAYS) {
  const date = parseDate(value);
  if (!date) return true;
  const { start, end } = getDateRangeForLastDays(days);
  return isDateWithinRange(date, start, end);
}

function isVisibleAppointment(item) {
  if (!isCompletedStatus(item.status)) return true;
  return isWithinLastDays(item.dateTime || item.createdAt, RECORD_RETENTION_DAYS);
}

function isVisibleSale(item) {
  return isWithinLastDays(item.createdAt, RECORD_RETENTION_DAYS);
}

function getVisibleAppointments() {
  return state.appointments.filter(isVisibleAppointment);
}

function getVisibleSales() {
  return state.sales.filter(isVisibleSale);
}

async function loadAllData() {
  const result = await requestAPI('GET');
  const data = result.data || {};
  state.appointments = Array.isArray(data.AGENDAMENTOS) ? data.AGENDAMENTOS.map(mapAppointment) : [];
  state.sales = Array.isArray(data.VENDAS) ? data.VENDAS.map(mapSale) : [];
  state.inventory = Array.isArray(data.ESTOQUE) ? data.ESTOQUE.map(mapInventory) : [];
  state.clients = Array.isArray(data.CADASTROS) ? data.CADASTROS.map(mapClient) : [];
}

function renderAppointments() {
  const filtered = filterByUnit(getVisibleAppointments());
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
  const filtered = filterByUnit(getVisibleSales());
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
  const searchQuery = normalizeText(state.inventorySearchQuery).toLocaleLowerCase('pt-BR');
  const filtered = filterByUnit(state.inventory).filter((item) => {
    if (!searchQuery) return true;
    const haystack = `${item.product || ''} ${item.unit || ''}`.toLocaleLowerCase('pt-BR');
    return haystack.includes(searchQuery);
  });
  const sorted = [...filtered].sort((a, b) => a.product.localeCompare(b.product, 'pt-BR'));
  renderTableRows(sorted, inventoryTableBody, inventoryEmptyState, (item) => `
    <td>${item.product || '-'}</td>
    <td>${item.quantity}</td>
    <td>${formatCurrency(item.price)}</td>
    <td>${item.unit || '-'}</td>
    <td>
      <div class="table-actions">
        <button
          type="button"
          class="table-action-button"
          data-action="edit-inventory"
          data-row="${item.rowNumber}"
        >Editar</button>
        <button
          type="button"
          class="table-action-button danger"
          data-action="delete-inventory"
          data-row="${item.rowNumber}"
        >Excluir</button>
      </div>
    </td>
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
    <td>
      <div class="table-actions">
        <button
          type="button"
          class="table-action-button"
          data-action="edit-client"
          data-row="${item.rowNumber}"
        >Editar</button>
        <button
          type="button"
          class="table-action-button danger"
          data-action="delete-client"
          data-row="${item.rowNumber}"
        >Excluir</button>
      </div>
    </td>
  `);
  updateCount(clientsCount, filtered.length);
}

function renderLowStockTable() {
  const latestLowStockItem = getLatestLowStockProduct();
  lowStockTableBody.innerHTML = '';
  if (!latestLowStockItem) {
    lowStockEmptyState.style.display = 'block';
    lowStockCount.textContent = '0 itens';
    return;
  }

  lowStockEmptyState.style.display = 'none';
  const row = document.createElement('tr');
  row.innerHTML = `<td>${latestLowStockItem.product}</td><td>${latestLowStockItem.quantity}</td>`;
  lowStockTableBody.appendChild(row);
  lowStockCount.textContent = '1 item';
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

function renderReports() {
  if (!reportsTableBody || !reportsEmptyState) return;

  const periodConfig = getReportPeriodConfig();
  const reportRows = getServicesRevenueReport(periodConfig.days);
  const totalRevenue = reportRows.reduce((sum, item) => sum + item.revenue, 0);
  const totalAppointments = reportRows.reduce((sum, item) => sum + item.appointments, 0);
  const uniqueServices = new Set(reportRows.map((item) => item.service.toLocaleLowerCase('pt-BR'))).size;

  if (reportPeriodLabel) reportPeriodLabel.textContent = periodConfig.description;
  if (reportRevenueDescription) reportRevenueDescription.textContent = `Serviços concluídos no período ${periodConfig.label.toLocaleLowerCase('pt-BR')}`;
  reportPeriodButtons?.forEach((button) => {
    button.classList.toggle('active', button.dataset.reportPeriod === state.reportPeriod);
    button.setAttribute('aria-pressed', String(button.dataset.reportPeriod === state.reportPeriod));
  });
  if (reportsEmptyState) reportsEmptyState.textContent = `Nenhum serviço com faturamento encontrado no período ${periodConfig.label.toLocaleLowerCase('pt-BR')}.`;

  if (reportRevenue7Days) reportRevenue7Days.textContent = formatCurrency(totalRevenue);
  if (reportAppointments7Days) reportAppointments7Days.textContent = String(totalAppointments);
  if (reportServicesCount7Days) reportServicesCount7Days.textContent = String(uniqueServices);

  updateCount(reportsCount, reportRows.length, 'serviço', 'serviços');

  renderTableRows(reportRows, reportsTableBody, reportsEmptyState, (item) => `
    <td>${item.service || '-'}</td>
    <td>${item.unit || '-'}</td>
    <td>${item.appointments}</td>
    <td>${formatCurrency(item.revenue)}</td>
    <td>${formatCurrency(item.averageTicket)}</td>
    <td>${formatDateTime(item.lastAttendance)}</td>
  `);
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

function getActiveSection() {
  const active = document.querySelector('.section.active');
  return active ? active.id : null;
}

function renderAll() {
  // Always re-render dashboards (KPIs, charts)
  renderDashboard();
  renderColabDashboard();

  // Only re-render the currently visible section table
  const section = getActiveSection();
  if (section === 'agendamentos') renderAppointments();
  else if (section === 'vendas') { renderSales(); populateProductsDatalist(); }
  else if (section === 'estoque') renderInventory();
  else if (section === 'relatorios') renderReports();
  else if (section === 'cadastros') renderClients();
}

function renderAllSections() {
  renderAppointments();
  renderSales();
  renderInventory();
  renderReports();
  renderClients();
  renderDashboard();
  renderColabDashboard();
}

function setModalVisibility(modal, visible) {
  if (!modal) return;
  if (!visible) {
    // Move focus out before hiding to prevent aria-hidden focus warning
    const focused = modal.querySelector(':focus');
    if (focused) focused.blur();
  }
  modal.classList.toggle('active', visible);
  modal.setAttribute('aria-hidden', visible ? 'false' : 'true');
  // Use inert to properly block interaction AND focus when hidden
  if (visible) {
    modal.removeAttribute('inert');
  } else {
    modal.setAttribute('inert', '');
  }
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

function openInventoryEditModal(rowNumber) {
  const inventoryItem = state.inventory.find((item) => item.rowNumber === Number(rowNumber));
  if (!inventoryItem) {
    setFeedback('Item de estoque não encontrado.', 'error');
    return;
  }

  state.selectedInventoryRow = inventoryItem.rowNumber;
  if (inventoryEditProductInput) inventoryEditProductInput.value = inventoryItem.product || '';
  if (inventoryEditQuantityInput) inventoryEditQuantityInput.value = String(inventoryItem.quantity ?? 0);
  if (inventoryEditPriceInput) inventoryEditPriceInput.value = normalizeNumber(inventoryItem.price).toFixed(2).replace('.', ',');
  if (inventoryEditUnitInput) inventoryEditUnitInput.value = inventoryItem.unit || '';

  setModalVisibility(inventoryEditModal, true);
  window.setTimeout(() => inventoryEditProductInput?.focus(), 80);
}

function closeInventoryEditModal() {
  state.selectedInventoryRow = null;
  inventoryEditForm?.reset();
  setModalVisibility(inventoryEditModal, false);
}

function openClientEditModal(rowNumber) {
  const client = state.clients.find((item) => item.rowNumber === Number(rowNumber));
  if (!client) {
    setFeedback('Cliente não encontrado.', 'error');
    return;
  }

  state.selectedClientRow = client.rowNumber;
  if (clientEditNameInput) clientEditNameInput.value = client.name || '';
  if (clientEditPhoneInput) clientEditPhoneInput.value = client.phone || '';
  if (clientEditEmailInput) clientEditEmailInput.value = client.email || '';
  if (clientEditUnitInput) clientEditUnitInput.value = client.unit || '';

  setModalVisibility(clientEditModal, true);
  window.setTimeout(() => clientEditNameInput?.focus(), 80);
}

function closeClientEditModal() {
  state.selectedClientRow = null;
  clientEditForm?.reset();
  setModalVisibility(clientEditModal, false);
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

  // Lazy-render the section being shown
  if (state.appointments.length || state.sales.length || state.inventory.length || state.clients.length) {
    if (sectionId === 'agendamentos') renderAppointments();
    else if (sectionId === 'vendas') { renderSales(); populateProductsDatalist(); }
    else if (sectionId === 'estoque') renderInventory();
    else if (sectionId === 'relatorios') renderReports();
    else if (sectionId === 'cadastros') renderClients();
    else if (sectionId === 'dashboard') renderDashboard();
    else if (sectionId === 'dashboard-colab') renderColabDashboard();
  }
}

function lockSubmitButton(form, isLoading, loadingLabel = 'Salvando...') {
  const submitButton = form.querySelector('button[type="submit"]');
  if (!submitButton) return;
  submitButton.disabled = isLoading;
  const label = submitButton.querySelector('span');
  if (!label) return;
  if (!label.dataset.defaultLabel) {
    label.dataset.defaultLabel = label.textContent.trim() || 'Confirmar';
  }
  label.textContent = isLoading ? loadingLabel : label.dataset.defaultLabel;
}

function flashButtonSuccess(form) {
  const btn = form?.querySelector('button[type="submit"]');
  if (!btn) return;
  btn.classList.add('btn-success');
  window.setTimeout(() => btn.classList.remove('btn-success'), 900);
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

async function updateInventoryRecord(rowNumber, payload) {
  return requestAPI('POST', {
    action: 'updateInventory',
    sheet: SHEETS.ESTOQUE,
    rowNumber,
    data: payload
  });
}

async function deleteInventoryRecord(rowNumber) {
  return requestAPI('POST', {
    action: 'deleteInventory',
    sheet: SHEETS.ESTOQUE,
    rowNumber
  });
}

async function updateClientRecord(rowNumber, payload) {
  return requestAPI('POST', {
    action: 'updateInventory',
    sheet: SHEETS.CADASTROS,
    rowNumber,
    data: payload
  });
}

async function deleteClientRecord(rowNumber) {
  return requestAPI('POST', {
    action: 'deleteInventory',
    sheet: SHEETS.CADASTROS,
    rowNumber
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
    renderAllSections();
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
  inventoryTableBody.innerHTML = '<tr><td colspan="5" class="loading-state">Carregando dados...</td></tr>';
  if (reportsTableBody) reportsTableBody.innerHTML = '<tr><td colspan="6" class="loading-state">Carregando dados...</td></tr>';
  clientsTableBody.innerHTML = '<tr><td colspan="5" class="loading-state">Carregando dados...</td></tr>';
  lowStockTableBody.innerHTML = '<tr><td colspan="2" class="loading-state">Carregando produtos...</td></tr>';
  if (reportRevenue7Days) reportRevenue7Days.textContent = 'R$ 0,00';
  if (reportAppointments7Days) reportAppointments7Days.textContent = '0';
  if (reportServicesCount7Days) reportServicesCount7Days.textContent = '0';
  if (reportsCount) reportsCount.textContent = '0 serviços';
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
closeInventoryEditModalBtn?.addEventListener('click', closeInventoryEditModal);
cancelInventoryEditBtn?.addEventListener('click', closeInventoryEditModal);
closeClientEditModalBtn?.addEventListener('click', closeClientEditModal);
cancelClientEditBtn?.addEventListener('click', closeClientEditModal);
refreshDashboardBtn?.addEventListener('click', () => handleRefreshData(true));
themeToggleBtn?.addEventListener('click', toggleTheme);

[appointmentModal, appointmentDetailsModal, inventoryEditModal, clientEditModal].forEach((modal) => {
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) {
      if (modal === inventoryEditModal) {
        closeInventoryEditModal();
        return;
      }
      if (modal === clientEditModal) {
        closeClientEditModal();
        return;
      }
      setModalVisibility(modal, false);
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (inventoryEditModal?.classList.contains('active')) closeInventoryEditModal();
  if (clientEditModal?.classList.contains('active')) closeClientEditModal();
  else if (appointmentDetailsModal?.classList.contains('active')) closeAppointmentDetailsModal();
  else if (appointmentModal?.classList.contains('active')) closeAppointmentModal();
});

[clientPhoneInput, clientEditPhoneInput].forEach((input) => {
  input?.addEventListener('input', (event) => {
    event.target.value = formatPhone(event.target.value);
  });
});

[salePriceInput, inventoryPriceInput, inventoryEditPriceInput, appointmentValueInput].forEach((input) => {
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

inventorySearchInput?.addEventListener('input', (event) => {
  state.inventorySearchQuery = event.target.value || '';
  renderInventory();
});

reportPeriodButtons?.forEach((button) => {
  button.addEventListener('click', () => {
    const nextPeriod = button.dataset.reportPeriod || 'weekly';
    if (!REPORT_PERIODS[nextPeriod]) return;
    state.reportPeriod = nextPeriod;
    renderReports();
  });
});

appointmentsTableBody?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="open-appointment-details"]');
  if (!button) return;
  openAppointmentDetails(button.dataset.row);
});

inventoryTableBody?.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-action="edit-inventory"]');
  if (editButton) {
    openInventoryEditModal(editButton.dataset.row);
    return;
  }

  const deleteButton = event.target.closest('[data-action="delete-inventory"]');
  if (!deleteButton) return;

  const rowNumber = Number(deleteButton.dataset.row || 0);
  const inventoryItem = state.inventory.find((item) => item.rowNumber === rowNumber);
  if (!inventoryItem) {
    setFeedback('Item de estoque não encontrado.', 'error');
    return;
  }

  const confirmed = window.confirm(`Deseja excluir o item "${inventoryItem.product}" do estoque?`);
  if (!confirmed) return;

  try {
    await deleteInventoryRecord(rowNumber);
    if (state.selectedInventoryRow === rowNumber) {
      closeInventoryEditModal();
    }
    await loadAllData();
    populateProductsDatalist();
    renderAllSections();
    setFeedback('Item de estoque excluído com sucesso.', 'success');
  } catch (error) {
    setFeedback(error.message, 'error');
  }
});

clientsTableBody?.addEventListener('click', async (event) => {
  const editButton = event.target.closest('[data-action="edit-client"]');
  if (editButton) {
    openClientEditModal(editButton.dataset.row);
    return;
  }

  const deleteButton = event.target.closest('[data-action="delete-client"]');
  if (!deleteButton) return;

  const rowNumber = Number(deleteButton.dataset.row || 0);
  const client = state.clients.find((item) => item.rowNumber === rowNumber);
  if (!client) {
    setFeedback('Cliente não encontrado.', 'error');
    return;
  }

  const confirmed = window.confirm(`Deseja excluir o cadastro de "${client.name}"?`);
  if (!confirmed) return;

  try {
    await deleteClientRecord(rowNumber);
    if (state.selectedClientRow === rowNumber) {
      closeClientEditModal();
    }
    await loadAllData();
    renderAllSections();
    setFeedback('Cliente excluído com sucesso.', 'success');
  } catch (error) {
    setFeedback(error.message, 'error');
  }
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
    flashButtonSuccess(appointmentForm);
    closeAppointmentModal();
    setFeedback('Agendamento feito com sucesso.', 'success');
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
    flashButtonSuccess(salesForm);
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
    flashButtonSuccess(inventoryForm);
    inventoryForm.reset();
    setFeedback('Item de estoque salvo com sucesso.', 'success');
  } catch (error) {
    setFeedback(error.message, 'error');
  } finally {
    lockSubmitButton(inventoryForm, false);
  }
});

inventoryEditForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!inventoryEditForm.reportValidity()) return;

  const rowNumber = Number(state.selectedInventoryRow || 0);
  if (!rowNumber) {
    setFeedback('Não foi possível identificar o item selecionado para edição.', 'error');
    return;
  }

  lockSubmitButton(inventoryEditForm, true, 'Salvando...');
  const payload = buildInventoryPayload(new FormData(inventoryEditForm));

  try {
    await updateInventoryRecord(rowNumber, payload);

    const inventoryItem = state.inventory.find((item) => item.rowNumber === rowNumber);
    if (inventoryItem) {
      inventoryItem.product = payload.PRODUTO;
      inventoryItem.quantity = payload.QUANTIDADE;
      inventoryItem.price = payload['PREÇO'];
      inventoryItem.unit = payload.UNIDADE;
    }

    populateProductsDatalist();
    renderAll();
    closeInventoryEditModal();
    setFeedback('Item de estoque atualizado com sucesso.', 'success');
  } catch (error) {
    setFeedback(error.message, 'error');
  } finally {
    lockSubmitButton(inventoryEditForm, false, 'Salvando...');
  }
});

clientEditForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!clientEditForm.reportValidity()) return;

  const rowNumber = Number(state.selectedClientRow || 0);
  if (!rowNumber) {
    setFeedback('Não foi possível identificar o cliente selecionado para edição.', 'error');
    return;
  }

  lockSubmitButton(clientEditForm, true, 'Salvando...');
  const payload = buildClientPayload(new FormData(clientEditForm));

  try {
    await updateClientRecord(rowNumber, payload);

    const client = state.clients.find((item) => item.rowNumber === rowNumber);
    if (client) {
      client.name = payload.CLIENTE;
      client.phone = payload.TELEFONE;
      client.email = payload['E-MAIL'];
      client.unit = payload.UNIDADE;
    }

    renderAll();
    closeClientEditModal();
    setFeedback('Cliente atualizado com sucesso.', 'success');
  } catch (error) {
    setFeedback(error.message, 'error');
  } finally {
    lockSubmitButton(clientEditForm, false, 'Salvando...');
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
    flashButtonSuccess(clientsForm);
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

let _pickerSearchTimer = null;
productPickerSearch?.addEventListener('input', (e) => {
  clearTimeout(_pickerSearchTimer);
  _pickerSearchTimer = setTimeout(() => renderProductPickerList(e.target.value), 120);
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

  const latestLowStockItem = getLatestLowStockProduct();
  colabLowStockTableBody.innerHTML = '';

  if (!latestLowStockItem) {
    colabLowStockEmptyState.style.display = 'block';
    colabLowStockCount.textContent = '0 itens';
    return;
  }

  colabLowStockEmptyState.style.display = 'none';
  const row = document.createElement('tr');
  row.innerHTML = `<td>${latestLowStockItem.product}</td><td>${latestLowStockItem.quantity}</td>`;
  colabLowStockTableBody.appendChild(row);
  colabLowStockCount.textContent = '1 item';
}

// Cache collab dashboard DOM refs once
const _colabEls = {};
function getColabEl(id) {
  if (!_colabEls[id]) _colabEls[id] = document.getElementById(id);
  return _colabEls[id];
}

function renderColabDashboard() {
  const colabTodayLabel = getColabEl('colabTodayLabel');
  const colabKpiDone = getColabEl('colabKpiAppointmentsDone');
  const colabStockAlertCard = getColabEl('colabStockAlertCard');
  const colabKpiStockAlert = getColabEl('colabKpiStockAlert');
  const colabKpiStockAlertText = getColabEl('colabKpiStockAlertText');
  const colabTopSellerName = getColabEl('colabTopSellerName');
  const colabTopSellerMeta = getColabEl('colabTopSellerMeta');
  const colabTopProviderName = getColabEl('colabTopProviderName');
  const colabTopProviderMeta = getColabEl('colabTopProviderMeta');

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
  loginModal.classList.add('active');
  loginModal.setAttribute('aria-hidden', 'false');
  loginModal.removeAttribute('inert');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('loginUser')?.focus(), 80);
}

function closeLoginModal() {
  // Blur focused element inside login modal before hiding
  const focused = loginModal?.querySelector(':focus');
  if (focused) focused.blur();
  loginModal.classList.remove('active');
  loginModal.setAttribute('aria-hidden', 'true');
  loginModal.setAttribute('inert', '');
  document.body.style.overflow = '';
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