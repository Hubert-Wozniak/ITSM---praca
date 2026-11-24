<template>
  <div class="p-8 max-w-7xl mx-auto relative">
    <header class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Aktywne zgłoszenia</h2>
        <p class="text-slate-500 mt-1">Zarządzanie awariami, dziennikiem prac i wnioskami pracowników.</p>
      </div>
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
          placeholder="Szukaj po tytule, numerze (IT-1) lub sprzęcie..." 
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" 
        />
      </div>
      <select v-model="statusFilter" class="px-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer">
        <option value="ALL">Wszystkie zgłoszenia</option>
        <option value="NEW">Nowe</option>
        <option value="IN_PROGRESS">W toku</option>
        <option value="RESOLVED">Rozwiązane</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="divide-y divide-slate-100">
        
        <div v-for="ticket in filteredTickets" :key="ticket.id" class="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4">
          <div class="w-16 text-sm font-semibold text-slate-400">
            IT-{{ ticket.id }}
          </div>
          
          <div class="flex-1 min-w-0">
            <button
              @click="selectedTicketId = ticket.id"
              class="text-left group block max-w-full"
            >
              <h4 class="text-slate-900 font-medium mb-1 group-hover:text-sky-600 transition-colors truncate">
                {{ ticket.title }}
              </h4>
            </button>
            <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Kategoria: {{ ticket.category }}</span>
              <span>•</span>
              <span>Zgłosił(a): {{ ticket.requester }}</span>
              <span>•</span>
              <span>{{ formatDate(ticket.createdAt) }}</span>
            </div>

            <!-- POWIĄZANY SPRZĘT + LICZNIK KOMENTARZY -->
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <template v-if="editingEquipmentTicketId === ticket.id">
                <select
                  :value="ticket.equipmentId || ''"
                  @change="saveEquipmentLink(ticket.id, ($event.target as HTMLSelectElement).value)"
                  @blur="editingEquipmentTicketId = null"
                  class="px-2.5 py-1 text-xs border border-sky-400 rounded bg-white outline-none"
                  autofocus
                >
                  <option value="">— Brak powiązanego sprzętu —</option>
                  <option v-for="eq in equipmentList" :key="eq.id" :value="eq.id">
                    {{ eq.name }} (S/N: {{ eq.serialNumber }})
                  </option>
                </select>
              </template>
              <template v-else>
                <button
                  v-if="ticket.equipment"
                  @click="editingEquipmentTicketId = ticket.id"
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  title="Kliknij, aby zmienić lub odpiąć sprzęt"
                >
                  <LaptopIcon class="w-3.5 h-3.5" />
                  {{ ticket.equipment.name }}
                  <span class="font-mono text-[11px] text-indigo-500">({{ ticket.equipment.serialNumber }})</span>
                </button>
                <button
                  v-else
                  @click="editingEquipmentTicketId = ticket.id"
                  class="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <LaptopIcon class="w-3.5 h-3.5" />
                  + Powiąż sprzęt
                </button>
              </template>

              <button
                @click="selectedTicketId = ticket.id"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-slate-600 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                title="Otwórz szczegóły i dziennik prac"
              >
                <MessageSquareIcon class="w-3.5 h-3.5" />
                <span>{{ ticket._count?.comments || 0 }}</span>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2 w-52 justify-end">
            <span :class="['px-2 py-1 rounded text-xs font-semibold', getPriorityStyle(ticket.priority)]">
              {{ ticket.priority }}
            </span>

            <select
              :value="ticket.status"
              @change="updateTicket(ticket.id, { status: ($event.target as HTMLSelectElement).value })"
              :class="['px-2 py-1 rounded text-xs font-semibold outline-none cursor-pointer', getStatusStyle(ticket.status)]"
            >
              <option value="NEW">Nowe</option>
              <option value="IN_PROGRESS">W toku</option>
              <option value="RESOLVED">Rozwiązane</option>
            </select>
          </div>

          <div class="w-44 flex items-center gap-2 justify-end">
            <template v-if="editingAssigneeId === ticket.id">
              <input
                v-model="assigneeInput"
                @keyup.enter="saveAssignee(ticket.id)"
                @keyup.esc="editingAssigneeId = null"
                @blur="saveAssignee(ticket.id)"
                type="text"
                placeholder="Imię i nazwisko..."
                class="w-36 px-2 py-1 text-xs border border-sky-400 rounded outline-none"
                autofocus
              />
            </template>
            <template v-else>
              <button
                v-if="ticket.assignee"
                @click="startEditAssignee(ticket)"
                class="flex items-center gap-2 hover:bg-slate-200/70 px-2 py-1 rounded transition-colors"
                title="Kliknij, aby zmienić osobę"
              >
                <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                  {{ getInitials(ticket.assignee) }}
                </div>
                <span class="text-sm text-slate-600 truncate max-w-[110px]">{{ ticket.assignee }}</span>
              </button>
              <button
                v-else
                @click="startEditAssignee(ticket)"
                class="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium px-2 py-1 rounded hover:bg-sky-50 transition-colors"
              >
                <UserPlusIcon class="w-3.5 h-3.5" />
                Przypisz
              </button>
            </template>
          </div>

          <button
            @click="deleteTicket(ticket.id)"
            class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Usuń zgłoszenie"
          >
            <Trash2Icon class="w-4 h-4" />
          </button>
        </div>

        <div v-if="filteredTickets.length === 0" class="p-8 text-center text-slate-500">
          Brak zgłoszeń spełniających kryteria.
        </div>

      </div>
    </div>

    <TicketFormModal 
      :is-open="isModalOpen" 
      @close="isModalOpen = false" 
      @submit="handleAddTicket" 
    />

    <TicketDetailsDrawer
      :ticket-id="selectedTicketId"
      @close="selectedTicketId = null"
      @updated="fetchTickets"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { SearchIcon, Trash2Icon, UserPlusIcon, LaptopIcon, MessageSquareIcon } from 'lucide-vue-next';
