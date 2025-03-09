<script setup lang="ts">
import type { Festival, FestivalDepartment } from '~/types/festival';
import type { FestivalRegistration } from '~/types/registration';
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  festival: Festival;
}>();

const emit = defineEmits<{
  close: [];
}>();

const modalRef = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const registration = ref<FestivalRegistration | null>(null);
const departments = ref<FestivalDepartment[]>([]);

// Обработчик закрытия окна
const handleClose = () => {
  emit('close');
};

// Обработчик клика вне модального окна
const handleClickOutside = (event: MouseEvent) => {
  if (modalRef.value && !modalRef.value.contains(event.target as Node)) {
    handleClose();
  }
};

// Загрузка данных о регистрации пользователя
const fetchRegistrationData = async () => {
  if (!props.festival || !props.festival.id) return;
  
  isLoading.value = true;
  try {
    const response = await $fetch(`/api/festivals/${props.festival.id}/registration`);
    if (response.success) {
      registration.value = response.registration;
      departments.value = response.departments || [];
    } else {
      registration.value = null;
      departments.value = [];
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных о регистрации:', error);
    registration.value = null;
    departments.value = [];
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

// Добавляем и удаляем обработчик клика при монтировании/размонтировании компонента
onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  if (props.isOpen) {
    fetchRegistrationData();
  }
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

// Загружаем данные при открытии модального окна
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    fetchRegistrationData();
  }
});
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div ref="modalRef" class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-800">
            Фестиваль {{ festival.year }}
          </h2>
          <button @click="handleClose" class="text-gray-500 hover:text-gray-700">
            <Icon name="mdi:close" class="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div class="p-6">
        <!-- Загрузка -->
        <div v-if="isLoading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        
        <div v-else>
          <!-- Анонс фестиваля -->
          <div class="mb-6 p-4 bg-purple-50 rounded-lg">
            <h3 class="text-lg font-medium text-purple-800 mb-2">Информация о фестивале</h3>
            <p class="text-sm text-gray-700 mb-2">
              <span class="font-medium">Даты проведения:</span> 
              {{ formatDate(festival.startDate) }} - 
              {{ formatDate(festival.endDate) }}
            </p>
            <p v-if="festival.announcementText" class="text-sm text-gray-700">
              {{ festival.announcementText }}
            </p>
          </div>
          
          <!-- Информация о регистрации пользователя -->
          <div v-if="registration" class="mb-6">
            <h3 class="text-lg font-medium text-gray-800 mb-3">Ваша регистрация</h3>
            
            <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p class="text-sm text-gray-600 mb-1">Дата заезда:</p>
                  <p class="font-medium">{{ formatDate(registration.arrivalDate) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 mb-1">Дата выезда:</p>
                  <p class="font-medium">{{ formatDate(registration.departureDate) }}</p>
                </div>
              </div>
              
              <div class="mb-4">
                <p class="text-sm text-gray-600 mb-1">Транспорт:</p>
                <p v-if="registration.hasCar" class="font-medium">
                  Приезжает на автомобиле
                  <span v-if="registration.freeSeatsInCar > 0">
                    (свободных мест: {{ registration.freeSeatsInCar }})
                  </span>
                </p>
                <p v-else class="font-medium">Без автомобиля</p>
              </div>
              
              <div v-if="registration.hasPet" class="mb-4">
                <p class="text-sm text-gray-600 mb-1">Домашние животные:</p>
                <p class="font-medium">Приезжает с домашним животным</p>
              </div>
              
              <div v-if="departments.length > 0" class="mb-4">
                <p class="text-sm text-gray-600 mb-1">Выбранные департаменты:</p>
                <div class="flex flex-wrap gap-2 mt-1">
                  <span 
                    v-for="dept in departments" 
                    :key="dept.id"
                    class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {{ dept.title }}
                  </span>
                </div>
              </div>
              
              <div v-if="registration.children && registration.children.length > 0" class="mb-4">
                <p class="text-sm text-gray-600 mb-1">Дети:</p>
                <ul class="list-disc list-inside">
                  <li v-for="child in registration.children" :key="child.id" class="text-sm">
                    {{ child.fullName }}
                    <span v-if="child.needsSeparateBed" class="text-gray-500">(отдельная кровать)</span>
                  </li>
                </ul>
              </div>
              
              <div v-if="registration.notes" class="mb-4">
                <p class="text-sm text-gray-600 mb-1">Дополнительные замечания:</p>
                <p class="text-sm">{{ registration.notes }}</p>
              </div>
            </div>
          </div>
          
          <!-- Раздел с оплатами (заглушка) -->
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-800 mb-3">Оплаты</h3>
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p class="text-gray-500">Информация об оплатах будет доступна позднее</p>
            </div>
          </div>
          
          <!-- Кнопка закрытия -->
          <div class="flex justify-end">
            <button 
              @click="handleClose"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 