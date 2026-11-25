<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <h3 class="text-base font-bold text-slate-900">Nowe zgłoszenie serwisowe</h3>
        <button @click="$emit('close')" class="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors">
          <XIcon class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Temat zgłoszenia *</label>
          <input
            v-model="form.title"
            type="text"
            required
            placeholder="np. Brak połączenia z VPN / Uszkodzony zasilacz laptopa"
            class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Kategoria *</label>
            <select
              v-model="form.category"
              class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="Sprzęt">Sprzęt</option>
              <option value="Oprogramowanie">Oprogramowanie</option>
              <option value="Sieć / VPN">Sieć / VPN</option>
              <option value="Dostępy i konta">Dostępy i konta</option>
              <option value="Inne">Inne</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Priorytet *</label>
            <select
              v-model="form.priority"
              class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="Niski">Niski</option>
              <option value="Średni">Średni</option>
              <option value="Wysoki">Wysoki</option>
              <option value="Krytyczny">Krytyczny</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Osoba zgłaszająca *</label>
          <select
            v-model="form.requesterId"
            required
            class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
          >
            <option value="" disabled>— Wybierz pracownika —</option>
            <option v-for="user in activeUsers" :key="user.id" :value="user.id">
              {{ user.firstName }} {{ user.lastName }} ({{ user.department }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Powiązane urządzenie CMDB (opcjonalnie)</label>
          <select
            v-model="form.equipmentId"
            class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
          >
            <option value="">— Brak powiązanego urządzenia —</option>
            <option v-for="eq in equipmentList" :key="eq.id" :value="eq.id">
              {{ eq.name }} (S/N: {{ eq.serialNumber }}){{ eq.assignedUser ? ` — ${eq.assignedUser.firstName} ${eq.assignedUser.lastName}` : '' }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Opis problemu / szczegóły</label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Opisz objawy usterki, komunikaty błędów lub zakres wniosku..."
            class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none resize-none"
          ></textarea>
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            Anuluj
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-lg shadow-xs transition-colors"
          >
            Utwórz zgłoszenie
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { XIcon } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  initialRequesterId?: string | null;
  initialEquipmentId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', payload: any): void;
}>();

const usersList = ref<any[]>([]);
const equipmentList = ref<any[]>([]);

const activeUsers = computed(() => usersList.value.filter(u => u.isActive));

const form = reactive({
  title: '',
  category: 'Sprzęt',
  priority: 'Średni',
  requesterId: '',
  equipmentId: '',
  description: ''
});

const loadDictionaries = async () => {
  try {
    const [usersRes, eqRes] = await Promise.all([
      fetch('http://localhost:3000/api/users'),
      fetch('http://localhost:3000/api/equipment')
    ]);
    if (usersRes.ok) usersList.value = await usersRes.json();
    if (eqRes.ok) equipmentList.value = await eqRes.json();
  } catch (error) {
    console.error('Błąd pobierania słowników formularza:', error);
  }
};

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      form.title = '';
      form.category = 'Sprzęt';
      form.priority = 'Średni';
      form.requesterId = props.initialRequesterId || '';
      form.equipmentId = props.initialEquipmentId || '';
      form.description = '';
      await loadDictionaries();
    }
  }
);

const handleSubmit = () => {
  emit('submit', {
    title: form.title.trim(),
    category: form.category,
    priority: form.priority,
    requesterId: form.requesterId,
    equipmentId: form.equipmentId || null,
    description: form.description.trim() || null
  });
};
</script>