import TicketFormModal from '../components/TicketFormModal.vue';
import TicketDetailsDrawer from '../components/TicketDetailsDrawer.vue';

const searchQuery = ref('');
const statusFilter = ref('ALL');
const isModalOpen = ref(false);
const selectedTicketId = ref<number | null>(null);
const ticketsList = ref<any[]>([]);
const equipmentList = ref<any[]>([]);

const editingAssigneeId = ref<number | null>(null);
const assigneeInput = ref('');
const editingEquipmentTicketId = ref<number | null>(null);

const fetchTickets = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/tickets');
    if (response.ok) {
      ticketsList.value = await response.json();
    }
  } catch (error) {
    console.error('Błąd pobierania zgłoszeń:', error);
  }
};

const fetchEquipment = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/equipment');
    if (response.ok) {
      equipmentList.value = await response.json();
    }
  } catch (error) {
    console.error('Błąd pobierania sprzętu:', error);
  }
};

const handleAddTicket = async (newTicket: any) => {
  try {
    const response = await fetch('http://localhost:3000/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTicket.title,
        description: newTicket.description || null,
        category: newTicket.category,
        priority: newTicket.priority,
        requester: newTicket.requester,
        equipmentId: newTicket.equipmentId || null
      })
    });

    if (response.ok) {
      await fetchTickets();
      isModalOpen.value = false;
    } else {
      alert('Nie udało się zapisać zgłoszenia.');
    }
  } catch (error) {
    console.error('Błąd zapisu zgłoszenia:', error);
  }
};

const updateTicket = async (
  id: number,
  payload: { status?: string; assignee?: string | null; equipmentId?: string | null }
) => {
  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      await fetchTickets();
    }
  } catch (error) {
    console.error('Błąd aktualizacji zgłoszenia:', error);
  }
};

const saveEquipmentLink = async (ticketId: number, equipmentId: string) => {
  editingEquipmentTicketId.value = null;
  await updateTicket(ticketId, { equipmentId: equipmentId || null });
};

const deleteTicket = async (id: number) => {
  if (!confirm(`Czy na pewno chcesz usunąć zgłoszenie IT-${id}?`)) return;

  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      if (selectedTicketId.value === id) {
        selectedTicketId.value = null;
      }
      ticketsList.value = ticketsList.value.filter(t => t.id !== id);
    }
  } catch (error) {
    console.error('Błąd usuwania zgłoszenia:', error);
  }
};

const startEditAssignee = (ticket: any) => {
  editingAssigneeId.value = ticket.id;
  assigneeInput.value = ticket.assignee || '';
};

const saveAssignee = async (id: number) => {
  if (editingAssigneeId.value !== id) return;
  const trimmed = assigneeInput.value.trim();
  editingAssigneeId.value = null;
  await updateTicket(id, { assignee: trimmed || null });
};

const filteredTickets = computed(() => {
  return ticketsList.value.filter(t => {
    const query = searchQuery.value.toLowerCase();
    const ticketCode = `it-${t.id}`;
    const equipmentMatch =
      (t.equipment?.name || '').toLowerCase().includes(query) ||
      (t.equipment?.serialNumber || '').toLowerCase().includes(query);
    const matchesSearch = t.title.toLowerCase().includes(query) || ticketCode.includes(query) || equipmentMatch;
    const matchesStatus = statusFilter.value === 'ALL' || t.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

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
    'NEW': 'text-sky-700 border border-sky-200 bg-sky-50',
    'IN_PROGRESS': 'text-amber-700 border border-amber-200 bg-amber-50',
    'RESOLVED': 'text-emerald-700 border border-emerald-200 bg-emerald-50'
  };
  return styles[status] || '';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

onMounted(() => {
  fetchTickets();
  fetchEquipment();
});
</script>