export const API_URL = 'https://script.google.com/macros/s/AKfycbyVNqoHcQUE9w8v1KDZGRuceuCgXGsiZRXFo3bIF5HOTdLiJpvgVaKs7vK4z3N8BoCF/exec';

export const SHEETS = Object.freeze({
  AGENDAMENTOS: 'AGENDAMENTOS',
  VENDAS: 'VENDAS',
  ESTOQUE: 'ESTOQUE',
  CADASTROS: 'CADASTROS',
});

export const STAFF_OPTIONS = Object.freeze(['Elane', 'Edila', 'Tété', 'Biatriz', 'Eduarda', 'Juliana']);
export const LOW_STOCK_THRESHOLD = 1;
export const RECORD_RETENTION_DAYS = 7;
export const REPORT_PERIODS = Object.freeze({
  daily: { label: 'Diário', days: 1, description: 'Hoje' },
  weekly: { label: 'Semanal', days: 7, description: 'Últimos 7 dias' },
  monthly: { label: 'Mensal', days: 30, description: 'Últimos 30 dias' },
});
export const THEME_STORAGE_KEY = 'beleza_manager_theme';

export const ACCESS_MAP = Object.freeze({
  admin: ['dashboard', 'agendamentos', 'vendas', 'estoque', 'relatorios', 'cadastros'],
  gerente: ['dashboard', 'agendamentos', 'vendas', 'estoque', 'relatorios', 'cadastros'],
  colaboradora: ['dashboard-colab', 'agendamentos', 'vendas', 'estoque', 'relatorios', 'cadastros'],
});

export const UNRESTRICTED_LEVELS = Object.freeze(['admin', 'gerente']);
