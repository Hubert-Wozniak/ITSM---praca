<template>
  <div class="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      <!-- Nagłówek -->
      <div class="px-8 pt-8 pb-6 bg-slate-50 border-b border-slate-200/80 text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500 text-white shadow-md mb-3">
          <HeadphonesIcon class="w-6 h-6" />
        </div>
        <h1 class="text-xl font-bold text-slate-900">ITSM Desk Pro</h1>
        <p class="text-xs text-slate-500 mt-1">Panel obsługi zgłoszeń i ewidencji zasobów IT</p>
      </div>

      <!-- Formularz logowania -->
      <form @submit.prevent="handleSubmit" class="p-8 space-y-5">
        <div
          v-if="errorMessage"
          class="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2"
        >
          <AlertCircleIcon class="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{{ errorMessage }}</span>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Adres e-mail
          </label>
          <div class="relative">
            <MailIcon class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="email"
              type="email"
              required
              autocomplete="username"
              placeholder="np. admin@itsm.local"
              class="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Hasło
          </label>
          <div class="relative">
            <LockIcon class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <LogInIcon class="w-4 h-4" />
          <span>{{ isSubmitting ? 'Logowanie...' : 'Zaloguj się do systemu' }}</span>
        </button>

        <!-- Szybkie logowanie na konta startowe (środowisko testowe) -->
        <div class="pt-4 border-t border-slate-100">
          <p class="text-[11px] text-slate-400 text-center mb-2.5">Konta testowe (szybkie uzupełnienie):</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="fillCredentials('admin@itsm.local', 'Admin123!')"
              class="px-3 py-2 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-xs font-semibold text-amber-900 transition-colors"
            >
              Administrator
            </button>
            <button
              type="button"
              @click="fillCredentials('technik@itsm.local', 'Tech123!')"
              class="px-3 py-2 rounded-lg border border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-xs font-semibold text-sky-900 transition-colors"
            >
              Technik IT
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  HeadphonesIcon,
  MailIcon,
  LockIcon,
  LogInIcon,
  AlertCircleIcon
} from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { login } = useAuth();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

const fillCredentials = (demoEmail: string, demoPassword: string) => {
  email.value = demoEmail;
  password.value = demoPassword;
  errorMessage.value = '';
};

const handleSubmit = async () => {
  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    await login(email.value, password.value);
    router.push('/');
  } catch (error: any) {
    errorMessage.value = error?.message || 'Nieprawidłowe dane logowania.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>