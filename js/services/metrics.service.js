import { LOW_STOCK_THRESHOLD } from '../core/config.js';
import { state } from '../core/state.js';
import { filterByUnit } from '../core/access.js';
import { getDateRangeForLastDays, getToday, isDateWithinRange, isSameDay, parseDate } from '../utils/dates.js';
import { normalizeNumber, normalizeText } from '../utils/formatters.js';
import { formatStatus, isCompletedStatus } from '../utils/status.js';

export function getLowStockProducts() {
  return filterByUnit(state.inventory)
    .filter((item) => item.quantity <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.quantity - b.quantity || a.product.localeCompare(b.product, 'pt-BR'));
}

export function getLatestLowStockProduct() {
  const lowStockItems = getLowStockProducts();
  if (!lowStockItems.length) return null;

  return [...lowStockItems].sort((a, b) => {
    const dateA = parseDate(a.createdAt)?.getTime() || 0;
    const dateB = parseDate(b.createdAt)?.getTime() || 0;
    return dateB - dateA || b.rowNumber - a.rowNumber;
  })[0];
}

export function getTodayAppointments(statusFilter = null) {
  const today = getToday();
  return filterByUnit(state.appointments).filter((item) => {
    const date = parseDate(item.dateTime || item.createdAt);
    if (!isSameDay(date, today)) return false;
    return statusFilter ? formatStatus(item.status).toLowerCase() === formatStatus(statusFilter).toLowerCase() : true;
  });
}

export function getTodayClosedAppointments() {
  return getTodayAppointments('Concluído');
}

export function getTodaySales() {
  const today = getToday();
  return filterByUnit(state.sales).filter((item) => isSameDay(parseDate(item.createdAt), today));
}

export function getDailyRevenue() {
  const appointmentsTotal = getTodayClosedAppointments().reduce((total, item) => total + normalizeNumber(item.value), 0);
  const salesTotal = getTodaySales().reduce((total, item) => total + (normalizeNumber(item.price) * normalizeNumber(item.quantity)), 0);
  return appointmentsTotal + salesTotal;
}

export function getTopProvider() {
  const counter = new Map();
  getTodayClosedAppointments().forEach((item) => {
    const key = item.professional || 'Não informado';
    counter.set(key, (counter.get(key) || 0) + 1);
  });

  const [name = '—', total = 0] = [...counter.entries()].sort((a, b) => b[1] - a[1])[0] || [];
  return { name, total };
}

export function getTopSeller() {
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

export function getWeeklyRevenueSeries() {
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

export function getAppointmentsWithRevenueLastDays(days = 7) {
  const { start, end } = getDateRangeForLastDays(days);

  return filterByUnit(state.appointments).filter((item) => {
    const appointmentDate = parseDate(item.dateTime || item.createdAt);
    const serviceName = normalizeText(item.service);
    return (
      isCompletedStatus(item.status) &&
      normalizeNumber(item.value) > 0 &&
      !!serviceName &&
      isDateWithinRange(appointmentDate, start, end)
    );
  });
}

export function getServicesRevenueReport(days = 7) {
  const reportMap = new Map();

  getAppointmentsWithRevenueLastDays(days).forEach((item) => {
    const service = normalizeText(item.service);
    const unit = normalizeText(item.unit) || '—';
    const revenue = normalizeNumber(item.value);
    const appointmentDate = parseDate(item.dateTime || item.createdAt);
    const key = `${service.toLocaleLowerCase('pt-BR')}__${unit.toLocaleLowerCase('pt-BR')}`;

    if (!reportMap.has(key)) {
      reportMap.set(key, {
        service,
        unit,
        appointments: 0,
        revenue: 0,
        lastAttendance: appointmentDate
      });
    }

    const current = reportMap.get(key);
    current.appointments += 1;
    current.revenue += revenue;

    if (appointmentDate && (!current.lastAttendance || appointmentDate.getTime() > current.lastAttendance.getTime())) {
      current.lastAttendance = appointmentDate;
    }
  });

  return [...reportMap.values()]
    .map((item) => ({
      ...item,
      averageTicket: item.appointments ? item.revenue / item.appointments : 0
    }))
    .sort((a, b) =>
      b.revenue - a.revenue ||
      b.appointments - a.appointments ||
      a.service.localeCompare(b.service, 'pt-BR')
    );
}
