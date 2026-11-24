<template>
  <div class="p-8 max-w-7xl mx-auto relative">
    <header class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Zgłoszenia serwisowe</h2>
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
          placeholder="Szukaj po tytule, numerze (IT-1), pracowniku lub sprzęcie..." 
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" 
        />
      </div>
      <select v-model="statusFilter" class="px-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer">
        <option value="ACTIVE">Aktywne (bez zamkniętych)</option>
        <option value="ALL">Wszystkie zgłoszenia</option>
        <option value="NEW">Nowe</option>
        <option value="IN_PROGRESS">W toku</option>
        <option value="RESOLVED">Zamknięte</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="divide-y divide-slate-100">
        
        <div
          v-for="ticket in filteredTickets"
          :key="ticket.id"
          :class="[
            'p-4 transition-colors flex items-center gap-4',
            ticket.status === 'RESOLVED' ? 'bg-slate-50/90 opacity-65' : 'hover:bg-slate-50'
          ]"
        >
          <div class="w-16 text-sm font-semibold text-slate-400">
            IT-{{ ticket.id }}
          </div>
          
          <div class="flex-1 min-w-0">
            <button
              @click="selectedTicketId = ticket.id"
              class="text-left group block max-w-full"
            >
              <h4
                :class="[
                  'font-medium mb-1 transition-colors truncate',
                  ticket.status === 'RESOLVED'
                    ? 'text-slate-600'
                    : 'text-slate-900 group-hover:text-sky-600'
                ]"
              >
                {{ ticket.title }}
              </h4>
            </button>
            <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Kategoria: {{ ticket.category }}</span>
              <span>•</span>
              <span>
                Zgłosił(a): {{ ticket.requester ? `${ticket.requester.firstName} ${ticket.requester.lastName}` : 'Brak danych' }}
              </span>
              <span>•</span>
              <span>{{ formatDate(ticket.createdAt) }}</span>
            </div>

            <!-- POWIĄZANY SPRZĘT + LICZNIK KOMENTARZY -->
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <template v-if="ticket.status === 'RESOLVED'">
                <span
                  v-if="ticket.equipment"
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"
                >
                  <LaptopIcon class="w-3.5 h-3.5" />
                  {{ ticket.equipment.name }}
                  <span class="font-mono text-[11px] text-slate-400">({{ ticket.equipment.serialNumber }})</span>
                </span>
              </template>

              <template v-else-if="editingEquipmentTicketId === ticket.id">
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
                  @click="startEditEquipment(ticket)"
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                  title="Kliknij, aby zmienić lub odpiąć sprzęt"
                >
                  <LaptopIcon class="w-3.5 h-3.5" />
                  {{ ticket.equipment.name }}
                  <span class="font-mono text-[11px] text-indigo-500">({{ ticket.equipment.serialNumber }})</span>
                </button>
                <button
                  v-else
                  @click="startEditEquipment(ticket)"
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

          <div class="flex items-center gap-2 w-48 justify-end">
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
              <option value="RESOLVED">Zamknięte</option>
            </select>
          </div>

          <!-- PRZYPISANY TECHNIK IT (lista rozwijana z bazy Users) -->
          <div class="w-44 flex items-center gap-2 justify-end">
            <template v-if="ticket.status === 'RESOLVED'">
              <div v-if="ticket.assignee" class="flex items-center gap-2 px-2 py-1">
                <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                  {{ getInitials(ticket.assignee.firstName, ticket.assignee.lastName) }}
                </div>
                <span class="text-sm text-slate-500 truncate max-w-[110px]">
                  {{ ticket.assignee.firstName }} {{ ticket.assignee.lastName }}
                </span>
              </div>
              <span v-else class="text-xs text-slate-400 italic px-2 py-1">Nieprzypisane</span>
            </template>

            <template v-else-if="editingAssigneeId === ticket.id">
              <select
                :value="ticket.assigneeId || ''"
                @change="saveAssignee(ticket.id, ($event.target as HTMLSelectElement).value)"
                @blur="editingAssigneeId = null"
                class="w-44 px-2 py-1 text-xs border border-sky-400 rounded bg-white outline-none"
                autofocus
              >
                <option value="">— Nieprzypisane —</option>
                <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                  {{ tech.firstName }} {{ tech.lastName }}
                </option>
              </select>
            </template>
            <template v-else>
              <button
                v-if="ticket.assignee"
                @click="startEditAssignee(ticket)"
                class="flex items-center gap-2 hover:bg-slate-200/70 px-2 py-1 rounded transition-colors"
                title="Kliknij, aby zmienić technika"
              >
                <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                  {{ getInitials(ticket.assignee.firstName, ticket.assignee.lastName) }}
                </div>
                <span class="text-sm text-slate-700 truncate max-w-[110px]">
                  {{ ticket.assignee.firstName }} {{ ticket.assignee.lastName }}
                </span>
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

          <!-- PRZYCISK ZAMKNIJ / WZNÓW + USUŃ -->
          <div class="flex items-center gap-1.5 pl-2 border-l border-slate-100">
            <button
              v-if="ticket.status !== 'RESOLVED'"
              @click="updateTicket(ticket.id, { status: 'RESOLVED' })"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              title="Zamknij zgłoszenie jako rozwiązane"
            >
              <CheckIcon class="w-3.5 h-3.5" />
              Zamknij
            </button>
            <button
              v-else
              @click="updateTicket(ticket.id, { status: 'IN_PROGRESS' })"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              title="Wznów zamknięte zgłoszenie"
            >
              <RotateCcwIcon class="w-3.5 h-3.5" />
              Wznów
            </button>

            <button
              @click="deleteTicket(ticket.id)"
              class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Usuń zgłoszenie"
            >
              <Trash2Icon class="w-4 h-4" />
            </button>
          </div>
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
import {
  SearchIcon,
  Trash2Icon,
  UserPlusIcon,
  LaptopIcon,
  MessageSquareIcon,
  CheckIcon,
  RotateCcwIcon
} from 'lucide-vue-next';
import TicketFormModal from '../components/TicketFormModal.vue';
import TicketDetailsDrawer from '../components/TicketDetailsDrawer.vue';

