// =============================================================================
// Who is logged in (FR-01) - Bobby
// =============================================================================
// WHAT IT DOES
//   Keeps track of the logged-in student for the whole app. On load it asks the
//   server "who is logged in?" (GET /api/auth/me). If any later request says the
//   session ended (30 minutes idle, NFR 6.2), it clears the user so the login page shows.
//
// HOW IT CONNECTS
//   - App.tsx wraps everything in <AuthProvider>; any component can call useAuth()
//     to get { user, years, logout, ... }.
//   - React "context" is how one value is shared with every component below it
//     without passing it through each one.
//   - lib/api/client.ts fires SESSION_ENDED_EVENT on a 401 answer; this file listens for it.
// =============================================================================

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { getMe, logout as logoutRequest } from '@/lib/api/auth';
import { SESSION_ENDED_EVENT } from '@/lib/api/client';
import type { User } from '@/lib/types';

const YEARS_FALLBACK = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

interface AuthState {
  user: User | null;
  years: string[];
  checking: boolean; // true until the first /auth/me answer arrives
  sessionEnded: boolean; // true after the server ended the session
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [years, setYears] = useState(YEARS_FALLBACK);
  const [checking, setChecking] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    getMe()
      .then((r) => {
        setUserState(r.user);
        setYears(r.years);
      })
      .catch(() => setUserState(null))
      .finally(() => setChecking(false));

    const onSessionEnded = () => {
      setUserState(null);
      setSessionEnded(true);
    };
    window.addEventListener(SESSION_ENDED_EVENT, onSessionEnded);
    return () => window.removeEventListener(SESSION_ENDED_EVENT, onSessionEnded);
  }, []);

  const setUser = (next: User | null) => {
    setUserState(next);
    if (next) setSessionEnded(false);
  };

  const logout = async () => {
    await logoutRequest().catch(() => undefined);
    setUserState(null);
    navigate('/'); // the next person to log in starts on the Today page
  };

  return (
    <AuthContext.Provider value={{ user, years, checking, sessionEnded, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Use inside any component: const { user, logout } = useAuth(); */
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.');
  return value;
}
