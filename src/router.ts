
type RouteHandler = (params?: Record<string,string>) => void;

const routes: Record<string, RouteHandler> = {};

export function initRouter(defs: Record<string, RouteHandler>) {
  Object.assign(routes, defs);
  window.addEventListener('popstate', () => {
    navigate(location.pathname + location.search, false);
  });
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t && t.closest) {
      const a = t.closest('a[href^="/"]') as HTMLAnchorElement | null;
      if (a) {
        e.preventDefault();
        navigate(a.getAttribute('href')!, true);
      }
    }
  });
}

function match(pathname: string): {handler?: RouteHandler, params: Record<string,string>} {
  for (const pattern in routes) {
    const names: string[] = [];
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, (m) => {
      names.push(m.slice(1)); return '([^/]+)';
    }) + '$');
    const m = pathname.match(regex);
    if (m) {
      const params: Record<string,string> = {};
      names.forEach((n, i) => params[n] = decodeURIComponent(m[i+1]));
      return { handler: routes[pattern], params };
    }
  }
  return { params: {} };
}

export function navigate(url: string, pushState = true) {
  const [path] = url.split('?');
  const { handler, params } = match(path);
  if (pushState) history.pushState({}, '', url);
  if (handler) handler(params);
  else routes['/']?.({});
}
