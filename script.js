const API_BASE_URL = "https://script.google.com/macros/s/AKfycbyVNqoHcQUE9w8v1KDZGRuceuCgXGsiZRXFo3bIF5HOTdLiJpvgVaKs7vK4z3N8BoCF/exec";

const STORAGE_KEYS = {
    theme: "beleza_oculta_theme"
};

const LOW_STOCK_LIMIT = 5;
const DEFAULT_LOGIN = {
    email: "Elane",
    password: "BOH2026"
};

const MONTHS_PT_BR = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" }
];

const SHEET_NAMES = {
    appointments: "AGENDAMENTOS",
    products: "CAD. PRODUTOS",
    clients: "CAD. CLIENTES",
    sales: "VENDAS"
};

const COLUMN_MAP = {
    appointments: {
        id: "ID",
        client: "NOME CLIENTE",
        service: "SERVIÇO",
        professional: "PROFISSIONAL",
        value: "VALOR",
        date: "DATA E HORA"
    },
    products: {
        id: "ID",
        name: "PRODUTO",
        quantity: "QUANTIDADE",
        price: "PREÇO"
    },
    clients: {
        id: "ID",
        name: "NOME",
        phone: "TELEFONE",
        email: "E-MAIL"
    },
    sales: {
        id: "ID",
        productName: "PRODUTO",
        customer: "CLIENTE",
        quantity: "QUANTIDADE",
        unitPrice: "PREÇO UNITÁRIO",
        total: "TOTAL",
        date: "DATA"
    }
};

const state = {
    appointments: [],
    products: [],
    clients: [],
    sales: [],
    currentSectionId: "dashboard",
    selectedAppointmentId: null,
    editingAppointmentId: null,
    editingSaleId: null,
    chartAnimationFrame: null,
    dashboardRenderFrame: null,
    metricsCache: null,
    revenueChartCache: [],
    isAuthenticated: false,
    lastTouched: {
        appointments: null,
        products: null,
        clients: null,
        sales: null
    },
    ui: {
        toasts: new Map()
    }
};

const el = {
    html: document.documentElement,
    loginScreen: document.getElementById("loginScreen"),
    appShell: document.getElementById("appShell"),
    loginForm: document.getElementById("loginForm"),
    loginEmail: document.getElementById("loginEmail"),
    loginPassword: document.getElementById("loginPassword"),
    togglePasswordBtn: document.getElementById("togglePasswordBtn"),
    logoutBtn: document.getElementById("logoutBtn"),

    themeToggleBtn: document.getElementById("themeToggleBtn"),
    navLinks: document.querySelectorAll(".nav-link"),
    pageTitle: document.getElementById("pageTitle"),
    sidebar: document.getElementById("sidebar"),
    mobileMenuBtn: document.getElementById("mobileMenuBtn"),
    mobileSidebarOverlay: document.getElementById("mobileSidebarOverlay"),

    metricAppointments: document.getElementById("metricAppointments"),
    metricRevenue: document.getElementById("metricRevenue"),
    metricLowStock: document.getElementById("metricLowStock"),
    metricClients: document.getElementById("metricClients"),
    metricProducts: document.getElementById("metricProducts"),
    metricAverageTicket: document.getElementById("metricAverageTicket"),
    metricProductsSold: document.getElementById("metricProductsSold"),
    dashboardAppointments: document.getElementById("dashboardAppointments"),
    dashboardLowStock: document.getElementById("dashboardLowStock"),
    revenueChart: document.getElementById("revenueChart"),

    appointmentForm: document.getElementById("appointmentForm"),
    appointmentId: document.getElementById("appointmentId"),
    appointmentClient: document.getElementById("appointmentClient"),
    appointmentService: document.getElementById("appointmentService"),
    appointmentProfessional: document.getElementById("appointmentProfessional"),
    appointmentDay: document.getElementById("appointmentDay"),
    appointmentMonth: document.getElementById("appointmentMonth"),
    appointmentYear: document.getElementById("appointmentYear"),
    appointmentHour: document.getElementById("appointmentHour"),
    appointmentMinute: document.getElementById("appointmentMinute"),
    appointmentDatePreview: document.getElementById("appointmentDatePreview"),
    appointmentTimePreview: document.getElementById("appointmentTimePreview"),
    appointmentValue: document.getElementById("appointmentValue"),
    appointmentSearch: document.getElementById("appointmentSearch"),
    appointmentsBoard: document.getElementById("appointmentsBoard"),
    appointmentModal: document.getElementById("appointmentModal"),
    appointmentModalTitle: document.getElementById("appointmentModalTitle"),
    appointmentSubmitBtn: document.getElementById("appointmentSubmitBtn"),
    openAppointmentModalBtn: document.getElementById("openAppointmentModalBtn"),

    finishAppointmentModal: document.getElementById("finishAppointmentModal"),
    finishAppointmentContent: document.getElementById("finishAppointmentContent"),
    confirmFinishAppointmentBtn: document.getElementById("confirmFinishAppointmentBtn"),

    productForm: document.getElementById("productForm"),
    productId: document.getElementById("productId"),
    productName: document.getElementById("productName"),
    productQuantity: document.getElementById("productQuantity"),
    productPrice: document.getElementById("productPrice"),
    productsTableBody: document.getElementById("productsTableBody"),
    stockFormTitle: document.getElementById("stockFormTitle"),
    productSubmitBtn: document.getElementById("productSubmitBtn"),
    cancelEditBtn: document.getElementById("cancelEditBtn"),
    productModal: document.getElementById("productModal"),
    openProductModalBtn: document.getElementById("openProductModalBtn"),

    clientForm: document.getElementById("clientForm"),
    clientName: document.getElementById("clientName"),
    clientPhone: document.getElementById("clientPhone"),
    clientEmail: document.getElementById("clientEmail"),
    clientSearch: document.getElementById("clientSearch"),
    clientsTableBody: document.getElementById("clientsTableBody"),
    clientModal: document.getElementById("clientModal"),
    openClientModalBtn: document.getElementById("openClientModalBtn"),

    saleForm: document.getElementById("saleForm"),
    saleId: document.getElementById("saleId"),
    saleProduct: document.getElementById("saleProduct"),
    saleCustomer: document.getElementById("saleCustomer"),
    saleQuantity: document.getElementById("saleQuantity"),
    saleUnitPrice: document.getElementById("saleUnitPrice"),
    saleSearch: document.getElementById("saleSearch"),
    salesTableBody: document.getElementById("salesTableBody"),
    saleModal: document.getElementById("saleModal"),
    saleModalTitle: document.getElementById("saleModalTitle"),
    saleSubmitBtn: document.getElementById("saleSubmitBtn"),
    openSaleModalBtn: document.getElementById("openSaleModalBtn"),

    closeModalButtons: document.querySelectorAll("[data-close-modal]")
};

function renderLucideIcons() {
    if (window.lucide) window.lucide.createIcons();
    ensureSpinnerStyle();
}

