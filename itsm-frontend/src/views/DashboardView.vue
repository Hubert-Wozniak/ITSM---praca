<template>
  <div class="p-8 max-w-7xl mx-auto">
    <header class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Pulpit nawigacyjny ITSM</h2>
        <p class="text-slate-500 mt-1">Podsumowanie zgłoszeń serwisowych oraz stanu zasobów IT w czasie rzeczywistym.</p>
      </div>
      <button
        @click="fetchDashboard"
        :disabled="isLoading"
        class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
      >
        <RefreshCwIcon :class="['w-4 h-4', isLoading && 'animate-spin']" />
        Odśwież dane
      </button>
    </header>

    <!-- 4 KARTY KPI -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-slate-500">Aktywne zgłoszenia</span>
          <div class="p-2 bg-sky-50 text-sky-600 rounded-lg">
            <TicketIcon class="w-5 h-5" />
          </div>
        </div>
        <div class="text-3xl font-bold text-slate-900">{{ activeTicketsCount }}</div>
        <div class="mt-2 text-xs text-slate-500 flex items-center gap-2">
          <span class="text-sky-600 font-semibold">{{ stats.tickets.new }} nowych</span>
          <span>•</span>
          <span class="text-amber-600 font-semibold">{{ stats.tickets.inProgress }} w toku</span>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-slate-500">Incydenty krytyczne</span>
          <div :class="['p-2 rounded-lg', stats.tickets.criticalOpen > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600']">
            <AlertTriangleIcon class="w-5 h-5" />
          </div>
        </div>
        <div :class="['text-3xl font-bold', stats.tickets.criticalOpen > 0 ? 'text-red-600' : 'text-slate-900']">
          {{ stats.tickets.criticalOpen }}
        </div>
        <div class="mt-2 text-xs text-slate-500">
          {{ stats.tickets.criticalOpen > 0 ? 'Wymagają natychmiastowej reakcji' : 'Brak otwartych awarii krytycznych' }}
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-slate-500">Sprzęt w użyciu</span>
          <div class="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <LaptopIcon class="w-5 h-5" />
          </div>
        </div>
        <div class="text-3xl font-bold text-slate-900">
          {{ stats.equipment.inUse }}
          <span class="text-base font-normal text-slate-400">/ {{ stats.equipment.total }}</span>
        </div>
        <div class="mt-2 text-xs text-slate-500">
          Wykorzystanie zasobów: <span class="font-semibold text-slate-700">{{ equipmentUsagePercent }}%</span>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-slate-500">Magazyn / Do wymiany</span>
          <div class="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <WrenchIcon class="w-5 h-5" />
          </div>
        </div>
        <div class="text-3xl font-bold text-slate-900">{{ stats.equipment.inStorage }}</div>
        <div class="mt-2 text-xs text-slate-500">
          Dostępne w magazynie •
          <span :class="stats.equipment.needsReplacement > 0 ? 'text-amber-600 font-semibold' : ''">
            {{ stats.equipment.needsReplacement }} do wymiany
          </span>
        </div>
      </div>
    </div>

    <!-- PASKI PROPORCJI (HELPDESK + ZASOBY) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold text-slate-900">Struktura zgłoszeń</h3>
          <span class="text-xs text-slate-400">Łącznie: {{ stats.tickets.total }}</span>
        </div>

        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-xs font-medium mb-1">
              <span class="text-sky-700">Nowe</span>
              <span class="text-slate-600">{{ stats.tickets.new }} ({{ calcPercent(stats.tickets.new, stats.tickets.total) }}%)</span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-sky-500 transition-all duration-300" :style="{ width: `${calcPercent(stats.tickets.new, stats.tickets.total)}%` }"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-medium mb-1">
              <span class="text-amber-700">W toku</span>
              <span class="text-slate-600">{{ stats.tickets.inProgress }} ({{ calcPercent(stats.tickets.inProgress, stats.tickets.total) }}%)</span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-amber-500 transition-all duration-300" :style="{ width: `${calcPercent(stats.tickets.inProgress, stats.tickets.total)}%` }"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-medium mb-1">
              <span class="text-emerald-700">Rozwiązane</span>
              <span class="text-slate-600">{{ stats.tickets.resolved }} ({{ calcPercent(stats.tickets.resolved, stats.tickets.total) }}%)</span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 transition-all duration-300" :style="{ width: `${calcPercent(stats.tickets.resolved, stats.tickets.total)}%` }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold text-slate-900">Struktura zasobów IT</h3>
          <span class="text-xs text-slate-400">Łącznie: {{ stats.equipment.total }}</span>
        </div>

        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-xs font-medium mb-1">
              <span class="text-emerald-700">W użyciu</span>
              <span class="text-slate-600">{{ stats.equipment.inUse }} ({{ calcPercent(stats.equipment.inUse, stats.equipment.total) }}%)</span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 transition-all duration-300" :style="{ width: `${calcPercent(stats.equipment.inUse, stats.equipment.total)}%` }"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-medium mb-1">
              <span class="text-slate-700">W magazynie</span>
              <span class="text-slate-600">{{ stats.equipment.inStorage }} ({{ calcPercent(stats.equipment.inStorage, stats.equipment.total) }}%)</span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-slate-500 transition-all duration-300" :style="{ width: `${calcPercent(stats.equipment.inStorage, stats.equipment.total)}%` }"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-xs font-medium mb-1">
              <span class="text-amber-700">Do wymiany</span>
              <span class="text-slate-600">{{ stats.equipment.needsReplacement }} ({{ calcPercent(stats.equipment.needsReplacement, stats.equipment.total) }}%)</span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-amber-500 transition-all duration-300" :style="{ width: `${calcPercent(stats.equipment.needsReplacement, stats.equipment.total)}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- OSTATNIA AKTYWNOŚĆ (2 KOLUMNY) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Ostatnie zgłoszenia -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 class="font-semibold text-slate-900">Ostatnie zgłoszenia</h3>
          <RouterLink to="/tickets" class="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1">
            Wszystkie
            <ArrowRightIcon class="w-3.5 h-3.5" />
          </RouterLink>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="ticket in stats.recentTickets" :key="ticket.id" class="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-slate-400">IT-{{ ticket.id }}</span>
                <p class="text-sm font-medium text-slate-900 truncate">{{ ticket.title }}</p>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Zgłosił(a): {{ ticket.requester }}</p>
            </div>
            <span :class="['px-2 py-0.5 rounded text-xs font-semibold shrink-0', getTicketStatusStyle(ticket.status)]">
              {{ getTicketStatusLabel(ticket.status) }}
            </span>
          </div>
          <div v-if="stats.recentTickets.length === 0" class="p-6 text-center text-sm text-slate-400">
            Brak zgłoszeń w bazie danych.
          </div>
        </div>
      </div>

      <!-- Ostatnio dodany sprzęt -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 class="font-semibold text-slate-900">Ostatnio dodany sprzęt</h3>
          <RouterLink to="/equipment" class="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1">
            Ewidencja
            <ArrowRightIcon class="w-3.5 h-3.5" />
          </RouterLink>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="item in stats.recentEquipment" :key="item.id" class="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">{{ item.name }}</p>
              <p class="text-xs text-slate-500 mt-0.5">
                S/N: {{ item.serialNumber }} • {{ item.assignedUser ? `Wydano: ${item.assignedUser}` : 'W magazynie' }}
              </p>
            </div>
            <span :class="['px-2 py-0.5 rounded text-xs font-semibold shrink-0', getEquipmentStatusStyle(item.status)]">
              {{ getEquipmentStatusLabel(item.status) }}
            </span>
          </div>
          <div v-if="stats.recentEquipment.length === 0" class="p-6 text-center text-sm text-slate-400">
            Brak urządzeń w ewidencji.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import {
  TicketIcon,
  AlertTriangleIcon,
  LaptopIcon,
  WrenchIcon,
  RefreshCwIcon,
  ArrowRightIcon
} from 'lucide-vue-next';

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
    needsReplacement: number;
  };
  recentTickets: any[];
  recentEquipment: any[];
}

const isLoading = ref(false);
const stats = ref<DashboardStats>({
  tickets: { total: 0, new: 0, inProgress: 0, resolved: 0, criticalOpen: 0 },
  equipment: { total: 0, inStorage: 0, inUse: 0, needsReplacement: 0 },
  recentTickets: [],
  recentEquipment: []
});

const fetchDashboard = async () => {
  isLoading.value = true;
  try {
    const response = await fetch('http://localhost:3000/api/dashboard');
    if (response.ok) {
      stats.value = await response.json();
    }
  } catch (error) {
    console.error('Błąd pobierania danych dashboardu:', error);
  } finally {
    isLoading.value = false;
  }
};

const activeTicketsCount = computed(() => stats.value.tickets.new + stats.value.tickets.inProgress);

const equipmentUsagePercent = computed(() =>
  calcPercent(stats.value.equipment.inUse, stats.value.equipment.total)
);

const calcPercent = (part: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
};

const getTicketStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    'NEW': 'text-sky-700 bg-sky-50 border border-sky-200',
    'IN_PROGRESS': 'text-amber-700 bg-amber-50 border border-amber-200',
    'RESOLVED': 'text-emerald-700 bg-emerald-50 border border-emerald-200'
  };
  return styles[status] || 'text-slate-600 bg-slate-100';
};

const getTicketStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'NEW': 'Nowe',
    'IN_PROGRESS': 'W toku',
    'RESOLVED': 'Rozwiązane'
  };
  return labels[status] || status;
};

const getEquipmentStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    'IN_STORAGE': 'text-slate-700 bg-slate-100 border border-slate-200',
    'IN_USE': 'text-emerald-700 bg-emerald-50 border border-emerald-200',
    'NEEDS_REPLACEMENT': 'text-amber-700 bg-amber-50 border border-amber-200'
  };
  return styles[status] || 'text-slate-600 bg-slate-100';
};

const getEquipmentStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'IN_STORAGE': 'W magazynie',
    'IN_USE': 'W użyciu',
    'NEEDS_REPLACEMENT': 'Do wymiany'
  };
  return labels[status] || status;
};

onMounted(() => {
  fetchDashboard();
});
</script>