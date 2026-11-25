import { ref, computed } from 'vue';

export type AppRole = 'ADMIN' | 'TECHNICIAN';

const STORAGE_KEY = 'itsm_active_role';
const currentRole = ref<AppRole>((localStorage.getItem(STORAGE_KEY) as AppRole) || 'ADMIN');

export function useCurrentRole() {
  const setRole = (role: AppRole) => {
    currentRole.value = role;
    localStorage.setItem(STORAGE_KEY, role);
  };

  const isAdmin = computed(() => currentRole.value === 'ADMIN');

  return {
    currentRole,
    setRole,
    isAdmin
  };
}