function ensureSpinnerStyle() {
    let styleTag = document.getElementById("spin-loader-style");
    if (styleTag) return;

    styleTag = document.createElement("style");
    styleTag.id = "spin-loader-style";
    styleTag.textContent = `
    .spin-loader {
      animation: spinLoader .9s linear infinite;
    }
    @keyframes spinLoader {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
    document.head.appendChild(styleTag);
}

function ensureToastStack() {
    let toastStack = document.getElementById("toastStack");

    if (!toastStack) {
        toastStack = document.createElement("div");
        toastStack.id = "toastStack";
        toastStack.className = "toast-stack";
        document.body.appendChild(toastStack);
    }

    return toastStack;
}

function createToast({ type = "loading", title, message = "", autoClose = false, duration = 2600 }) {
    const stack = ensureToastStack();
    const toastId = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const iconMap = {
        loading: "loader-circle",
        success: "check-check",
        error: "triangle-alert"
    };

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.dataset.toastId = toastId;
    toast.dataset.autoclose = autoClose ? "true" : "false";
    toast.innerHTML = `
        <div class="toast__icon">
            <i data-lucide="${iconMap[type] || "info"}" class="${type === "loading" ? "spin-loader" : ""}"></i>
        </div>
        <div class="toast__content">
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
        <div class="toast__progress" style="${autoClose ? `animation-duration:${duration}ms;` : ""}"></div>
    `;

    stack.appendChild(toast);
    state.ui.toasts.set(toastId, toast);
    renderLucideIcons();

    if (autoClose) {
        window.setTimeout(() => removeToast(toastId), duration);
    }

    return toastId;
}

function updateToast(toastId, { type = "success", title, message = "", autoClose = true, duration = 2600 }) {
    const toast = state.ui.toasts.get(toastId);
    if (!toast) return;

    toast.className = `toast toast--${type}`;
    toast.dataset.autoclose = autoClose ? "true" : "false";

    const iconMap = {
        loading: "loader-circle",
        success: "check-check",
        error: "triangle-alert"
    };

    toast.innerHTML = `
        <div class="toast__icon">
            <i data-lucide="${iconMap[type] || "info"}" class="${type === "loading" ? "spin-loader" : ""}"></i>
        </div>
        <div class="toast__content">
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
        <div class="toast__progress" style="${autoClose ? `animation-duration:${duration}ms;` : ""}"></div>
    `;

    renderLucideIcons();

    if (autoClose) {
        window.setTimeout(() => removeToast(toastId), duration);
    }
}

function removeToast(toastId) {
    const toast = state.ui.toasts.get(toastId);
    if (!toast) return;

    toast.classList.add("is-leaving");

    window.setTimeout(() => {
        toast.remove();
        state.ui.toasts.delete(toastId);
    }, 220);
}

function showFeedbackToastLoading(title, message) {
    return createToast({
        type: "loading",
        title,
        message,
        autoClose: false
    });
}

function showFeedbackToastSuccess(toastId, title, message) {
    updateToast(toastId, {
        type: "success",
        title,
        message,
        autoClose: true,
        duration: 2400
    });
}

function showFeedbackToastError(toastId, title, message) {
    if (toastId && state.ui.toasts.has(toastId)) {
        updateToast(toastId, {
            type: "error",
            title,
            message,
            autoClose: true,
            duration: 3200
        });
        return;
    }

    createToast({
        type: "error",
        title,
        message,
        autoClose: true,
        duration: 3200
    });
}

function markRecentlyTouched(collectionKey, id) {
    if (!id) return;
    state.lastTouched[collectionKey] = id;

    window.setTimeout(() => {
        if (state.lastTouched[collectionKey] === id) {
            state.lastTouched[collectionKey] = null;
        }
    }, 1800);
}

function highlightIfTouched(collectionKey, id) {
    return state.lastTouched[collectionKey] === id ? "flash-created" : "";
}

function normalizeText(value) {
    return String(value ?? "").trim();
}

function toNumber(value) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    let normalized = String(value ?? "").trim();

    if (!normalized) return 0;

    normalized = normalized.replace(/\s/g, "").replace(/[R$]/g, "");

    const hasComma = normalized.includes(",");
    const hasDot = normalized.includes(".");

    if (hasComma && hasDot) {
        const lastComma = normalized.lastIndexOf(",");
        const lastDot = normalized.lastIndexOf(".");

        if (lastComma > lastDot) {
            normalized = normalized.replace(/\./g, "").replace(",", ".");
        } else {
            normalized = normalized.replace(/,/g, "");
        }
    } else if (hasComma) {
        normalized = normalized.replace(",", ".");
    }

    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : 0;
}

function toInteger(value) {
    const numeric = Number(String(value ?? "").replace(",", "."));
    return Number.isInteger(numeric) ? numeric : 0;
}

function buildJsonHeaders() {
    return {
        "Content-Type": "text/plain;charset=utf-8"
    };
}

function parseFlexibleDate(value) {
    if (value == null || value === "") return null;

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value;
    }

    const text = String(value).trim();
    if (!text) return null;

    const brDateTime = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[\s,]+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (brDateTime) {
        const day = Number(brDateTime[1]);
        const month = Number(brDateTime[2]) - 1;
        const year = Number(brDateTime[3]);
        const hour = Number(brDateTime[4] || 0);
        const minute = Number(brDateTime[5] || 0);
        const second = Number(brDateTime[6] || 0);
        const parsed = new Date(year, month, day, hour, minute, second);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    const isoLike = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
    if (isoLike) {
        const year = Number(isoLike[1]);
        const month = Number(isoLike[2]) - 1;
        const day = Number(isoLike[3]);
        const hour = Number(isoLike[4] || 0);
        const minute = Number(isoLike[5] || 0);
        const second = Number(isoLike[6] || 0);
        const parsed = new Date(year, month, day, hour, minute, second);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    const direct = new Date(text);
    if (!Number.isNaN(direct.getTime())) {
        return direct;
    }

    return null;
}

function sameCalendarDay(dateA, dateB) {
    return (
        dateA.getDate() === dateB.getDate() &&
        dateA.getMonth() === dateB.getMonth() &&
        dateA.getFullYear() === dateB.getFullYear()
    );
}

function addDays(baseDate, days) {
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
}

function parseAppointmentFormPayload() {
    const dateTime = buildAppointmentISODateTime();

    if (!dateTime) {
        throw new Error("Preencha corretamente a data e o horário.");
    }

    return {
        "NOME CLIENTE": normalizeText(el.appointmentClient.value),
        "SERVIÇO": normalizeText(el.appointmentService.value),
        "PROFISSIONAL": normalizeText(el.appointmentProfessional.value),
        "VALOR": toNumber(el.appointmentValue.value),
        "DATA E HORA": dateTime
    };
}

function appointmentFromPayload(id, data) {
    return {
        id: normalizeText(id),
        client: normalizeText(data["NOME CLIENTE"]),
        service: normalizeText(data["SERVIÇO"]),
        professional: normalizeText(data["PROFISSIONAL"]),
        value: toNumber(data["VALOR"]),
        date: normalizeText(data["DATA E HORA"])
    };
}

function productFromPayload(id, data) {
    return {
        id: normalizeText(id),
        name: normalizeText(data["PRODUTO"]),
        quantity: toInteger(data["QUANTIDADE"]),
        price: toNumber(data["PREÇO"])
    };
}

function clientFromPayload(id, data) {
    return {
        id: normalizeText(id),
        name: normalizeText(data["NOME"]),
        phone: normalizeText(data["TELEFONE"]),
        email: normalizeText(data["E-MAIL"])
    };
}

function saleFromPayload(id, data) {
    return {
        id: normalizeText(id),
        productName: normalizeText(data["PRODUTO"]),
        customer: normalizeText(data["CLIENTE"]),
        quantity: toInteger(data["QUANTIDADE"]),
        unitPrice: toNumber(data["PREÇO UNITÁRIO"]),
        total: toNumber(data["TOTAL"]),
        date: normalizeText(data["DATA"])
    };
}

function upsertById(list, item) {
    const index = list.findIndex((entry) => entry.id === item.id);

    if (index === -1) {
        list.unshift(item);
        return;
    }

    list[index] = item;
}

function removeById(list, id) {
    const index = list.findIndex((entry) => entry.id === id);
    if (index !== -1) {
        list.splice(index, 1);
    }
}

function invalidateDashboardCache() {
    state.metricsCache = null;
    state.revenueChartCache = [];
}

function buildRevenueDataLast7Days() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayMap = new Map();

    for (const sale of state.sales) {
        const saleDate = parseFlexibleDate(sale.date);
        if (!saleDate) continue;

        saleDate.setHours(0, 0, 0, 0);
        const key = saleDate.toISOString().slice(0, 10);
        dayMap.set(key, (dayMap.get(key) || 0) + toNumber(sale.total));
    }

    const result = [];

    for (let i = 6; i >= 0; i -= 1) {
        const baseDate = addDays(today, -i);
        const key = baseDate.toISOString().slice(0, 10);
        const label = baseDate.toLocaleDateString("pt-BR", { weekday: "short" });

        result.push({
            label: label.charAt(0).toUpperCase() + label.slice(1).replace(".", ""),
            total: toNumber(dayMap.get(key) || 0)
        });
    }

    return result;
}

function computeDashboardMetrics() {
    if (state.metricsCache) {
        return state.metricsCache;
    }

    const now = new Date();
    const todayAppointments = [];
    let todayRevenue = 0;
    let todayProductsSold = 0;
    let totalTransactions = 0;
    const lowStock = [];
    const totalClients = state.clients.length;
    const totalProducts = state.products.length;

    for (const appointment of state.appointments) {
        const appointmentDate = parseFlexibleDate(appointment.date);
        if (appointmentDate && sameCalendarDay(appointmentDate, now)) {
            todayAppointments.push(appointment);
        }
    }

    todayAppointments.sort((a, b) => {
        const dateA = parseFlexibleDate(a.date);
        const dateB = parseFlexibleDate(b.date);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
    });

    for (const product of state.products) {
        if (toNumber(product.quantity) <= LOW_STOCK_LIMIT) {
            lowStock.push(product);
        }
    }

    for (const sale of state.sales) {
        const saleDate = parseFlexibleDate(sale.date);
        if (saleDate && sameCalendarDay(saleDate, now)) {
            todayRevenue += toNumber(sale.total);
            todayProductsSold += toNumber(sale.quantity);
            totalTransactions += 1;
        }
    }

    state.revenueChartCache = buildRevenueDataLast7Days();
    state.metricsCache = {
        todayAppointments,
        lowStock,
        todayRevenue,
        todayProductsSold,
        totalTransactions,
        averageTicket: totalTransactions ? todayRevenue / totalTransactions : 0,
        totalClients,
        totalProducts
    };

    return state.metricsCache;
}

function scheduleDashboardRender({ animateChart = true } = {}) {
    if (state.dashboardRenderFrame) {
        cancelAnimationFrame(state.dashboardRenderFrame);
    }

    state.dashboardRenderFrame = requestAnimationFrame(() => {
        state.dashboardRenderFrame = null;
        renderDashboard(animateChart);
    });
}

async function parseJsonResponse(response) {
    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch (error) {
        console.error("Resposta não JSON:", text);
        throw new Error("A resposta do Apps Script não está em JSON válido.");
    }
}

function extractApiData(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    if (payload && payload.success === true && Array.isArray(payload.data)) return payload.data;
    if (payload && payload.success === true && payload.data && typeof payload.data === "object") return payload.data;
    if (payload && payload.success === true) return payload;
    if (payload && payload.error) throw new Error(payload.error);
    if (payload && payload.success === false) throw new Error(payload.message || "Erro retornado pela API.");
    if (payload && typeof payload === "object") return payload;
    return [];
}

async function apiGet(action) {
    const response = await fetch(`${API_BASE_URL}?action=${encodeURIComponent(action)}`, {
        method: "GET"
    });

    const payload = await parseJsonResponse(response);
    return extractApiData(payload);
}

async function apiPost(action, payload = {}) {
    const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: buildJsonHeaders(),
        body: JSON.stringify({
            action,
            ...payload
        })
    });

    const result = await parseJsonResponse(response);

    if (result?.success === false) {
        throw new Error(result.message || "Erro ao enviar dados.");
    }

    if (result?.error) {
        throw new Error(result.error);
    }

    return result;
}

function getActionBySheet(sheetName) {
    if (sheetName === SHEET_NAMES.appointments) return "appointments";
    if (sheetName === SHEET_NAMES.products) return "products";
    if (sheetName === SHEET_NAMES.clients) return "clients";
    if (sheetName === SHEET_NAMES.sales) return "sales";
    throw new Error("Aba não mapeada.");
}

async function listSheet(sheetName) {
    return apiGet(getActionBySheet(sheetName));
}

async function createSheetRow(sheetName, data) {
    return apiPost("create", {
        sheet: sheetName,
        data
    });
}

async function updateSheetRow(sheetName, id, data) {
    return apiPost("update", {
        sheet: sheetName,
        id,
        data
    });
}

async function deleteSheetRow(sheetName, id) {
    return apiPost("delete", {
        sheet: sheetName,
        id
    });
}

function setButtonProcessing(button, isProcessing, processingText) {
    if (!button) return;

    if (isProcessing) {
        button.dataset.originalHtml = button.innerHTML;
        button.disabled = true;
        button.classList.add("is-processing");
        button.innerHTML = `<i data-lucide="loader-circle" class="spin-loader"></i> ${processingText}`;
        renderLucideIcons();
        return;
    }

    button.disabled = false;
    button.classList.remove("is-processing");
    if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
    }
    renderLucideIcons();
}

async function withProcessing(button, processingText, callback, options = {}) {
    const {
        loadingTitle = "Salvando informações",
        loadingMessage = "Aguarde enquanto os dados são enviados para a planilha.",
        successTitle = "Alteração concluída",
        successMessage = "Os dados foram atualizados com sucesso.",
        errorTitle = "Falha ao salvar"
    } = options;

    const toastId = showFeedbackToastLoading(loadingTitle, loadingMessage);

    try {
        setButtonProcessing(button, true, processingText);
        const result = await callback();
        showFeedbackToastSuccess(toastId, successTitle, successMessage);
        return result;
    } catch (error) {
        showFeedbackToastError(toastId, errorTitle, error.message || "Não foi possível concluir a operação.");
        throw error;
    } finally {
        setButtonProcessing(button, false, processingText);
    }
}

function mapAppointmentRow(item) {
    const map = COLUMN_MAP.appointments;
    return {
        id: normalizeText(item[map.id]),
        client: normalizeText(item[map.client]),
        service: normalizeText(item[map.service]),
        professional: normalizeText(item[map.professional]),
        value: toNumber(item[map.value]),
        date: normalizeText(item[map.date])
    };
}

function mapProductRow(item) {
    const map = COLUMN_MAP.products;
    return {
        id: normalizeText(item[map.id]),
        name: normalizeText(item[map.name]),
        quantity: toInteger(item[map.quantity]),
        price: toNumber(item[map.price])
    };
}

function mapClientRow(item) {
    const map = COLUMN_MAP.clients;
    return {
        id: normalizeText(item[map.id]),
        name: normalizeText(item[map.name]),
        phone: normalizeText(item[map.phone]),
        email: normalizeText(item[map.email])
    };
}

function mapSaleRow(item) {
    const map = COLUMN_MAP.sales;
    return {
        id: normalizeText(item[map.id]),
        productName: normalizeText(item[map.productName]),
        customer: normalizeText(item[map.customer]),
        quantity: toInteger(item[map.quantity]),
        unitPrice: toNumber(item[map.unitPrice]),
        total: toNumber(item[map.total]),
        date: normalizeText(item[map.date])
    };
}

async function loadAppointments() {
    const rows = await listSheet(SHEET_NAMES.appointments);
    state.appointments = Array.isArray(rows) ? rows.map(mapAppointmentRow) : [];
    invalidateDashboardCache();
}

async function loadProducts() {
    const rows = await listSheet(SHEET_NAMES.products);
    state.products = Array.isArray(rows) ? rows.map(mapProductRow) : [];
    invalidateDashboardCache();
}

async function loadClients() {
    const rows = await listSheet(SHEET_NAMES.clients);
    state.clients = Array.isArray(rows) ? rows.map(mapClientRow) : [];
    invalidateDashboardCache();
}

async function loadSales() {
    const rows = await listSheet(SHEET_NAMES.sales);
    state.sales = Array.isArray(rows) ? rows.map(mapSaleRow) : [];
    invalidateDashboardCache();
}

async function initializeAppData() {
    try {
        await Promise.all([
            loadAppointments(),
            loadProducts(),
            loadClients(),
            loadSales()
        ]);

        renderAll();
    } catch (error) {
        console.error("Erro detalhado ao carregar dados:", error);
        alert(`Erro ao carregar dados do Google Sheets.\n\nDetalhe: ${error.message}`);
    }
}

function setAuth() {
    state.isAuthenticated = true;
}

function clearAuth() {
    state.isAuthenticated = false;
}

function isAuthenticated() {
    return state.isAuthenticated;
}

function setTheme(theme) {
    el.html.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);

    const icon = theme === "dark" ? "sun" : "moon";
    el.themeToggleBtn.innerHTML = `<i data-lucide="${icon}"></i>`;
    renderLucideIcons();
}

function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "light";
    setTheme(savedTheme);
}

function updateAuthView() {
    el.loginScreen.classList.toggle("hidden", isAuthenticated());
    el.appShell.classList.toggle("hidden", !isAuthenticated());
    renderLucideIcons();
}

function handleLogin(event) {
    event.preventDefault();

    const email = normalizeText(el.loginEmail.value);
    const password = normalizeText(el.loginPassword.value);

    if (email === DEFAULT_LOGIN.email && password === DEFAULT_LOGIN.password) {
        setAuth();
        el.loginForm.reset();
        updateAuthView();
        initializeAppData();
        return;
    }

    alert("Usuário ou senha inválidos.");
}

function handleLogout() {
    clearAuth();
    closeAllModals();
    closeMobileSidebar();
    updateAuthView();
}

function togglePasswordVisibility() {
    const isPassword = el.loginPassword.type === "password";
    el.loginPassword.type = isPassword ? "text" : "password";
    el.togglePasswordBtn.innerHTML = `<i data-lucide="${isPassword ? "eye-off" : "eye"}"></i>`;
    renderLucideIcons();
}

function isMobileLayout() {
    return window.innerWidth <= 991;
}

function openMobileSidebar() {
    if (!isMobileLayout()) return;
    el.sidebar.classList.add("is-open");
    el.mobileSidebarOverlay.classList.add("active");
}

function closeMobileSidebar() {
    el.sidebar.classList.remove("is-open");
    el.mobileSidebarOverlay.classList.remove("active");
}

function toggleMobileSidebar() {
    if (el.sidebar.classList.contains("is-open")) {
        closeMobileSidebar();
    } else {
        openMobileSidebar();
    }
}

function handleResponsiveSidebar() {
    if (!isMobileLayout()) {
        closeMobileSidebar();
    }
}

function formatCurrency(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatDateTime(dateString) {
    const date = parseFlexibleDate(dateString);
    if (!date) return normalizeText(dateString) || "Data inválida";

    return date.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        hour12: false
    });
}

function getInitials(name) {
    return normalizeText(name)
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
}

function isToday(dateString) {
    const date = parseFlexibleDate(dateString);
    if (!date) return false;
    return sameCalendarDay(date, new Date());
}

function openModal(modalElement) {
    modalElement.classList.add("active");
    document.body.style.overflow = "hidden";
    renderLucideIcons();
}

function closeModal(modalElement) {
    modalElement.classList.remove("active");
    if (!document.querySelector(".modal-overlay.active")) {
        document.body.style.overflow = "";
    }
}

function closeAllModals() {
    [
        el.appointmentModal,
        el.finishAppointmentModal,
        el.productModal,
        el.clientModal,
        el.saleModal
    ].forEach((modal) => modal.classList.remove("active"));

    document.body.style.overflow = "";
}

function populateDateAndTimeFields() {
    el.appointmentDay.innerHTML = '<option value="">Dia</option>' +
        Array.from({ length: 31 }, (_, i) => {
            const value = String(i + 1).padStart(2, "0");
            return `<option value="${value}">${value}</option>`;
        }).join("");

    el.appointmentMonth.innerHTML = '<option value="">Mês</option>' +
        MONTHS_PT_BR.map((month) => `<option value="${month.value}">${month.label}</option>`).join("");

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear + i);
    el.appointmentYear.innerHTML = '<option value="">Ano</option>' +
        years.map((year) => `<option value="${year}">${year}</option>`).join("");

    el.appointmentHour.innerHTML = '<option value="">Hora</option>' +
        Array.from({ length: 24 }, (_, i) => {
            const value = String(i).padStart(2, "0");
            return `<option value="${value}">${value}</option>`;
        }).join("");

    el.appointmentMinute.innerHTML = '<option value="">Min</option>' +
        Array.from({ length: 60 }, (_, i) => {
            const value = String(i).padStart(2, "0");
            return `<option value="${value}">${value}</option>`;
        }).join("");
}

function getAppointmentDateValue() {
    const day = el.appointmentDay.value;
    const month = el.appointmentMonth.value;
    const year = el.appointmentYear.value;

    if (!day || !month || !year) return "";

    const date = new Date(`${year}-${month}-${day}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "";

    if (
        date.getFullYear() !== Number(year) ||
        date.getMonth() + 1 !== Number(month) ||
        date.getDate() !== Number(day)
    ) {
        return "";
    }

    return `${day}/${month}/${year}`;
}

