<script setup lang="ts">
import Loader from '~/components/ui/Loader.vue';

const emit = defineEmits(['success', 'error', 'close', 'logout']);

const { signOut } = useAuth();
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const errors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  general: ''
});

// Валидация формы
const validateForm = () => {
  let isValid = true;
  errors.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    general: ''
  };

  if (!currentPassword.value) {
    errors.value.currentPassword = 'Введите текущий пароль';
    isValid = false;
  }

  if (!newPassword.value) {
    errors.value.newPassword = 'Введите новый пароль';
    isValid = false;
  } else if (newPassword.value.length < 8) {
    errors.value.newPassword = 'Пароль должен содержать не менее 8 символов';
    isValid = false;
  }

  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'Подтвердите новый пароль';
    isValid = false;
  } else if (newPassword.value !== confirmPassword.value) {
    errors.value.confirmPassword = 'Пароли не совпадают';
    isValid = false;
  }

  return isValid;
};

// Отправка формы
const submitForm = async () => {
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;
  errors.value.general = '';

  try {
    await $fetch('/api/user/change-password', {
      method: 'POST',
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      }
    });

    // Очищаем форму
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';

    // Уведомляем родительский компонент об успешной смене пароля
    emit('success', 'Пароль успешно изменен. Вам нужно будет заново авторизоваться.');
    
    // Закрываем модальное окно
    emit('close');
    
    // Выходим из системы через 2 секунды
    setTimeout(async () => {
      await signOut({ redirect: true, callbackUrl: '/' });
    }, 2000);
  } catch (error: any) {
    console.error('Ошибка при смене пароля:', error);
    
    // Обрабатываем различные ошибки
    if (error.data?.code === 'INVALID_CURRENT_PASSWORD') {
      errors.value.currentPassword = 'Неверный текущий пароль';
    } else {
      errors.value.general = error.data?.message || 'Ошибка при смене пароля';
    }
    
    emit('error', errors.value.general || 'Ошибка при смене пароля');
  } finally {
    isLoading.value = false;
  }
};

// Отмена и закрытие формы
const cancel = () => {
  emit('close');
};
</script>

<template>
  <form @submit.prevent="submitForm" class="space-y-4">
    <!-- Общая ошибка -->
    <div v-if="errors.general" class="p-3 bg-red-50 text-red-700 border border-red-200 rounded">
      {{ errors.general }}
    </div>
    
    <!-- Текущий пароль -->
    <div>
      <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
      <input
        id="currentPassword"
        v-model="currentPassword"
        type="password"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        :class="{ 'border-red-500': errors.currentPassword }"
        autocomplete="current-password"
      />
      <p v-if="errors.currentPassword" class="mt-1 text-sm text-red-600">{{ errors.currentPassword }}</p>
    </div>
    
    <!-- Новый пароль -->
    <div>
      <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
      <input
        id="newPassword"
        v-model="newPassword"
        type="password"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        :class="{ 'border-red-500': errors.newPassword }"
        autocomplete="new-password"
      />
      <p v-if="errors.newPassword" class="mt-1 text-sm text-red-600">{{ errors.newPassword }}</p>
      <p v-else class="mt-1 text-sm text-gray-500">Минимум 8 символов</p>
    </div>
    
    <!-- Подтверждение пароля -->
    <div>
      <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Подтверждение пароля</label>
      <input
        id="confirmPassword"
        v-model="confirmPassword"
        type="password"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        :class="{ 'border-red-500': errors.confirmPassword }"
        autocomplete="new-password"
      />
      <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-600">{{ errors.confirmPassword }}</p>
    </div>
    
    <!-- Кнопки -->
    <div class="flex justify-end space-x-3 pt-4">
      <button
        type="button"
        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        @click="cancel"
        :disabled="isLoading"
      >
        Отмена
      </button>
      
      <button
        type="submit"
        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[120px] h-10 flex items-center justify-center"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="flex items-center">
          <Loader size="sm" class="mr-2" />
          <span>Сохранение...</span>
        </span>
        <span v-else>Сохранить</span>
      </button>
    </div>
  </form>
</template> 