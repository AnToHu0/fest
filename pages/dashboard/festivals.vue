<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "dashboard"
});

import Loader from '~/components/ui/Loader.vue';

const festivals = ref<any[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

// Загрузка данных о фестивалях
const fetchFestivals = async () => {
  isLoading.value = true;
  try {
    // В будущем здесь будет запрос к API
    // const response = await $fetch('/api/festivals', { method: 'GET' });
    // festivals.value = response;
    
    // Временные данные для демонстрации
    await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация задержки загрузки
    
    festivals.value = [
      {
        id: 1,
        name: 'Крымский Вайшнавский Фестиваль 2025',
        startDate: '2025-07-01',
        endDate: '2025-07-14',
        status: 'upcoming',
        description: 'Приглашаем вас на ежегодный Крымский Вайшнавский Фестиваль 2025!'
      },
      {
        id: 2,
        name: 'Крымский Вайшнавский Фестиваль 2024',
        startDate: '2024-07-01',
        endDate: '2024-07-14',
        status: 'current',
        description: 'Текущий фестиваль. Регистрация открыта!'
      },
      {
        id: 3,
        name: 'Крымский Вайшнавский Фестиваль 2023',
        startDate: '2023-07-01',
        endDate: '2023-07-14',
        status: 'past',
        description: 'Архивная информация о прошедшем фестивале.'
      }
    ];
  } catch (error: any) {
    console.error('Ошибка при загрузке фестивалей:', error);
    errorMessage.value = error.data?.message || 'Ошибка при загрузке данных о фестивалях';
  } finally {
    isLoading.value = false;
  }
};

// Форматирование даты
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

// Получение статуса фестиваля
const getStatusText = (status: string) => {
  switch (status) {
    case 'upcoming': return 'Предстоящий';
    case 'current': return 'Текущий';
    case 'past': return 'Прошедший';
    default: return 'Неизвестно';
  }
};

// Получение класса для статуса
const getStatusClass = (status: string) => {
  switch (status) {
    case 'upcoming': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'current': return 'bg-green-100 text-green-800 border-green-200';
    case 'past': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

onMounted(() => {
  fetchFestivals();
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Фестивали</h1>
    
    <div v-if="isLoading">
      <Loader />
    </div>
    
    <div v-else-if="errorMessage" class="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
      <p>{{ errorMessage }}</p>
    </div>
    
    <div v-else-if="festivals.length === 0" class="bg-blue-50 p-4 rounded-lg border border-blue-200 text-blue-700">
      <p>Нет доступных фестивалей.</p>
    </div>
    
    <div v-else class="space-y-6">
      <div 
        v-for="festival in festivals" 
        :key="festival.id" 
        class="bg-white rounded-lg shadow overflow-hidden border border-gray-200"
      >
        <div class="p-6">
          <div class="flex justify-between items-start">
            <h2 class="text-xl font-semibold text-gray-900">{{ festival.name }}</h2>
            <span 
              :class="[
                'px-2 py-1 text-xs font-medium rounded-full border', 
                getStatusClass(festival.status)
              ]"
            >
              {{ getStatusText(festival.status) }}
            </span>
          </div>
          
          <div class="mt-2 text-sm text-gray-600">
            {{ formatDate(festival.startDate) }} - {{ formatDate(festival.endDate) }}
          </div>
          
          <p class="mt-4 text-gray-700">{{ festival.description }}</p>
          
          <div class="mt-6 flex justify-end">
            <button 
              v-if="festival.status === 'current' || festival.status === 'upcoming'"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {{ festival.status === 'current' ? 'Зарегистрироваться' : 'Подробнее' }}
            </button>
            
            <button 
              v-else
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Просмотреть информацию
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 