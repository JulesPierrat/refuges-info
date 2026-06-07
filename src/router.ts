/**
 * Minimal History-API router. The app is a single persistent shell (the globe
 * never remounts); only the side panel changes with the route.
 */
export type Route = { name: 'home' } | { name: 'massif'; slug: string };

type Listener = (route: Route) => void;
const listeners = new Set<Listener>();

export function currentRoute(): Route {
  const m = location.pathname.match(/^\/massif\/([^/]+)\/?$/);
  if (m) return { name: 'massif', slug: decodeURIComponent(m[1]) };
  return { name: 'home' };
}

function emit() {
  const route = currentRoute();
  for (const l of listeners) l(route);
}

/** Push a new path (no-op if unchanged) and notify listeners. */
export function navigate(path: string) {
  if (path !== location.pathname) history.pushState({}, '', path);
  emit();
}

export function onRouteChange(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

window.addEventListener('popstate', emit);
