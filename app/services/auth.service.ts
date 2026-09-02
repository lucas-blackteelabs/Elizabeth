import { apiEndpoints } from '@/config/apiEndpoints';
import { AuthTokens } from '@/lib/types';
import { genericCreate } from './generic.service';

export type LoginRequest = { username: string; password: string };
export type SignUpRequest = { name: string; username: string; password: string; timeZone?: string };

export const login = (req: LoginRequest) => genericCreate<LoginRequest, AuthTokens>(apiEndpoints.auth.login, req);
export const signUp = (req: SignUpRequest) => genericCreate<SignUpRequest, AuthTokens>(apiEndpoints.auth.signup, req);
export const signOut = () => genericCreate<void, void>(apiEndpoints.auth.signout);
