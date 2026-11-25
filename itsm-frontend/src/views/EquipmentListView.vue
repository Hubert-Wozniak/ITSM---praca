<template>
  <div class="p-8 max-w-7xl mx-auto relative">
    <header class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Ewidencja Sprzętu</h2>
        <p class="text-slate-500 mt-1">Zarządzanie zasobami IT, wydaniami, odbiorami i stanem magazynowym.</p>
      </div>
      <button @click="isModalOpen = true" class="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors">
        + Dodaj sprzęt
      </button>
    </header>

    <div class="flex gap-4 mb-6">
      <div class="relative flex-1 max-w-md">
        <SearchIcon class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Szukaj po nazwie, S/N, pracowniku lub lokalizacji..." 
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" 
        />
      </div>
      <select v-model="statusFilter" class="px-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer">
        <option value="ALL">Wszystkie statusy</option>
        <option value="IN_STORAGE">W magazynie (gotowe)</option>
        <option value="IN_USE">W użyciu</option>
        <option value="RETURNED">Odebrany (do przygotowania)</option>
        <option value="NEEDS_REPLACEMENT">Do wymiany</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <th class="py-3.5 px-5">Urządzenie / Numer seryjny</th>
            <th class="py-3.5 px-4">Status</th>
            <th class="py-3.5 px-4">Przypisany pracownik</th>
            <th class="py-3.5 px-4">Lokalizacja</th>
            <th class="py-3.5 px-5 text-right">Akcje</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="item in filteredEquipment" :key="item.id" class="hover:bg-slate-50 transition-colors group">
            <td class="py-4 px-5">
              <div class="flex items-center gap-2">
                <button
                  @click="selectedEquipmentId = item.id"
                  class="font-medium text-slate-900 hover:text-sky-600 transition-colors text-left"
                >
                  {{ item.name }}
                </button>
                <span
                  v-if="item._count?.tickets > 0"
                  class="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
                  title="Liczba zgłoszeń powiązanych z tym urządzeniem"
                >
                  {{ item._count.tickets }} zgł.
                </span>
              </div>
              <div class="text-xs font-mono text-slate-400 mt-0.5">S/N: {{ item.serialNumber }}</div>
            </td>

            <td class="py-4 px-4">
              <select
                :value="item.status"
                @change="updateEquipment(item.id, { status: ($event.target as HTMLSelectElement).value })"
                :class="['px-2.5 py-1 rounded text-xs font-semibold outline-none cursor-pointer', getStatusStyle(item.status)]"
              >
                <option value="IN_STORAGE">W magazynie</option>
                <option value="IN_USE">W użyciu</option>
                <option value="RETURNED">Odebrany / Do przygotowania</option>
                <option value="NEEDS_REPLACEMENT">Do wymiany</option>
              </select>
            </td>

            <!-- WYDAWANIE SPRZĘTU PRACOWNIKOWI Z BAZY USERS -->
            <td class="py-4 px-4">
              <template v-if="item.status === 'RETURNED'">
                <span class="text-xs text-purple-700 italic px-2 py-1">
                  Wymaga przygotowania przed wydaniem
                </span>
              </template>

              <template v-else-if="editingUserId === item.id">
                <select
                  :value="item.assignedUserId || ''"
                  @change="saveUser(item, ($event.target as HTMLSelectElement).value)"
                  @blur="editingUserId = null"
                  class="w-48 px-2.5 py-1 text-xs border border-sky-400 rounded bg-white outline-none"
                  autofocus
                >
                  <option value="">— Brak przypisania —</option>
                  <option v-for="user in activeUsers" :key="user.id" :value="user.id">
                    {{ user.firstName }} {{ user.lastName }} ({{ user.department }})
                  </option>
                </select>
              </template>

              <template v-else>
                <button
                  v-if="item.assignedUser"
                  @click="editingUserId = item.id"
                  class="flex items-center gap-2 hover:bg-slate-200/70 px-2 py-1 rounded transition-colors"
                  title="Kliknij, aby zmienić przypisanego pracownika"
                >
                  <div class="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px]">
                    {{ getInitials(item.assignedUser.firstName, item.assignedUser.lastName) }}
                  </div>
                  <span class="text-sm text-slate-700">
                    {{ item.assignedUser.firstName }} {{ item.assignedUser.lastName }}
                  </span>
                </button>
                <button
                  v-else
                  @click="editingUserId = item.id"
                  class="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium px-2 py-1 rounded hover:bg-sky-50 transition-colors"
                >
                  <UserPlusIcon class="w-3.5 h-3.5" />
                  Wydaj pracownikowi
                </button>
              </template>
            </td>

            <td class="py-4 px-4">
              <template v-if="editingLocationId === item.id">
                <input
                  v-model="locationInput"
                  @keyup.enter="saveLocation(item.id)"
                  @keyup.esc="editingLocationId = null"
                  @blur="saveLocation(item.id)"
                  type="text"
                  placeholder="np. Pokój 204..."
                  class="w-36 px-2.5 py-1 text-xs border border-sky-400 rounded outline-none"
                  autofocus
                />
              </template>
              <template v-else>
                <button
                  v-if="item.location"
                  @click="startEditLocation(item)"
                  class="flex items-center gap-1.5 text-sm text-slate-600 hover:bg-slate-200/70 px-2 py-1 rounded transition-colors"
                  title="Kliknij, aby zmienić lokalizację"
                >
                  <MapPinIcon class="w-3.5 h-3.5 text-slate-400" />
                  {{ item.location }}
                </button>
                <button
                  v-else
                  @click="startEditLocation(item)"
                  class="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  <MapPinIcon class="w-3.5 h-3.5" />
                  Dodaj lokalizację
                </button>
              </template>
            </td>

            <!-- AKCJE CYKLU ŻYCIA + STRZAŁKA KARTY URZĄDZENIA -->
            <td class="py-4 px-5 text-right">
              <div class="inline-flex items-center justify-end gap-1.5">
                <button
                  v-if="item.assignedUser || item.status === 'IN_USE'"
                  @click.stop="returningEquipment = item"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                  title="Odbierz sprzęt od pracownika z checklistą"
                >
                  <Undo2Icon class="w-3.5 h-3.5" />
                  Odbierz
                </button>

                <button
                  v-else-if="item.status === 'RETURNED'"
                  @click.stop="updateEquipment(item.id, { status: 'IN_STORAGE' })"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                  title="Oznacz sprzęt jako przygotowany i gotowy do ponownego wydania"
                >
                  <CheckIcon class="w-3.5 h-3.5" />
                  Zatwierdź na magazyn
                </button>

                <button
                  type="button"
                  @click.stop="selectedEquipmentId = item.id"
                  class="p-1.5 text-slate-400 group-hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                  title="Otwórz kartę urządzenia i historię powierzeń"
                >
                  <ChevronRightIcon class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="filteredEquipment.length === 0">
            <td colspan="5" class="p-8 text-center text-slate-500">
              Brak sprzętu spełniającego wybrane kryteria.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <EquipmentFormModal 
      :is-open="isModalOpen" 
      @close="isModalOpen = false" 
      @submit="handleAddEquipment" 
    />

    <EquipmentReturnModal
      :equipment="returningEquipment"
      @close="returningEquipment = null"
      @completed="fetchEquipment"
    />

    <EquipmentDetailsDrawer
      :equipment-id="selectedEquipmentId"
      @close="selectedEquipmentId = null"
      @updated="fetchEquipment"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  SearchIcon,
  UserPlusIcon,
  MapPinIcon,
  Undo2Icon,
  CheckIcon,
  ChevronRightIcon
} from 'lucide-vue-next';
import EquipmentFormModal from '../components/EquipmentFormModal.vue';
import EquipmentReturnModal from '../components/EquipmentReturnModal.vue';
import EquipmentDetailsDrawer from '../components/EquipmentDetailsDrawer.vue';

