import { normalizeNumber, normalizeText } from '../utils/formatters.js';
import { formatStatus } from '../utils/status.js';

export function mapAppointment(item) {
  return {
    rowNumber: Number(item._rowNumber || 0),
    client: normalizeText(item.CLIENTE),
    service: normalizeText(item['SERVIÇO'] || item.SERVICO),
    professional: normalizeText(item.PROFISSIONAL),
    value: normalizeNumber(item.VALOR),
    unit: normalizeText(item.UNIDADE),
    dateTime: normalizeText(item['DATA E HORA'] || item.DATA_HORA || item.DATAHORA || item.DATA_HORA_ATENDIMENTO),
    createdAt: normalizeText(item.DATA_REGISTRO),
    status: formatStatus(item.STATUS)
  };
}

export function mapSale(item) {
  return {
    rowNumber: Number(item._rowNumber || 0),
    product: normalizeText(item.PRODUTO),
    client: normalizeText(item.CLIENTE),
    seller: normalizeText(item.VENDEDORA || item.VENDEDOR),
    quantity: normalizeNumber(item.QUANTIDADE),
    price: normalizeNumber(item['PREÇO'] || item.PRECO),
    unit: normalizeText(item.UNIDADE),
    createdAt: normalizeText(item.DATA_REGISTRO)
  };
}

export function mapInventory(item) {
  return {
    rowNumber: Number(item._rowNumber || 0),
    product: normalizeText(item.PRODUTO),
    quantity: normalizeNumber(item.QUANTIDADE),
    price: normalizeNumber(item['PREÇO'] || item.PRECO),
    unit: normalizeText(item.UNIDADE),
    createdAt: normalizeText(item.DATA_REGISTRO)
  };
}

export function mapClient(item) {
  return {
    rowNumber: Number(item._rowNumber || 0),
    name: normalizeText(item.CLIENTE),
    phone: normalizeText(item.TELEFONE),
    email: normalizeText(item['E-MAIL'] || item.EMAIL),
    unit: normalizeText(item.UNIDADE),
    createdAt: normalizeText(item.DATA_REGISTRO)
  };
}
