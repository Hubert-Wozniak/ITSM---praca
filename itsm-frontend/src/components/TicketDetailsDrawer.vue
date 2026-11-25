<template>
  <div v-if="ticketId !== null" class="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs" @click.self="$emit('close')">
    <aside class="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
      <!-- Nagłówek panelu -->
      <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 gap-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <span v-if="ticket" class="text-xs font-mono font-bold text-slate-500">IT-{{ ticket.id }}</span>
          <span v-if="ticket" :class="['px-2.5 py-0.5 rounded-full text-xs font-semibold', getStatusStyle(ticket.status)]">
            {{ getStatusLabel(ticket.status) }}
          </span>
          <span v-if="ticket" :class="['px-2 py-0.5 rounded text-xs font-semibold', getPriorityStyle(ticket.priority)]">
            {{ ticket.priority }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button
            v-if="ticket && isAdmin"
            @click="deleteTicketPermanently"
            class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Usuń zgłoszenie trwale z bazy (Administrator)"
          >
            <Trash2Icon class="w-4 h-4" />
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

      <div v-if="isLoading" class="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Ładowanie szczegółów zgłoszenia...
      </div>

      <div v-else-if="ticket" class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Tytuł i opis zgłoszenia -->
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <h3 class="text-lg font-bold text-slate-900 leading-snug">{{ ticket.title }}</h3>
          <p v-if="ticket.description" class="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {{ ticket.description }}
          </p>
          <p v-else class="text-xs text-slate-400 italic">Brak dodatkowego opisu zgłoszenia.</p>

          <div class="pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>Zgłaszający: <strong class="text-slate-800">{{ getRequesterDisplay(ticket) }}</strong></span>
            <span>•</span>
            <span>Kategoria: <strong class="text-slate-800">{{ ticket.category }}</strong></span>
            <span>•</span>
            <span>Utworzono: {{ formatDate(ticket.createdAt) }}</span>
          </div>
        </div>

        <!-- Parametry obsługi (Status, Priorytet, Technik, Sprzęt) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status zgłoszenia</label>
            <select
              :value="ticket.status"
              @change="patchTicket({ status: ($event.target as HTMLSelectElement).value })"
              class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="NEW">Nowe</option>
              <option value="IN_PROGRESS">W toku</option>
              <option value="RESOLVED">Zamknięte</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Priorytet</label>
            <select
              :value="ticket.priority"
              @change="patchTicket({ priority: ($event.target as HTMLSelectElement).value })"
              class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="Niski">Niski</option>
              <option value="Średni">Średni</option>
              <option value="Wysoki">Wysoki</option>
              <option value="Krytyczny">Krytyczny</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Przypisany technik IT</label>
            <select
              :value="ticket.assigneeId || ''"
              @change="patchTicket({ assigneeId: ($event.target as HTMLSelectElement).value || null })"
              class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">— Nieprzypisane —</option>
              <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                {{ tech.firstName }} {{ tech.lastName }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Powiązany sprzęt CMDB</label>
            <select
              :value="ticket.equipmentId || ''"
              @change="patchTicket({ equipmentId: ($event.target as HTMLSelectElement).value || null })"
              class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">— Brak powiązanego sprzętu —</option>
              <option v-for="eq in equipmentList" :key="eq.id" :value="eq.id">
                {{ eq.name }} ({{ eq.serialNumber }})
              </option>
            </select>
          </div>
        </div>

        <!-- Dziennik prac i komentarze -->
        <div class="space-y-4 pt-2 border-t border-slate-200">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <MessageSquareIcon class="w-4 h-4 text-slate-400" />
            Dziennik prac i komunikacja ({{ ticket.comments?.length || 0 }})
          </h4>

          <div v-if="ticket.comments && ticket.comments.length > 0" class="space-y-3">
            <div
              v-for="comment in ticket.comments"
              :key="comment.id"
              class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-bold text-slate-800">{{ comment.author }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-[11px] text-slate-400">{{ formatDate(comment.createdAt) }}</span>
                  <button
                    @click="deleteComment(comment.id)"
                    class="text-slate-400 hover:text-red-600 transition-colors"
                    title="Usuń wpis"
                  >
                    <Trash2Icon class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p class="text-sm text-slate-700 whitespace-pre-line">{{ comment.content }}</p>
            </div>
          </div>

          <div v-else class="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
            Brak wpisów w dzienniku prac. Dodaj pierwszą notatkę serwisową poniżej.
          </div>

          <!-- Formularz nowego komentarza (autor z sesji JWT) -->
          <form @submit.prevent="addComment" class="space-y-2.5 pt-2">
            <div class="flex items-center justify-between text-xs text-slate-500">
              <span>Dodajesz wpis jako: <strong class="text-slate-800">{{ fullName }}</strong></span>
            </div>
            <textarea
              v-model="newCommentContent"
              rows="3"
              required
              placeholder="Wpisz podjęte kroki diagnostyczne, rozwiązanie lub informację dla pracownika..."
              class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none resize-none"
            ></textarea>
            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="!newCommentContent.trim()"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
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
  Trash2Icon,
  MessageSquareIcon,
  SendIcon
} from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import { useCurrentRole } from '../composables/useCurrentRole';

const props = defineProps<{
  ticketId: number | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const { fullName } = useAuth();
const { isAdmin } = useCurrentRole();

const ticket = ref<any | null>(null);
const isLoading = ref(false);
const usersList = ref<any[]>([]);
const equipmentList = ref<any[]>([]);
const newCommentContent = ref('');

const technicians = computed(() =>
  usersList.value.filter(u => u.isActive && (u.role === 'TECHNICIAN' || u.role === 'ADMIN'))
);

const fetchTicketDetails = async (id: number) => {
  isLoading.value = true;
  try {
    const [ticketRes, usersRes, eqRes] = await Promise.all([
      fetch(`http://localhost:3000/api/tickets/${id}`),
      fetch('http://localhost:3000/api/users'),
      fetch('http://localhost:3000/api/equipment')
    ]);

    if (ticketRes.ok) ticket.value = await ticketRes.json();
    if (usersRes.ok) usersList.value = await usersRes.json();
    if (eqRes.ok) equipmentList.value = await eqRes.json();
  } catch (error) {
    console.error('Błąd pobierania szczegółów zgłoszenia:', error);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.ticketId,
  (newId) => {
    newCommentContent.value = '';
    if (newId !== null) {
      fetchTicketDetails(newId);
    } else {
      ticket.value = null;
    }
  }
);

const patchTicket = async (payload: Record<string, any>) => {
  if (!ticket.value) return;
  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${ticket.value.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      await fetchTicketDetails(ticket.value.id);
      emit('updated');
    }
  } catch (error) {
    console.error('Błąd aktualizacji zgłoszenia:', error);
  }
};

const addComment = async () => {
  if (!ticket.value || !newCommentContent.value.trim()) return;
  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${ticket.value.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: fullName.value,
        content: newCommentContent.value.trim()
      })
    });

    if (response.ok) {
      newCommentContent.value = '';
      await fetchTicketDetails(ticket.value.id);
      emit('updated');
    }
  } catch (error) {
    console.error('Błąd dodawania komentarza:', error);
  }
};

