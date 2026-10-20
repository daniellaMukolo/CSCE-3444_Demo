// =============================================================================
// Top-level app and page routes - Shared (integration: Bobby)
// =============================================================================
// WHAT IT DOES
//   Shows the login screen until someone is logged in, then shows the page that
//   matches the address (/, /log, /schedule, ...) inside the shared Shell frame.
//   Also shows the short pop-up messages ("Your check-in is saved.").
//
// HOW IT CONNECTS
//   - main.tsx renders <App />. AuthProvider (components/auth) knows who is logged in.
//   - Each page lives in its own folder under src/features/. To add a page: add a
//     <Route> here and an entry in navItems in components/layout/Shell.tsx.
//   - notify(text) is passed to pages so they can show a Toast after saving.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the overall page list and the idea of one App with
//   a Shell around every page (her App/Shell layout). Routing and login are new.
// =============================================================================

import { useState } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { Shell } from '@/components/layout/Shell';
import { Toast } from '@/components/Toast';
import { AuthPage } from '@/features/auth/AuthPage';
import { ComparePage } from '@/features/compare/ComparePage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { LogPage } from '@/features/daily-log/LogPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { ProgressPage } from '@/features/progress/ProgressPage';
import { SchedulePage } from '@/features/schedule/SchedulePage';
import NotFound from '@/pages/not-found';
import './index.css';

function Pages() {
  const { user, checking } = useAuth();
  const [message, setMessage] = useState('');
  const notify = (text: string) => setMessage(text);

  if (checking) return <div className="auth-shell subtle">Loading…</div>;
  if (!user) return <AuthPage />;

  return (
    <>
      <Shell>
        <Switch>
          <Route path="/">
            <DashboardPage />
          </Route>
          <Route path="/log">
            <LogPage notify={notify} />
          </Route>
          <Route path="/schedule">
            <SchedulePage notify={notify} />
          </Route>
          <Route path="/progress">
            <ProgressPage />
          </Route>
          <Route path="/compare">
            <ComparePage />
          </Route>
          <Route path="/profile">
            <ProfilePage notify={notify} />
          </Route>
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </Shell>
      {message && <Toast message={message} onDone={() => setMessage('')} />}
    </>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AuthProvider>
        <Pages />
      </AuthProvider>
    </WouterRouter>
  );
}

export default App;
