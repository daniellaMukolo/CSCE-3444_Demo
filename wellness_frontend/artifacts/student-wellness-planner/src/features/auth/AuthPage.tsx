// =============================================================================
// Login and sign-up screen (FR-01 / UC-01) - Bobby
// =============================================================================
// WHAT IT DOES
//   The screen shown whenever nobody is logged in: one card that switches between
//   Log in and Create your account. Shows the server's messages next to each field.
//
// HOW IT CONNECTS
//   - App.tsx shows it when useAuth().user is empty.
//   - Sends requests through lib/api/auth.ts. The rules (8+ character password,
//     lockout after 5 failures, hashing) are enforced by wellness/auth.py on the server.
//   - After success it calls setUser(user), and App.tsx switches to the Today page.
//
// CREDIT
//   Visual style follows Malika's design (brand block and panels from her prototype).
// =============================================================================

import { useEffect, useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Leaf, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Character } from '@/components/Character';
import { FieldError } from '@/components/FieldError';
import { getDemoLogin, login, register } from '@/lib/api/auth';
import { ApiError, errorMessage } from '@/lib/api/client';

type Mode = 'login' | 'register';

export function AuthPage() {
  const { setUser, years, sessionEnded } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', year: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  // TEMPORARY: the demo student's login, shown so teammates, instructors and testers can try the app.
  // The server sends it only while SHOW_DEMO_LOGIN is on (wellness/__init__.py); otherwise nothing shows.
  const [demo, setDemo] = useState<{ email: string; password: string } | null>(null);
  useEffect(() => {
    getDemoLogin().then(setDemo).catch(() => setDemo(null));
  }, []);

  // Change one field: [key] uses the variable's value as the property name.
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setFormError('');
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError('');
    try {
      const result = mode === 'login' ? await login(form.email, form.password) : await register(form);
      setUser(result.user); // AuthProvider now has a user, so App.tsx shows the app
      if (mode === 'register') navigate('/'); // new accounts start on the Today page
    } catch (error) {
      // Sign-up problems come back per field; a failed login comes back as one message.
      if (error instanceof ApiError && error.data.errors) setErrors(error.data.errors);
      else setFormError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  // Draws one labeled input with its error message, so each field isn't written out by hand.
  const field = (
    key: keyof typeof form,
    label: string,
    type = 'text',
    autoComplete?: string,
    help?: string,
  ) => (
    <div className="field">
      <label htmlFor={`auth-${key}`}>{label}</label>
      <input
        id={`auth-${key}`}
        type={type}
        value={form[key]}
        autoComplete={autoComplete}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `auth-${key}-error` : undefined}
        className={errors[key] ? 'has-error' : undefined}
        data-testid={`input-auth-${key}`}
      />
      {help && !errors[key] && <span className="field-help">{help}</span>}
      <FieldError id={`auth-${key}-error`} message={errors[key]} />
    </div>
  );

  return (
    <div className="auth-shell">
      <section className="panel auth-card">
        <div className="brand auth-brand">
          <div className="brand-mark">
            <Leaf size={21} />
          </div>
          <div>
            <div className="brand-name">Student Wellness Planner</div>
            <div className="brand-caption">A softer kind of planner</div>
          </div>
        </div>
        <Character name="today" className="auth-mascot" />
        <div className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Make some room for you'}</div>
        <h1 className="page-title auth-title">{mode === 'login' ? 'Log in' : 'Create your account'}</h1>
        {sessionEnded && mode === 'login' && (
          <p className="form-note">You were logged out after 30 minutes of inactivity. Log in to continue.</p>
        )}
        {demo && mode === 'login' && (
          <div className="form-note" data-testid="panel-demo-login">
            <strong>Trying the app?</strong> Log in as our demo student, Alexa.
            <br />
            Email: {demo.email} · Password: {demo.password}
            <br />
            <button
              type="button"
              className="link-button"
              onClick={() => setForm((f) => ({ ...f, email: demo.email, password: demo.password }))}
              data-testid="button-demo-fill"
            >
              Fill it in for me
            </button>
          </div>
        )}
        <form className="grid auth-form" onSubmit={submit} noValidate>
          {mode === 'register' && field('name', 'Name', 'text', 'name')}
          {field('email', 'Email', 'email', 'email')}
          {field(
            'password',
            'Password',
            'password',
            mode === 'login' ? 'current-password' : 'new-password',
            mode === 'register' ? 'At least 8 characters.' : undefined,
          )}
          {mode === 'register' && field('confirm', 'Confirm password', 'password', 'new-password')}
          {mode === 'register' && (
            <div className="field">
              <label htmlFor="auth-year">Year in school</label>
              <select
                id="auth-year"
                value={form.year}
                onChange={(e) => set('year', e.target.value)}
                aria-invalid={!!errors.year}
                className={errors.year ? 'has-error' : undefined}
                data-testid="select-auth-year"
              >
                <option value="">Choose…</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <FieldError id="auth-year-error" message={errors.year} />
            </div>
          )}
          {formError && (
            <div className="form-alert" role="alert" data-testid="status-auth-error">
              {formError}
            </div>
          )}
          {mode === 'register' && errors.email === 'This email is already registered.' && (
            <button type="button" className="link-button" onClick={() => switchMode('login')}>
              Log in instead
            </button>
          )}
          <button type="submit" className="button primary" disabled={busy} data-testid="button-auth-submit">
            {busy ? 'One moment…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            data-testid="button-auth-switch"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
        <div className="privacy-pill auth-privacy">
          <LockKeyhole size={13} /> Your check-ins are private to your account
        </div>
      </section>
    </div>
  );
}
