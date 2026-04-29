import { formatPhone, normalizeNumber, normalizeText } from '../utils/formatters.js';

export function buildAppointmentPayload(formData) {
  return {
    CLIENTE: normalizeText(formData.get('client')),
    'SERVIÇO': normalizeText(formData.get('service')),
    PROFISSIONAL: normalizeText(formData.get('professional')),
    VALOR: normalizeNumber(formData.get('value')),
    UNIDADE: normalizeText(formData.get('unit')),
    'DATA E HORA': normalizeText(formData.get('dateTime')),
    STATUS: 'Em aguardo'
  };
}

export function buildInventoryPayload(formData) {
  return {
    PRODUTO: normalizeText(formData.get('product')),
    QUANTIDADE: normalizeNumber(formData.get('quantity')),
    'PREÇO': normalizeNumber(formData.get('price')),
    UNIDADE: normalizeText(formData.get('unit'))
  };
}

export function buildClientPayload(formData) {
  return {
    CLIENTE: normalizeText(formData.get('name')),
    TELEFONE: formatPhone(formData.get('phone')),
    'E-MAIL': normalizeText(formData.get('email')),
    UNIDADE: normalizeText(formData.get('unit'))
  };
}

export function buildSalePayload(formData) {
  return {
    PRODUTO: normalizeText(formData.get('product')),
    CLIENTE: normalizeText(formData.get('client')),
    VENDEDORA: normalizeText(formData.get('seller')),
    QUANTIDADE: normalizeNumber(formData.get('quantity')),
    'PREÇO': normalizeNumber(formData.get('price')),
    UNIDADE: normalizeText(formData.get('unit'))
  };
}
