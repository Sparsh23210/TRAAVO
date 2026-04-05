import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const rootElement = document.getElementById('root');
const pathname = window.location.pathname;
const preRenderedMeta = document.querySelector('meta[name="prerender-path"]');
const preRenderedPath = preRenderedMeta ? preRenderedMeta.getAttribute('content') : null;

// Normalize paths for comparison (remove trailing slashes)
const currentPathNorm = pathname.replace(/\/$/, '') || '/';
const preRenderedPathNorm = preRenderedPath ? (preRenderedPath.replace(/\/$/, '') || '/') : null;

// Only hydrate if we are matching the pre-rendered HTML, or if no meta tag exists but it's the homepage fallback.
// If there's a mismatch (e.g., server sent homepage HTML for /about), we fall back to createRoot to clear and render cleanly.
const isMatch = preRenderedPathNorm === currentPathNorm || (!preRenderedPath && currentPathNorm === '/');

if (rootElement.hasChildNodes() && isMatch) {
  hydrateRoot(
    rootElement,
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
