import { computed } from 'vue';
import { useAuth } from './useAuth';

export type ActiveRole = 'ADMIN' | 'TECHNICIAN';

export function useCurrentRole() {
  const { currentUser, isAdmin } = useAuth();

  const currentRole = computed<ActiveRole>(() =>
    currentUser.value?.role === 'ADMIN' ? 'ADMIN' : 'TECHNICIAN'
  );

  return {
    currentRole,
    isAdmin
  };
}