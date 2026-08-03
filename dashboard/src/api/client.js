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
  createOrganization: (payload) => client.post('/auth/organization', payload),

  // API Keys
  getApiKeys: () => client.get('/apikeys'),
  createApiKey: (payload) => client.post('/apikeys', payload),
  toggleApiKey: (id, data) => client.patch(`/apikeys/${id}/toggle`, data),
  deleteApiKey: (id) => client.delete(`/apikeys/${id}`),
  bulkToggleApiKeys: (ids, enable) => client.patch('/apikeys/bulk/toggle', { ids, enable }),
  bulkDeleteApiKeys: (ids) => client.post('/apikeys/bulk/delete', { ids }),

  // Tasks
  createTask: (payload, apiKey) => client.post('/tasks', payload, {
    headers: apiKey ? { 'x-api-key': apiKey } : {}
  }),
  getTaskStatus: (id, apiKey) => client.get(`/tasks/${id}`, {
    headers: apiKey ? { 'x-api-key': apiKey } : {}
  }),

  // Organization & Team Members
  getMembers: (orgId = 'active') => client.get(`/organizations/${orgId}/members`),
  addMember: (orgId = 'active', payload) => client.post(`/organizations/${orgId}/members`, payload),
  updateMemberRole: (orgId = 'active', memberId, role) => client.patch(`/organizations/${orgId}/members/${memberId}`, { role }),
  removeMember: (orgId = 'active', memberId) => client.delete(`/organizations/${orgId}/members/${memberId}`),
  cancelInvite: (orgId = 'active', inviteId) => client.delete(`/organizations/${orgId}/invites/${inviteId}`),
}

export default client