const searchQuery = ref('');
const statusFilter = ref('ACTIVE');
const isModalOpen = ref(false);
const selectedTicketId = ref<number | null>(null);
const ticketsList = ref<any[]>([]);
const equipmentList = ref<any[]>([]);
const usersList = ref<any[]>([]);

const editingAssigneeId = ref<number | null>(null);
const editingEquipmentTicketId = ref<number | null>(null);

const technicians = computed(() =>
  usersList.value.filter(u => u.isActive && (u.role === 'TECHNICIAN' || u.role === 'ADMIN'))
);

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

const fetchUsers = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/users');
    if (response.ok) {
      usersList.value = await response.json();
    }
  } catch (error) {
    console.error('Błąd pobierania użytkowników:', error);
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
        requesterId: newTicket.requesterId,
        equipmentId: newTicket.equipmentId || null
      })
    });

    if (response.ok) {
      await fetchTickets();
      isModalOpen.value = false;
    } else {
      const err = await response.json().catch(() => ({}));
      alert(err.error || 'Nie udało się zapisać zgłoszenia.');
    }
  } catch (error) {
    console.error('Błąd zapisu zgłoszenia:', error);
  }
};

const updateTicket = async (
  id: number,
  payload: { status?: string; assigneeId?: string | null; equipmentId?: string | null }
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

const startEditEquipment = (ticket: any) => {
  if (ticket.status === 'RESOLVED') return;
  editingEquipmentTicketId.value = ticket.id;
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
  if (ticket.status === 'RESOLVED') return;
  editingAssigneeId.value = ticket.id;
};

const saveAssignee = async (ticketId: number, assigneeId: string) => {
  editingAssigneeId.value = null;
  await updateTicket(ticketId, { assigneeId: assigneeId || null });
};

const filteredTickets = computed(() => {
  return ticketsList.value.filter(t => {
    const query = searchQuery.value.toLowerCase();
    const ticketCode = `it-${t.id}`;
    const requesterName = t.requester ? `${t.requester.firstName} ${t.requester.lastName}`.toLowerCase() : '';
    const equipmentMatch =
      (t.equipment?.name || '').toLowerCase().includes(query) ||
      (t.equipment?.serialNumber || '').toLowerCase().includes(query);
    const matchesSearch =
      t.title.toLowerCase().includes(query) ||
      ticketCode.includes(query) ||
      requesterName.includes(query) ||
      equipmentMatch;

    const matchesStatus =
      statusFilter.value === 'ALL'
        ? true
        : statusFilter.value === 'ACTIVE'
          ? t.status !== 'RESOLVED'
          : t.status === statusFilter.value;

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
    'RESOLVED': 'text-slate-600 border border-slate-300 bg-slate-100'
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

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

onMounted(() => {
  fetchTickets();
  fetchEquipment();
  fetchUsers();
});
</script>