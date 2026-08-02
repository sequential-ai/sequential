// Centralized mock data for pages not yet backed by real API

export const mockProjects = [
  { id: 'p1', name: 'Market Research Q3', description: 'Competitive analysis for product roadmap', taskCount: 14, archived: false, createdAt: '2026-07-15T10:00:00Z' },
  { id: 'p2', name: 'Regulatory Compliance', description: 'Legal landscape across 5 jurisdictions', taskCount: 8, archived: false, createdAt: '2026-07-20T10:00:00Z' },
  { id: 'p3', name: 'Tech Stack Evaluation', description: 'LLM provider benchmarks and cost analysis', taskCount: 22, archived: false, createdAt: '2026-07-25T10:00:00Z' },
  { id: 'p4', name: 'Investor Due Diligence', description: 'Portfolio company research for Series B', taskCount: 5, archived: true, createdAt: '2026-06-01T10:00:00Z' },
]

export const mockUsageData = {
  requestsChart: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    requests: Math.floor(Math.random() * 120) + 20,
  })),
  tokensChart: Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    input: Math.floor(Math.random() * 800000) + 100000,
    output: Math.floor(Math.random() * 400000) + 50000,
  })),
  costChart: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: parseFloat((Math.random() * 8 + 0.5).toFixed(2)),
  })),
  summary: { totalRequests: 2847, totalTokens: 18_420_000, totalCost: 142.38, avgCostPerTask: 0.049 },
}

export const mockPlan = {
  name: 'Pro',
  status: 'ACTIVE',
  currentPeriodEnd: '2026-09-01T00:00:00Z',
  monthlyCredits: 10000,
  usedCredits: 6840,
  monthlyRequestLimit: 5000,
  usedRequests: 2847,
  features: ['Parallel workers (up to 20)', 'Persistent memory', 'Full trace tree', 'API access', 'Webhook events', 'Priority support'],
  price: '$49/mo',
}

export const mockCreditLedger = [
  { id: 'l1', type: 'GRANT', amount: 10000, reason: 'Monthly plan grant', createdAt: '2026-08-01T00:00:00Z' },
  { id: 'l2', type: 'SPEND', amount: -120, reason: 'Task: market analysis deep research', createdAt: '2026-08-01T09:14:00Z' },
  { id: 'l3', type: 'SPEND', amount: -85, reason: 'Task: competitor pricing scan', createdAt: '2026-08-01T11:30:00Z' },
  { id: 'l4', type: 'SPEND', amount: -240, reason: 'Task: regulatory landscape EU', createdAt: '2026-08-01T14:20:00Z' },
  { id: 'l5', type: 'REFUND', amount: 85, reason: 'Task failed — no charge', createdAt: '2026-08-01T15:00:00Z' },
  { id: 'l6', type: 'SPEND', amount: -310, reason: 'Task: investor report synthesis', createdAt: '2026-08-02T08:00:00Z' },
]

export const mockTeamMembers = [
  { id: 'u1', name: 'Yash Trivedi', email: 'yash@sequential.ai', role: 'OWNER', imageUrl: '', joinedAt: '2026-06-01T00:00:00Z' },
  { id: 'u2', name: 'Priya Sharma', email: 'priya@sequential.ai', role: 'ADMIN', imageUrl: '', joinedAt: '2026-06-15T00:00:00Z' },
  { id: 'u3', name: 'Arjun Mehta', email: 'arjun@sequential.ai', role: 'DEVELOPER', imageUrl: '', joinedAt: '2026-07-01T00:00:00Z' },
  { id: 'u4', name: 'Sneha Patel', email: 'sneha@sequential.ai', role: 'ANALYST', imageUrl: '', joinedAt: '2026-07-10T00:00:00Z' },
]

export const mockPendingInvites = [
  { id: 'i1', email: 'dev@partner.com', role: 'DEVELOPER', status: 'PENDING', createdAt: '2026-08-01T10:00:00Z' },
]

export const mockNotifications = [
  { id: 'n1', type: 'TASK_COMPLETED', title: 'Task completed', body: 'Market analysis deep research finished in 4.2s', readAt: null, createdAt: '2026-08-02T12:00:00Z' },
  { id: 'n2', type: 'CREDITS_LOW', title: 'Credits running low', body: 'You have 3,160 credits remaining this month', readAt: null, createdAt: '2026-08-02T11:30:00Z' },
  { id: 'n3', type: 'TASK_FAILED', title: 'Task failed', body: 'Competitor pricing scan encountered an error', readAt: '2026-08-01T15:05:00Z', createdAt: '2026-08-01T15:00:00Z' },
  { id: 'n4', type: 'MEMBER_JOINED', title: 'New member joined', body: 'Sneha Patel joined as Analyst', readAt: '2026-07-10T12:00:00Z', createdAt: '2026-07-10T10:00:00Z' },
  { id: 'n5', type: 'SUBSCRIPTION_RENEWED', title: 'Subscription renewed', body: 'Your Pro plan renewed for August', readAt: '2026-08-01T00:05:00Z', createdAt: '2026-08-01T00:00:00Z' },
]

export const mockWebhooks = [
  { id: 'w1', url: 'https://api.myapp.com/webhooks/sequential', events: ['TASK_COMPLETED', 'TASK_FAILED'], isActive: true, createdAt: '2026-07-01T00:00:00Z' },
]

export const mockSecrets = [
  { id: 's1', provider: 'OPENAI', name: 'default', createdAt: '2026-06-01T00:00:00Z' },
  { id: 's2', provider: 'FIRECRAWL', name: 'default', createdAt: '2026-06-01T00:00:00Z' },
]

export const mockAuditLogs = [
  { id: 'a1', actorName: 'Yash Trivedi', category: 'API_KEY', action: 'api_key.created', ipAddress: '49.36.x.x', createdAt: '2026-08-02T10:00:00Z' },
  { id: 'a2', actorName: 'Yash Trivedi', category: 'TASK', action: 'task.created', ipAddress: '49.36.x.x', createdAt: '2026-08-02T09:30:00Z' },
  { id: 'a3', actorName: 'Priya Sharma', category: 'MEMBER', action: 'member.invited', ipAddress: '103.21.x.x', createdAt: '2026-08-01T14:00:00Z' },
  { id: 'a4', actorName: 'Yash Trivedi', category: 'BILLING', action: 'subscription.upgraded', ipAddress: '49.36.x.x', createdAt: '2026-08-01T10:00:00Z' },
  { id: 'a5', actorName: 'Arjun Mehta', category: 'AUTH', action: 'user.login', ipAddress: '117.196.x.x', createdAt: '2026-08-01T09:00:00Z' },
  { id: 'a6', actorName: 'Yash Trivedi', category: 'SETTINGS', action: 'org.settings_updated', ipAddress: '49.36.x.x', createdAt: '2026-07-31T16:00:00Z' },
]

export const mockOverviewStats = {
  totalTasksThisMonth: 58,
  totalTasksTrend: +12,
  creditsRemaining: 3160,
  totalCredits: 10000,
  apiRequestsThisMonth: 2847,
  apiRequestsTrend: +340,
  activeApiKeys: 2,
}
