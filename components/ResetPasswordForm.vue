<script lang="ts" setup>
const props = defineProps({
  token: {
    type: String,
    required: true
  }
});

const form = ref({
  password: '',
  confirmPassword: ''
});

const isLoading = ref(false);
const error = ref('');
const successMessage = ref('');
const resetComplete = ref(false);

const emit = defineEmits(['reset-success']);

async function handleSubmit() {
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Пароли не совпадают';
    return;
  }

  if (form.value.password.length < 6) {
    error.value = 'Пароль должен содержать не менее 6 символов';
    return;
  }

  error.value = '';
  isLoading.value = true;

  try {
    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: props.token,
        password: form.value.password
      }
    });

    resetComplete.value = true;
    successMessage.value = response.message || 'Пароль успешно изменен';
    emit('reset-success');
  } catch (e: any) {
    error.value = e.data?.message || 'Произошла ошибка при сбросе пароля';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div>
    <h1 class="mb-4 text-xl font-bold">Сброс пароля</h1>
    
    <div v-if="resetComplete" class="bg-green-50 p-6 rounded-lg border border-green-200">
      <div class="text-green-700 font-semibold text-lg mb-2">Пароль успешно изменен!</div>
      <p class="text-gray-700 mb-4">{{ successMessage }}</p>
      <p>Теперь вы можете войти в систему, используя новый пароль.</p>
    </div>
    
    <form v-else @submit.prevent="handleSubmit">
      <p class="mb-4 text-gray-600">Введите новый пароль для вашей учетной записи.</p>
      <input
        v-model="form.password"
        class="w-full border p-2 rounded-lg mb-4"
        type="password"
        placeholder="Новый пароль"
        required
      />
      <input
        v-model="form.confirmPassword"
        class="w-full border p-2 rounded-lg mb-4"
        type="password"
        placeholder="Подтвердите пароль"
        required
      />
      <div v-if="error" class="text-sm text-left text-red-500 mb-4">{{ error }}</div>
      <button
        type="submit"
        class="bg-blue-500 hover:bg-blue-600 transition-all duration-200 w-full text-blue-50 rounded-lg py-2 px-4"
        :disabled="isLoading"
        :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
      >
        {{ isLoading ? 'Сохранение...' : 'Сохранить новый пароль' }}
      </button>
    </form>
  </div>
</template> 