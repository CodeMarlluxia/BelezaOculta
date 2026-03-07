const STORAGE_KEYS = {
    appointments: "beleza_oculta_appointments",
    products: "beleza_oculta_products",
    clients: "beleza_oculta_clients",
    sales: "beleza_oculta_sales",
    auth: "beleza_oculta_auth",
    theme: "beleza_oculta_theme"
};

const LOW_STOCK_LIMIT = 5;
const DEFAULT_LOGIN = {
    email: "admin@belezaoculta.com",
    password: "123456"
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

const state = {
    appointments: JSON.parse(localStorage.getItem(STORAGE_KEYS.appointments)) || [],
    products: JSON.parse(localStorage.getItem(STORAGE_KEYS.products)) || [],
    clients: JSON.parse(localStorage.getItem(STORAGE_KEYS.clients)) || [],
    sales: JSON.parse(localStorage.getItem(STORAGE_KEYS.sales)) || [],
    currentSectionId: "dashboard",
    selectedAppointmentId: null,
    editingAppointmentId: null,
    editingSaleId: null,
    chartAnimationFrame: null
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
}

function persistData() {
    localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(state.appointments));
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(state.products));
    localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(state.clients));
    localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(state.sales));
}

function setAuth(email) {
    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify({ isAuthenticated: true, email }));
}

function clearAuth() {
    localStorage.removeItem(STORAGE_KEYS.auth);
}

function isAuthenticated() {
    const authData = JSON.parse(localStorage.getItem(STORAGE_KEYS.auth));
    return Boolean(authData?.isAuthenticated);
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

    const email = el.loginEmail.value.trim().toLowerCase();
    const password = el.loginPassword.value.trim();

    if (email === DEFAULT_LOGIN.email && password === DEFAULT_LOGIN.password) {
        setAuth(email);
        el.loginForm.reset();
        updateAuthView();
        renderAll();
        return;
    }

    alert("E-mail ou senha inválidos.");
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

function generateId() {
    return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function formatCurrency(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Data inválida";

    return date.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        hour12: false
    });
}

function getInitials(name) {
    return name
        .trim()
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
}

