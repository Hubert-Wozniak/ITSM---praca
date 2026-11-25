import type { Router } from 'vue-router';
import { useAuth } from '../composables/useAuth';

let isInstalled = false;

export function setupFetchInterceptor(router: Router) {
  if (isInstalled) return;
  isInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const isApiCall = url.startsWith('http://localhost:3000/api/');
    const isLoginEndpoint = url.endsWith('/api/auth/login');

    if (!isApiCall || isLoginEndpoint) {
      return originalFetch(input, init);
    }

    const { token, logout } = useAuth();
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));

    if (token.value && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token.value}`);
    }

    const response = await originalFetch(input, {
      ...init,
      headers
    });

    if (response.status === 401) {
      logout();
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login');
      }
    }

    return response;
  };
}