<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Шапка -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 class="text-xl font-bold text-gray-900">Крымский Вайшнавский Фестиваль</h1>
      </div>
    </header>
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row">
      <!-- Боковое меню -->
      <DashboardSidebar />
      
      <!-- Основной контент -->
      <main class="flex-1 bg-white rounded-lg shadow p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardSidebar from '~/components/dashboard/Sidebar.vue';
</script> 