function getAppointmentTimeValue() {
    const hour = el.appointmentHour.value;
    const minute = el.appointmentMinute.value;

    if (!hour || !minute) return "";
    return `${hour}:${minute}`;
}

function buildAppointmentISODateTime() {
    const day = el.appointmentDay.value;
    const month = el.appointmentMonth.value;
    const year = el.appointmentYear.value;
    const hour = el.appointmentHour.value;
    const minute = el.appointmentMinute.value;

    if (!day || !month || !year || !hour || !minute) return "";

    const iso = `${year}-${month}-${day}T${hour}:${minute}`;
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) return "";

    if (
        date.getFullYear() !== Number(year) ||
        date.getMonth() + 1 !== Number(month) ||
        date.getDate() !== Number(day)
    ) {
        return "";
    }

    return iso;
}

function updateDateTimePreview() {
    const formattedDate = getAppointmentDateValue();
    const formattedTime = getAppointmentTimeValue();

    el.appointmentDatePreview.textContent = formattedDate || "Selecione uma data";
    el.appointmentTimePreview.textContent = formattedTime || "Selecione um horário";
}

function setAppointmentDateTimeFromISO(isoString) {
    const date = parseFlexibleDate(isoString);
    if (!date) return;

    el.appointmentDay.value = String(date.getDate()).padStart(2, "0");
    el.appointmentMonth.value = String(date.getMonth() + 1).padStart(2, "0");
    el.appointmentYear.value = String(date.getFullYear());
    el.appointmentHour.value = String(date.getHours()).padStart(2, "0");
    el.appointmentMinute.value = String(date.getMinutes()).padStart(2, "0");

    updateDateTimePreview();
}