function isToday(dateString) {
    const date = new Date(dateString);
    const today = new Date();

    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
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
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return;

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
    if (el.saleProduct.options.length > 0) updateSalePriceFromProduct();
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

function getTodayCompletedAppointments() {
    return state.appointments.filter((item) => item.status === "completed" && item.completedAt && isToday(item.completedAt));
}

function getTodaySales() {
    return state.sales.filter((item) => isToday(item.date));
}

function getTodayRevenue() {
    const serviceRevenue = getTodayCompletedAppointments().reduce((sum, item) => sum + Number(item.value), 0);
    const salesRevenue = getTodaySales().reduce((sum, item) => sum + Number(item.total), 0);
    return serviceRevenue + salesRevenue;
}

function getTodayProductsSoldCount() {
    return getTodaySales().reduce((sum, item) => sum + Number(item.quantity), 0);
}

function getTodayTransactionsCount() {
    return getTodayCompletedAppointments().length + getTodaySales().length;
}

function getLowStockProducts() {
    return state.products.filter((item) => Number(item.quantity) <= LOW_STOCK_LIMIT);
}

function renderDashboard() {
    const pendingToday = state.appointments.filter((item) => isToday(item.date) && item.status !== "completed");
    const lowStock = getLowStockProducts();
    const todayRevenue = getTodayRevenue();
    const totalTransactions = getTodayTransactionsCount();
    const averageTicket = totalTransactions ? todayRevenue / totalTransactions : 0;

    animateCount(el.metricAppointments, pendingToday.length);
    animateCount(el.metricRevenue, todayRevenue, { isCurrency: true });
    animateCount(el.metricLowStock, lowStock.length);
    animateCount(el.metricClients, state.clients.length);
    animateCount(el.metricProducts, state.products.length);
    animateCount(el.metricAverageTicket, averageTicket, { isCurrency: true });
    animateCount(el.metricProductsSold, getTodayProductsSoldCount());

    renderDashboardAppointments(pendingToday);
    renderDashboardLowStock(lowStock);
    renderRevenueChart(true);
}

function renderDashboardAppointments(items) {
    if (items.length === 0) {
        el.dashboardAppointments.innerHTML = `<div class="empty-state">Nenhum atendimento pendente para hoje.</div>`;
        return;
    }

    const sorted = [...items].sort((a, b) => new Date(a.date) - new Date(b.date));

    el.dashboardAppointments.innerHTML = sorted
        .slice(0, 8)
        .map((item) => `
      <button class="list-item list-item--clickable" onclick="openFinishAppointmentModal('${item.id}')">
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
      <div class="list-item">
        <strong>${item.name}</strong>
        <small>Quantidade atual: ${item.quantity}</small>
      </div>
    `)
        .join("");
}

function getRevenueDataLast7Days() {
    const result = [];
    const today = new Date();

    for (let i = 6; i >= 0; i -= 1) {
        const baseDate = new Date(today);
        baseDate.setHours(0, 0, 0, 0);
        baseDate.setDate(today.getDate() - i);

        const label = baseDate.toLocaleDateString("pt-BR", { weekday: "short" });

        const serviceRevenue = state.appointments
            .filter((item) => item.status === "completed" && item.completedAt)
            .filter((item) => {
                const d = new Date(item.completedAt);
                return d.getDate() === baseDate.getDate() && d.getMonth() === baseDate.getMonth() && d.getFullYear() === baseDate.getFullYear();
            })
            .reduce((sum, item) => sum + Number(item.value), 0);

        const salesRevenue = state.sales
            .filter((item) => {
                const d = new Date(item.date);
                return d.getDate() === baseDate.getDate() && d.getMonth() === baseDate.getMonth() && d.getFullYear() === baseDate.getFullYear();
            })
            .reduce((sum, item) => sum + Number(item.total), 0);

        result.push({
            label: label.charAt(0).toUpperCase() + label.slice(1).replace(".", ""),
            total: serviceRevenue + salesRevenue
        });
    }

    return result;
}

function renderRevenueChart(animate = false) {
    const canvas = el.revenueChart;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const data = getRevenueDataLast7Days();
    const parent = canvas.parentElement;
    const width = parent.clientWidth;
    const height = window.innerWidth <= 640 ? 190 : window.innerWidth <= 991 ? 220 : 240;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const padding = { top: 20, right: 20, bottom: 35, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...data.map((item) => item.total), 100);
    const barWidth = Math.max((chartWidth / data.length) - 12, 18);

    if (state.chartAnimationFrame) cancelAnimationFrame(state.chartAnimationFrame);

    function draw(progress = 1) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        ctx.beginPath();
        ctx.strokeStyle = document.documentElement.getAttribute("data-theme") === "dark"
            ? "rgba(209, 196, 219, 0.18)"
            : "rgba(171, 152, 184, 0.22)";
        ctx.lineWidth = 1;
        ctx.moveTo(padding.left, padding.top + chartHeight);
        ctx.lineTo(width - padding.right, padding.top + chartHeight);
        ctx.stroke();

        data.forEach((item, index) => {
            const x = padding.left + index * (barWidth + 12) + 6;
            const targetHeight = (item.total / maxValue) * (chartHeight - 15);
            const barHeight = targetHeight * progress;
            const y = padding.top + chartHeight - barHeight;

            const gradient = ctx.createLinearGradient(0, y, 0, padding.top + chartHeight);

            if (document.documentElement.getAttribute("data-theme") === "dark") {
                gradient.addColorStop(0, "rgba(206, 192, 223, 0.95)");
                gradient.addColorStop(1, "rgba(186, 166, 210, 0.42)");
            } else {
                gradient.addColorStop(0, "rgba(201, 182, 228, 0.95)");
                gradient.addColorStop(1, "rgba(217, 191, 220, 0.45)");
            }

            drawRoundedRect(ctx, x, y, barWidth, Math.max(barHeight, 8), 10, gradient);

            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-soft").trim() || "#83768f";
            ctx.font = window.innerWidth <= 640 ? "11px Segoe UI" : "12px Segoe UI";
            ctx.textAlign = "center";
            ctx.fillText(progress > 0.98 && item.total > 0 ? `R$ ${item.total.toFixed(0)}` : "-", x + barWidth / 2, y - 8);
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
        if (progress < 1) state.chartAnimationFrame = requestAnimationFrame(step);
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

function saveAppointment(event) {
    event.preventDefault();

    const dateTime = buildAppointmentISODateTime();

    if (!dateTime) {
        alert("Preencha corretamente a data e o horário.");
        return;
    }

    const payload = {
        id: state.editingAppointmentId || generateId(),
        client: el.appointmentClient.value.trim(),
        service: el.appointmentService.value.trim(),
        professional: el.appointmentProfessional.value,
        date: dateTime,
        value: Number(el.appointmentValue.value),
        status: "scheduled",
        completedAt: null
    };

    if (state.editingAppointmentId) {
        const old = state.appointments.find((a) => a.id === state.editingAppointmentId);
        payload.status = old.status;
        payload.completedAt = old.completedAt;
        state.appointments = state.appointments.map((item) => item.id === state.editingAppointmentId ? payload : item);
    } else {
        state.appointments.push(payload);
    }

    persistData();
    renderAll();
    resetAppointmentForm();
    closeModal(el.appointmentModal);
}

function deleteAppointment(id) {
    if (!confirm("Deseja realmente excluir este agendamento?")) return;
    state.appointments = state.appointments.filter((item) => item.id !== id);
    persistData();
    renderAll();
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

function finishAppointment() {
    if (!state.selectedAppointmentId) return;

    const appointment = state.appointments.find((item) => item.id === state.selectedAppointmentId);
    if (!appointment || appointment.status === "completed") return;

    appointment.status = "completed";
    appointment.completedAt = new Date().toISOString();

    persistData();
    renderAll();
    closeModal(el.finishAppointmentModal);
    state.selectedAppointmentId = null;
}

function renderAppointments(filteredAppointments = state.appointments) {
    if (filteredAppointments.length === 0) {
        el.appointmentsBoard.innerHTML = `<div class="empty-state">Nenhum agendamento encontrado.</div>`;
        return;
    }

    const sorted = [...filteredAppointments].sort((a, b) => new Date(a.date) - new Date(b.date));

    el.appointmentsBoard.innerHTML = sorted
        .map((item) => `
      <article class="appointment-card">
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
            <span>${item.status === "completed" ? "Atendimento encerrado" : "Aguardando atendimento"}</span>
          </div>
        </div>

        <div class="table-actions">
          ${item.status !== "completed" ? `
            <button class="icon-btn success" onclick="openFinishAppointmentModal('${item.id}')" title="Encerrar atendimento">
              <i data-lucide="check"></i>
            </button>` : ""}
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

function saveProduct(event) {
    event.preventDefault();

    const id = el.productId.value.trim();
    const payload = {
        id: id || generateId(),
        name: el.productName.value.trim(),
        quantity: Number(el.productQuantity.value),
        price: Number(el.productPrice.value)
    };

    if (id) {
        state.products = state.products.map((item) => item.id === id ? payload : item);
    } else {
        state.products.push(payload);
    }

    persistData();
    renderAll();
    resetProductForm();
    closeModal(el.productModal);
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

function deleteProduct(id) {
    if (!confirm("Deseja realmente excluir este produto?")) return;
    state.products = state.products.filter((item) => item.id !== id);
    persistData();
    renderAll();
    resetProductForm();
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
      <tr>
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

function saveClient(event) {
    event.preventDefault();

    state.clients.push({
        id: generateId(),
        name: el.clientName.value.trim(),
        phone: el.clientPhone.value.trim(),
        email: el.clientEmail.value.trim()
    });

    persistData();
    renderAll();
    resetClientForm();
    closeModal(el.clientModal);
}

function deleteClient(id) {
    if (!confirm("Deseja realmente apagar este cliente?")) return;
    state.clients = state.clients.filter((item) => item.id !== id);
    persistData();
    renderAll();
}

function renderClients(filteredClients = state.clients) {
    if (filteredClients.length === 0) {
        el.clientsTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">Nenhum cliente encontrado.</td></tr>`;
        return;
    }

    el.clientsTableBody.innerHTML = filteredClients
        .map((item) => `
      <tr>
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
    renderClients(state.clients.filter((client) => client.name.toLowerCase().includes(searchTerm)));
}

function populateSaleProducts() {
    const availableProducts = state.products.filter((item) => Number(item.quantity) > 0 || item.id === el.saleProduct.value);

    if (availableProducts.length === 0) {
        el.saleProduct.innerHTML = `<option value="">Sem produtos disponíveis</option>`;
        return;
    }

    el.saleProduct.innerHTML = availableProducts
        .map((item) => `
      <option value="${item.id}">
        ${item.name} • Estoque: ${item.quantity} • ${formatCurrency(item.price)}
      </option>
    `)
        .join("");
}

function updateSalePriceFromProduct() {
    const product = state.products.find((item) => item.id === el.saleProduct.value);
    if (!product) return;
    el.saleUnitPrice.value = Number(product.price).toFixed(2);
}

function openSaleCreateModal() {
    resetSaleForm();
    openModal(el.saleModal);
}

function editSale(id) {
    const sale = state.sales.find((item) => item.id === id);
    if (!sale) return;

    state.editingSaleId = id;
    el.saleId.value = sale.id;
    populateSaleProducts();
    el.saleProduct.value = sale.productId;
    el.saleCustomer.value = sale.customer;
    el.saleQuantity.value = sale.quantity;
    el.saleUnitPrice.value = Number(sale.unitPrice).toFixed(2);

    el.saleModalTitle.textContent = "Editar Venda";
    el.saleSubmitBtn.innerHTML = `<i data-lucide="pencil"></i> Atualizar Venda`;
    renderLucideIcons();

    openModal(el.saleModal);
}

function deleteSale(id) {
    if (!confirm("Deseja realmente excluir esta venda?")) return;

    const sale = state.sales.find((item) => item.id === id);
    if (sale) {
        const product = state.products.find((item) => item.id === sale.productId);
        if (product) product.quantity += Number(sale.quantity);
    }

    state.sales = state.sales.filter((item) => item.id !== id);
    persistData();
    renderAll();
}

function saveSale(event) {
    event.preventDefault();

    const product = state.products.find((item) => item.id === el.saleProduct.value);
    if (!product) {
        alert("Selecione um produto válido.");
        return;
    }

    const quantity = Number(el.saleQuantity.value);
    const unitPrice = Number(el.saleUnitPrice.value);

    if (quantity <= 0) {
        alert("Informe uma quantidade válida.");
        return;
    }

    if (state.editingSaleId) {
        const oldSale = state.sales.find((item) => item.id === state.editingSaleId);
        if (!oldSale) return;

        const oldProduct = state.products.find((item) => item.id === oldSale.productId);
        if (oldProduct) oldProduct.quantity += Number(oldSale.quantity);

        if (quantity > Number(product.quantity)) {
            if (oldProduct) oldProduct.quantity -= Number(oldSale.quantity);
            alert("Quantidade maior que o estoque disponível.");
            return;
        }

        product.quantity -= quantity;

        state.sales = state.sales.map((item) =>
            item.id === state.editingSaleId
                ? {
                    ...item,
                    productId: product.id,
                    productName: product.name,
                    customer: el.saleCustomer.value.trim() || "Cliente avulso",
                    quantity,
                    unitPrice,
                    total: quantity * unitPrice
                }
                : item
        );
    } else {
        if (quantity > Number(product.quantity)) {
            alert("Quantidade maior que o estoque disponível.");
            return;
        }

        product.quantity -= quantity;

        state.sales.push({
            id: generateId(),
            productId: product.id,
            productName: product.name,
            customer: el.saleCustomer.value.trim() || "Cliente avulso",
            quantity,
            unitPrice,
            total: quantity * unitPrice,
            date: new Date().toISOString()
        });
    }

    persistData();
    renderAll();
    resetSaleForm();
    closeModal(el.saleModal);
}

function renderSales(filteredSales = state.sales) {
    if (filteredSales.length === 0) {
        el.salesTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Nenhuma venda registrada.</td></tr>`;
        return;
    }

    const sorted = [...filteredSales].sort((a, b) => new Date(b.date) - new Date(a.date));

    el.salesTableBody.innerHTML = sorted
        .map((item) => `
      <tr>
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

function seedInitialData() {
    const hasAnyData =
        state.appointments.length ||
        state.products.length ||
        state.clients.length ||
        state.sales.length;

    if (hasAnyData) return;

    state.products = [
        { id: generateId(), name: "Shampoo Hidratante", quantity: 8, price: 59.9 },
        { id: generateId(), name: "Máscara Capilar Premium", quantity: 3, price: 89.9 },
        { id: generateId(), name: "Óleo Finalizador", quantity: 12, price: 45.5 }
    ];

    state.clients = [
        { id: generateId(), name: "Ana Souza", phone: "(85) 99999-1111", email: "ana@email.com" },
        { id: generateId(), name: "Juliana Lima", phone: "(85) 99999-2222", email: "juliana@email.com" }
    ];

    const now = new Date();
    const date1 = new Date(now.getTime() + 60 * 60 * 1000);
    const date2 = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    state.appointments = [
        {
            id: generateId(),
            client: "Ana Souza",
            service: "Escova Modelada",
            professional: "Camila",
            date: `${date1.getFullYear()}-${String(date1.getMonth() + 1).padStart(2, "0")}-${String(date1.getDate()).padStart(2, "0")}T${String(date1.getHours()).padStart(2, "0")}:${String(date1.getMinutes()).padStart(2, "0")}`,
            value: 90,
            status: "scheduled",
            completedAt: null
        },
        {
            id: generateId(),
            client: "Juliana Lima",
            service: "Hidratação",
            professional: "Renata",
            date: `${date2.getFullYear()}-${String(date2.getMonth() + 1).padStart(2, "0")}-${String(date2.getDate()).padStart(2, "0")}T${String(date2.getHours()).padStart(2, "0")}:${String(date2.getMinutes()).padStart(2, "0")}`,
            value: 120,
            status: "scheduled",
            completedAt: null
        }
    ];

    persistData();
}

function renderAll() {
    renderDashboard();
    renderAppointments();
    renderProducts();
    renderClients();
    populateSaleProducts();
    renderSales();
    updateDateTimePreview();
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
    renderRevenueChart(false);
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
        if (event.target === modal) closeModal(modal);
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
    renderRevenueChart(false);
});

function init() {
    seedInitialData();
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

    initTheme();
    updateAuthView();
    handleResponsiveSidebar();
    updateDateTimePreview();
    renderAll();
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