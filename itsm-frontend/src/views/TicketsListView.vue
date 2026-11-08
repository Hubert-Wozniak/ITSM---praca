<template>
  <div class="p-8 max-w-7xl mx-auto relative">
    <header class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Aktywne zgłoszenia</h2>
        <p class="text-slate-500 mt-1">Zarządzanie awariami i wnioskami pracowników.</p>
      </div>
      <!-- Zmiana 1: Otwieranie modala po kliknięciu -->
      <button @click="isModalOpen = true" class="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors">
        + Nowe zgłoszenie
      </button>
    </header>

    <div class="flex gap-4 mb-6">
      <div class="relative flex-1 max-w-md">
        <SearchIcon class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Szukaj po tytule lub numerze (np. IT-102)..." 
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" 
        />
      </div>
      <select v-model="statusFilter" class="px-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer">
        <option value="ALL">Wszystkie aktywne</option>
        <option value="NEW">Nowe</option>
        <option value="IN_PROGRESS">W toku</option>
        <option value="RESOLVED">Rozwiązane</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="divide-y divide-slate-100">
        
        <div v-for="ticket in filteredTickets" :key="ticket.id" class="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
          <div class="w-16 text-sm font-semibold text-slate-400">
            {{ ticket.id }}
          </div>
          
          <div class="flex-1">
            <h4 class="text-slate-900 font-medium mb-1">{{ ticket.title }}</h4>
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <span>Kategoria: {{ ticket.category }}</span>
              <span>•</span>
              <span>Zgłosił(a): {{ ticket.requester }}</span>
              <span>•</span>
              <span>{{ ticket.timeAgo }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 w-48 justify-end">
            <span :class="['px-2 py-1 rounded text-xs font-semibold', getPriorityStyle(ticket.priority)]">
              {{ ticket.priority }}
            </span>
            <span :class="['px-2 py-1 rounded text-xs font-semibold', getStatusStyle(ticket.status)]">
              {{ ticket.statusLabel }}
            </span>
          </div>

          <div class="w-40 flex items-center gap-2 justify-end">
            <div v-if="ticket.assignee" class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                {{ getInitials(ticket.assignee) }}
              </div>
              <span class="text-sm text-slate-600">{{ ticket.assignee }}</span>
            </div>
            <span v-else class="text-sm text-slate-400 italic">Nieprzypisane</span>
          </div>
        </div>

        <div v-if="filteredTickets.length === 0" class="p-8 text-center text-slate-500">
          Brak zgłoszeń spełniających kryteria.
        </div>

      </div>
    </div>

    <!-- Zmiana 2: Wstrzyknięcie Modala -->
    <TicketFormModal 
      :is-open="isModalOpen" 
      @close="isModalOpen = false" 
      @submit="handleAddTicket" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { SearchIcon } from 'lucide-vue-next';
// Importujemy komponent modala
import TicketFormModal from '../components/TicketFormModal.vue';

const searchQuery = ref('');
const statusFilter = ref('ALL');
// Stan modala
const isModalOpen = ref(false);

const ticketsList = ref([
  { id: 'IT-102', title: 'Nie działa drukarka na 3 piętrze', category: 'Sprzęt', requester: 'Anna', timeAgo: '6 godz. temu', priority: 'Średni', status: 'IN_PROGRESS', statusLabel: 'W toku', assignee: 'Marek Wiśniewski' },
  { id: 'IT-103', title: 'Brak dostępu do współdzielonego dysku', category: 'Dostęp / Uprawnienia', requester: 'Piotr', timeAgo: '1 godz. temu', priority: 'Wysoki', status: 'NEW', statusLabel: 'Nowe', assignee: 'Marek Wiśniewski' },
  { id: 'IT-105', title: 'VPN rozłącza się co kilka minut', category: 'Sieć', requester: 'Piotr', timeAgo: '3 godz. temu', priority: 'Krytyczny', status: 'IN_PROGRESS', statusLabel: 'W toku', assignee: 'Katarzyna Lewandowska' },
  { id: 'IT-106', title: 'Prośba o instalację Adobe Acrobat Pro', category: 'Oprogramowanie', requester: 'Anna', timeAgo: '24 min temu', priority: 'Niski', status: 'NEW', statusLabel: 'Nowe', assignee: null }
]);

const filteredTickets = computed(() => {
  return ticketsList.value.filter(t => {
    const query = searchQuery.value.toLowerCase();
    const matchesSearch = t.title.toLowerCase().includes(query) || t.id.toLowerCase().includes(query);
    const matchesStatus = statusFilter.value === 'ALL' || t.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

// Zmiana 3: Funkcja obsługująca dodanie nowego zgłoszenia
const handleAddTicket = (newTicket: any) => {
  const newId = `IT-${Math.floor(Math.random() * 900) + 100}`; // Generuje numer od 100 do 999
  
  ticketsList.value.unshift({
    id: newId,
    title: newTicket.title,
    category: newTicket.category,
    requester: newTicket.requester,
    timeAgo: 'Przed chwilą',
    priority: newTicket.priority,
    status: 'NEW',
    statusLabel: 'Nowe',
    assignee: null // Nowe zgłoszenie zawsze wpada jako nieprzypisane
  });

  isModalOpen.value = false;
};

const getPriorityStyle = (priority: string) => {
  const styles: Record<string, string> = {
    'Niski': 'text-slate-600 bg-slate-100',
    'Średni': 'text-blue-600 bg-blue-100',
    'Wysoki': 'text-orange-600 bg-orange-100',
    'Krytyczny': 'text-red-600 bg-red-100'
  };
  return styles[priority] || 'text-slate-600 bg-slate-100';
};

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    'NEW': 'text-sky-600 border border-sky-200 bg-sky-50',
    'IN_PROGRESS': 'text-amber-600 border border-amber-200 bg-amber-50',
    'RESOLVED': 'text-emerald-600 border border-emerald-200 bg-emerald-50'
  };
  return styles[status] || '';
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};
</script>