function resetAppointmentForm() {
    state.editingAppointmentId = null;
    el.appointmentForm.reset();
    el.appointmentId.value = "";
    el.appointmentModalTitle.textContent = "Novo Agendamento";
    el.appointmentSubmitBtn.innerHTML = `<i data-lucide="check"></i> Salvar Agendamento`;
    populateDateAndTimeFields();
    updateDateTimePreview();
    renderLucideIcons();
}

function resetProductForm() {
    el.productForm.reset();
    el.productId.value = "";
    el.stockFormTitle.textContent = "Cadastrar Produto";
    el.productSubmitBtn.innerHTML = `<i data-lucide="save"></i> Salvar Produto`;
    renderLucideIcons();
}

function resetClientForm() {
    el.clientForm.reset();
}

function resetSaleForm() {
    state.editingSaleId = null;
    el.saleForm.reset();
    el.saleId.value = "";
    el.saleModalTitle.textContent = "Nova Venda de Produto";
    el.saleSubmitBtn.innerHTML = `<i data-lucide="shopping-bag"></i> Salvar Venda`;

    populateSaleProducts();

    el.saleProduct.value = "";
    el.saleUnitPrice.value = "";

    renderLucideIcons();
}

function changeSection(sectionId, buttonElement) {
    if (sectionId === state.currentSectionId) {
        closeMobileSidebar();
        return;
    }

    const currentSection = document.getElementById(state.currentSectionId);
    const nextSection = document.getElementById(sectionId);

    el.navLinks.forEach((link) => link.classList.remove("active"));
    buttonElement.classList.add("active");
    el.pageTitle.textContent = buttonElement.querySelector("span").textContent;

    currentSection?.classList.remove("active");
    nextSection.classList.add("active");

    state.currentSectionId = sectionId;
    closeMobileSidebar();
}

function animateCount(element, endValue, { duration = 700, isCurrency = false } = {}) {
    const startValue = Number(element.dataset.value || 0);
    const finalValue = Number(endValue);

    if (startValue === finalValue) {
        element.textContent = isCurrency ? formatCurrency(finalValue) : Math.round(finalValue).toString();
        return;
    }

    const startTime = performance.now();

    function update(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startValue + (finalValue - startValue) * eased;

        element.textContent = isCurrency ? formatCurrency(current) : Math.round(current).toString();

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.dataset.value = finalValue;
            element.textContent = isCurrency ? formatCurrency(finalValue) : Math.round(finalValue).toString();
        }
    }

    requestAnimationFrame(update);
}

