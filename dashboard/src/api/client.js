import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach Bearer token from localStorage if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('seq-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const api = {
  // Auth & Sync
  login: (clerkUserId) => client.post('/auth/login', { clerkUserId }),
  register: (payload) => client.post('/auth/register', payload),
  getProfile: () => client.get('/auth/me'),

  // API Keys
  getApiKeys: () => client.get('/apikeys'),
  createApiKey: (payload) => client.post('/apikeys', payload),
  toggleApiKey: (id) => client.patch(`/apikeys/${id}/toggle`),
  deleteApiKey: (id) => client.delete(`/apikeys/${id}`),

  // Tasks
  createTask: (payload, apiKey) => client.post('/tasks', payload, {
    headers: apiKey ? { 'x-api-key': apiKey } : {}
  }),
  getTaskStatus: (id, apiKey) => client.get(`/tasks/${id}`, {
    headers: apiKey ? { 'x-api-key': apiKey } : {}
  }),
}

export default client
