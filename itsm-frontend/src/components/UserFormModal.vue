<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <h3 class="text-base font-bold text-slate-900">
          {{ userToEdit ? 'Edytuj dane pracownika' : 'Dodaj nowego pracownika' }}
        </h3>
        <button @click="$emit('close')" class="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors">
          <XIcon class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Imię *</label>
            <input
              v-model="form.firstName"
              type="text"
              required
              placeholder="np. Anna"
              class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nazwisko *</label>
            <input
              v-model="form.lastName"
              type="text"
              required
              placeholder="np. Kowalska"
              class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Adres e-mail *</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="anna.kowalska@firma.pl"
              class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Telefon służbowy</label>
            <input
              v-model="form.phone"
              type="text"
              placeholder="+48 500 600 700"
              class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Dział *</label>
            <input
              v-model="form.department"
              type="text"
              required
              placeholder="np. Księgowość, Sprzedaż, IT"
              class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Stanowisko</label>
            <input
              v-model="form.position"
              type="text"
              placeholder="np. Specjalista ds. kadr"
              class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Rola w systemie</label>
          <select
            v-model="form.role"
            class="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
          >
            <option value="EMPLOYEE">Pracownik (katalog HR / CMDB — bez logowania do panelu IT)</option>
            <option value="TECHNICIAN">Technik IT (obsługa zgłoszeń i sprzętu)</option>
            <option value="ADMIN">Administrator (pełne uprawnienia RBAC)</option>
          </select>
        </div>

        <!-- Pole hasła dla operatorów z dostępem do panelu IT -->
        <div
          v-if="form.role === 'TECHNICIAN' || form.role === 'ADMIN'"
          class="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2"
        >
          <label class="block text-xs font-semibold text-sky-950">
            {{ userToEdit ? 'Nowe hasło logowania (opcjonalnie)' : 'Hasło logowania do panelu IT *' }}
          </label>
          <input
            v-model="form.password"
            type="password"
            :required="!userToEdit"
            minlength="6"
            :placeholder="userToEdit ? 'Pozostaw puste, aby zachować obecne hasło' : 'Minimum 6 znaków'"
            class="w-full px-3.5 py-2 text-sm bg-white border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
          />
          <p class="text-[11px] text-sky-800">
            Konto z rolą {{ form.role === 'ADMIN' ? 'Administratora' : 'Technika IT' }} może logować się do systemu swoim adresem e-mail i powyższym hasłem.
          </p>
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
            {{ userToEdit ? 'Zapisz zmiany' : 'Dodaj pracownika' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { XIcon } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  userToEdit: any | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', payload: any): void;
}>();

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  role: 'EMPLOYEE',
  password: ''
});

watch(
  () => [props.isOpen, props.userToEdit],
  () => {
    if (props.userToEdit) {
      form.firstName = props.userToEdit.firstName || '';
      form.lastName = props.userToEdit.lastName || '';
      form.email = props.userToEdit.email || '';
      form.phone = props.userToEdit.phone || '';
      form.department = props.userToEdit.department || '';
      form.position = props.userToEdit.position || '';
      form.role = props.userToEdit.role || 'EMPLOYEE';
      form.password = '';
    } else {
      form.firstName = '';
      form.lastName = '';
      form.email = '';
      form.phone = '';
      form.department = '';
      form.position = '';
      form.role = 'EMPLOYEE';
      form.password = '';
    }
  },
  { immediate: true }
);

const handleSubmit = () => {
  const payload: Record<string, any> = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    department: form.department.trim(),
    position: form.position.trim() || null,
    role: form.role
  };

  if ((form.role === 'TECHNICIAN' || form.role === 'ADMIN') && form.password.trim()) {
    payload.password = form.password.trim();
  }

  emit('submit', payload);
};
</script>