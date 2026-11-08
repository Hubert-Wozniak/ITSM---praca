<template>
  <div class="p-8 max-w-7xl mx-auto relative">
    <header class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Zarządzanie Sprzętem</h2>
        <p class="text-slate-500 mt-1">Ewidencja przypisań i statusów urządzeń w firmie.</p>
      </div>
      <!-- Podpinamy otwieranie modala pod przycisk -->
      <button @click="isModalOpen = true" class="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors">
        + Dodaj sprzęt
      </button>
    </header>

    <div class="flex gap-4 mb-6">
      <div class="relative flex-1 max-w-md">
        <SearchIcon class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input v-model="searchQuery" type="text" placeholder="Szukaj po nazwie, numerze seryjnym..." class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
      </div>
      <select v-model="statusFilter" class="px-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer">
        <option value="ALL">Wszystkie statusy</option>
        <option value="IN_USE">W użyciu</option>
        <option value="IN_STORAGE">W magazynie (Wolne)</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
          <tr>
            <th class="px-6 py-4">ID / Urządzenie</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4 text-right">Akcje</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="item in filteredEquipment" :key="item.id" class="hover:bg-slate-50/50">
            <td class="px-6 py-4">
              <div class="font-semibold text-slate-900">{{ item.id }}</div>
              <div class="text-slate-500 mt-0.5">{{ item.name }} (SN: {{ item.serialNumber }})</div>
            </td>
            <td class="px-6 py-4">
              <span :class="['px-2.5 py-1 rounded-full text-xs font-semibold', item.status === 'IN_USE' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700']">
                {{ item.status === 'IN_USE' ? 'W użyciu' : 'Magazyn' }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <button class="p-2 text-slate-400 hover:text-sky-500"><Edit2Icon class="w-4 h-4" /></button>
            </td>
          </tr>
          <!-- Pusty stan, gdy szukanie nie da wyników -->
          <tr v-if="filteredEquipment.length === 0">
            <td colspan="3" class="px-6 py-8 text-center text-slate-500">
              Brak urządzeń spełniających kryteria.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Wstrzykujemy nasz komponent Modala -->
    <EquipmentFormModal 
      :is-open="isModalOpen" 
      @close="isModalOpen = false" 
      @submit="handleAddEquipment" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { SearchIcon, Edit2Icon } from 'lucide-vue-next';
// Importujemy nasz nowy klocek
import EquipmentFormModal from '../components/EquipmentFormModal.vue';

const searchQuery = ref('');
const statusFilter = ref('ALL');
// Stan sterujący widocznością okienka
const isModalOpen = ref(false);

const equipmentList = ref([
  { id: 'IT-LAP-001', name: 'Dell Latitude 5520', serialNumber: 'DL1X29A', status: 'IN_USE' },
  { id: 'IT-MON-015', name: 'Monitor Dell 27"', serialNumber: 'MD27-998', status: 'IN_STORAGE' }
]);

const filteredEquipment = computed(() => {
  return equipmentList.value.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || item.serialNumber.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

// Funkcja odbierająca dane z Modala i dodająca je do naszej listy
const handleAddEquipment = (newEquipment: any) => {
  // Generujemy tymczasowe ID (docelowo to będzie robił backend/baza danych)
  const newId = `IT-DEV-${Math.floor(Math.random() * 1000)}`;
  
  // Wpychamy nowy obiekt na sam początek tablicy
  equipmentList.value.unshift({
    id: newId,
    name: newEquipment.name,
    serialNumber: newEquipment.serialNumber,
    status: newEquipment.status
  });

  // Zamykamy okienko po zapisie
  isModalOpen.value = false;
};
</script>