// =============================================================================
// App frame: sidebar, top bar, phone navigation - Malika (design)
// =============================================================================
// WHAT IT DOES
//   The frame around every page: the green sidebar with the menu (desktop), the top
//   bar with today's date and the "Private to your account" note, and the bottom
//   menu bar on phones. Also the profile link and the Log out button.
//
// HOW IT CONNECTS
//   - App.tsx wraps every page in <Shell>.
//   - To add a page to the menus, add it to navItems and add its Route in App.tsx.
//   - useAuth() (components/auth/AuthProvider.tsx) gives the user's name and logout().
//   - The look comes from the .sidebar / .topbar / .mobile-nav styles in index.css.
//
// CREDIT
//   Malika Ray - from her original Replit prototype: the sidebar, top bar, menu, brand block,
//   "A small reminder" note and phone navigation (layout, wording and styling).
//   Added later: account links, Log out, the student character, the app name.
// =============================================================================

import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Activity,
  ArrowLeftRight,
  BookOpen,
  CalendarDays,
  Heart,
  Leaf,
  LockKeyhole,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Character } from '@/components/Character';

type RouteName = 'home' | 'log' | 'schedule' | 'progress' | 'compare';
const navItems: {
  href: string;
  label: string;
  icon: typeof Heart;
  key: RouteName;
}[] = [
  { href: '/', label: 'Today', icon: Leaf, key: 'home' },
  { href: '/log', label: 'Daily log', icon: BookOpen, key: 'log' },
  { href: '/schedule', label: 'My week', icon: CalendarDays, key: 'schedule' },
  { href: '/progress', label: 'Your patterns', icon: Activity, key: 'progress' },
  { href: '/compare', label: 'Compare', icon: ArrowLeftRight, key: 'compare' },
];

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const current = navItems.find((item) => item.href === location)?.key;
  const today = new Date();
  const firstName = user?.name.split(' ')[0] ?? '';
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Leaf size={21} />
          </div>
          <div>
            <div className="brand-name">Student Wellness Planner</div>
            <div className="brand-caption">A softer kind of planner</div>
          </div>
        </div>
        <div className="nav-label">Your space</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(({ href, label, icon: Icon, key }) => (
            <Link
              key={key}
              href={href}
              className={`nav-link ${current === key ? 'active' : ''}`}
              data-testid={`link-nav-${key}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="side-note">
          <Character name="today" className="side-note-character" />
          <strong>A small reminder</strong>You don't have to do it all today. A little care still counts.
        </div>
        <div className="sidebar-account">
          <Link
            href="/profile"
            className={`nav-link ${location === '/profile' ? 'active' : ''}`}
            data-testid="link-nav-profile"
          >
            <User size={18} />
            {firstName || 'Profile'}
          </Link>
          <button type="button" className="nav-link nav-button" onClick={logout} data-testid="button-logout">
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>
      <main className="main-area">
        <div className="topbar">
          <div className="top-date">
            <CalendarDays size={15} />
            <span>
              {today.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="topbar-right">
            <div className="privacy-pill">
              <LockKeyhole size={13} /> Private to your account
            </div>
            <Link
              href="/profile"
              className="account-pill"
              aria-label="Your profile"
              data-testid="link-top-profile"
            >
              <User size={14} />
              <span>{firstName}</span>
            </Link>
          </div>
        </div>
        {children}
      </main>
      <nav className="mobile-nav" aria-label="Main navigation">
        {navItems.map(({ href, label, icon: Icon, key }) => (
          <Link
            key={key}
            href={href}
            className={`nav-link ${current === key ? 'active' : ''}`}
            data-testid={`link-mobile-nav-${key}`}
          >
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
