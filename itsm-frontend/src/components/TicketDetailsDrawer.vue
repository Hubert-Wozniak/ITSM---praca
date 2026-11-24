<template>
  <div v-if="ticketId !== null" class="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs" @click.self="$emit('close')">
    <aside class="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
      <!-- Nagłówek panelu -->
      <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div class="flex items-center gap-3">
          <span class="px-2.5 py-1 rounded-md bg-slate-200/80 text-slate-700 font-mono text-xs font-bold">
            IT-{{ ticketId }}
          </span>
          <span v-if="ticket" class="text-xs font-medium text-slate-500">
            {{ ticket.category }} • Zgłoszono {{ formatDate(ticket.createdAt) }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="ticket && ticket.status !== 'RESOLVED'"
            @click="closeTicketAndExit"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
          >
            <CheckIcon class="w-3.5 h-3.5" />
            Zamknij zgłoszenie
          </button>
          <button
            v-else-if="ticket && ticket.status === 'RESOLVED'"
            @click="patchTicket({ status: 'IN_PROGRESS' })"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
          >
            <RotateCcwIcon class="w-3.5 h-3.5" />
            Wznów zgłoszenie
          </button>

          <button
            @click="$emit('close')"
            class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Zamknij panel"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Zawartość główna (scrollowana) -->
      <div v-if="isLoading" class="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Ładowanie szczegółów zgłoszenia...
      </div>

      <div v-else-if="ticket" class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Baner dla zamkniętego zgłoszenia -->
        <div
          v-if="ticket.status === 'RESOLVED'"
          class="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600"
        >
          <span>To zgłoszenie zostało zamknięte — edycja technika i sprzętu jest zablokowana.</span>
          <button @click="patchTicket({ status: 'IN_PROGRESS' })" class="font-semibold text-sky-600 hover:underline">
            Wznów
          </button>
        </div>

        <!-- Tytuł i zgłaszający -->
        <div>
          <h3 :class="['text-xl font-bold leading-snug', ticket.status === 'RESOLVED' ? 'text-slate-600' : 'text-slate-900']">
            {{ ticket.title }}
          </h3>
          <p class="text-sm text-slate-500 mt-1">
            Zgłosił(a):
            <span class="font-medium text-slate-700">
              {{ ticket.requester ? `${ticket.requester.firstName} ${ticket.requester.lastName} (${ticket.requester.department})` : 'Brak danych' }}
            </span>
          </p>
        </div>

        <!-- Szybkie parametry -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <div>
            <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Status</label>
            <select
              :value="ticket.status"
              @change="patchTicket({ status: ($event.target as HTMLSelectElement).value })"
              class="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white outline-none cursor-pointer"
            >
              <option value="NEW">Nowe</option>
              <option value="IN_PROGRESS">W toku</option>
              <option value="RESOLVED">Zamknięte</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Priorytet</label>
            <select
              :value="ticket.priority"
              @change="patchTicket({ priority: ($event.target as HTMLSelectElement).value })"
              class="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white outline-none cursor-pointer"
            >
              <option value="Niski">Niski</option>
              <option value="Średni">Średni</option>
              <option value="Wysoki">Wysoki</option>
              <option value="Krytyczny">Krytyczny</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Technik realizujący</label>
            <select
              :value="ticket.assigneeId || ''"
              :disabled="ticket.status === 'RESOLVED'"
              @change="patchTicket({ assigneeId: ($event.target as HTMLSelectElement).value || null })"
              :class="[
                'w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 outline-none',
                ticket.status === 'RESOLVED'
                  ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                  : 'bg-white cursor-pointer'
              ]"
            >
              <option value="">— Nieprzypisane —</option>
              <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                {{ tech.firstName }} {{ tech.lastName }}
              </option>
            </select>
          </div>
        </div>

        <!-- Powiązany sprzęt CMDB -->
        <div v-if="ticket.equipment" class="flex items-center justify-between p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <LaptopIcon class="w-4 h-4" />
            </div>
            <div>
              <p class="text-xs font-semibold text-indigo-950">{{ ticket.equipment.name }}</p>
              <p class="text-[11px] text-indigo-600 font-mono">
                S/N: {{ ticket.equipment.serialNumber }}{{ ticket.equipment.location ? ` • ${ticket.equipment.location}` : '' }}
              </p>
            </div>
          </div>
          <span class="text-[11px] font-semibold text-indigo-600 px-2 py-0.5 bg-white rounded border border-indigo-200">
            Zasób CMDB
          </span>
        </div>

        <!-- Opis problemu -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500">Opis problemu / zakres prac</h4>
            <button
              v-if="!isEditingDescription"
              @click="startEditDescription"
              class="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <Edit3Icon class="w-3.5 h-3.5" />
              Edytuj opis
            </button>
          </div>

          <div v-if="isEditingDescription" class="space-y-2">
            <textarea
              v-model="descriptionDraft"
              rows="4"
              placeholder="Wpisz opis problemu lub ustalenia techniczne..."
              class="w-full p-3 text-sm border border-sky-400 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
            ></textarea>
            <div class="flex justify-end gap-2">
              <button
                @click="isEditingDescription = false"
                class="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Anuluj
              </button>
              <button
                @click="saveDescription"
                class="px-3 py-1.5 text-xs font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg"
              >
                Zapisz opis
              </button>
            </div>
          </div>

          <div v-else class="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-sm text-slate-700 whitespace-pre-line">
            {{ ticket.description || 'Brak szczegółowego opisu zgłoszenia.' }}
          </div>
        </div>

        <!-- Dziennik prac / Komentarze -->
        <div class="pt-2 border-t border-slate-200">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquareIcon class="w-4 h-4 text-slate-400" />
              Dziennik prac i komentarze ({{ ticket.comments?.length || 0 }})
            </h4>
          </div>

          <div v-if="ticket.comments && ticket.comments.length > 0" class="space-y-3 mb-6">
            <div
              v-for="comment in ticket.comments"
              :key="comment.id"
              class="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs group"
            >
              <div class="flex items-center justify-between mb-1.5">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px]">
                    {{ getInitials(comment.author) }}
                  </div>
                  <span class="text-xs font-semibold text-slate-800">{{ comment.author }}</span>
                  <span class="text-[11px] text-slate-400">• {{ formatDate(comment.createdAt) }}</span>
                </div>
                <button
                  @click="deleteComment(comment.id)"
                  class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition-all"
                  title="Usuń wpis"
                >
                  <Trash2Icon class="w-3.5 h-3.5" />
                </button>
              </div>
              <p class="text-sm text-slate-700 whitespace-pre-line pl-8">{{ comment.content }}</p>
            </div>
          </div>

          <div v-else class="text-center py-6 px-4 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 mb-6">
            Brak wpisów w dzienniku prac. Dodaj pierwszą notatkę z diagnozy lub kontaktu z użytkownikiem.
          </div>

          <!-- Formularz dodawania wpisu -->
          <form @submit.prevent="addComment" class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Autor wpisu *</label>
              <input
                v-model="newCommentAuthor"
                type="text"
                required
                placeholder="np. Jan Kowalski (IT)"
                class="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Notatka serwisowa / komentarz *</label>
              <textarea
                v-model="newCommentContent"
                rows="3"
                required
                placeholder="Opisz podjęte kroki diagnostyczne, wymienione podzespoły lub informację dla zgłaszającego..."
                class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-sky-500 resize-none"
              ></textarea>
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="isSubmittingComment"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <SendIcon class="w-3.5 h-3.5" />
                Dodaj wpis do dziennika
              </button>
            </div>
          </form>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  XIcon,
  LaptopIcon,
  Edit3Icon,
  MessageSquareIcon,
  Trash2Icon,
  SendIcon,
  CheckIcon,
  RotateCcwIcon
} from 'lucide-vue-next';

