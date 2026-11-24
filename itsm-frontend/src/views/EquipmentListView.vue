<template>
  <div class="p-8 max-w-7xl mx-auto relative">
    <header class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Ewidencja Sprzętu</h2>
        <p class="text-slate-500 mt-1">Zarządzanie zasobami IT, przypisaniami i stanem magazynowym.</p>
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
        <option value="IN_STORAGE">W magazynie</option>
        <option value="IN_USE">W użyciu</option>
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
          <tr v-for="item in filteredEquipment" :key="item.id" class="hover:bg-slate-50 transition-colors">
            <td class="py-4 px-5">
              <div class="font-medium text-slate-900">{{ item.name }}</div>
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
                <option value="NEEDS_REPLACEMENT">Do wymiany</option>
              </select>
            </td>

            <td class="py-4 px-4">
              <template v-if="editingUserId === item.id">
                <input
                  v-model="userInput"
                  @keyup.enter="saveUser(item)"
                  @keyup.esc="editingUserId = null"
                  @blur="saveUser(item)"
                  type="text"
                  placeholder="Imię i nazwisko..."
                  class="w-40 px-2.5 py-1 text-xs border border-sky-400 rounded outline-none"
                  autofocus
                />
              </template>
              <template v-else>
                <button
                  v-if="item.assignedUser"
                  @click="startEditUser(item)"
                  class="flex items-center gap-2 hover:bg-slate-200/70 px-2 py-1 rounded transition-colors"
                  title="Kliknij, aby zmienić pracownika lub cofnąć wydanie"
                >
                  <div class="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px]">
                    {{ getInitials(item.assignedUser) }}
                  </div>
                  <span class="text-sm text-slate-700">{{ item.assignedUser }}</span>
                </button>
                <button
                  v-else
                  @click="startEditUser(item)"
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

            <td class="py-4 px-5 text-right">
              <button
                @click="deleteEquipment(item)"
                class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Usuń urządzenie"
              >
                <Trash2Icon class="w-4 h-4" />
              </button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { SearchIcon, Trash2Icon, UserPlusIcon, MapPinIcon } from 'lucide-vue-next';
import EquipmentFormModal from '../components/EquipmentFormModal.vue';

const searchQuery = ref('');
const statusFilter = ref('ALL');
const isModalOpen = ref(false);
const equipmentList = ref<any[]>([]);

const editingUserId = ref<string | null>(null);
const userInput = ref('');

const editingLocationId = ref<string | null>(null);
const locationInput = ref('');

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
  payload: { status?: string; assignedUser?: string | null; location?: string | null }
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

const deleteEquipment = async (item: any) => {
  if (!confirm(`Czy na pewno chcesz usunąć "${item.name}" (S/N: ${item.serialNumber})?`)) return;

  try {
    const response = await fetch(`http://localhost:3000/api/equipment/${item.id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      equipmentList.value = equipmentList.value.filter(e => e.id !== item.id);
    }
  } catch (error) {
    console.error('Błąd usuwania sprzętu:', error);
  }
};

const startEditUser = (item: any) => {
  editingUserId.value = item.id;
  userInput.value = item.assignedUser || '';
};

const saveUser = async (item: any) => {
  if (editingUserId.value !== item.id) return;
  const trimmed = userInput.value.trim();
  editingUserId.value = null;

  const nextUser = trimmed || null;
  let nextStatus = item.status;

  if (nextUser && item.status === 'IN_STORAGE') {
    nextStatus = 'IN_USE';
  } else if (!nextUser && item.status === 'IN_USE') {
    nextStatus = 'IN_STORAGE';
  }

  await updateEquipment(item.id, { assignedUser: nextUser, status: nextStatus });
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
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.serialNumber.toLowerCase().includes(query) ||
      (item.assignedUser || '').toLowerCase().includes(query) ||
      (item.location || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    'IN_STORAGE': 'text-slate-700 border border-slate-200 bg-slate-100',
    'IN_USE': 'text-emerald-700 border border-emerald-200 bg-emerald-50',
    'NEEDS_REPLACEMENT': 'text-amber-700 border border-amber-200 bg-amber-50'
  };
  return styles[status] || '';
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

onMounted(() => {
  fetchEquipment();
});
</script>