export function updateLucideIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

export function updateCount(element, count, singular = 'registro', plural = 'registros') {
  if (!element) return;

  element.textContent = `${count} ${count === 1 ? singular : plural}`;
}
