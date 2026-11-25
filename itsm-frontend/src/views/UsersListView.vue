<template>
  <div class="p-8 max-w-7xl mx-auto">
    <header class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Użytkownicy i zespół IT</h2>
        <p class="text-slate-500 mt-1">Katalog pracowników organizacji, uprawnienia oraz przydzielone zasoby.</p>
      </div>
      <button
        @click="isCreateModalOpen = true"
        class="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
      >
        + Dodaj pracownika
      </button>
    </header>

    <!-- Filtry i wyszukiwarka -->
    <div class="flex flex-wrap gap-4 mb-6">
      <div class="relative flex-1 min-w-[260px] max-w-md">
        <SearchIcon class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Szukaj po imieniu, nazwisku, e-mailu lub dziale..."
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
        />
      </div>

      <select v-model="roleFilter" class="px-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer">
        <option value="ALL">Wszystkie role</option>
        <option value="EMPLOYEE">Pracownicy</option>
        <option value="TECHNICIAN">Technicy IT</option>
        <option value="ADMIN">Administratorzy</option>
      </select>

      <select v-model="statusFilter" class="px-4 py-2.5 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer">
        <option value="ACTIVE">Aktywne konta</option>
        <option value="INACTIVE">Po offboardingu</option>
        <option value="ALL">Wszyscy użytkownicy</option>
      </select>
    </div>

    <!-- Tabela użytkowników -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <th class="py-3.5 px-5">Pracownik</th>
            <th class="py-3.5 px-4">Dział / Stanowisko</th>
            <th class="py-3.5 px-4">Rola</th>
            <th class="py-3.5 px-4">Zasoby i zgłoszenia</th>
            <th class="py-3.5 px-4">Status konta</th>
            <th class="py-3.5 px-5 text-right w-14"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            @click="selectedUserId = user.id"
            :class="[
              'cursor-pointer transition-colors group',
              user.isActive ? 'hover:bg-slate-50' : 'bg-slate-50/80 opacity-65 hover:opacity-85'
            ]"
          >
            <td class="py-4 px-5">
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                    user.isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-500'
                  ]"
                >
                  {{ getInitials(user.firstName, user.lastName) }}
                </div>
                <div>
                  <div class="font-medium text-slate-900 group-hover:text-sky-600 transition-colors">
                    {{ user.firstName }} {{ user.lastName }}
                  </div>
                  <div class="text-xs text-slate-500">
                    {{ user.email }}{{ user.phone ? ` • ${user.phone}` : '' }}
                  </div>
                </div>
              </div>
            </td>

            <td class="py-4 px-4">
              <div class="text-sm font-medium text-slate-800">{{ user.department }}</div>
              <div class="text-xs text-slate-400">{{ user.position || '—' }}</div>
            </td>

            <td class="py-4 px-4">
              <span :class="['px-2.5 py-1 rounded text-xs font-semibold', getRoleStyle(user.role)]">
                {{ getRoleLabel(user.role) }}
              </span>
            </td>

            <td class="py-4 px-4">
              <div class="flex items-center gap-2 text-xs">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                  <LaptopIcon class="w-3.5 h-3.5 text-slate-500" />
                  {{ user._count?.equipment || 0 }} szt.
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                  <TicketIcon class="w-3.5 h-3.5 text-slate-500" />
                  {{ user._count?.requestedTickets || 0 }} zgł.
                </span>
              </div>
            </td>

            <td class="py-4 px-4">
              <span
                v-if="user.isActive"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Aktywny
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Nieaktywny
              </span>
            </td>

            <td class="py-4 px-5 text-right">
              <button
                type="button"
                @click.stop="selectedUserId = user.id"
                class="p-1.5 text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-50 rounded-lg transition-colors"
                title="Otwórz kartę pracownika"
              >
                <ChevronRightIcon class="w-4 h-4" />
              </button>
            </td>
          </tr>

          <tr v-if="filteredUsers.length === 0">
            <td colspan="6" class="p-8 text-center text-slate-500">
              Brak użytkowników spełniających wybrane kryteria.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UserFormModal
      :is-open="isCreateModalOpen"
      :user-to-edit="null"
      @close="isCreateModalOpen = false"
      @submit="handleCreateUser"
    />

    <UserDetailsDrawer
      :user-id="selectedUserId"
      @close="selectedUserId = null"
      @updated="fetchUsers"
      @start-offboarding="(id) => (offboardingUserId = id)"
    />

    <OffboardingModal
      :user-id="offboardingUserId"
      @close="offboardingUserId = null"
      @completed="fetchUsers"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  SearchIcon,
  LaptopIcon,
  TicketIcon,
  ChevronRightIcon
} from 'lucide-vue-next';
import UserFormModal from '../components/UserFormModal.vue';
import UserDetailsDrawer from '../components/UserDetailsDrawer.vue';
import OffboardingModal from '../components/OffboardingModal.vue';

const searchQuery = ref('');
const roleFilter = ref('ALL');
const statusFilter = ref('ACTIVE');

const isCreateModalOpen = ref(false);
const selectedUserId = ref<string | null>(null);
const offboardingUserId = ref<string | null>(null);
const usersList = ref<any[]>([]);

const fetchUsers = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/users');
    if (response.ok) {
      usersList.value = await response.json();
    }
  } catch (error) {
    console.error('Błąd pobierania użytkowników:', error);
  }
};

const handleCreateUser = async (payload: any) => {
  try {
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      await fetchUsers();
      isCreateModalOpen.value = false;
    } else {
      const err = await response.json();
      alert(err.error || 'Nie udało się zapisać danych użytkownika.');
    }
  } catch (error) {
    console.error('Błąd zapisu użytkownika:', error);
  }
};

const filteredUsers = computed(() => {
  return usersList.value.filter(u => {
    const query = searchQuery.value.toLowerCase();
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.department.toLowerCase().includes(query) ||
      (u.position || '').toLowerCase().includes(query);

    const matchesRole = roleFilter.value === 'ALL' || u.role === roleFilter.value;
    const matchesStatus =
      statusFilter.value === 'ALL'
        ? true
        : statusFilter.value === 'ACTIVE'
          ? u.isActive
          : !u.isActive;

    return matchesSearch && matchesRole && matchesStatus;
  });
});

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    EMPLOYEE: 'Pracownik',
    TECHNICIAN: 'Technik IT',
    ADMIN: 'Administrator'
  };
  return labels[role] || role;
};

const getRoleStyle = (role: string) => {
  const styles: Record<string, string> = {
    EMPLOYEE: 'bg-slate-100 text-slate-700',
    TECHNICIAN: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    ADMIN: 'bg-amber-50 text-amber-700 border border-amber-200'
  };
  return styles[role] || 'bg-slate-100 text-slate-700';
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

onMounted(() => {
  fetchUsers();
});
</script>