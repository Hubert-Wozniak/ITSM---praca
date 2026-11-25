<template>
  <div v-if="equipment !== null" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
      <!-- Nagłówek -->
      <div class="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-purple-100 text-purple-700 rounded-lg">
            <Undo2Icon class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900">Odbiór sprzętu od pracownika</h3>
            <p class="text-xs text-slate-500">
              {{ equipment.name }} • <span class="font-mono">S/N: {{ equipment.serialNumber }}</span>
            </p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
      </div>

      <form @submit.prevent="handleConfirmReturn" class="p-6 space-y-5">
        <!-- Informacja o obecnym użytkowniku -->
        <div v-if="equipment.assignedUser" class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <span class="text-slate-500">Zdający urządzenie:</span>
          <span class="font-semibold text-slate-900">
            {{ equipment.assignedUser.firstName }} {{ equipment.assignedUser.lastName }} ({{ equipment.assignedUser.department }})
          </span>
        </div>

        <!-- Krótka checklista odbioru -->
        <div>
          <div class="flex items-center justify-between mb-2.5">
            <label class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Checklista weryfikacji przy zwrocie *
            </label>
            <span class="text-xs font-medium text-slate-500">
              {{ completedCount }} / {{ checklistItems.length }}
            </span>
          </div>

          <div class="space-y-2">
            <label
              v-for="item in checklistItems"
              :key="item.key"
              :class="[
                'flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none',
                item.checked ? 'bg-purple-50/60 border-purple-200' : 'bg-white border-slate-200 hover:bg-slate-50'
              ]"
            >
              <input
                v-model="item.checked"
                type="checkbox"
                class="mt-0.5 w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <div>
                <div class="text-sm font-medium text-slate-800">{{ item.label }}</div>
                <div class="text-xs text-slate-500 mt-0.5">{{ item.description }}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Uwagi serwisowe -->
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">
            Uwagi przy odbiorze <span class="text-slate-400 font-normal">(opcjonalnie)</span>
          </label>
          <input
            v-model="notes"
            type="text"
            placeholder="np. Brak oryginalnego pudełka, drobne rysy na klapie..."
            class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>

        <div class="p-3 rounded-lg bg-purple-50 border border-purple-200/80 text-xs text-purple-900">
          Po zatwierdzeniu sprzęt zostanie odpięty od pracownika i otrzyma status <strong>Odebrany / Do przygotowania</strong> przed ponownym wydaniem.
        </div>

        <!-- Przyciski -->
        <div class="pt-3 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Anuluj
          </button>
          <button
            type="submit"
            :disabled="!allChecked || isSubmitting"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckIcon class="w-4 h-4" />
            Potwierdź odbiór sprzętu
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Undo2Icon, CheckIcon } from 'lucide-vue-next';

const props = defineProps<{
  equipment: any | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'completed'): void;
}>();

const createChecklist = () => [
  {
    key: 'physical_condition',
    label: 'Weryfikacja stanu fizycznego urządzenia',
    description: 'Brak pęknięć obudowy, uszkodzeń matrycy oraz wyłamanych portów.',
    checked: false
  },
  {
    key: 'accessories_returned',
    label: 'Zwrot zasilacza i akcesoriów',
    description: 'Odebrano ładowarkę sieciową oraz ewentualne dodatki (torba, mysz, stacja dokująca).',
    checked: false
  },
  {
    key: 'account_logout',
    label: 'Zabezpieczenie danych i wylogowanie z kont',
    description: 'Urządzenie odpięte od sesji użytkownika i przekazane do czyszczenia systemu.',
    checked: false
  }
];

const checklistItems = ref(createChecklist());
const notes = ref('');
const isSubmitting = ref(false);

watch(
  () => props.equipment,
  () => {
    checklistItems.value = createChecklist();
    notes.value = '';
  }
);

const completedCount = computed(() => checklistItems.value.filter(i => i.checked).length);
const allChecked = computed(() => completedCount.value === checklistItems.value.length);

const handleConfirmReturn = async () => {
  if (!props.equipment || !allChecked.value) return;
  isSubmitting.value = true;

  try {
    const now = new Date().toISOString();
    const returnedFromName = props.equipment.assignedUser
      ? `${props.equipment.assignedUser.firstName} ${props.equipment.assignedUser.lastName}`
      : 'Nieznany użytkownik';

    const response = await fetch(`http://localhost:3000/api/equipment/${props.equipment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignedUserId: null,
        status: 'RETURNED',
        lastReturnedAt: now,
        lastReturnChecklist: {
          returnedAt: now,
          returnedFrom: returnedFromName,
          notes: notes.value.trim() || null,
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
      alert('Nie udało się zarejestrować odbioru sprzętu.');
    }
  } catch (error) {
    console.error('Błąd podczas odbioru sprzętu:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>