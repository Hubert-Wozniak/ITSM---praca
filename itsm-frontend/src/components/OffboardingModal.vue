<template>
  <div v-if="userId !== null" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Nagłówek -->
      <div class="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-amber-100 text-amber-700 rounded-lg">
            <UserMinusIcon class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900">Procedura Offboardingu</h3>
            <p v-if="user" class="text-xs text-slate-500">
              {{ user.firstName }} {{ user.lastName }} • {{ user.department }} ({{ user.email }})
            </p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
      </div>

      <div v-if="isLoading" class="p-10 text-center text-sm text-slate-400">
        Weryfikacja zasobów CMDB i zgłoszeń pracownika...
      </div>

      <div v-else-if="user" class="p-6 overflow-y-auto space-y-6">
        <!-- ETAP 1: Automatyczna weryfikacja CMDB -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            1. Automatyczna kontrola zasobów w systemie (CMDB)
          </h4>

          <!-- Blokada przy niezwróconym sprzęcie -->
          <div
            v-if="hasUnreturnedEquipment"
            class="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3"
          >
            <div class="flex items-start gap-3">
              <AlertTriangleIcon class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm font-semibold text-red-900">
                  Wykryto niezwrócony sprzęt firmowy ({{ user.equipment.length }} szt.)
                </p>
                <p class="text-xs text-red-700 mt-0.5">
                  Finalizacja offboardingu jest zablokowana do czasu przyjęcia poniższych urządzeń na magazyn w Ewidencji Sprzętu:
                </p>
              </div>
            </div>

            <ul class="space-y-1.5 pl-8">
              <li
                v-for="eq in user.equipment"
                :key="eq.id"
                class="text-xs font-medium text-red-950 bg-white/80 px-3 py-1.5 rounded-lg border border-red-200 flex items-center justify-between"
              >
                <span>{{ eq.name }}</span>
                <span class="font-mono text-red-700">S/N: {{ eq.serialNumber }}</span>
              </li>
            </ul>

            <div class="pl-8 pt-1">
              <RouterLink
                to="/equipment"
                @click="$emit('close')"
                class="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-800 underline"
              >
                Przejdź do Ewidencji Sprzętu, aby rozliczyć urządzenia &rarr;
              </RouterLink>
            </div>
          </div>

          <!-- Brak sprzętu na stanie -->
          <div
            v-else
            class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3"
          >
            <div class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckIcon class="w-4 h-4" />
            </div>
            <div>
              <p class="text-sm font-semibold text-emerald-950">Zasoby sprzętowe rozliczone</p>
              <p class="text-xs text-emerald-700">Pracownik nie posiada żadnego przypisanego sprzętu w bazie CMDB.</p>
            </div>
          </div>

          <!-- Ostrzeżenie o otwartych zgłoszeniach technika -->
          <div
            v-if="openAssignedTickets.length > 0"
            class="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3"
          >
            <AlertTriangleIcon class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div class="text-xs text-amber-900">
              <span class="font-semibold">Uwaga (rola serwisowa):</span>
              Pracownik ma nadal przypisane aktywne zgłoszenia ({{ openAssignedTickets.map(t => `IT-${t.id}`).join(', ') }}). Przekaż je innemu technikowi przed lub po dezaktywacji konta.
            </div>
          </div>
        </div>

        <!-- ETAP 2: Checklista proceduralna IT -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              2. Checklista zadań administracyjnych IT
            </h4>
            <span class="text-xs font-semibold text-slate-600">
              Wykonano: {{ completedCount }} / {{ checklistItems.length }}
            </span>
          </div>

          <div class="space-y-2.5">
            <label
              v-for="item in checklistItems"
              :key="item.key"
              :class="[
                'flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer select-none',
                item.checked
                  ? 'bg-sky-50/60 border-sky-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              ]"
            >
              <input
                v-model="item.checked"
                type="checkbox"
                class="mt-0.5 w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <div>
                <div :class="['text-sm font-medium', item.checked ? 'text-slate-900' : 'text-slate-700']">
                  {{ item.label }}
                </div>
                <div class="text-xs text-slate-500 mt-0.5">{{ item.description }}</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Stopka z akcjami -->
      <div class="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
        <span class="text-xs text-slate-500">
          {{ canFinalize ? 'Wszystkie warunki spełnione — konto gotowe do dezaktywacji.' : 'Rozlicz sprzęt i odhacz wszystkie punkty checklisty.' }}
        </span>

        <div class="flex items-center gap-3 shrink-0">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            Anuluj
          </button>
          <button
            type="button"
            @click="confirmOffboarding"
            :disabled="!canFinalize || isSubmitting"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <UserMinusIcon class="w-4 h-4" />
            Zakończ offboarding
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { UserMinusIcon, AlertTriangleIcon, CheckIcon } from 'lucide-vue-next';

