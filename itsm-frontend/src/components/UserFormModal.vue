<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
    <div class="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="text-lg font-bold text-slate-900">
          {{ userToEdit ? 'Edycja danych pracownika' : 'Nowy użytkownik (Onboarding)' }}
        </h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Imię *</label>
            <input
              v-model="form.firstName"
              type="text"
              required
              placeholder="np. Jan"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nazwisko *</label>
            <input
              v-model="form.lastName"
              type="text"
              required
              placeholder="np. Kowalski"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Służbowy e-mail *</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="jan.kowalski@firma.pl"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Telefon / nr wewn.</label>
            <input
              v-model="form.phone"
              type="text"
              placeholder="np. +48 500 600 700"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Dział *</label>
            <select v-model="form.department" class="w-full px-3.5 py-2 border border-slate-300 rounded-lg outline-none bg-white">
              <option value="IT">Dział IT</option>
              <option value="Administracja">Administracja</option>
              <option value="Księgowość">Księgowość</option>
              <option value="Kadry i Płace">Kadry i Płace</option>
              <option value="Sprzedaż">Sprzedaż</option>
              <option value="Logistyka">Logistyka</option>
              <option value="Zarząd">Zarząd</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Stanowisko</label>
            <input
              v-model="form.position"
              type="text"
              placeholder="np. Specjalista IT"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Rola w systemie ITSM *</label>
          <select v-model="form.role" class="w-full px-3.5 py-2 border border-slate-300 rounded-lg outline-none bg-white">
            <option value="EMPLOYEE">Pracownik (zgłaszający / użytkownik sprzętu)</option>
            <option value="TECHNICIAN">Technik IT (realizacja zgłoszeń Helpdesk)</option>
            <option value="ADMIN">Administrator systemu</option>
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
            {{ userToEdit ? 'Zapisz zmiany' : 'Dodaj pracownika' }}
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
  userToEdit?: any | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', payload: any): void;
}>();

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: 'Administracja',
  position: '',
  role: 'EMPLOYEE'
});

watch(
  () => [props.isOpen, props.userToEdit],
  ([opened]) => {
    if (!opened) return;
    if (props.userToEdit) {
      form.value = {
        firstName: props.userToEdit.firstName || '',
        lastName: props.userToEdit.lastName || '',
        email: props.userToEdit.email || '',
        phone: props.userToEdit.phone || '',
        department: props.userToEdit.department || 'Administracja',
        position: props.userToEdit.position || '',
        role: props.userToEdit.role || 'EMPLOYEE'
      };
    } else {
      form.value = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: 'Administracja',
        position: '',
        role: 'EMPLOYEE'
      };
    }
  }
);

const handleSubmit = () => {
  emit('submit', { ...form.value });
};
</script>