function renderDashboard(animateChart = true) {
    const metrics = computeDashboardMetrics();

    animateCount(el.metricAppointments, metrics.todayAppointments.length);
    animateCount(el.metricRevenue, metrics.todayRevenue, { isCurrency: true });
    animateCount(el.metricLowStock, metrics.lowStock.length);
    animateCount(el.metricClients, metrics.totalClients);
    animateCount(el.metricProducts, metrics.totalProducts);
    animateCount(el.metricAverageTicket, metrics.averageTicket, { isCurrency: true });
    animateCount(el.metricProductsSold, metrics.todayProductsSold);

    renderDashboardAppointments(metrics.todayAppointments);
    renderDashboardLowStock(metrics.lowStock);

    requestAnimationFrame(() => {
        renderRevenueChart(animateChart);
    });
}

function renderDashboardAppointments(items) {
    if (items.length === 0) {
        el.dashboardAppointments.innerHTML = `<div class="empty-state">Nenhum atendimento para hoje.</div>`;
        return;
    }

    el.dashboardAppointments.innerHTML = items
        .slice(0, 8)
        .map((item) => `
      <button class="list-item list-item--clickable ${highlightIfTouched("appointments", item.id)}" onclick="openFinishAppointmentModal('${item.id}')">
        <strong>${item.client}</strong>
        <small>${item.service} • ${item.professional}</small><br>
        <small>${formatDateTime(item.date)} • ${formatCurrency(item.value)}</small>
      </button>
    `)
        .join("");
}

function renderDashboardLowStock(items) {
    if (items.length === 0) {
        el.dashboardLowStock.innerHTML = `<div class="empty-state">Nenhum alerta de estoque.</div>`;
        return;
    }

    el.dashboardLowStock.innerHTML = items
        .map((item) => `
      <div class="list-item ${highlightIfTouched("products", item.id)}">
        <strong>${item.name}</strong>
        <small>Quantidade atual: ${item.quantity}</small>
      </div>
    `)
        .join("");
}

function renderRevenueChart(animate = false) {
    const canvas = el.revenueChart;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const data = state.revenueChartCache.length ? state.revenueChartCache : buildRevenueDataLast7Days();
    const parent = canvas.parentElement;
    const width = parent.clientWidth;
    const height = window.innerWidth <= 640 ? 190 : window.innerWidth <= 991 ? 220 : 240;
    const dpr = window.devicePixelRatio || 1;
    const theme = document.documentElement.getAttribute("data-theme");
    const rootStyle = getComputedStyle(document.documentElement);

    const textSoft = rootStyle.getPropertyValue("--text-soft").trim() || "#81638b";
    const strongPrimary = rootStyle.getPropertyValue("--mocha").trim() || "#503459";
    const mediumPrimary = rootStyle.getPropertyValue("--rose-gold").trim() || "#81638b";
    const softPrimary = rootStyle.getPropertyValue("--rose-gold-soft").trim() || "#b695c0";
    const baseLineColor = theme === "dark" ? "rgba(216, 197, 221, 0.26)" : "rgba(129, 99, 139, 0.20)";
    const valueTextColor = theme === "dark" ? "#f7eef9" : strongPrimary;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const padding = { top: 20, right: 20, bottom: 35, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...data.map((item) => toNumber(item.total)), 100);
    const barWidth = Math.max((chartWidth / data.length) - 12, 18);

    if (state.chartAnimationFrame) {
        cancelAnimationFrame(state.chartAnimationFrame);
    }

    function draw(progress = 1) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        ctx.beginPath();
        ctx.strokeStyle = baseLineColor;
        ctx.lineWidth = 1;
        ctx.moveTo(padding.left, padding.top + chartHeight);
        ctx.lineTo(width - padding.right, padding.top + chartHeight);
        ctx.stroke();

        data.forEach((item, index) => {
            const numericTotal = toNumber(item.total);
            const x = padding.left + index * (barWidth + 12) + 6;
            const targetHeight = (numericTotal / maxValue) * (chartHeight - 15);
            const barHeight = targetHeight * progress;
            const y = padding.top + chartHeight - barHeight;

            const gradient = ctx.createLinearGradient(0, y, 0, padding.top + chartHeight);

            if (theme === "dark") {
                gradient.addColorStop(0, softPrimary);
                gradient.addColorStop(0.55, mediumPrimary);
                gradient.addColorStop(1, "rgba(80, 52, 89, 0.34)");
            } else {
                gradient.addColorStop(0, strongPrimary);
                gradient.addColorStop(0.58, mediumPrimary);
                gradient.addColorStop(1, "rgba(182, 149, 192, 0.38)");
            }

            drawRoundedRect(ctx, x, y, barWidth, Math.max(barHeight, 8), 10, gradient);

            ctx.fillStyle = valueTextColor;
            ctx.font = window.innerWidth <= 640 ? "11px Segoe UI" : "12px Segoe UI";
            ctx.textAlign = "center";
            ctx.fillText(progress > 0.98 && numericTotal > 0 ? `R$ ${numericTotal.toFixed(0)}` : "-", x + barWidth / 2, y - 8);

            ctx.fillStyle = textSoft;
            ctx.fillText(item.label, x + barWidth / 2, padding.top + chartHeight + 18);
        });
    }

    if (!animate) {
        draw(1);
        return;
    }

    const start = performance.now();
    const duration = 650;

    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        draw(eased);

        if (progress < 1) {
            state.chartAnimationFrame = requestAnimationFrame(step);
        }
    }

    state.chartAnimationFrame = requestAnimationFrame(step);
}

function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
}

function openAppointmentCreateModal() {
    resetAppointmentForm();
    openModal(el.appointmentModal);
}

function editAppointment(id) {
    const item = state.appointments.find((a) => a.id === id);
    if (!item) return;

    state.editingAppointmentId = id;
    el.appointmentId.value = item.id;
    el.appointmentClient.value = item.client;
    el.appointmentService.value = item.service;
    el.appointmentProfessional.value = item.professional;
    el.appointmentValue.value = item.value;

    setAppointmentDateTimeFromISO(item.date);

    el.appointmentModalTitle.textContent = "Editar Agendamento";
    el.appointmentSubmitBtn.innerHTML = `<i data-lucide="pencil"></i> Atualizar Agendamento`;
    renderLucideIcons();
    openModal(el.appointmentModal);
}

function renderAppointmentSection({ animateChart = false } = {}) {
    renderAppointments();
    scheduleDashboardRender({ animateChart });
    renderLucideIcons();
}

async function saveAppointment(event) {
    event.preventDefault();

    let data;

    try {
        data = parseAppointmentFormPayload();
    } catch (validationError) {
        alert(validationError.message);
        return;
    }

    const isEditing = Boolean(state.editingAppointmentId);

    try {
        await withProcessing(el.appointmentSubmitBtn, "Salvando...", async () => {
            if (isEditing) {
                await updateSheetRow(SHEET_NAMES.appointments, state.editingAppointmentId, data);

                const updatedAppointment = appointmentFromPayload(state.editingAppointmentId, data);
                upsertById(state.appointments, updatedAppointment);
                markRecentlyTouched("appointments", updatedAppointment.id);
            } else {
                const result = await createSheetRow(SHEET_NAMES.appointments, data);
                const createdAppointment = appointmentFromPayload(result.id, data);
                upsertById(state.appointments, createdAppointment);
                markRecentlyTouched("appointments", createdAppointment.id);
            }

            invalidateDashboardCache();
            renderAppointmentSection({ animateChart: true });
            resetAppointmentForm();
            closeModal(el.appointmentModal);
        }, {
            loadingTitle: isEditing ? "Atualizando agendamento" : "Salvando agendamento",
            loadingMessage: "Por favor, aguarde.",
            successTitle: isEditing ? "Agendamento atualizado" : "Agendamento salvo",
            successMessage: isEditing
                ? "A alteração do agendamento foi confirmada com sucesso."
                : "O novo agendamento foi registrado com sucesso.",
            errorTitle: "Falha ao salvar agendamento"
        });
    } catch (error) {
        console.error(error);
        alert(error.message || "Não foi possível salvar o agendamento.");
    }
}

