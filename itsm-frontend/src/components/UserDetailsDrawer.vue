<template>
  <div v-if="userId !== null" class="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs" @click.self="$emit('close')">
    <aside class="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
      <!-- Nagłówek panelu -->
      <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">Karta pracownika</span>
          <span
            v-if="user"
            :class="[
              'px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0',
              user.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            ]"
          >
            {{ user.isActive ? 'Aktywny' : 'Po offboardingu' }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button
            v-if="user && user.isActive"
            @click="createTicketForUser"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
            title="Utwórz nowe zgłoszenie dla tego pracownika"
          >
            <PlusIcon class="w-3.5 h-3.5" />
            Zgłoś
          </button>

          <button
            v-if="user"
            @click="isEditModalOpen = true"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            title="Edytuj dane pracownika"
          >
            <PencilIcon class="w-3.5 h-3.5" />
            Edytuj
          </button>

          <button
            v-if="user && user.isActive"
            @click="triggerOffboarding"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
          >
            <UserMinusIcon class="w-3.5 h-3.5" />
            Offboarding
          </button>

          <button
            v-else-if="user && !user.isActive"
            @click="reactivateUser"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
          >
            <RotateCcwIcon class="w-3.5 h-3.5" />
            Przywróć konto
          </button>

          <!-- Dyskretne trwałe usunięcie tylko dla Administratora -->
          <button
            v-if="user && isAdmin"
            @click="deleteUserPermanently"
            class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Usuń użytkownika trwale z bazy (Administrator)"
          >
            <Trash2Icon class="w-4 h-4" />
          </button>

          <button
            @click="$emit('close')"
            class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Zamknij panel"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Ładowanie karty pracownika...
      </div>

      <div v-else-if="user" class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Profil i dane kontaktowe -->
        <div class="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div
            :class="[
              'w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shrink-0',
              user.isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-500'
            ]"
          >
            {{ getInitials(user.firstName, user.lastName) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-lg font-bold text-slate-900">{{ user.firstName }} {{ user.lastName }}</h3>
              <span class="px-2 py-0.5 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                {{ getRoleLabel(user.role) }}
              </span>
            </div>
            <p class="text-sm text-slate-600 mt-0.5">
              {{ user.department }}{{ user.position ? ` • ${user.position}` : '' }}
            </p>
            <div class="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-500">
              <span class="inline-flex items-center gap-1">
                <MailIcon class="w-3.5 h-3.5 text-slate-400" />
                {{ user.email }}
              </span>
              <span v-if="user.phone" class="inline-flex items-center gap-1">
                <PhoneIcon class="w-3.5 h-3.5 text-slate-400" />
                {{ user.phone }}
              </span>
            </div>
          </div>
        </div>

        <!-- Archiwalny protokół offboardingu (jeśli wykonany) -->
        <div
          v-if="!user.isActive && user.offboardingChecklist"
          class="p-4 rounded-xl bg-slate-100/90 border border-slate-200 space-y-2.5"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ClipboardCheckIcon class="w-4 h-4 text-emerald-600" />
              Protokół zakończonego offboardingu
            </span>
            <span v-if="user.offboardedAt" class="text-[11px] text-slate-500">
              {{ formatDate(user.offboardedAt) }}
            </span>
          </div>
          <ul class="space-y-1.5 pt-1">
            <li
              v-for="item in user.offboardingChecklist.items || []"
              :key="item.key"
              class="flex items-center gap-2 text-xs text-slate-700"
            >
              <CheckIcon class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{{ item.label }}</span>
            </li>
          </ul>
        </div>

        <!-- Przypisany sprzęt CMDB -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <LaptopIcon class="w-4 h-4 text-slate-400" />
            Przydzielony sprzęt ({{ user.equipment?.length || 0 }})
          </h4>

          <div v-if="user.equipment && user.equipment.length > 0" class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            <button
              v-for="eq in user.equipment"
              :key="eq.id"
              type="button"
              @click="openEquipment(eq.id)"
              class="w-full p-3.5 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-left group"
            >
              <div>
                <p class="text-sm font-medium text-slate-900 group-hover:text-sky-600 transition-colors">{{ eq.name }}</p>
                <p class="text-xs font-mono text-slate-400">
                  S/N: {{ eq.serialNumber }}{{ eq.location ? ` • ${eq.location}` : '' }}
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  W użyciu
                </span>
                <ChevronRightIcon class="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
              </div>
            </button>
          </div>

          <div v-else class="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
            Brak sprzętu przypisanego do tego pracownika.
          </div>
        </div>

        <!-- Zgłoszenia utworzone przez pracownika -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <TicketIcon class="w-4 h-4 text-slate-400" />
            Zgłoszone incydenty i wnioski ({{ user.requestedTickets?.length || 0 }})
          </h4>

          <div v-if="user.requestedTickets && user.requestedTickets.length > 0" class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            <button
              v-for="t in user.requestedTickets"
              :key="t.id"
              type="button"
              @click="openTicket(t.id)"
              class="w-full p-3.5 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-left group"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-slate-400">IT-{{ t.id }}</span>
                  <p class="text-sm font-medium text-slate-900 group-hover:text-sky-600 transition-colors truncate">{{ t.title }}</p>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">{{ t.category }} • {{ formatDate(t.createdAt) }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span :class="['px-2 py-0.5 rounded text-xs font-semibold', getTicketStatusStyle(t.status)]">
                  {{ getTicketStatusLabel(t.status) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
              </div>
            </button>
          </div>

          <div v-else class="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
            Brak zgłoszeń utworzonych przez tego pracownika.
          </div>
        </div>

        <!-- Zgłoszenia realizowane jako technik IT -->
        <div v-if="user.role !== 'EMPLOYEE' || (user.assignedTickets && user.assignedTickets.length > 0)">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Obsługiwane zgłoszenia serwisowe ({{ user.assignedTickets?.length || 0 }})
          </h4>

          <div v-if="user.assignedTickets && user.assignedTickets.length > 0" class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            <button
              v-for="t in user.assignedTickets"
              :key="t.id"
              type="button"
              @click="openTicket(t.id)"
              class="w-full p-3.5 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-left group"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-slate-400">IT-{{ t.id }}</span>
                  <p class="text-sm font-medium text-slate-900 group-hover:text-sky-600 transition-colors truncate">{{ t.title }}</p>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">{{ formatDate(t.createdAt) }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span :class="['px-2 py-0.5 rounded text-xs font-semibold', getTicketStatusStyle(t.status)]">
                  {{ getTicketStatusLabel(t.status) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
              </div>
            </button>
          </div>

          <div v-else class="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
            Brak przypisanych zgłoszeń do realizacji.
          </div>
        </div>
      </div>

      <UserFormModal
        :is-open="isEditModalOpen"
        :user-to-edit="user"
        @close="isEditModalOpen = false"
        @submit="handleUpdateUser"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  XIcon,
  LaptopIcon,
  TicketIcon,
  MailIcon,
  PhoneIcon,
  UserMinusIcon,
  RotateCcwIcon,
  ClipboardCheckIcon,
  CheckIcon,
  Trash2Icon,
  PencilIcon,
  PlusIcon,
  ChevronRightIcon
} from 'lucide-vue-next';
import { useCurrentRole } from '../composables/useCurrentRole';
import UserFormModal from './UserFormModal.vue';

const props = defineProps<{
  userId: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
  (e: 'startOffboarding', userId: string): void;
}>();

const router = useRouter();
const { isAdmin } = useCurrentRole();
const user = ref<any | null>(null);
const isLoading = ref(false);
const isEditModalOpen = ref(false);

const fetchUserDetails = async (id: string) => {
  isLoading.value = true;
  try {
    const response = await fetch(`http://localhost:3000/api/users/${id}`);
    if (response.ok) {
      user.value = await response.json();
    }
  } catch (error) {
    console.error('Błąd pobierania karty pracownika:', error);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.userId,
  (newId) => {
    isEditModalOpen.value = false;
    if (newId !== null) {
      fetchUserDetails(newId);
    } else {
      user.value = null;
    }
  }
);

const createTicketForUser = () => {
  if (!user.value) return;
  const requesterId = user.value.id;
  emit('close');
  router.push({
    path: '/tickets',
    query: {
      create: '1',
      requesterId
    }
  });
};

const openEquipment = (equipmentId: string) => {
  emit('close');
  router.push({
    path: '/equipment',
    query: { equipmentId }
  });
};

const openTicket = (ticketId: number) => {
  emit('close');
  router.push({
    path: '/tickets',
    query: { ticketId: String(ticketId) }
  });
};

const handleUpdateUser = async (payload: any) => {
  if (!user.value) return;
  try {
    const response = await fetch(`http://localhost:3000/api/users/${user.value.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      isEditModalOpen.value = false;
      await fetchUserDetails(user.value.id);
      emit('updated');
    } else {
      const err = await response.json().catch(() => ({}));
      alert(err.error || 'Nie udało się zapisać zmian.');
    }
  } catch (error) {
    console.error('Błąd aktualizacji pracownika:', error);
  }
};

const triggerOffboarding = () => {
  if (!user.value) return;
  const id = user.value.id;
  emit('close');
  emit('startOffboarding', id);
};

const reactivateUser = async () => {
  if (!user.value || !confirm(`Przywrócić aktywność konta ${user.value.firstName} ${user.value.lastName}?`)) return;
  try {
    const response = await fetch(`http://localhost:3000/api/users/${user.value.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isActive: true,
        offboardedAt: null
      })
    });
    if (response.ok) {
      await fetchUserDetails(user.value.id);
      emit('updated');
    }
  } catch (error) {
    console.error('Błąd przywracania konta:', error);
  }
};

const deleteUserPermanently = async () => {
  if (!user.value || !isAdmin.value) return;
  if (!confirm(`Czy na pewno chcesz TRWALE usunąć użytkownika ${user.value.firstName} ${user.value.lastName}?\n\nZamknięte zgłoszenia zachowają jego imię i nazwisko.`)) return;

  try {
    const response = await fetch(`http://localhost:3000/api/users/${user.value.id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      emit('updated');
      emit('close');
    } else {
      const err = await response.json().catch(() => ({}));
      alert(err.error || 'Nie udało się usunąć użytkownika.');
    }
  } catch (error) {
    console.error('Błąd usuwania użytkownika:', error);
  }
};

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    EMPLOYEE: 'Pracownik',
    TECHNICIAN: 'Technik IT',
    ADMIN: 'Administrator'
  };
  return labels[role] || role;
};

const getTicketStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    NEW: 'Nowe',
    IN_PROGRESS: 'W toku',
    RESOLVED: 'Zamknięte'
  };
  return labels[status] || status;
};

const getTicketStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    NEW: 'text-sky-700 bg-sky-50 border border-sky-200',
    IN_PROGRESS: 'text-amber-700 bg-amber-50 border border-amber-200',
    RESOLVED: 'text-slate-600 bg-slate-100 border border-slate-300'
  };
  return styles[status] || 'text-slate-600 bg-slate-100';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};
</script>