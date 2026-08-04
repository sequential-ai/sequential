import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach Bearer token and active Organization ID from localStorage if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('seq-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const activeOrgId = localStorage.getItem('seq_active_org_id')
  if (activeOrgId) {
    config.headers['x-organization-id'] = activeOrgId
  }
  return config
})

export const api = {
  // Auth & Sync
  login: (clerkUserId) => client.post('/auth/login', { clerkUserId }),
  register: (payload) => client.post('/auth/register', payload),
  getProfile: () => client.get('/auth/me'),
  createOrganization: (payload) => client.post('/auth/organization', payload),
  getPendingInvites: () => client.get('/auth/invites/pending'),
  acceptInvite: (inviteId) => client.post(`/auth/invites/${inviteId}/accept`),
  declineInvite: (inviteId) => client.post(`/auth/invites/${inviteId}/decline`),

  // API Keys
  getApiKeys: () => client.get('/apikeys'),
  createApiKey: (payload) => client.post('/apikeys', payload),
  toggleApiKey: (id, data) => client.patch(`/apikeys/${id}/toggle`, data),
  deleteApiKey: (id) => client.delete(`/apikeys/${id}`),
  bulkToggleApiKeys: (ids, enable) => client.patch('/apikeys/bulk/toggle', { ids, enable }),
  bulkDeleteApiKeys: (ids) => client.post('/apikeys/bulk/delete', { ids }),

  // Tasks
  getTasks: (apiKey) => client.get('/tasks', {
    headers: apiKey ? { 'x-api-key': apiKey } : {}
  }),
  createTask: (payload, apiKey) => client.post('/tasks', payload, {
    headers: apiKey ? { 'x-api-key': apiKey } : {}
  }),
  getTaskStatus: (id, apiKey) => client.get(`/tasks/${id}`, {
    headers: apiKey ? { 'x-api-key': apiKey } : {}
  }),

  // Organization & Settings
  getMembers: (orgId = 'active') => client.get(`/organizations/${orgId}/members`),
  addMember: (orgId = 'active', payload) => client.post(`/organizations/${orgId}/members`, payload),
  updateMemberRole: (orgId = 'active', memberId, role) => client.patch(`/organizations/${orgId}/members/${memberId}`, { role }),
  removeMember: (orgId = 'active', memberId) => client.delete(`/organizations/${orgId}/members/${memberId}`),
  cancelInvite: (orgId = 'active', inviteId) => client.delete(`/organizations/${orgId}/invites/${inviteId}`),
  getOrganizationSettings: (orgId = 'active') => client.get(`/organizations/${orgId}/settings`),
  updateOrganizationSettings: (orgId = 'active', payload) => client.patch(`/organizations/${orgId}/settings`, payload),
  deleteOrganization: (orgId = 'active') => client.delete(`/organizations/${orgId}`),
}

export default client
