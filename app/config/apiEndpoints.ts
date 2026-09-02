export const apiEndpoints = {
  auth: {
    login: '/v1/auth/login',
    signup: '/v1/auth/signup',
    refresh: '/v1/auth/refresh',
    signout: '/v1/auth/signout',
  },
  households: {
    me: '/v1/households/me',
    draft: '/v1/households/onboarding/draft',
    sample: '/v1/households/onboarding/sample',
    commit: '/v1/households/onboarding/commit',
    demo: '/v1/households/demo',
    policy: (id: string) => `/v1/households/me/policies/${id}`,
    trust: '/v1/households/me/trust',
  },
  inbox: { base: '/v1/inbox', signals: '/v1/inbox/signals', samples: '/v1/inbox/samples' },
  brief: { base: '/v1/brief', script: '/v1/brief/script' },
  ledger: {
    base: '/v1/ledger',
    decision: (id: string) => `/v1/ledger/${id}/decision`,
    trace: '/v1/ledger/trace',
    messages: '/v1/ledger/messages',
  },
  calendar: { base: '/v1/calendar', reminders: '/v1/calendar/reminders', ics: '/v1/calendar/ics' },
  chores: {
    base: '/v1/chores',
    complete: (id: string) => `/v1/chores/${id}/complete`,
    undo: (id: string) => `/v1/chores/${id}/undo`,
    remove: (id: string) => `/v1/chores/${id}`,
    claims: '/v1/chores/claims',
    approve: (id: string) => `/v1/chores/claims/${id}/approve`,
    rewards: '/v1/chores/rewards',
  },
} as const;

const PUBLIC = [apiEndpoints.auth.login, apiEndpoints.auth.signup, apiEndpoints.auth.refresh];
export const isPublicEndpoint = (url?: string) => !!url && PUBLIC.some((p) => url.endsWith(p));
