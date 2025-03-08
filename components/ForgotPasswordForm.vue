<script lang="ts" setup>
const email = ref('');
const isLoading = ref(false);
const error = ref('');
const successMessage = ref('');
const requestSent = ref(false);

const emit = defineEmits(['back-to-login']);

async function handleSubmit() {
  if (!email.value) {
    error.value = 'Пожалуйста, введите email';
    return;
  }

  error.value = '';
  isLoading.value = true;

  try {
    const response = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value }
    });

    requestSent.value = true;
    successMessage.value = response.message || 'Инструкции по восстановлению пароля отправлены на ваш email';
  } catch (e: any) {
    error.value = e.data?.message || 'Произошла ошибка при отправке запроса';
  } finally {
    isLoading.value = false;
  }
}

function goBackToLogin() {
  emit('back-to-login');
}
</script>

<template>
  <div>
    <div v-if="requestSent" class="bg-green-50 p-6 rounded-lg border border-green-200">
      <div class="text-green-700 font-semibold text-lg mb-2">Запрос отправлен!</div>
      <p class="text-gray-700 mb-4">{{ successMessage }}</p>
      <div class="bg-yellow-50 p-4 rounded border border-yellow-200 text-yellow-800">
        <p class="font-medium mb-2">Что дальше?</p>
        <ol class="list-decimal list-inside space-y-2">
          <li>Проверьте вашу электронную почту ({{ email }})</li>
          <li>Найдите письмо с инструкциями по восстановлению пароля</li>
          <li>Нажмите на ссылку в письме и следуйте инструкциям</li>
        </ol>
      </div>
      <p class="mt-4 text-sm text-gray-600">Если вы не получили письмо, проверьте папку "Спам" или попробуйте снова.</p>
      <button 
        @click="goBackToLogin" 
        class="mt-4 text-blue-500 hover:text-blue-700"
      >
        Вернуться к форме входа
      </button>
    </div>
    
    <form v-else @submit.prevent="handleSubmit">
      <p class="mb-4 text-gray-600">Введите email, указанный при регистрации, и мы отправим вам инструкции по восстановлению пароля.</p>
      <input
        v-model="email"
        class="w-full border p-2 rounded-lg mb-4"
        type="email"
        placeholder="Email"
        required
      />
      <div v-if="error" class="text-sm text-left text-red-500 mb-4">{{ error }}</div>
      <div class="flex space-x-2">
        <button
          type="button"
          class="bg-gray-300 hover:bg-gray-400 transition-all duration-200 text-gray-800 rounded-lg py-2 px-4"
          @click="goBackToLogin"
        >
          Назад
        </button>
        <button
          type="submit"
          class="bg-blue-500 hover:bg-blue-600 transition-all duration-200 flex-1 text-blue-50 rounded-lg py-2 px-4"
          :disabled="isLoading"
          :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
        >
          {{ isLoading ? 'Отправка...' : 'Отправить' }}
        </button>
      </div>
    </form>
  </div>
</template> 