<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
    <div class="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="text-lg font-bold text-slate-900">Nowe zgłoszenie serwisowe</h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Temat zgłoszenia *</label>
          <input
            v-model="form.title"
            type="text"
            required
            placeholder="np. Brak dostępu do poczty lub uszkodzony zasilacz"
            class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            Szczegółowy opis problemu <span class="text-slate-400 font-normal">(opcjonalnie)</span>
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Opisz objawy usterki, treść komunikatu błędu lub okoliczności wystąpienia..."
            class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none resize-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Kategoria *</label>
            <select v-model="form.category" class="w-full px-3.5 py-2 border border-slate-300 rounded-lg outline-none bg-white">
              <option value="Sprzęt">Sprzęt</option>
              <option value="Oprogramowanie">Oprogramowanie</option>
              <option value="Sieć i dostęp">Sieć i dostęp</option>
              <option value="Inne">Inne</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Priorytet *</label>
            <select v-model="form.priority" class="w-full px-3.5 py-2 border border-slate-300 rounded-lg outline-none bg-white">
              <option value="Niski">Niski</option>
              <option value="Średni">Średni</option>
              <option value="Wysoki">Wysoki</option>
              <option value="Krytyczny">Krytyczny</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Osoba zgłaszająca *</label>
          <input
            v-model="form.requester"
            type="text"
            required
            placeholder="Imię i nazwisko pracownika"
            class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            Powiązany sprzęt z ewidencji <span class="text-slate-400 font-normal">(opcjonalnie)</span>
          </label>
          <select v-model="form.equipmentId" class="w-full px-3.5 py-2 border border-slate-300 rounded-lg outline-none bg-white">
            <option value="">— Brak powiązanego sprzętu —</option>
            <option v-for="item in equipmentOptions" :key="item.id" :value="item.id">
              {{ item.name }} (S/N: {{ item.serialNumber }}){{ item.assignedUser ? ` — ${item.assignedUser}` : '' }}
            </option>
          </select>
        </div>

        <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Anuluj
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg shadow-xs transition-colors"
          >
            Utwórz zgłoszenie
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', payload: any): void;
}>();

const equipmentOptions = ref<any[]>([]);

const form = ref({
  title: '',
  description: '',
  category: 'Sprzęt',
  priority: 'Średni',
  requester: '',
  equipmentId: ''
});

const fetchEquipmentOptions = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/equipment');
    if (response.ok) {
      equipmentOptions.value = await response.json();
    }
  } catch (error) {
    console.error('Błąd pobierania listy sprzętu do modala:', error);
  }
};

watch(
  () => props.isOpen,
  (opened) => {
    if (opened) {
      fetchEquipmentOptions();
    }
  }
);

const handleSubmit = () => {
  emit('submit', {
    ...form.value,
    description: form.value.description.trim() || null,
    equipmentId: form.value.equipmentId || null
  });

  form.value = {
    title: '',
    description: '',
    category: 'Sprzęt',
    priority: 'Średni',
    requester: '',
    equipmentId: ''
  };
};
</script>