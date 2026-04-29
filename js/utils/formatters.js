const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function normalizeText(value) {
  return String(value || '').trim();
}

export function normalizeNumber(value) {
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

export function formatCurrency(value) {
  return currencyFormatter.format(normalizeNumber(value));
}

export function formatCurrencyInput(event) {
  const input = event.target;
  input.value = normalizeNumber(input.value).toFixed(2).replace('.', ',');
}

export function formatPhone(value) {
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
