<template>
  <div class="p-8 max-w-7xl mx-auto space-y-8">
    <header class="flex flex-wrap justify-between items-end gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Dashboard operacyjny IT</h2>
        <p class="text-slate-500 mt-1">Podsumowanie zgłoszeń serwisowych oraz stanu zasobów CMDB w czasie rzeczywistym.</p>
      </div>
      <div class="flex items-center gap-3">
        <router-link
          to="/tickets"
          class="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
        >
          Wszystkie zgłoszenia
        </router-link>
        <router-link
          to="/equipment"
          class="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg shadow-xs transition-colors"
        >
          Ewidencja sprzętu
        </router-link>
      </div>
    </header>

    <div v-if="isLoading" class="py-16 text-center text-sm text-slate-400">
      Ładowanie statystyk systemu...
    </div>

    <template v-else>
      <!-- Główne kafelki KPI -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Aktywne zgłoszenia</span>
            <div class="p-2 rounded-lg bg-sky-50 text-sky-600">
              <TicketIcon class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-3xl font-bold text-slate-900">{{ activeTicketsCount }}</span>
            <span class="text-xs text-slate-500">z {{ stats.tickets.total }} łącznie</span>
          </div>
          <p class="text-xs text-slate-500 mt-2">
            Nowe: <strong class="text-sky-700">{{ stats.tickets.new }}</strong> • W toku: <strong class="text-amber-700">{{ stats.tickets.inProgress }}</strong>
          </p>
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Krytyczne otwarte</span>
            <div class="p-2 rounded-lg bg-red-50 text-red-600">
              <AlertTriangleIcon class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-3xl font-bold" :class="stats.tickets.criticalOpen > 0 ? 'text-red-600' : 'text-slate-900'">
              {{ stats.tickets.criticalOpen }}
            </span>
            <span class="text-xs text-slate-500">priorytet krytyczny</span>
          </div>
          <p class="text-xs text-slate-500 mt-2">
            Zamknięte zgłoszenia: <strong class="text-emerald-700">{{ stats.tickets.resolved }}</strong>
          </p>
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Gotowe na magazynie</span>
            <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <PackageCheckIcon class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-3xl font-bold text-slate-900">{{ stats.equipment.inStorage }}</span>
            <span class="text-xs text-slate-500">szt. do wydania</span>
          </div>
          <p class="text-xs text-slate-500 mt-2">
            Wydane pracownikom: <strong class="text-slate-800">{{ stats.equipment.inUse }}</strong> / {{ stats.equipment.total }} szt.
          </p>
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Kolejka serwisowa CMDB</span>
            <div class="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Undo2Icon class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-3 flex items-baseline gap-2">
            <span class="text-3xl font-bold text-purple-700">{{ stats.equipment.returned }}</span>
            <span class="text-xs text-slate-500">do przygotowania</span>
          </div>
          <p class="text-xs text-slate-500 mt-2">
            Do wymiany / naprawy: <strong class="text-amber-700">{{ stats.equipment.needsReplacement }}</strong> szt.
          </p>
        </div>
      </div>

      <!-- Struktura stanów ewidencji CMDB -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 class="text-sm font-bold text-slate-900">Struktura cyklu życia sprzętu (CMDB)</h3>
          <span class="text-xs text-slate-500">Łącznie w ewidencji: {{ stats.equipment.total }} szt.</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              W magazynie
            </div>
            <p class="text-xl font-bold text-slate-900 mt-1">{{ stats.equipment.inStorage }}</p>
          </div>

          <div class="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <div class="flex items-center gap-2 text-xs font-medium text-emerald-800">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              W użyciu
            </div>
            <p class="text-xl font-bold text-emerald-950 mt-1">{{ stats.equipment.inUse }}</p>
          </div>

          <div class="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80">
            <div class="flex items-center gap-2 text-xs font-medium text-purple-800">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              Odebrany / Do przygotowania
            </div>
            <p class="text-xl font-bold text-purple-950 mt-1">{{ stats.equipment.returned }}</p>
          </div>

          <div class="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
            <div class="flex items-center gap-2 text-xs font-medium text-amber-800">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Do wymiany / naprawy
            </div>
            <p class="text-xl font-bold text-amber-950 mt-1">{{ stats.equipment.needsReplacement }}</p>
          </div>
        </div>
      </div>

      <!-- Ostatnia aktywność (Zgłoszenia + Sprzęt) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Ostatnie zgłoszenia -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div class="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900">Ostatnie zgłoszenia serwisowe</h3>
            <router-link to="/tickets" class="text-xs font-semibold text-sky-600 hover:text-sky-700">
              Zobacz wszystkie &rarr;
            </router-link>
          </div>

          <div v-if="stats.recentTickets.length > 0" class="divide-y divide-slate-100">
            <button
              v-for="ticket in stats.recentTickets"
              :key="ticket.id"
              type="button"
              @click="selectedTicketId = ticket.id"
              class="w-full px-6 py-3.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-semibold text-slate-400">IT-{{ ticket.id }}</span>
                  <p class="text-sm font-medium text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                    {{ ticket.title }}
                  </p>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ getRequesterDisplay(ticket) }} • {{ formatDate(ticket.createdAt) }}
                </p>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span :class="['px-2 py-0.5 rounded text-xs font-semibold', getTicketStatusStyle(ticket.status)]">
                  {{ getTicketStatusLabel(ticket.status) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
              </div>
            </button>
          </div>

          <div v-else class="p-8 text-center text-xs text-slate-400">
            Brak zgłoszeń w systemie.
          </div>
        </div>

        <!-- Ostatnio dodany sprzęt -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div class="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-900">Ostatnio dodany sprzęt CMDB</h3>
            <router-link to="/equipment" class="text-xs font-semibold text-sky-600 hover:text-sky-700">
              Pełna ewidencja &rarr;
            </router-link>
          </div>

          <div v-if="stats.recentEquipment.length > 0" class="divide-y divide-slate-100">
            <button
              v-for="eq in stats.recentEquipment"
              :key="eq.id"
              type="button"
              @click="selectedEquipmentId = eq.id"
              class="w-full px-6 py-3.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                  <LaptopIcon class="w-4 h-4" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                    {{ eq.name }}
                  </p>
                  <p class="text-xs text-slate-500 truncate">
                    <span class="font-mono">S/N: {{ eq.serialNumber }}</span>
                    <template v-if="eq.assignedUser">
                      • {{ eq.assignedUser.firstName }} {{ eq.assignedUser.lastName }}
                    </template>
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <span :class="['px-2 py-0.5 rounded text-xs font-semibold', getEquipmentStatusStyle(eq.status)]">
                  {{ getEquipmentStatusLabel(eq.status) }}
                </span>
                <ChevronRightIcon class="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
              </div>
            </button>
          </div>

          <div v-else class="p-8 text-center text-xs text-slate-400">
            Brak urządzeń w ewidencji.
          </div>
        </div>
      </div>
    </template>

    <TicketDetailsDrawer
      :ticket-id="selectedTicketId"
      @close="selectedTicketId = null"
      @updated="fetchDashboard"
    />

    <EquipmentDetailsDrawer
      :equipment-id="selectedEquipmentId"
      @close="selectedEquipmentId = null"
      @updated="fetchDashboard"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  TicketIcon,
  AlertTriangleIcon,
  PackageCheckIcon,
  Undo2Icon,
  LaptopIcon,
  ChevronRightIcon
} from 'lucide-vue-next';
import TicketDetailsDrawer from '../components/TicketDetailsDrawer.vue';
import EquipmentDetailsDrawer from '../components/EquipmentDetailsDrawer.vue';

interface RecentTicket {
  id: number;
  title: string;
  status: string;
  priority: string;
  requesterName?: string;
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
}

interface RecentEquipment {
  id: string;
  name: string;
  serialNumber: string;
  status: string;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
}

interface DashboardStats {
  tickets: {
    total: number;
    new: number;
    inProgress: number;
    resolved: number;
    criticalOpen: number;
  };
  equipment: {
    total: number;
    inStorage: number;
    inUse: number;
    returned: number;
    needsReplacement: number;
  };
  recentTickets: RecentTicket[];
  recentEquipment: RecentEquipment[];
}

const isLoading = ref(true);
const selectedTicketId = ref<number | null>(null);
const selectedEquipmentId = ref<string | null>(null);

const stats = ref<DashboardStats>({
  tickets: { total: 0, new: 0, inProgress: 0, resolved: 0, criticalOpen: 0 },
  equipment: { total: 0, inStorage: 0, inUse: 0, returned: 0, needsReplacement: 0 },
  recentTickets: [],
  recentEquipment: []
});

const activeTicketsCount = computed(() => stats.value.tickets.new + stats.value.tickets.inProgress);

const fetchDashboard = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/dashboard');
    if (response.ok) {
      stats.value = await response.json();
    }
  } catch (error) {
    console.error('Błąd pobierania statystyk dashboardu:', error);
  } finally {
    isLoading.value = false;
  }
};

const getRequesterDisplay = (ticket: RecentTicket) => {
  if (ticket.requester) {
    return `${ticket.requester.firstName} ${ticket.requester.lastName}`;
  }
  return ticket.requesterName || 'Brak danych';
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

const getEquipmentStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    IN_STORAGE: 'W magazynie',
    IN_USE: 'W użyciu',
    RETURNED: 'Odebrany / Do przygotowania',
    NEEDS_REPLACEMENT: 'Do wymiany'
  };
  return labels[status] || status;
};

const getEquipmentStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    IN_STORAGE: 'text-slate-700 bg-slate-100 border border-slate-200',
    IN_USE: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
    RETURNED: 'text-purple-700 bg-purple-50 border border-purple-200',
    NEEDS_REPLACEMENT: 'text-amber-700 bg-amber-50 border border-amber-200'
  };
  return styles[status] || 'text-slate-700 bg-slate-100';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  fetchDashboard();
});
</script>