import { API_URL } from '../core/config.js';

export function validateEndpoint() {
  if (!API_URL || API_URL === 'COLE_AQUI_SUA_URL_DO_GOOGLE_APPS_SCRIPT') {
    throw new Error('Defina a URL do Google Apps Script no arquivo js/core/config.js antes de utilizar a integração.');
  }
}

export async function requestAPI(method = 'GET', payload = null) {
  validateEndpoint();

  const fetchOptions = method === 'GET'
    ? { method: 'GET', redirect: 'follow' }
    : {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload ? JSON.stringify(payload) : null,
    };

  let response;
  try {
    response = await fetch(API_URL, fetchOptions);
  } catch (error) {
    throw new Error('Não foi possível conectar ao Google Apps Script. Verifique se a implantação está publicada como "Qualquer pessoa" e tente novamente.');
  }

  if (!response.ok) {
    throw new Error(`Falha de comunicação com a API. Código HTTP ${response.status}.`);
  }

  let result;
  try {
    const text = await response.text();
    result = JSON.parse(text);
  } catch (error) {
    throw new Error('A API retornou uma resposta inválida.');
  }

  if (!result || result.success === false) {
    throw new Error(result?.message || 'Não foi possível concluir a operação.');
  }

  return result;
}
