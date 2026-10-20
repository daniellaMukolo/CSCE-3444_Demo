// =============================================================================
// Entry point - Replit template (unchanged)
// =============================================================================
// WHAT IT DOES
//   Starts React: finds the <div id="root"> in index.html and draws <App /> inside it,
//   wrapped in an ErrorBoundary so a crash shows a message instead of a blank page.
//
// HOW IT CONNECTS
//   - index.html loads this file; Vite bundles everything it imports.
//   - index.css (the whole visual design) is loaded here.
//
// CREDIT
//   Replit's React template (came with the project; not written by the team).
// =============================================================================

import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
