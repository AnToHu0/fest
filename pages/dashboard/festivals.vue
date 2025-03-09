<script setup lang="ts">
import type { Festival } from '~/types/festival';
import FestivalCard from '~/components/user/FestivalCard.vue';
import Loader from '~/components/ui/Loader.vue';

definePageMeta({
  middleware: "auth",
  layout: "dashboard"
});

const { hasRole } = useRoles();

// Проверяем, есть ли у пользователя роль user
const canAccess = computed(() => hasRole('user'));

// Если у пользователя нет роли user, перенаправляем его на главную страницу дашборда
onMounted(() => {
  if (!canAccess.value) {
    navigateTo('/dashboard');
  }
});

// Состояние страницы
const isLoading = ref(false);
const festivals = ref<Festival[]>([]);
const activeFestivals = computed(() => festivals.value.filter(f => f.isActive));
const pastFestivals = computed(() => festivals.value.filter(f => !f.isActive));

// Загрузка данных фестивалей
const { data: festivalsData, pending: festivalsLoading } = await useFetch('/api/festivals', {
  key: 'user-festivals-data',
  server: true,
  lazy: false
});

// Обновляем состояние на основе полученных данных
watch(festivalsData, (newData) => {
  if (newData?.success && newData.festivals) {
    festivals.value = newData.festivals;
  }
}, { immediate: true });

// Отслеживаем состояние загрузки
watch(festivalsLoading, (loading) => {
  isLoading.value = loading;
}, { immediate: true });

// Обработчики событий
const handleParticipate = (id: number) => {
  // Функционал будет реализован позже
  alert(`Функционал участия в фестивале ${id} будет реализован позже`);
};

const handleView = (id: number) => {
  // Функционал будет реализован позже
  alert(`Функционал просмотра фестиваля ${id} будет реализован позже`);
};
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Фестивали</h1>
      <p class="text-gray-600 mt-1">Просмотр доступных фестивалей и регистрация на участие</p>
    </div>
    
    <div v-if="isLoading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="festivals.length === 0" class="bg-white rounded-lg shadow p-6 text-center">
      <Icon name="mdi:calendar-blank" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">Нет доступных фестивалей</h3>
      <p class="text-gray-500">В настоящее время нет запланированных фестивалей</p>
    </div>
    
    <div v-else>
      <!-- Активные фестивали -->
      <div v-if="activeFestivals.length > 0" class="mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Активные фестивали</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FestivalCard 
            v-for="festival in activeFestivals" 
            :key="festival.id" 
            :festival="festival"
            @participate="handleParticipate"
            @view="handleView"
          />
        </div>
      </div>
      
      <!-- Прошедшие фестивали -->
      <div v-if="pastFestivals.length > 0">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Прошедшие и планируемые фестивали</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FestivalCard 
            v-for="festival in pastFestivals" 
            :key="festival.id" 
            :festival="festival"
            @participate="handleParticipate"
            @view="handleView"
          />
        </div>
      </div>
    </div>
  </div>
</template> 