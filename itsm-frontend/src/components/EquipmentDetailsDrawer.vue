<template>
  <div v-if="equipmentId !== null" class="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs" @click.self="$emit('close')">
    <aside class="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
      <!-- Nagłówek panelu -->
      <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Karta urządzenia CMDB</span>
          <span v-if="item" :class="['px-2.5 py-0.5 rounded-full text-xs font-semibold', getStatusStyle(item.status)]">
            {{ getStatusLabel(item.status) }}
          </span>
        </div>

        <div class="flex items-center gap-1.5">
          <!-- Dyskretne trwałe usunięcie tylko dla Administratora -->
          <button
            v-if="item && isAdmin"
            @click="deleteEquipmentPermanently"
            class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Usuń urządzenie trwale z bazy (Administrator)"
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
        Ładowanie karty urządzenia...
      </div>

      <div v-else-if="item" class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Baner przygotowania odebranego sprzętu -->
        <div
          v-if="item.status === 'RETURNED'"
          class="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-4"
        >
          <div class="text-xs text-purple-950">
            <p class="font-semibold">Urządzenie odebrane od pracownika — oczekuje na przygotowanie</p>
            <p class="text-purple-700 mt-0.5">
              Po wyczyszczeniu systemu i przeglądzie zatwierdź sprzęt na magazyn, aby umożliwić jego ponowne wydanie.
            </p>
          </div>
          <button
            @click="markReadyInStorage"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shrink-0 transition-colors"
          >
            <CheckIcon class="w-3.5 h-3.5" />
            Zatwierdź na magazyn
          </button>
        </div>

        <!-- Identyfikacja urządzenia -->
        <div class="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div class="p-3 rounded-xl bg-sky-100 text-sky-700 shrink-0">
            <LaptopIcon class="w-6 h-6" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold text-slate-900">{{ item.name }}</h3>
            <p class="text-xs font-mono text-slate-500 mt-0.5">Numer seryjny (S/N): {{ item.serialNumber }}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200/80 text-xs">
              <div>
                <span class="text-slate-400 block">Obecny użytkownik</span>
                <span class="font-semibold text-slate-800">
                  {{ item.assignedUser ? `${item.assignedUser.firstName} ${item.assignedUser.lastName} (${item.assignedUser.department})` : 'Brak (nieprzypisane)' }}
                </span>
              </div>
              <div>
                <span class="text-slate-400 block">Lokalizacja</span>
                <span class="font-semibold text-slate-800">{{ item.location || 'Nie określono' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Oś czasu historii cyklu życia i powierzeń -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <HistoryIcon class="w-4 h-4 text-slate-400" />
            Historia cyklu życia i powierzeń ({{ item.history?.length || 0 }})
          </h4>

          <div v-if="item.history && item.history.length > 0" class="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
            <div v-for="entry in item.history" :key="entry.id" class="relative">
              <!-- Punkt na osi czasu -->
              <div
                :class="[
                  'absolute -left-6 top-0.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-2xs',
                  getHistoryBadgeStyle(entry.action)
                ]"
              >
                <component :is="getHistoryIcon(entry.action)" class="w-3 h-3" />
              </div>

              <div class="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-xs font-semibold text-slate-900">
                    {{ getHistoryActionLabel(entry.action) }}
                  </span>
                  <span class="text-[11px] text-slate-400">
                    {{ formatDate(entry.createdAt) }}
                  </span>
                </div>

                <p v-if="getHistoryUserDisplay(entry)" class="text-xs text-slate-700 mt-1">
                  Pracownik: <span class="font-semibold">{{ getHistoryUserDisplay(entry) }}</span>
                </p>

                <p v-if="entry.notes" class="text-xs text-slate-500 mt-1">
                  {{ entry.notes }}
                </p>
              </div>
            </div>
          </div>

          <div v-else class="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
            Brak wcześniejszych wpisów historii. Każde kolejne wydanie, odbiór lub zmiana statusu urządzenia zostanie automatycznie zapisana na osi czasu.
          </div>
        </div>

        <!-- Protokół ostatniego odbioru (jeśli istnieje) -->
        <div
          v-if="item.lastReturnChecklist"
          class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ClipboardCheckIcon class="w-4 h-4 text-purple-600" />
              Protokół ostatniego zwrotu sprzętu
            </span>
            <span v-if="item.lastReturnedAt" class="text-[11px] text-slate-500">
              {{ formatDate(item.lastReturnedAt) }}
            </span>
          </div>
          <p v-if="item.lastReturnChecklist.returnedFrom" class="text-xs text-slate-600">
            Zdający: <span class="font-medium text-slate-800">{{ item.lastReturnChecklist.returnedFrom }}</span>
          </p>
          <ul class="space-y-1.5 pt-1">
            <li
              v-for="check in item.lastReturnChecklist.items || []"
              :key="check.key"
              class="flex items-center gap-2 text-xs text-slate-700"
            >
              <CheckIcon class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{{ check.label }}</span>
            </li>
          </ul>
          <p v-if="item.lastReturnChecklist.notes" class="text-xs text-slate-600 italic pt-1 border-t border-slate-200/70">
            Uwagi: {{ item.lastReturnChecklist.notes }}
          </p>
        </div>

        <!-- Historia zgłoszeń serwisowych urządzenia -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <TicketIcon class="w-4 h-4 text-slate-400" />
            Historia zgłoszeń serwisowych ({{ item.tickets?.length || 0 }})
          </h4>

          <div v-if="item.tickets && item.tickets.length > 0" class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            <div v-for="t in item.tickets" :key="t.id" class="p-3.5 bg-white flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-slate-400">IT-{{ t.id }}</span>
                  <p class="text-sm font-medium text-slate-900 truncate">{{ t.title }}</p>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">
                  Zgłosił(a): {{ getRequesterDisplay(t) }} • {{ formatDate(t.createdAt) }}
                </p>
              </div>
              <span :class="['px-2 py-0.5 rounded text-xs font-semibold shrink-0', getTicketStatusStyle(t.status)]">
                {{ getTicketStatusLabel(t.status) }}
              </span>
            </div>
          </div>

          <div v-else class="p-5 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
            Brak zarejestrowanych awarii ani zgłoszeń serwisowych dla tego urządzenia.
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  XIcon,
  LaptopIcon,
  Trash2Icon,
  CheckIcon,
  ClipboardCheckIcon,
  TicketIcon,
  HistoryIcon,
  PlusCircleIcon,
  UserPlusIcon,
  ArrowRightLeftIcon,
  Undo2Icon,
  WrenchIcon,
  PackageCheckIcon
} from 'lucide-vue-next';
import { useCurrentRole } from '../composables/useCurrentRole';

