<template>
  <div v-if="$route.path === '/login'" class="min-h-screen font-sans text-slate-900">
    <router-view />
  </div>

  <div v-else class="flex h-screen bg-slate-50 font-sans text-slate-900">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import { useAuth } from './composables/useAuth';

const { isAuthenticated, fetchCurrentUser } = useAuth();

onMounted(() => {
  if (isAuthenticated.value) {
    fetchCurrentUser();
  }
});
</script>