const props = defineProps<{
  ticketId: number | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const ticket = ref<any | null>(null);
const usersList = ref<any[]>([]);
const isLoading = ref(false);

const isEditingDescription = ref(false);
const descriptionDraft = ref('');

const newCommentAuthor = ref('');
const newCommentContent = ref('');
const isSubmittingComment = ref(false);

const technicians = computed(() =>
  usersList.value.filter(u => u.isActive && (u.role === 'TECHNICIAN' || u.role === 'ADMIN'))
);

const fetchUsers = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/users');
    if (response.ok) {
      usersList.value = await response.json();
    }
  } catch (error) {
    console.error('Błąd pobierania techników:', error);
  }
};

const fetchTicketDetails = async (id: number) => {
  isLoading.value = true;
  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${id}`);
    if (response.ok) {
      const data = await response.json();
      ticket.value = data;
      if (!newCommentAuthor.value && data.assignee) {
        newCommentAuthor.value = `${data.assignee.firstName} ${data.assignee.lastName}`;
      }
    }
  } catch (error) {
    console.error('Błąd pobierania szczegółów zgłoszenia:', error);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.ticketId,
  (newId) => {
    isEditingDescription.value = false;
    newCommentContent.value = '';
    if (newId !== null) {
      fetchUsers();
      fetchTicketDetails(newId);
    } else {
      ticket.value = null;
    }
  }
);

const patchTicket = async (payload: Record<string, any>) => {
  if (!props.ticketId) return;
  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${props.ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      await fetchTicketDetails(props.ticketId);
      emit('updated');
    }
  } catch (error) {
    console.error('Błąd aktualizacji zgłoszenia:', error);
  }
};

const closeTicketAndExit = async () => {
  await patchTicket({ status: 'RESOLVED' });
  emit('close');
};

const startEditDescription = () => {
  descriptionDraft.value = ticket.value?.description || '';
  isEditingDescription.value = true;
};

const saveDescription = async () => {
  await patchTicket({ description: descriptionDraft.value.trim() || null });
  isEditingDescription.value = false;
};

const addComment = async () => {
  if (!props.ticketId || !newCommentAuthor.value.trim() || !newCommentContent.value.trim()) return;
  isSubmittingComment.value = true;
  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${props.ticketId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: newCommentAuthor.value,
        content: newCommentContent.value
      })
    });

    if (response.ok) {
      newCommentContent.value = '';
      await fetchTicketDetails(props.ticketId);
      emit('updated');
    }
  } catch (error) {
    console.error('Błąd dodawania wpisu:', error);
  } finally {
    isSubmittingComment.value = false;
  }
};

const deleteComment = async (commentId: number) => {
  if (!props.ticketId || !confirm('Usunąć ten wpis z dziennika prac?')) return;
  try {
    const response = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      await fetchTicketDetails(props.ticketId);
      emit('updated');
    }
  } catch (error) {
    console.error('Błąd usuwania wpisu:', error);
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
</script>