const deleteComment = async (commentId: number) => {
  if (!ticket.value || !confirm('Usunąć ten wpis z dziennika prac?')) return;
  try {
    const response = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      await fetchTicketDetails(ticket.value.id);
      emit('updated');
    }
  } catch (error) {
    console.error('Błąd usuwania komentarza:', error);
  }
};

const deleteTicketPermanently = async () => {
  if (!ticket.value || !isAdmin.value) return;
  if (!confirm(`Czy na pewno chcesz TRWALE usunąć zgłoszenie IT-${ticket.value.id} z bazy?`)) return;

  try {
    const response = await fetch(`http://localhost:3000/api/tickets/${ticket.value.id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      emit('updated');
      emit('close');
    }
  } catch (error) {
    console.error('Błąd usuwania zgłoszenia:', error);
  }
};

const getRequesterDisplay = (t: any) => {
  if (t.requester) {
    return `${t.requester.firstName} ${t.requester.lastName}`;
  }
  return t.requesterName || 'Brak danych';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    NEW: 'Nowe',
    IN_PROGRESS: 'W toku',
    RESOLVED: 'Zamknięte'
  };
  return labels[status] || status;
};

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    NEW: 'text-sky-700 bg-sky-50 border border-sky-200',
    IN_PROGRESS: 'text-amber-700 bg-amber-50 border border-amber-200',
    RESOLVED: 'text-slate-600 bg-slate-100 border border-slate-300'
  };
  return styles[status] || 'text-slate-600 bg-slate-100';
};

const getPriorityStyle = (priority: string) => {
  const styles: Record<string, string> = {
    Niski: 'text-slate-600 bg-slate-100',
    Średni: 'text-blue-600 bg-blue-100',
    Wysoki: 'text-orange-600 bg-orange-100',
    Krytyczny: 'text-red-600 bg-red-100'
  };
  return styles[priority] || 'text-slate-600 bg-slate-100';
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
</script>