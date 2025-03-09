<script setup lang="ts">
import type { Festival } from '~/types/festival';
import { ref, onMounted } from 'vue';

const isLoading = ref(true);
const festival = ref<Festival | null>(null);
const router = useRouter();

// Загрузка данных о последнем фестивале
const fetchLastFestival = async () => {
  isLoading.value = true;
  try {
    const response = await $fetch('/api/festivals');
    if (response.success && response.festivals.length > 0) {
      // Берем первый фестиваль, так как они отсортированы по дате
      festival.value = response.festivals[0];
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных о фестивале:', error);
  } finally {
    isLoading.value = false;
  }
};

// Форматирование даты
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

// Загружаем данные при монтировании компонента
onMounted(() => {
  fetchLastFestival();
});

// Переход к списку фестивалей
const navigateToFestivals = () => {
  router.push('/festivals');
};
</script>

<template>
  <div class="bg-white rounded-lg shadow-lg overflow-hidden">
    <!-- Заглавное изображение с информацией -->
    <div class="h-48 bg-purple-50 relative flex items-center justify-center">
      <img src="/img/logo.png" alt="Крымский Вайшнавский Фестиваль" class="h-32 object-contain">
      <div 
        v-if="festival"
        class="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 rounded-br-lg text-sm font-medium"
      >
        {{ festival.isRegistered ? 'Вы зарегистрированы' : 'Регистрация открыта' }}
      </div>
    </div>
    
    <div class="p-6">
      <!-- Загрузка -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      
      <!-- Нет данных -->
      <div v-else-if="!festival" class="text-center py-8">
        <p class="text-gray-500">Информация о фестивалях пока не доступна</p>
      </div>
      
      <!-- Информация о фестивале -->
      <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-gray-800">
            Фестиваль {{ festival.year }}
          </h3>
        </div>
        
        <div class="text-sm text-gray-600">
          <p class="mb-2">
            <span class="font-medium">Даты проведения:</span> 
            {{ formatDate(festival.startDate) }} - {{ formatDate(festival.endDate) }}
          </p>
          <p v-if="festival.announcementText" class="text-gray-700">
            {{ festival.announcementText }}
          </p>
        </div>
        
        <!-- Кнопки навигации -->
        <div class="grid grid-cols-2 gap-4 pt-4">
          <button 
            @click="router.push('/dashboard/profile')"
            class="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <Icon name="mdi:account" class="w-4 h-4 mr-2" />
            <span>Мой профиль</span>
          </button>
          <button 
            @click="router.push('/dashboard/festivals')"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <span>К фестивалям</span>
            <Icon name="mdi:arrow-right" class="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template> 