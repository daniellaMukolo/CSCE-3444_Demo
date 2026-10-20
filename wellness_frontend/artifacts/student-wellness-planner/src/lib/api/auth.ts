// AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
// =============================================================================
// Account requests (FR-01) - Bobby
// =============================================================================
// WHAT IT DOES
//   One small function per account address: who is logged in, register, log in,
//   log out, and update the profile.
//
// HOW IT CONNECTS
//   - Matches wellness_planner/wellness/api/auth.py.
//   - Used by AuthProvider, AuthPage and ProfilePage.
// =============================================================================

import type { User } from '../types';
import { api } from './client';

/** TEMPORARY: the demo student's login for the login screen (404 when turned off on the server). */
export const getDemoLogin = () => api<{ email: string; password: string }>('/auth/demo');

export const getMe = () => api<{ user: User; years: string[] }>('/auth/me');

export const login = (email: string, password: string) =>
  api<{ user: User }>('/auth/login', { method: 'POST', body: { email, password } });

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirm: string;
  year: string;
}
export const register = (form: RegisterForm) =>
  api<{ user: User }>('/auth/register', { method: 'POST', body: form });

export const logout = () => api('/auth/logout', { method: 'POST' });

export const updateProfile = (name: string, year: string) =>
  api<{ user: User }>('/auth/profile', { method: 'PUT', body: { name, year } });