const props = defineProps<{
  userId: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'completed'): void;
}>();

const user = ref<any | null>(null);
const isLoading = ref(false);
const isSubmitting = ref(false);

const createDefaultChecklist = () => [
  {
    key: 'm365_archive',
    label: 'Archiwizacja konta Microsoft 365 (Exchange Online / OneDrive)',
    description: 'Przekonwertowanie skrzynki na współdzieloną lub eksport archiwum PST oraz zabezpieczenie plików.',
    checked: false
  },
  {
    key: 'm365_licenses',
    label: 'Odebranie licencji M365 i unieważnienie sesji (Entra ID)',
    description: 'Cofnięcie aktywnych tokenów logowania, reset hasła oraz zwolnienie licencji subskrypcyjnej.',
    checked: false
  },
  {
    key: 'internal_access',
    label: 'Zablokowanie dostępu VPN, AD oraz aplikacji wewnętrznych',
    description: 'Wyłączenie konta w katalogu lokalnym, odebranie certyfikatów VPN i dostępów do zasobów sieciowych.',
    checked: false
  },
  {
    key: 'physical_badges',
    label: 'Odbiór kart dostępu, identyfikatora i kluczy',
    description: 'Potwierdzenie zdania fizycznych nośników dostępu do biura oraz serwerowni.',
    checked: false
  }
];

const checklistItems = ref(createDefaultChecklist());

const fetchUserDetails = async (id: string) => {
  isLoading.value = true;
  try {
    const response = await fetch(`http://localhost:3000/api/users/${id}`);
    if (response.ok) {
      user.value = await response.json();
    }
  } catch (error) {
    console.error('Błąd pobierania danych do offboardingu:', error);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.userId,
  (newId) => {
    checklistItems.value = createDefaultChecklist();
    if (newId !== null) {
      fetchUserDetails(newId);
    } else {
      user.value = null;
    }
  }
);

const hasUnreturnedEquipment = computed(() => (user.value?.equipment?.length || 0) > 0);

const openAssignedTickets = computed(() =>
  (user.value?.assignedTickets || []).filter((t: any) => t.status !== 'RESOLVED')
);

const completedCount = computed(() => checklistItems.value.filter(i => i.checked).length);

const canFinalize = computed(
  () =>
    Boolean(user.value) &&
    !hasUnreturnedEquipment.value &&
    completedCount.value === checklistItems.value.length
);

const confirmOffboarding = async () => {
  if (!user.value || !canFinalize.value) return;
  isSubmitting.value = true;
  try {
    const now = new Date().toISOString();
    const response = await fetch(`http://localhost:3000/api/users/${user.value.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isActive: false,
        offboardedAt: now,
        offboardingChecklist: {
          completedAt: now,
          items: checklistItems.value.map(i => ({
            key: i.key,
            label: i.label,
            checked: i.checked
          }))
        }
      })
    });

    if (response.ok) {
      emit('completed');
      emit('close');
    } else {
      alert('Nie udało się zapisać procedury offboardingu.');
    }
  } catch (error) {
    console.error('Błąd finalizacji offboardingu:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>