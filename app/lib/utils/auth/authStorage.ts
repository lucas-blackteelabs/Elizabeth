export const ACCESS_TOKEN_KEY = 'familyos.accessToken';
export const REFRESH_TOKEN_KEY = 'familyos.refreshToken';

const safe = (fn: () => string | null) => {
  try {
    return typeof window === 'undefined' ? null : fn();
  } catch {
    return null;
  }
};

export const tokenStorage = {
  getAccessToken: () => safe(() => localStorage.getItem(ACCESS_TOKEN_KEY)),
  getRefreshToken: () => safe(() => localStorage.getItem(REFRESH_TOKEN_KEY)),
  setTokens: (access: string, refresh: string) => {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    } catch {}
  },
  clear: () => {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {}
  },
};
