export const apiEndpoints = {
  auth: { login: '/auth/login', signup: '/auth/signup', refresh: '/auth/refresh', signout: '/auth/signout' },
  households: { me: '/households/me', draft: '/households/onboarding/draft', sample: '/households/onboarding/sample', commit: '/households/onboarding/commit', demo: '/households/demo', policy: (id: string) => `/households/me/policies/${id}`, trust: '/households/me/trust' },
  inbox: { base: '/inbox', signals: '/inbox/signals', samples: '/inbox/samples' },
  brief: { base: '/brief', script: '/brief/script' },
  ledger: { decision: (id: string) => `/ledger/${id}/decision` },
  calendar: { base: '/calendar', reminders: '/calendar/reminders', ics: '/calendar/ics' },
  chores: { base: '/chores', complete: (id: string) => `/chores/${id}/complete`, undo: (id: string) => `/chores/${id}/undo`, claims: '/chores/claims', approve: (id: string) => `/chores/claims/${id}/approve` },
} as const;

const PUBLIC = [apiEndpoints.auth.login, apiEndpoints.auth.signup, apiEndpoints.auth.refresh];
export const isPublicEndpoint = (url?: string) => !!url && PUBLIC.some((p) => url.endsWith(p));