const searchQuery = ref('');
const statusFilter = ref('ALL');
const isModalOpen = ref(false);
const equipmentList = ref<any[]>([]);
const usersList = ref<any[]>([]);

const editingUserId = ref<string | null>(null);
const editingLocationId = ref<string | null>(null);
const locationInput = ref('');

const returningEquipment = ref<any | null>(null);
const selectedEquipmentId = ref<string | null>(null);

const activeUsers = computed(() => usersList.value.filter(u => u.isActive));

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

const handleAddEquipment = async (newEquipment: any) => {
  try {
    const response = await fetch('http://localhost:3000/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newEquipment.name,
        serialNumber: newEquipment.serialNumber,
        status: newEquipment.status
      })
    });

    if (response.ok) {
      await fetchEquipment();
      isModalOpen.value = false;
    } else {
      alert('Nie udało się zapisać urządzenia. Sprawdź, czy numer seryjny jest unikalny.');
    }
  } catch (error) {
    console.error('Błąd podczas zapisywania:', error);
  }
};

const updateEquipment = async (
  id: string,
  payload: { status?: string; assignedUserId?: string | null; location?: string | null }
) => {
  try {
    const response = await fetch(`http://localhost:3000/api/equipment/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      await fetchEquipment();
    }
  } catch (error) {
    console.error('Błąd aktualizacji sprzętu:', error);
  }
};

const saveUser = async (item: any, selectedUserId: string) => {
  editingUserId.value = null;

  const nextUserId = selectedUserId || null;
  let nextStatus = item.status;

  if (nextUserId && item.status === 'IN_STORAGE') {
    nextStatus = 'IN_USE';
  } else if (!nextUserId && item.status === 'IN_USE') {
    nextStatus = 'IN_STORAGE';
  }

  await updateEquipment(item.id, { assignedUserId: nextUserId, status: nextStatus });
};

const startEditLocation = (item: any) => {
  editingLocationId.value = item.id;
  locationInput.value = item.location || '';
};

const saveLocation = async (id: string) => {
  if (editingLocationId.value !== id) return;
  const trimmed = locationInput.value.trim();
  editingLocationId.value = null;
  await updateEquipment(id, { location: trimmed || null });
};

const filteredEquipment = computed(() => {
  return equipmentList.value.filter(item => {
    const query = searchQuery.value.toLowerCase();
    const userName = item.assignedUser
      ? `${item.assignedUser.firstName} ${item.assignedUser.lastName}`.toLowerCase()
      : '';
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.serialNumber.toLowerCase().includes(query) ||
      userName.includes(query) ||
      (item.location || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    'IN_STORAGE': 'text-slate-700 border border-slate-200 bg-slate-100',
    'IN_USE': 'text-emerald-700 border border-emerald-200 bg-emerald-50',
    'RETURNED': 'text-purple-700 border border-purple-200 bg-purple-50',
    'NEEDS_REPLACEMENT': 'text-amber-700 border border-amber-200 bg-amber-50'
  };
  return styles[status] || '';
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

onMounted(() => {
  fetchEquipment();
  fetchUsers();
});
</script>