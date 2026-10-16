// Centralized API client with localStorage key persistence and error handling

const API_BASE = '/api';

export function getStoredApiKey() {
  return localStorage.getItem('gemini_custom_api_key') || '';
}

export function setStoredApiKey(key) {
  if (key) {
    localStorage.setItem('gemini_custom_api_key', key.trim());
  } else {
    localStorage.removeItem('gemini_custom_api_key');
  }
}

async function request(endpoint, options = {}) {
  const customKey = getStoredApiKey();
  const headers = {
    'Content-Type': 'application/json',
    ...(customKey ? { 'x-gemini-key': customKey } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Health & connection status
  getHealth: () => request('/health'),

  // Leads
  getLeads: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    return request(`/leads${qs ? `?${qs}` : ''}`);
  },

  getStats: () => request('/stats'),

  createLead: (leadData) =>
    request('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    }),

  createBulkLeads: (leads) =>
    request('/leads/bulk', {
      method: 'POST',
      body: JSON.stringify({ leads }),
    }),

  updateLead: (id, updates) =>
    request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteLead: (id) =>
    request(`/leads/${id}`, {
      method: 'DELETE',
    }),

  // AI Actions
  scoreLead: (id) =>
    request(`/leads/${id}/score`, {
      method: 'POST',
    }),

  scoreAllLeads: () =>
    request('/leads/score-all', {
      method: 'POST',
    }),

  generateOutreach: (id, tone = 'friendly') =>
    request(`/leads/${id}/outreach`, {
      method: 'POST',
      body: JSON.stringify({ tone }),
    }),

  autoGenerateLeads: (industry, city) =>
    request('/leads/auto-generate', {
      method: 'POST',
      body: JSON.stringify({ industry, city }),
    }),

  chat: (message, history = []) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  resetDemoLeads: () =>
    request('/leads/reset-demo', {
      method: 'POST',
    }),
};
