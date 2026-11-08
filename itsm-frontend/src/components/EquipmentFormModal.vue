<template>
  <!-- v-if sprawia, że okienko w ogóle nie istnieje w kodzie HTML, gdy isOpen jest false -->
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      
      <!-- Nagłówek okienka -->
      <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h3 class="text-lg font-bold text-slate-900">Dodaj nowe urządzenie</h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors">
          <XIcon class="w-5 h-5" />
        </button>
      </div>
      
      <!-- Formularz (@submit.prevent blokuje domyślne odświeżenie strony po kliknięciu wyślij) -->
      <form @submit.prevent="handleSubmit" class="p-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nazwa urządzenia</label>
            <input 
              v-model="formData.name" 
              type="text" 
              required 
              placeholder="np. Dell Latitude 5520" 
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" 
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Numer seryjny (SN)</label>
            <input 
              v-model="formData.serialNumber" 
              type="text" 
              required 
              placeholder="np. DL1X29A" 
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" 
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Status początkowy</label>
            <select v-model="formData.status" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
              <option value="IN_STORAGE">W magazynie (Wolne)</option>
              <option value="IN_USE">W użyciu</option>
            </select>
          </div>
        </div>

        <div class="mt-8 flex justify-end gap-3">
          <button type="button" @click="$emit('close')" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
            Anuluj
          </button>
          <button type="submit" class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors">
            Zapisz urządzenie
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { XIcon } from 'lucide-vue-next';

// 1. Odbieramy propsa z zewnątrz, który decyduje czy okienko jest otwarte
defineProps<{
  isOpen: boolean
}>();

// 2. Definiujemy zdarzenia, które możemy wysłać do rodzica (zamknięcie i wysłanie formularza)
const emit = defineEmits(['close', 'submit']);

// 3. Stan samego formularza
const formData = ref({
  name: '',
  serialNumber: '',
  status: 'IN_STORAGE'
});

// 4. Funkcja wywoływana po kliknięciu "Zapisz"
const handleSubmit = () => {
  // Wysyłamy sklonowane dane na zewnątrz do tabeli
  emit('submit', { ...formData.value });
  
  // Czyścimy formularz do następnego użycia
  formData.value = {
    name: '',
    serialNumber: '',
    status: 'IN_STORAGE'
  };
};
</script>