async function deleteAppointment(id) {
    if (!confirm("Deseja realmente excluir este agendamento?")) return;

    try {
        const toastId = showFeedbackToastLoading("Excluindo agendamento", "Aguarde enquanto a exclusão é processada.");
        await deleteSheetRow(SHEET_NAMES.appointments, id);

        removeById(state.appointments, id);
        invalidateDashboardCache();
        renderAppointmentSection({ animateChart: true });

        showFeedbackToastSuccess(toastId, "Agendamento excluído", "O registro foi removido com sucesso.");
    } catch (error) {
        console.error(error);
        showFeedbackToastError(null, "Falha ao excluir", error.message || "Não foi possível excluir o agendamento.");
        alert(error.message || "Não foi possível excluir o agendamento.");
    }
}

function openFinishAppointmentModal(id) {
    const appointment = state.appointments.find((item) => item.id === id);
    if (!appointment) return;

    state.selectedAppointmentId = id;

    el.finishAppointmentContent.innerHTML = `
    <h4>${appointment.client}</h4>
    <p><strong>Serviço:</strong> ${appointment.service}</p>
    <p><strong>Profissional:</strong> ${appointment.professional}</p>
    <p><strong>Data/Hora:</strong> ${formatDateTime(appointment.date)}</p>
    <p><strong>Valor:</strong> ${formatCurrency(appointment.value)}</p>
  `;

    openModal(el.finishAppointmentModal);
}

async function finishAppointment() {
    if (!state.selectedAppointmentId) return;

    const appointment = state.appointments.find((item) => item.id === state.selectedAppointmentId);
    if (!appointment) return;

    const salePayload = {
        "PRODUTO": appointment.service,
        "CLIENTE": appointment.client,
        "QUANTIDADE": 1,
        "PREÇO UNITÁRIO": Number(appointment.value),
        "TOTAL": Number(appointment.value),
        "DATA": new Date().toISOString()
    };

    try {
        await withProcessing(el.confirmFinishAppointmentBtn, "Encerrando...", async () => {
            const saleResult = await createSheetRow(SHEET_NAMES.sales, salePayload);
            await deleteSheetRow(SHEET_NAMES.appointments, appointment.id);

            const createdSale = saleFromPayload(saleResult.id, salePayload);
            upsertById(state.sales, createdSale);
            removeById(state.appointments, appointment.id);

            markRecentlyTouched("sales", createdSale.id);
            invalidateDashboardCache();

            renderAppointments();
            renderSales();
            scheduleDashboardRender({ animateChart: true });
            closeModal(el.finishAppointmentModal);
            state.selectedAppointmentId = null;
        }, {
            loadingTitle: "Encerrando atendimento",
            loadingMessage: "A venda correspondente está sendo gerada.",
            successTitle: "Atendimento encerrado",
            successMessage: "A ação foi confirmada e refletida no sistema.",
            errorTitle: "Falha ao encerrar atendimento"
        });
    } catch (error) {
        console.error(error);
        alert(error.message || "Não foi possível encerrar o atendimento.");
    }
}

function renderAppointments(filteredAppointments = state.appointments) {
    if (filteredAppointments.length === 0) {
        el.appointmentsBoard.innerHTML = `<div class="empty-state">Nenhum agendamento encontrado.</div>`;
        return;
    }

    const sorted = [...filteredAppointments].sort((a, b) => {
        const dateA = parseFlexibleDate(a.date);
        const dateB = parseFlexibleDate(b.date);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
    });

    el.appointmentsBoard.innerHTML = sorted
        .map((item) => `
      <article class="appointment-card ${highlightIfTouched("appointments", item.id)}">
        <div class="appointment-card__top">
          <div class="appointment-card__client">
            <div class="client-avatar">${getInitials(item.client)}</div>
            <div>
              <h4>${item.client}</h4>
              <span>${item.service}</span>
            </div>
          </div>

          <div class="professional-chip">
            <div class="professional-avatar">${getInitials(item.professional)}</div>
            <strong>${item.professional}</strong>
          </div>
        </div>

        <div class="appointment-card__meta">
          <div class="appointment-meta-item">
            <i data-lucide="calendar"></i>
            <span>${formatDateTime(item.date)}</span>
          </div>
          <div class="appointment-meta-item">
            <i data-lucide="wallet"></i>
            <span>${formatCurrency(item.value)}</span>
          </div>
          <div class="appointment-meta-item">
            <i data-lucide="badge-info"></i>
            <span>Agendado</span>
          </div>
        </div>

        <div class="table-actions">
          <button class="icon-btn success" onclick="openFinishAppointmentModal('${item.id}')" title="Encerrar atendimento">
            <i data-lucide="check"></i>
          </button>
          <button class="icon-btn edit" onclick="editAppointment('${item.id}')" title="Editar agendamento">
            <i data-lucide="pencil"></i>
          </button>
          <button class="icon-btn delete" onclick="deleteAppointment('${item.id}')" title="Excluir">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </article>
    `)
        .join("");

    renderLucideIcons();
}

function filterAppointments() {
    const searchTerm = el.appointmentSearch.value.toLowerCase().trim();

    renderAppointments(
        state.appointments.filter((item) =>
            item.client.toLowerCase().includes(searchTerm) ||
            item.service.toLowerCase().includes(searchTerm) ||
            item.professional.toLowerCase().includes(searchTerm)
        )
    );
}

function renderProductSection({ animateChart = false } = {}) {
    renderProducts();
    populateSaleProducts();
    scheduleDashboardRender({ animateChart });
    renderLucideIcons();
}

async function saveProduct(event) {
    event.preventDefault();

    const id = normalizeText(el.productId.value);
    const data = {
        "PRODUTO": normalizeText(el.productName.value),
        "QUANTIDADE": toInteger(el.productQuantity.value),
        "PREÇO": toNumber(el.productPrice.value)
    };

    try {
        await withProcessing(el.productSubmitBtn, "Salvando...", async () => {
            if (id) {
                await updateSheetRow(SHEET_NAMES.products, id, data);
                upsertById(state.products, productFromPayload(id, data));
                markRecentlyTouched("products", id);
            } else {
                const result = await createSheetRow(SHEET_NAMES.products, data);
                const createdProduct = productFromPayload(result.id, data);
                upsertById(state.products, createdProduct);
                markRecentlyTouched("products", createdProduct.id);
            }

            invalidateDashboardCache();
            renderProductSection({ animateChart: true });
            resetProductForm();
            closeModal(el.productModal);
        }, {
            loadingTitle: id ? "Atualizando produto" : "Salvando produto",
            loadingMessage: "Por favor, aguarde.",
            successTitle: id ? "Produto atualizado" : "Produto cadastrado",
            successMessage: "A alteração foi confirmada com sucesso.",
            errorTitle: "Falha ao salvar produto"
        });
    } catch (error) {
        console.error(error);
        alert(error.message || "Não foi possível salvar o produto.");
    }
}

function editProduct(id) {
    const product = state.products.find((item) => item.id === id);
    if (!product) return;

    el.productId.value = product.id;
    el.productName.value = product.name;
    el.productQuantity.value = product.quantity;
    el.productPrice.value = product.price;
    el.stockFormTitle.textContent = "Editar Produto";
    el.productSubmitBtn.innerHTML = `<i data-lucide="pencil"></i> Atualizar Produto`;
    renderLucideIcons();

    openModal(el.productModal);
}

async function deleteProduct(id) {
    if (!confirm("Deseja realmente excluir este produto?")) return;

    try {
        const toastId = showFeedbackToastLoading("Excluindo produto", "Aguarde enquanto a exclusão é processada.");
        await deleteSheetRow(SHEET_NAMES.products, id);

        removeById(state.products, id);
        invalidateDashboardCache();
        renderProductSection({ animateChart: true });
        resetProductForm();

        showFeedbackToastSuccess(toastId, "Produto excluído", "O produto foi removido com sucesso.");
    } catch (error) {
        console.error(error);
        showFeedbackToastError(null, "Falha ao excluir", error.message || "Não foi possível excluir o produto.");
        alert(error.message || "Não foi possível excluir o produto.");
    }
}

