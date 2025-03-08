<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "dashboard"
});

import Loader from '~/components/ui/Loader.vue';
import Modal from '~/components/ui/Modal.vue';
import ChangePasswordForm from '~/components/user/ChangePasswordForm.vue';

const { data } = useAuth();
const userData = ref<any>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const isSuccessVisible = ref(false);
const isChangePasswordModalOpen = ref(false);
const { hasRole } = useRoles();

// Проверяем, есть ли у пользователя роль user
const canEditProfile = computed(() => hasRole('user'));

// Форматирование телефона
const formatPhone = (value: string) => {
  if (!value) return '';

  const startsWithPlus7 = value.startsWith('+7');

  let digits = value.replace(/\D/g, '');

  if (startsWithPlus7 && digits.startsWith('7')) {
    digits = digits.substring(1);
  }

  if (!digits.length) return '+7';

  if (digits.length <= 3) {
    return `+7 (${digits}`;
  } else if (digits.length <= 6) {
    return `+7 (${digits.substring(0, 3)}) ${digits.substring(3)}`;
  } else if (digits.length <= 8) {
    return `+7 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  } else {
    return `+7 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`;
  }
};

// Обработчик ввода телефона
const handlePhoneInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const cursorPosition = input.selectionStart;
  const oldValue = input.value;
  const newValue = formatPhone(input.value);

  userData.value.phone = newValue;

  nextTick(() => {
    if (cursorPosition !== null) {
      let newCursorPosition = cursorPosition + (newValue.length - oldValue.length);

      if (newCursorPosition > 2 && newCursorPosition < 4 && newValue.length >= 4) {
        newCursorPosition = 4;
      }

      input.setSelectionRange(newCursorPosition, newCursorPosition);
    }
  });
};

// Функция для отображения сообщения об успешном сохранении с автоматическим скрытием
const showSuccessMessage = (message: string) => {
  successMessage.value = message;
  isSuccessVisible.value = true;

  // Устанавливаем таймер для скрытия сообщения через 3 секунды
  setTimeout(() => {
    isSuccessVisible.value = false;

    // Очищаем сообщение после завершения анимации
    setTimeout(() => {
      if (!isSuccessVisible.value) {
        successMessage.value = '';
      }
    }, 300); // 300ms - длительность анимации
  }, 3000);
};

// Получение данных пользователя
const fetchUserData = async () => {
  isLoading.value = true;
  try {
    const response = await $fetch('/api/user/profile', {
      method: 'GET'
    });

    if (response) {
      userData.value = response;
    } else {
      console.error('API вернул пустой ответ');
      errorMessage.value = 'Ошибка при загрузке данных пользователя: пустой ответ от сервера';
    }
  } catch (error: any) {
    console.error('Ошибка при загрузке данных пользователя:', error);
    errorMessage.value = error.data?.message || 'Ошибка при загрузке данных пользователя';
  } finally {
    isLoading.value = false;
  }
};

// Сохранение данных пользователя
const saveUserData = async () => {
  isSaving.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  isSuccessVisible.value = false;

  try {
    const response = await $fetch('/api/user/profile', {
      method: 'PUT',
      body: userData.value
    });

    // Обновляем данные пользователя
    userData.value = response;

    // Показываем сообщение об успешном сохранении
    showSuccessMessage('Данные успешно сохранены');
  } catch (error: any) {
    errorMessage.value = error.data?.message || 'Ошибка при сохранении данных пользователя';
  } finally {
    isSaving.value = false;
  }
};

// Открытие модального окна для смены пароля
const openChangePasswordModal = () => {
  isChangePasswordModalOpen.value = true;
};

// Закрытие модального окна для смены пароля
const closeChangePasswordModal = () => {
  isChangePasswordModalOpen.value = false;
};

// Обработка успешной смены пароля
const handlePasswordChangeSuccess = (message: string) => {
  showSuccessMessage(message);
};

// Обработка ошибки при смене пароля
const handlePasswordChangeError = (message: string) => {
  errorMessage.value = message;
};

// Инициализация данных пользователя из сессии
onMounted(async () => {
  try {
    // Временно используем данные из сессии, пока не реализован API
    userData.value = {
      fullName: (data.value?.user as any)?.fullName || '',
      lastName: '',
      firstName: '',
      middleName: '',
      spiritualName: (data.value?.user as any)?.spiritualName || '',
      birthDate: (data.value?.user as any)?.birthDate ? new Date((data.value?.user as any)?.birthDate).toISOString().split('T')[0] : '',
      email: (data.value?.user as any)?.email || '',
      phone: (data.value?.user as any)?.phone || '',
      city: (data.value?.user as any)?.city || ''
    };

    // Разбиваем полное имя на составляющие, если они не заполнены
    if (userData.value.fullName && (!userData.value.lastName || !userData.value.firstName)) {
      const nameParts = userData.value.fullName.split(' ');
      if (nameParts.length >= 1) userData.value.lastName = nameParts[0];
      if (nameParts.length >= 2) userData.value.firstName = nameParts[1];
      if (nameParts.length >= 3) userData.value.middleName = nameParts[2];
    }

    // Загружаем данные с сервера
    await fetchUserData();

    // Если у пользователя нет роли user, перенаправляем его на главную страницу дашборда
    if (!canEditProfile.value) {
      navigateTo('/dashboard');
    }
  } catch (error) {
    console.error('Ошибка при инициализации данных пользователя:', error);
    errorMessage.value = 'Ошибка при инициализации данных пользователя';
  }
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Профиль пользователя</h1>
    
    <div v-if="isLoading">
      <Loader />
    </div>
    
    <div v-else-if="userData">
      <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-300"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div 
          v-if="successMessage && isSuccessVisible" 
          class="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded"
        >
          {{ successMessage }}
        </div>
      </Transition>
      
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
        {{ errorMessage }}
      </div>
      
      <form @submit.prevent="saveUserData" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
            <input
              id="lastName"
              v-model="userData.lastName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">Имя</label>
            <input
              id="firstName"
              v-model="userData.firstName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label for="middleName" class="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
            <input
              id="middleName"
              v-model="userData.middleName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="spiritualName" class="block text-sm font-medium text-gray-700 mb-1">Духовное имя</label>
            <input
              id="spiritualName"
              v-model="userData.spiritualName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label for="birthDate" class="block text-sm font-medium text-gray-700 mb-1">Дата рождения</label>
            <input
              id="birthDate"
              v-model="userData.birthDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label for="city" class="block text-sm font-medium text-gray-700 mb-1">Город</label>
            <input
              id="city"
              v-model="userData.city"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              v-model="userData.email"
              type="email"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              readonly
            />
            <p class="mt-1 text-sm text-gray-500">Email нельзя изменить</p>
          </div>
          
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
            <input
              id="phone"
              v-model="userData.phone"
              type="tel"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="+7 (___) ___-__-__"
              @input="handlePhoneInput"
              required
            />
          </div>
        </div>
        
        <div class="flex justify-end">
          <button
            type="submit"
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[120px] h-10 flex items-center justify-center"
            :disabled="isSaving"
          >
            <span v-if="isSaving" class="flex items-center">
              <Loader size="sm" class="mr-2" />
              <span>Сохранение...</span>
            </span>
            <span v-else>Сохранить</span>
          </button>
        </div>
      </form>
      
      <div class="mt-8 pt-6 border-t border-gray-200">
        <h2 class="text-xl font-semibold mb-4">Смена пароля</h2>
        <div class="flex">
          <button
            type="button"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            @click="openChangePasswordModal"
          >
            Сменить пароль
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="py-10 text-center text-red-600">
      Не удалось загрузить данные пользователя. Пожалуйста, обновите страницу или попробуйте позже.
    </div>
    
    <!-- Модальное окно для смены пароля -->
    <Modal
      v-if="isChangePasswordModalOpen"
      title="Смена пароля"
      @close="closeChangePasswordModal"
    >
      <ChangePasswordForm
        @success="handlePasswordChangeSuccess"
        @error="handlePasswordChangeError"
        @close="closeChangePasswordModal"
      />
    </Modal>
  </div>
</template> 