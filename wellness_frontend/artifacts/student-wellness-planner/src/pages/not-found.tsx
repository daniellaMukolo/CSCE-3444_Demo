// =============================================================================
// Page not found (404) - Shared
// =============================================================================
// WHAT IT DOES
//   Shown for any address that doesn't match a page in App.tsx, with a link back to Today.
//
// HOW IT CONNECTS
//   - App.tsx's last <Route> (with no path) shows this page.
//
// CREDIT
//   Started from Replit's template 404 page; rewritten with the app's style and character.
// =============================================================================

import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { Character } from '@/components/Character';

export default function NotFound() {
  return (
    <div style={{ padding: '10vh 4vw' }}>
      <Character name="today" size={150} />
      <div className="eyebrow">A quiet detour</div>
      <h1 className="page-title">We can’t find that page.</h1>
      <p className="page-subtitle">Let’s bring you back to your day.</p>
      <Link className="button primary" href="/" data-testid="link-back-home">
        Go to today <ArrowRight size={15} />
      </Link>
    </div>
  );
}
