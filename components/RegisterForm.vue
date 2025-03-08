<script lang="ts" setup>
const form = ref({
  email: "",
  fullName: "",
  password: "",
});
const regError = ref('');
const successMessage = ref('');
const registrationComplete = ref(false);

const isLoading = ref(false);
const emit = defineEmits(['register-success']);

async function handleFormSubmit() {
  try {
    isLoading.value = true;

    try {
      const response = await $fetch("/api/auth/register", {
        method: "POST",
        body: form.value,
      });

      successMessage.value = response.message;
      registrationComplete.value = true;
      emit('register-success');
    } catch (error: any) {
      regError.value = error.data?.message || 'Ошибка при регистрации';
    }
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}
</script>
<template>
  <div>
    <div v-if="registrationComplete" class="bg-green-50 p-6 rounded-lg border border-green-200">
      <div class="text-green-700 font-semibold text-lg mb-2">Регистрация успешно завершена!</div>
      <p class="text-gray-700 mb-4">{{ successMessage }}</p>
      <div class="bg-yellow-50 p-4 rounded border border-yellow-200 text-yellow-800">
        <p class="font-medium mb-2">Что дальше?</p>
        <ol class="list-decimal list-inside space-y-2">
          <li>Проверьте вашу электронную почту ({{ form.email }})</li>
          <li>Найдите письмо с темой "Спасибо за регистрацию на сайте Крымского Вайшнавского Фестиваля"</li>
          <li>Нажмите на кнопку "Подтвердить регистрацию" в письме</li>
        </ol>
      </div>
      <p class="mt-4 text-sm text-gray-600">Если вы не получили письмо, проверьте папку "Спам" или попробуйте зарегистрироваться снова с другим email-адресом.</p>
    </div>
    
    <form v-else @submit.prevent="handleFormSubmit">
      <input
        v-model="form.email"
        class="w-full border p-2 rounded-lg mb-4"
        type="email"
        placeholder="Email"
      />
      <input
        v-model="form.fullName"
        class="w-full border p-2 rounded-lg mb-4"
        type="text"
        placeholder="Ваше имя"
      />
      <input
        v-model="form.password"
        class="w-full border p-2 rounded-lg mb-4"
        type="password"
        placeholder="Пароль"
      />
      <div v-show='regError' class="text-sm text-left text-red-500 mb-3">{{ regError }}</div>
      <button
        :disabled="isLoading"
        type="submit"
        class="bg-blue-500 hover:bg-blue-600 transition-all duration-200 w-full text-blue-50 rounded-lg p-2"
        :class="{
          'opacity-50 cursor-not-allowed': isLoading,
        }"
      >
        {{ isLoading ? 'Регистрация...' : 'Зарегистрироваться' }}
      </button>
    </form>
  </div>
</template> 