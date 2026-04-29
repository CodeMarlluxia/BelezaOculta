import { UNRESTRICTED_LEVELS } from './config.js';
import { state } from './state.js';

export function getUnitFilter() {
  const user = state.currentUser;

  if (!user) return null;

  const nivel = String(user.nivel || '').toLowerCase().trim();

  if (UNRESTRICTED_LEVELS.includes(nivel)) {
    return state.activeUnitFilter
      ? state.activeUnitFilter.trim().toLowerCase()
      : null;
  }

  return String(user.unidade || '').trim().toLowerCase();
}

export function filterByUnit(items) {
  const unitFilter = getUnitFilter();

  if (!unitFilter) return items;

  return items.filter((item) =>
    String(item.unit || item.unidade || '').trim().toLowerCase() === unitFilter,
  );
}
