// AI ASSISTANCE: Drafted with Claude (Anthropic) and reviewed by Bobby Hughes.
// =============================================================================
// Profile page (FR-01 / UC-01 part C) - Bobby
// =============================================================================
// WHAT IT DOES
//   Lets the student change their name and year in school, and log out.
//
// HOW IT CONNECTS
//   - Saves through updateProfile() in lib/api/auth.ts (PUT /api/auth/profile).
//   - After saving it calls setUser() so the sidebar shows the new name right away.
// =============================================================================

import { useState, type FormEvent } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Character } from '@/components/Character';
import { FieldError } from '@/components/FieldError';
import { Heading } from '@/components/Heading';
import { Panel } from '@/components/Panel';
import { updateProfile } from '@/lib/api/auth';
import { ApiError, errorMessage } from '@/lib/api/client';

export function ProfilePage({ notify }: { notify: (text: string) => void }) {
  const { user, years, setUser, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [year, setYear] = useState(user?.year ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const result = await updateProfile(name, year);
      // Share the new name with the whole app (the sidebar and greeting update right away).
      setUser(result.user);
      notify('Profile saved.');
    } catch (err) {
      setErrors(err instanceof ApiError && err.data.errors ? err.data.errors : { form: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Heading
        eyebrow="Just you"
        title="Your profile."
        subtitle="Your check-ins are private to this account."
      />
      <Panel className="profile-panel">
        <Character name="today" className="profile-character" />
        <form className="grid" style={{ gap: 15 }} onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="profile-email">Email</label>
            <input id="profile-email" value={user?.email ?? ''} disabled />
          </div>
          <div className="field">
            <label htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className={errors.name ? 'has-error' : undefined}
              data-testid="input-profile-name"
            />
            <FieldError id="profile-name-error" message={errors.name} />
          </div>
          <div className="field">
            <label htmlFor="profile-year">Year in school</label>
            <select
              id="profile-year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={errors.year ? 'has-error' : undefined}
              data-testid="select-profile-year"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <FieldError id="profile-year-error" message={errors.year} />
          </div>
          {errors.form && (
            <div className="form-alert" role="alert">
              {errors.form}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="button ghost"
              onClick={logout}
              data-testid="button-profile-logout"
            >
              <LogOut size={15} /> Log out
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={busy}
              data-testid="button-profile-save"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Panel>
    </>
  );
}
