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
        
        <router-link to="/equipment" class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-slate-800/50 hover:text-white" active-class="bg-slate-800 text-white">
          <MonitorSmartphoneIcon class="w-5 h-5" :class="$route.path === '/equipment' ? 'text-sky-400' : 'text-slate-400'" />
          <span class="font-medium text-sm">Ewidencja Sprzętu</span>
        </router-link>
      </nav>
    </div>

    <div class="p-4 border-t border-slate-700/50">
      <div class="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-slate-800 rounded-lg transition-colors">
        <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">HW</div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-white font-medium truncate">Hubert Woźniak</p>
          <p class="text-xs text-sky-400 truncate">IT_MANAGER</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { HeadphonesIcon, LayoutDashboardIcon, MonitorSmartphoneIcon } from 'lucide-vue-next';
</script>