<script setup lang="ts">
import type { Festival } from '~/types/festival';
import { computed } from 'vue';

const props = defineProps<{
  festival: Festival;
}>();

const emit = defineEmits<{
  participate: [id: number];
  view: [id: number];
}>();

// Проверка, является ли фестиваль активным
const isActive = computed(() => props.festival.isActive);

// Проверка, является ли фестиваль прошедшим
const isPast = computed(() => {
  const endDate = new Date(props.festival.endDate);
  return endDate < new Date();
});

// Проверка, зарегистрирован ли пользователь на фестиваль
const isRegistered = computed(() => props.festival.isRegistered);

// Форматирование даты
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

// Обработчики событий
const handleParticipate = () => {
  emit('participate', props.festival.id);
};

const handleView = () => {
  emit('view', props.festival.id);
};
</script>

<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
    <!-- Заглавное изображение только для активного фестиваля -->
    <div v-if="isActive" class="h-48 bg-purple-50 relative flex items-center justify-center">
      <img src="/img/logo.png" alt="Крымский Вайшнавский Фестиваль" class="h-32 object-contain">
      <div class="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 rounded-br-lg text-sm font-medium">
        {{ isRegistered ? 'Вы зарегистрированы' : 'Регистрация открыта' }}
      </div>
    </div>
    
    <div class="p-5">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-xl font-semibold text-gray-800">Фестиваль {{ festival.year }}</h3>
          <p class="text-sm text-gray-600 mt-1">
            {{ formatDate(festival.startDate) }} - {{ formatDate(festival.endDate) }}
          </p>
        </div>
        <div v-if="!isActive" class="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
          {{ isPast ? 'Завершен' : 'Планируется' }}
        </div>
      </div>
      
      <div v-if="festival.announcementText" class="mb-4">
        <p class="text-sm text-gray-700 line-clamp-3">{{ festival.announcementText }}</p>
      </div>
      
      <div class="flex space-x-3 mt-4">
        <button 
          v-if="!isRegistered"
          @click="handleParticipate"
          class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          :disabled="isPast"
          :class="{ 'opacity-50 cursor-not-allowed': isPast }"
        >
          Участвовать
        </button>
        <button 
          v-if="isRegistered || isPast"
          @click="handleView"
          class="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
        >
          Посмотреть
        </button>
      </div>
    </div>
  </div>
</template> 