function getStockStatus(quantity) {
    return Number(quantity) <= LOW_STOCK_LIMIT
        ? `<span class="stock-badge low">Reposição Necessária</span>`
        : `<span class="stock-badge ok">Normal</span>`;
}

function renderProducts() {
    if (state.products.length === 0) {
        el.productsTableBody.innerHTML = `<tr><td colspan="5" class="empty-state">Nenhum produto cadastrado.</td></tr>`;
        return;
    }

    el.productsTableBody.innerHTML = state.products
        .map((item) => `
      <tr class="${highlightIfTouched("products", item.id)}">
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.price)}</td>
        <td>${getStockStatus(item.quantity)}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn edit" onclick="editProduct('${item.id}')" title="Editar">
              <i data-lucide="pencil"></i>
            </button>
            <button class="icon-btn delete" onclick="deleteProduct('${item.id}')" title="Excluir">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `)
        .join("");

    renderLucideIcons();
}

function renderClientSection({ animateChart = false } = {}) {
    renderClients();
    scheduleDashboardRender({ animateChart });
    renderLucideIcons();
}

async function saveClient(event) {
    event.preventDefault();

    const submitButton = el.clientForm.querySelector('button[type="submit"]');

    const data = {
        "NOME": normalizeText(el.clientName.value),
        "TELEFONE": normalizeText(el.clientPhone.value),
        "E-MAIL": normalizeText(el.clientEmail.value)
    };

    try {
        await withProcessing(submitButton, "Salvando...", async () => {
            const result = await createSheetRow(SHEET_NAMES.clients, data);
            const createdClient = clientFromPayload(result.id, data);
            upsertById(state.clients, createdClient);
            markRecentlyTouched("clients", createdClient.id);

            invalidateDashboardCache();
            renderClientSection({ animateChart: true });
            resetClientForm();
            closeModal(el.clientModal);
        }, {
            loadingTitle: "Salvando cliente",
            loadingMessage: "Criando cadastro do cliente.",
            successTitle: "Cliente cadastrado",
            successMessage: "O cadastro foi concluído com sucesso.",
            errorTitle: "Falha ao salvar cliente"
        });
    } catch (error) {
        console.error(error);
        alert(error.message || "Não foi possível salvar o cliente.");
    }
}

async function deleteClient(id) {
    if (!confirm("Deseja realmente apagar este cliente?")) return;

    try {
        const toastId = showFeedbackToastLoading("Excluindo cliente", "Aguarde enquanto o cadastro é removido.");
        await deleteSheetRow(SHEET_NAMES.clients, id);

        removeById(state.clients, id);
        invalidateDashboardCache();
        renderClientSection({ animateChart: true });

        showFeedbackToastSuccess(toastId, "Cliente excluído", "O cadastro foi removido com sucesso.");
    } catch (error) {
        console.error(error);
        showFeedbackToastError(null, "Falha ao excluir", error.message || "Não foi possível apagar o cliente.");
        alert(error.message || "Não foi possível apagar o cliente.");
    }
}

function renderClients(filteredClients = state.clients) {
    if (filteredClients.length === 0) {
        el.clientsTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">Nenhum cliente encontrado.</td></tr>`;
        return;
    }

    el.clientsTableBody.innerHTML = filteredClients
        .map((item) => `
      <tr class="${highlightIfTouched("clients", item.id)}">
        <td>${item.name}</td>
        <td>${item.phone}</td>
        <td>${item.email || "-"}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn delete" onclick="deleteClient('${item.id}')" title="Apagar cliente">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `)
        .join("");

    renderLucideIcons();
}

function filterClients() {
    const searchTerm = el.clientSearch.value.toLowerCase().trim();
    renderClients(
        state.clients.filter((client) => client.name.toLowerCase().includes(searchTerm))
    );
}

function populateSaleProducts() {
    const availableProducts = state.products.filter(
        (item) => Number(item.quantity) > 0
    );

    if (availableProducts.length === 0) {
        el.saleProduct.innerHTML = `<option value="">Sem produtos disponíveis</option>`;
        return;
    }

    el.saleProduct.innerHTML =
        `<option value="">Selecione um produto</option>` +
        availableProducts
            .map(
                (item) => `
      <option value="${item.id}">${item.name}</option>
    `
            )
            .join("");

    el.saleProduct.value = "";
}

function updateSalePriceFromProduct() {
    const product = state.products.find((item) => item.id === el.saleProduct.value);

    if (!product) {
        el.saleUnitPrice.value = "";
        return;
    }

    el.saleUnitPrice.value = Number(product.price).toFixed(2);
}

function openSaleCreateModal() {
    resetSaleForm();
    openModal(el.saleModal);
}

function editSale(id) {
    const sale = state.sales.find((item) => item.id === id);
    if (!sale) return;

    const product = state.products.find((item) => item.name === sale.productName);
    if (!product) {
        alert("O produto desta venda não existe mais no cadastro.");
        return;
    }

    state.editingSaleId = id;
    el.saleId.value = sale.id;
    populateSaleProducts();
    el.saleProduct.value = product.id;
    el.saleCustomer.value = sale.customer;
    el.saleQuantity.value = sale.quantity;
    el.saleUnitPrice.value = Number(sale.unitPrice).toFixed(2);

    el.saleModalTitle.textContent = "Editar Venda";
    el.saleSubmitBtn.innerHTML = `<i data-lucide="pencil"></i> Atualizar Venda`;
    renderLucideIcons();

    openModal(el.saleModal);
}

async function deleteSale(id) {
    if (!confirm("Deseja realmente excluir esta venda?")) return;

    try {
        const toastId = showFeedbackToastLoading("Excluindo venda", "A venda está sendo removida e o estoque será recomposto.");
        const sale = state.sales.find((item) => item.id === id);

        if (sale) {
            const product = state.products.find((item) => item.name === sale.productName);
            if (product) {
                const updatedProduct = {
                    ...product,
                    quantity: Number(product.quantity) + Number(sale.quantity)
                };

                await updateSheetRow(SHEET_NAMES.products, product.id, {
                    "PRODUTO": updatedProduct.name,
                    "QUANTIDADE": updatedProduct.quantity,
                    "PREÇO": Number(updatedProduct.price)
                });

                upsertById(state.products, updatedProduct);
                markRecentlyTouched("products", updatedProduct.id);
            }
        }

        await deleteSheetRow(SHEET_NAMES.sales, id);
        removeById(state.sales, id);

        invalidateDashboardCache();
        renderProducts();
        populateSaleProducts();
        renderSales();
        scheduleDashboardRender({ animateChart: true });

        showFeedbackToastSuccess(toastId, "Venda excluída", "A exclusão foi concluída com sucesso.");
    } catch (error) {
        console.error(error);
        showFeedbackToastError(null, "Falha ao excluir", error.message || "Não foi possível excluir a venda.");
        alert(error.message || "Não foi possível excluir a venda.");
    }
}

