<script setup lang="ts">
import type { Festival } from '~/types/festival';
import { computed } from 'vue';

const props = defineProps<{
  festival: Festival;
}>();

// Получаем департаменты с учетом возможных вариантов имени свойства
const departments = computed(() => {
  return props.festival.departments || props.festival.Departments || [];
});

const emit = defineEmits<{
  edit: [festival: Festival];
  delete: [id: number];
}>();

// Форматирование даты
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

// Форматирование цены
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(price);
};

// Обработчики событий
const handleEdit = () => {
  emit('edit', props.festival);
};

const handleDelete = () => {
  emit('delete', props.festival.id);
};
</script>

<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
    <div class="p-5">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-xl font-semibold text-gray-800">Фестиваль {{ festival.year }}</h3>
          <div class="flex items-center mt-1">
            <span 
              class="px-2 py-1 text-xs rounded-full" 
              :class="festival.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
            >
              {{ festival.isActive ? 'Активный' : 'Неактивный' }}
            </span>
          </div>
        </div>
        <div class="flex space-x-2">
          <button 
            @click="handleEdit"
            class="p-2 text-blue-600 hover:text-blue-800 transition-colors"
            title="Редактировать"
          >
            <Icon name="mdi:pencil" class="w-5 h-5" />
          </button>
          <button 
            @click="handleDelete"
            class="p-2 text-red-600 hover:text-red-800 transition-colors"
            title="Удалить"
          >
            <Icon name="mdi:delete" class="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p class="text-sm text-gray-500">Даты проведения:</p>
          <p class="text-sm font-medium">
            {{ formatDate(festival.startDate) }} - {{ formatDate(festival.endDate) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Доступные корпуса:</p>
          <p class="text-sm font-medium">
            {{ festival.availableBuildings?.length ? festival.availableBuildings.join(', ') : 'Не указаны' }}
          </p>
        </div>
      </div>
      
      <div class="mb-4">
        <p class="text-sm text-gray-500 mb-1">Стоимость участия:</p>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <p class="text-xs text-gray-500">Взрослый:</p>
            <p class="text-sm font-medium">{{ formatPrice(festival.adultPrice) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Подросток:</p>
            <p class="text-sm font-medium">{{ formatPrice(festival.teenPrice) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Ребенок:</p>
            <p class="text-sm font-medium">{{ formatPrice(festival.childPrice) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Животное:</p>
            <p class="text-sm font-medium">{{ formatPrice(festival.petPrice) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Автомобиль:</p>
            <p class="text-sm font-medium">{{ formatPrice(festival.carPrice) }}</p>
          </div>
        </div>
      </div>
      
      <div v-if="departments.length > 0" class="mb-4">
        <p class="text-sm text-gray-500 mb-1">Департаменты:</p>
        <div class="flex flex-wrap gap-1">
          <span 
            v-for="dept in departments" 
            :key="dept.id"
            class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
          >
            {{ dept.title }}
          </span>
        </div>
      </div>
      
      <div v-if="festival.announcementText" class="mt-4">
        <p class="text-sm text-gray-500 mb-1">Анонс:</p>
        <p class="text-sm text-gray-700 line-clamp-3">{{ festival.announcementText }}</p>
      </div>
    </div>
  </div>
</template>