const props = defineProps<{
  equipmentId: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const { isAdmin } = useCurrentRole();
const item = ref<any | null>(null);
const isLoading = ref(false);

const fetchDetails = async (id: string) => {
  isLoading.value = true;
  try {
    const response = await fetch(`http://localhost:3000/api/equipment/${id}`);
    if (response.ok) {
      item.value = await response.json();
    }
  } catch (error) {
    console.error('Błąd pobierania karty urządzenia:', error);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.equipmentId,
  (newId) => {
    if (newId !== null) {
      fetchDetails(newId);
    } else {
      item.value = null;
    }
  }
);

const markReadyInStorage = async () => {
  if (!item.value) return;
  try {
    const response = await fetch(`http://localhost:3000/api/equipment/${item.value.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_STORAGE' })
    });
    if (response.ok) {
      await fetchDetails(item.value.id);
      emit('updated');
    }
  } catch (error) {
    console.error('Błąd zmiany statusu urządzenia:', error);
  }
};

const deleteEquipmentPermanently = async () => {
  if (!item.value || !isAdmin.value) return;
  if (!confirm(`Czy na pewno chcesz TRWALE usunąć urządzenie "${item.value.name}" (S/N: ${item.value.serialNumber}) z bazy?`)) return;

  try {
    const response = await fetch(`http://localhost:3000/api/equipment/${item.value.id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      emit('updated');
      emit('close');
    }
  } catch (error) {
    console.error('Błąd usuwania urządzenia:', error);
  }
};

const getHistoryActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    CREATED: 'Przyjęto do ewidencji',
    ASSIGNED: 'Wydano pracownikowi',
    TRANSFERRED: 'Przekazano innemu pracownikowi',
    RETURNED: 'Odebrano od pracownika',
    NEEDS_REPLACEMENT: 'Skierowano do naprawy / wymiany',
    IN_STORAGE: 'Przyjęto na magazyn (gotowe)'
  };
  return labels[action] || action;
};

const getHistoryBadgeStyle = (action: string) => {
  const styles: Record<string, string> = {
    CREATED: 'bg-sky-100 text-sky-700',
    ASSIGNED: 'bg-emerald-100 text-emerald-700',
    TRANSFERRED: 'bg-indigo-100 text-indigo-700',
    RETURNED: 'bg-purple-100 text-purple-700',
    NEEDS_REPLACEMENT: 'bg-amber-100 text-amber-700',
    IN_STORAGE: 'bg-slate-200 text-slate-700'
  };
  return styles[action] || 'bg-slate-200 text-slate-700';
};

const getHistoryIcon = (action: string) => {
  const icons: Record<string, any> = {
    CREATED: PlusCircleIcon,
    ASSIGNED: UserPlusIcon,
    TRANSFERRED: ArrowRightLeftIcon,
    RETURNED: Undo2Icon,
    NEEDS_REPLACEMENT: WrenchIcon,
    IN_STORAGE: PackageCheckIcon
  };
  return icons[action] || HistoryIcon;
};

const getHistoryUserDisplay = (entry: any) => {
  if (entry.user) {
    return `${entry.user.firstName} ${entry.user.lastName} (${entry.user.department})`;
  }
  return entry.userName || '';
};

const getRequesterDisplay = (ticket: any) => {
  if (ticket.requester) {
    return `${ticket.requester.firstName} ${ticket.requester.lastName}`;
  }
  return ticket.requesterName || 'Brak danych';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    IN_STORAGE: 'W magazynie',
    IN_USE: 'W użyciu',
    RETURNED: 'Odebrany / Do przygotowania',
    NEEDS_REPLACEMENT: 'Do wymiany'
  };
  return labels[status] || status;
};

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    IN_STORAGE: 'text-slate-700 border border-slate-200 bg-slate-100',
    IN_USE: 'text-emerald-700 border border-emerald-200 bg-emerald-50',
    RETURNED: 'text-purple-700 border border-purple-200 bg-purple-50',
    NEEDS_REPLACEMENT: 'text-amber-700 border border-amber-200 bg-amber-50'
  };
  return styles[status] || 'text-slate-700 bg-slate-100';
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
</script>