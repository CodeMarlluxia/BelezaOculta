import { normalizeText } from './formatters.js';

export function formatStatus(status) {
  const current = normalizeText(status).toLowerCase();
  if (!current) return 'Em aguardo';
  if (current === 'encerrado') return 'Concluído';
  if (current === 'concluido') return 'Concluído';
  if (current === 'em aguardo') return 'Em aguardo';
  return normalizeText(status);
}

export function isWaitingStatus(status) {
  return formatStatus(status).toLowerCase() === 'em aguardo';
}

export function isCompletedStatus(status) {
  return formatStatus(status).toLowerCase() === 'concluído';
}
