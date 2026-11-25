import { ref, computed } from 'vue';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string | null;
  role: 'ADMIN' | 'TECHNICIAN' | string;
  isActive: boolean;
}

const TOKEN_KEY = 'itsm_auth_token';
const USER_KEY = 'itsm_auth_user';

const loadStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
const currentUser = ref<AuthUser | null>(loadStoredUser());

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(token.value && currentUser.value));
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN');

  const fullName = computed(() => {
    if (!currentUser.value) return 'Nieznany użytkownik';
    return `${currentUser.value.firstName} ${currentUser.value.lastName}`;
  });

  const initials = computed(() => {
    if (!currentUser.value) return 'IT';
    return `${currentUser.value.firstName?.[0] || ''}${currentUser.value.lastName?.[0] || ''}`.toUpperCase();
  });

  const setSession = (newToken: string, user: AuthUser) => {
    token.value = newToken;
    currentUser.value = user;
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const clearSession = () => {
    token.value = null;
    currentUser.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Nie udało się zalogować.');
    }

    setSession(data.token, data.user);
    return data.user as AuthUser;
  };

  const fetchCurrentUser = async () => {
    if (!token.value) return null;

    try {
      const response = await fetch('http://localhost:3000/api/auth/me');
      if (!response.ok) {
        clearSession();
        return null;
      }
      const data = await response.json();
      if (data.user) {
        currentUser.value = data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
      return data.user as AuthUser;
    } catch {
      return null;
    }
  };

  return {
    token,
    currentUser,
    isAuthenticated,
    isAdmin,
    fullName,
    initials,
    login,
    logout: clearSession,
    fetchCurrentUser
  };
}