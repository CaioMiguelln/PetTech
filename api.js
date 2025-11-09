// api.js - integração com Pet-Tech API (modo script clássico + proteção contra dupla carga)
(function (global) {
  // Evita redefinir caso o script seja injetado mais de uma vez
  if (global.PetTechAPI) return;

  // Base URL da API (escopo isolado)
  const API_BASE = 'https://pet-tech.onrender.com';

  // Gerenciamento simples de token (se futuramente houver autenticação)
  let authToken = null;
  function setAuthToken(token) { authToken = token; }
  function clearAuthToken() { authToken = null; }

  // Helper genérico
  async function request(method, path, { query, body } = {}) {
    let url;
    try {
      url = new URL(API_BASE + path);
    } catch (e) {
      console.error('URL inválida para request:', { method, path });
      throw e;
    }
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
      });
    }
    const headers = { 'Accept': 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    let res;
    try {
      res = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr) {
      console.error('Erro de rede ao chamar API:', method, path, networkErr);
      throw new Error('Falha de rede ao comunicar com a API. Verifique sua conexão ou se o serviço está ativo.');
    }

    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { data = await res.json(); } catch (_) { data = null; }
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const error = new Error(`Erro API ${method} ${path}: ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  // Endpoints conforme OpenAPI
  const getRoot = () => request('GET', '/');
  // Endpoint oficial confirmado: /create-pet
  const createPet = (pet) => request('POST', '/create-pet', { body: pet });
  const listPets = () => request('GET', '/list-pet');
  const deletePet = (petId) => request('DELETE', `/delete-pet/${encodeURIComponent(petId)}`);
  const updatePet = (petId, pet) => request('PUT', `/update-pet/${encodeURIComponent(petId)}`, { body: pet });

  // Exposição pública
  global.PetTechAPI = { setAuthToken, clearAuthToken, getRoot, createPet, listPets, deletePet, updatePet };
})(typeof window !== 'undefined' ? window : this);
