export type UserInfo = { id: string; name: string; email: string; householdId?: string; exp: number };

export const getUserInfoFromToken = (token: string): UserInfo | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { id: payload.id, name: payload.name, email: payload.sub, householdId: payload.householdId, exp: payload.exp };
  } catch {
    return null;
  }
};
