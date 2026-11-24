<template>
  <div class="p-8 max-w-7xl mx-auto relative">
    <header class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Zarządzanie Sprzętem</h2>
        <p class="text-slate-500 mt-1">Ewidencja przypisań i statusów urządzeń w firmie.</p>
      </div>
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
          <tr v-if="filteredEquipment.length === 0">
            <td colspan="3" class="px-6 py-8 text-center text-slate-500">
              Brak urządzeń spełniających kryteria.
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
import { SearchIcon, Edit2Icon } from 'lucide-vue-next';
import EquipmentFormModal from '../components/EquipmentFormModal.vue';

const searchQuery = ref('');
const statusFilter = ref('ALL');
const isModalOpen = ref(false);

const equipmentList = ref<any[]>([]);

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
      headers: {
        'Content-Type': 'application/json'
      },
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
      alert("Nie udało się zapisać urządzenia. Sprawdź, czy numer seryjny jest unikalny.");
    }
  } catch (error) {
    console.error('Błąd podczas zapisywania:', error);
  }
};

const filteredEquipment = computed(() => {
  return equipmentList.value.filter(item => {
    const query = searchQuery.value.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(query) || item.serialNumber.toLowerCase().includes(query);
    const matchesStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

onMounted(() => {
  fetchEquipment();
});
</script>