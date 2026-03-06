import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

type Params = Record<string, string>;

type RouteMatch = {
  path: string;
  params: Params;
};

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, '');

function normalize(path: string) {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

function withBase(path: string) {
  if (!BASE_URL) {
    return path;
  }

  return `${BASE_URL}${path === '/' ? '' : path}`;
}

function stripBase(pathname: string) {
  if (BASE_URL && pathname.startsWith(BASE_URL)) {
    const sliced = pathname.slice(BASE_URL.length);
    return sliced ? normalize(sliced) : '/';
  }

  return normalize(pathname);
}

function matchPath(pattern: string, pathname: string): Params | null {
  const patternSegments = normalize(pattern).split('/').filter(Boolean);
  const pathSegments = normalize(pathname).split('/').filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params: Params = {};

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index];
    const pathSegment = pathSegments[index];

    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
      continue;
    }

    if (patternSegment !== pathSegment) {
      return null;
    }
  }

  return params;
}

export function navigateTo(path: string) {
  const target = withBase(path);
  window.history.pushState({}, '', target);
  window.dispatchEvent(new Event('popstate'));
}

export function RouterLink({
  to,
  children,
  className
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  const href = withBase(to);

  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }

        event.preventDefault();
        navigateTo(to);
      }}
    >
      {children}
    </a>
  );
}

export function useRouter() {
  const [pathname, setPathname] = useState(() => stripBase(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setPathname(stripBase(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return pathname;
}

export function useRoute(pathname: string, patterns: string[]): RouteMatch {
  return useMemo(() => {
    for (const pattern of patterns) {
      const params = matchPath(pattern, pathname);
      if (params) {
        return { path: pattern, params };
      }
    }

    return { path: '/', params: {} };
  }, [pathname, patterns]);
}
