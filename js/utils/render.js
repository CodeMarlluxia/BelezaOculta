export function renderTableRows(items, tableBody, emptyState, rowTemplate) {
  if (!items.length) {
    tableBody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  // Build all HTML in one string — single DOM write, no per-row reflow
  tableBody.innerHTML = items.map((item) => `<tr>${rowTemplate(item)}</tr>`).join('');
}
