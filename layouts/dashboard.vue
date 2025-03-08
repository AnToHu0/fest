<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Сайдбар -->
    <Sidebar />

    <!-- Основной контент -->
    <div class="pl-64">
      <!-- Шапка -->
      <header class="bg-white shadow-sm sticky top-0 z-20">
        <div class="px-6 py-4">
          <h1 class="text-xl font-semibold text-gray-800">Личный кабинет</h1>
        </div>
      </header>

      <!-- Контент страницы -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '~/components/dashboard/Sidebar.vue';
</script> 