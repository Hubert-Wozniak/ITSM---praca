<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
      
      <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h3 class="text-lg font-bold text-slate-900">Nowe zgłoszenie</h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors">
          <XIcon class="w-5 h-5" />
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="p-6">
        <div class="space-y-4">
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Tytuł zgłoszenia / Opis problemu</label>
            <input 
              v-model="formData.title" 
              type="text" 
              required 
              placeholder="np. Nie działa drukarka na 3 piętrze" 
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" 
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Kategoria</label>
              <select v-model="formData.category" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                <option value="Sprzęt">Sprzęt</option>
                <option value="Oprogramowanie">Oprogramowanie</option>
                <option value="Sieć">Sieć</option>
                <option value="Dostęp / Uprawnienia">Dostęp / Uprawnienia</option>
                <option value="Poczta / Outlook">Poczta / Outlook</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Priorytet</label>
              <select v-model="formData.priority" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                <option value="Niski">Niski</option>
                <option value="Średni">Średni</option>
                <option value="Wysoki">Wysoki</option>
                <option value="Krytyczny">Krytyczny</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Osoba zgłaszająca</label>
            <input 
              v-model="formData.requester" 
              type="text" 
              required 
              placeholder="Imię i nazwisko pracownika" 
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" 
            />
          </div>

        </div>

        <div class="mt-8 flex justify-end gap-3">
          <button type="button" @click="$emit('close')" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
            Anuluj
          </button>
          <button type="submit" class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors">
            Utwórz zgłoszenie
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { XIcon } from 'lucide-vue-next';

defineProps<{
  isOpen: boolean
}>();

const emit = defineEmits(['close', 'submit']);

const formData = ref({
  title: '',
  category: 'Sprzęt',
  priority: 'Średni',
  requester: ''
});

const handleSubmit = () => {
  emit('submit', { ...formData.value });
  
  formData.value = {
    title: '',
    category: 'Sprzęt',
    priority: 'Średni',
    requester: ''
  };
};
</script>