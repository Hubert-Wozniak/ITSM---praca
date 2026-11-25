<template>
  <aside class="w-64 bg-[#0f172a] text-slate-300 flex flex-col justify-between shrink-0">
    <div>
      <div class="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
        <div class="bg-sky-500 p-1.5 rounded-lg">
          <HeadphonesIcon class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-white font-bold text-lg leading-tight">ITSM Desk Pro</h1>
          <p class="text-xs text-slate-400">Helpdesk IT</p>
        </div>
      </div>

      <nav class="flex flex-col gap-1 px-3 py-6">
        <router-link to="/" class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-800/50 hover:text-white" active-class="bg-slate-800 text-white">
          <LayoutDashboardIcon class="w-5 h-5" :class="$route.path === '/' ? 'text-sky-400' : 'text-slate-400'" />
          <span class="font-medium text-sm">Dashboard</span>
        </router-link>
        
        <router-link to="/tickets" class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-800/50 hover:text-white" active-class="bg-slate-800 text-white">
          <TicketIcon class="w-5 h-5" :class="$route.path.includes('/tickets') ? 'text-sky-400' : 'text-slate-400'" />
          <span class="font-medium text-sm">Zgłoszenia</span>
        </router-link>

        <router-link to="/equipment" class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-800/50 hover:text-white" active-class="bg-slate-800 text-white">
          <MonitorSmartphoneIcon class="w-5 h-5" :class="$route.path.includes('/equipment') ? 'text-sky-400' : 'text-slate-400'" />
          <span class="font-medium text-sm">Ewidencja Sprzętu</span>
        </router-link>

        <router-link to="/users" class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-800/50 hover:text-white" active-class="bg-slate-800 text-white">
          <UsersIcon class="w-5 h-5" :class="$route.path.includes('/users') ? 'text-sky-400' : 'text-slate-400'" />
          <span class="font-medium text-sm">Użytkownicy</span>
        </router-link>
      </nav>
    </div>

    <div class="p-4 border-t border-slate-700/50 space-y-3">
      <div>
        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 px-2">Konto i rola</p>
        <div class="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">HW</div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-white font-medium truncate">Hubert Woźniak</p>
            <p class="text-xs truncate" :class="isAdmin ? 'text-amber-400' : 'text-sky-400'">
              {{ isAdmin ? 'ADMINISTRATOR' : 'TECHNIK IT' }}
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-800/90 border border-slate-700/70">
        <button
          type="button"
          @click="setRole('ADMIN')"
          :class="[
            'py-1.5 px-2 rounded-md text-xs font-semibold transition-colors',
            currentRole === 'ADMIN'
              ? 'bg-amber-500 text-slate-950 shadow-2xs'
              : 'text-slate-400 hover:text-white'
          ]"
        >
          Admin
        </button>
        <button
          type="button"
          @click="setRole('TECHNICIAN')"
          :class="[
            'py-1.5 px-2 rounded-md text-xs font-semibold transition-colors',
            currentRole === 'TECHNICIAN'
              ? 'bg-sky-500 text-white shadow-2xs'
              : 'text-slate-400 hover:text-white'
          ]"
        >
          Technik IT
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { 
  HeadphonesIcon, 
  LayoutDashboardIcon, 
  TicketIcon, 
  MonitorSmartphoneIcon, 
  UsersIcon 
} from 'lucide-vue-next';
import { useCurrentRole } from '../composables/useCurrentRole';

const { currentRole, setRole, isAdmin } = useCurrentRole();
</script>