async function saveSale(event) {
    event.preventDefault();

    const product = state.products.find((item) => item.id === el.saleProduct.value);
    if (!product) {
        alert("Selecione um produto válido.");
        return;
    }

    const quantity = toInteger(el.saleQuantity.value);
    const unitPrice = toNumber(el.saleUnitPrice.value);

    if (quantity <= 0) {
        alert("Informe uma quantidade válida.");
        return;
    }

    try {
        await withProcessing(el.saleSubmitBtn, "Salvando...", async () => {
            if (state.editingSaleId) {
                const oldSale = state.sales.find((item) => item.id === state.editingSaleId);
                if (!oldSale) throw new Error("Venda antiga não encontrada.");

                const oldProduct = state.products.find((item) => item.name === oldSale.productName);
                let availableStock = Number(product.quantity);

                if (oldProduct && oldProduct.id === product.id) {
                    availableStock += Number(oldSale.quantity);
                }

                if (quantity > availableStock) {
                    throw new Error("Quantidade maior que o estoque disponível.");
                }

                if (oldProduct) {
                    const restoredQty = oldProduct.id === product.id
                        ? availableStock - quantity
                        : Number(oldProduct.quantity) + Number(oldSale.quantity);

                    const restoredProduct = {
                        ...oldProduct,
                        quantity: restoredQty
                    };

                    await updateSheetRow(SHEET_NAMES.products, oldProduct.id, {
                        "PRODUTO": restoredProduct.name,
                        "QUANTIDADE": restoredProduct.quantity,
                        "PREÇO": Number(restoredProduct.price)
                    });

                    upsertById(state.products, restoredProduct);
                }

                if (product.id !== (oldProduct?.id || "")) {
                    if (quantity > Number(product.quantity)) {
                        throw new Error("Quantidade maior que o estoque disponível.");
                    }

                    const targetProduct = {
                        ...product,
                        quantity: Number(product.quantity) - quantity
                    };

                    await updateSheetRow(SHEET_NAMES.products, product.id, {
                        "PRODUTO": targetProduct.name,
                        "QUANTIDADE": targetProduct.quantity,
                        "PREÇO": Number(targetProduct.price)
                    });

                    upsertById(state.products, targetProduct);
                }

                const updatedSalePayload = {
                    "PRODUTO": product.name,
                    "CLIENTE": normalizeText(el.saleCustomer.value) || "Cliente avulso",
                    "QUANTIDADE": quantity,
                    "PREÇO UNITÁRIO": unitPrice,
                    "TOTAL": quantity * unitPrice,
                    "DATA": oldSale.date
                };

                await updateSheetRow(SHEET_NAMES.sales, state.editingSaleId, updatedSalePayload);

                const updatedSale = saleFromPayload(state.editingSaleId, updatedSalePayload);
                upsertById(state.sales, updatedSale);
                markRecentlyTouched("sales", state.editingSaleId);
            } else {
                if (quantity > Number(product.quantity)) {
                    throw new Error("Quantidade maior que o estoque disponível.");
                }

                const salePayload = {
                    "PRODUTO": product.name,
                    "CLIENTE": normalizeText(el.saleCustomer.value) || "Cliente avulso",
                    "QUANTIDADE": quantity,
                    "PREÇO UNITÁRIO": unitPrice,
                    "TOTAL": quantity * unitPrice,
                    "DATA": new Date().toISOString()
                };

                const saleResult = await createSheetRow(SHEET_NAMES.sales, salePayload);
                const createdSale = saleFromPayload(saleResult.id, salePayload);
                upsertById(state.sales, createdSale);
                markRecentlyTouched("sales", createdSale.id);

                const updatedProduct = {
                    ...product,
                    quantity: Number(product.quantity) - quantity
                };

                await updateSheetRow(SHEET_NAMES.products, product.id, {
                    "PRODUTO": updatedProduct.name,
                    "QUANTIDADE": updatedProduct.quantity,
                    "PREÇO": Number(updatedProduct.price)
                });

                upsertById(state.products, updatedProduct);
                markRecentlyTouched("products", updatedProduct.id);
            }

            invalidateDashboardCache();
            renderProducts();
            populateSaleProducts();
            renderSales();
            scheduleDashboardRender({ animateChart: true });
            resetSaleForm();
            closeModal(el.saleModal);
        }, {
            loadingTitle: state.editingSaleId ? "Atualizando venda" : "Salvando venda",
            loadingMessage: "A venda e o estoque estão sendo sincronizados.",
            successTitle: state.editingSaleId ? "Venda atualizada" : "Venda registrada",
            successMessage: "A alteração foi confirmada.",
            errorTitle: "Falha ao salvar venda"
        });
    } catch (error) {
        console.error(error);
        alert(error.message || "Não foi possível salvar a venda.");
    }
}

function renderSales(filteredSales = state.sales) {
    if (filteredSales.length === 0) {
        el.salesTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhuma venda registrada.</td></tr>`;
        return;
    }

    const sorted = [...filteredSales].sort((a, b) => {
        const dateA = parseFlexibleDate(a.date);
        const dateB = parseFlexibleDate(b.date);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
    });

    el.salesTableBody.innerHTML = sorted
        .map((item) => `
      <tr class="${highlightIfTouched("sales", item.id)}">
        <td>${item.productName}</td>
        <td>${item.customer}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.total)}</td>
        <td>${formatDateTime(item.date)}</td>
        <td>
          <div class="table-actions">
            <button class="icon-btn edit" onclick="editSale('${item.id}')" title="Editar venda">
              <i data-lucide="pencil"></i>
            </button>
            <button class="icon-btn delete" onclick="deleteSale('${item.id}')" title="Excluir venda">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `)
        .join("");

    renderLucideIcons();
}

function filterSales() {
    const searchTerm = el.saleSearch.value.toLowerCase().trim();

    renderSales(
        state.sales.filter((item) =>
            item.productName.toLowerCase().includes(searchTerm) ||
            item.customer.toLowerCase().includes(searchTerm)
        )
    );
}

function renderAll() {
    renderAppointments();
    renderProducts();
    renderClients();
    populateSaleProducts();
    renderSales();
    updateDateTimePreview();
    scheduleDashboardRender({ animateChart: true });
    renderLucideIcons();
}

el.loginForm.addEventListener("submit", handleLogin);
el.togglePasswordBtn.addEventListener("click", togglePasswordVisibility);
el.logoutBtn.addEventListener("click", handleLogout);

el.mobileMenuBtn.addEventListener("click", toggleMobileSidebar);
el.mobileSidebarOverlay.addEventListener("click", closeMobileSidebar);

el.themeToggleBtn.addEventListener("click", () => {
    const currentTheme = el.html.getAttribute("data-theme");
    setTheme(currentTheme === "dark" ? "light" : "dark");
    requestAnimationFrame(() => renderRevenueChart(false));
});

el.appointmentForm.addEventListener("submit", saveAppointment);
el.productForm.addEventListener("submit", saveProduct);
el.clientForm.addEventListener("submit", saveClient);
el.saleForm.addEventListener("submit", saveSale);

el.clientSearch.addEventListener("input", filterClients);
el.appointmentSearch.addEventListener("input", filterAppointments);
el.saleSearch.addEventListener("input", filterSales);

[
    el.appointmentDay,
    el.appointmentMonth,
    el.appointmentYear,
    el.appointmentHour,
    el.appointmentMinute
].forEach((field) => {
    field.addEventListener("change", updateDateTimePreview);
});

el.saleProduct.addEventListener("change", updateSalePriceFromProduct);
el.cancelEditBtn.addEventListener("click", resetProductForm);
el.confirmFinishAppointmentBtn.addEventListener("click", finishAppointment);

el.navLinks.forEach((button) => {
    button.addEventListener("click", () => {
        changeSection(button.dataset.section, button);
    });
});

el.openAppointmentModalBtn.addEventListener("click", openAppointmentCreateModal);
el.openProductModalBtn.addEventListener("click", () => {
    resetProductForm();
    openModal(el.productModal);
});
el.openClientModalBtn.addEventListener("click", () => {
    resetClientForm();
    openModal(el.clientModal);
});
el.openSaleModalBtn.addEventListener("click", openSaleCreateModal);

el.closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const modal = document.getElementById(button.dataset.closeModal);
        closeModal(modal);
    });
});

[
    el.appointmentModal,
    el.finishAppointmentModal,
    el.productModal,
    el.clientModal,
    el.saleModal
].forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeAllModals();
        closeMobileSidebar();
    }
});

window.addEventListener("resize", () => {
    handleResponsiveSidebar();
    requestAnimationFrame(() => renderRevenueChart(false));
});

function init() {
    populateDateAndTimeFields();

    [
        el.metricAppointments,
        el.metricRevenue,
        el.metricLowStock,
        el.metricClients,
        el.metricProducts,
        el.metricAverageTicket,
        el.metricProductsSold
    ].forEach((node) => {
        node.dataset.value = "0";
    });

    clearAuth();
    initTheme();
    updateAuthView();
    handleResponsiveSidebar();
    updateDateTimePreview();
    ensureToastStack();
    renderLucideIcons();

    if (isAuthenticated()) {
        initializeAppData();
    }
}

init();

window.openFinishAppointmentModal = openFinishAppointmentModal;
window.deleteAppointment = deleteAppointment;
window.editAppointment = editAppointment;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.deleteClient = deleteClient;
window.editSale = editSale;
window.deleteSale = deleteSale;