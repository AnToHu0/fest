<script setup lang="ts">
import type { Festival, FestivalDepartment } from '~/types/festival';
import type { FestivalRegistrationFormData } from '~/types/registration';
import FestivalCard from '~/components/user/FestivalCard.vue';
import FestivalRegistrationForm from '~/components/user/FestivalRegistrationForm.vue';
import FestivalRegistrationSuccess from '~/components/user/FestivalRegistrationSuccess.vue';
import FestivalViewModal from '~/components/user/FestivalViewModal.vue';
import Loader from '~/components/ui/Loader.vue';
import Modal from '~/components/ui/Modal.vue';

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

// Состояние модальных окон
const showRegistrationForm = ref(false);
const showSuccessModal = ref(false);
const showViewModal = ref(false);
const currentFestival = ref<Festival | null>(null);
const selectedDepartments = ref<FestivalDepartment[]>([]);

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

// Обработчик нажатия на кнопку "Участвовать"
const handleParticipate = (id: number) => {
  const festival = festivals.value.find(f => f.id === id);
  if (festival) {
    console.log('Selected festival for registration:', festival);
    console.log('Festival departments:', festival.Departments || festival.departments);
    currentFestival.value = festival;
    showRegistrationForm.value = true;
  }
};

// Обработчик нажатия на кнопку "Посмотреть"
const handleView = (id: number) => {
  const festival = festivals.value.find(f => f.id === id);
  if (festival) {
    currentFestival.value = festival;
    showViewModal.value = true;
  }
};

// Обработчик закрытия формы регистрации
const handleCloseRegistrationForm = () => {
  showRegistrationForm.value = false;
  currentFestival.value = null;
};

// Обработчик отправки формы регистрации
const handleSubmitRegistration = async (formData: FestivalRegistrationFormData) => {
  isLoading.value = true;
  try {
    const response = await $fetch('/api/festivals/register', {
      method: 'POST',
      body: {
        ...formData,
        festivalId: currentFestival.value?.id
      }
    });
    
    if (response.success) {
      // Сохраняем информацию о выбранных департаментах для отображения в окне успешной регистрации
      selectedDepartments.value = response.departments || [];
      
      // Закрываем форму регистрации и показываем окно успешной регистрации
      showRegistrationForm.value = false;
      showSuccessModal.value = true;
      
      // Обновляем список фестивалей, чтобы отразить регистрацию
      refreshNuxtData('user-festivals-data');
    }
  } catch (error: any) {
    console.error('Ошибка при регистрации на фестиваль:', error);
    alert(error.data?.message || 'Произошла ошибка при регистрации на фестиваль');
  } finally {
    isLoading.value = false;
  }
};

// Обработчик закрытия окна успешной регистрации
const handleCloseSuccessModal = () => {
  showSuccessModal.value = false;
  currentFestival.value = null;
  selectedDepartments.value = [];
};

// Обработчик закрытия окна просмотра фестиваля
const handleCloseViewModal = () => {
  showViewModal.value = false;
  currentFestival.value = null;
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
    
    <!-- Форма регистрации на фестиваль -->
    <Modal
      v-if="showRegistrationForm && currentFestival"
      :title="`Регистрация на фестиваль ${currentFestival.year}`"
      @close="handleCloseRegistrationForm"
      size="xl"
    >
      <FestivalRegistrationForm 
        :festival="currentFestival"
        @close="handleCloseRegistrationForm"
        @submit="handleSubmitRegistration"
      />
    </Modal>
    
    <!-- Окно успешной регистрации -->
    <Modal
      v-if="showSuccessModal && currentFestival"
      title="Регистрация успешно завершена!"
      @close="handleCloseSuccessModal"
      size="lg"
    >
      <FestivalRegistrationSuccess 
        :festival="currentFestival"
        :departments="selectedDepartments"
        @close="handleCloseSuccessModal"
      />
    </Modal>
    
    <!-- Окно просмотра информации о фестивале -->
    <Modal
      v-if="showViewModal && currentFestival"
      :title="`Фестиваль ${currentFestival.year}`"
      @close="handleCloseViewModal"
      size="xl"
    >
      <FestivalViewModal
        :festival="currentFestival"
        @close="handleCloseViewModal"
      />
    </Modal>
  </div>
</template> 