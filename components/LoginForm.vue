<script lang="ts" setup>
const form = ref({
  email: "",
  password: "",
});

const error = ref('')
const router = useRouter();

const { signIn } = useAuth();
const emit = defineEmits(['login-success', 'forgot-password', 'error-change']);

// Следим за изменением ошибки и уведомляем родительский компонент
watch(error, (newValue) => {
  emit('error-change', newValue);
  // Даем время для обновления DOM
  nextTick(() => {
    // Находим ближайший родительский элемент с классом form-wrapper
    const formWrapper = document.querySelector('.form-wrapper') as HTMLElement;
    if (formWrapper) {
      const activeForm = formWrapper.querySelector('.form-container');
      if (activeForm) {
        const height = activeForm.scrollHeight;
        formWrapper.style.height = `${height}px`;
      }
    }
  });
});

async function handleLogin() {
  try {
    const result = await signIn("credentials", { ...form.value, redirect: false }) as any;
    if (result?.error) {
      console.log(result.error)
      error.value = result.error
    } else {
      emit('login-success');
      // Перенаправляем пользователя в личный кабинет после успешной авторизации
      router.push('/dashboard');
    }
  } catch (e) {
    console.error(e)
  }
}

function handleForgotPassword() {
  emit('forgot-password', form.value.email);
}
</script>
<template>
  <div>
    <form @submit.prevent="handleLogin">
      <input
        v-model="form.email"
        class="w-full border p-2 rounded-lg mb-4"
        type="text"
        placeholder="Email"
      />
      <input
        v-model="form.password"
        class="w-full border p-2 rounded-lg mb-4"
        type="password"
        placeholder="Пароль"
      />
      
      <!-- Сообщение об ошибке отображается отдельно, перед кнопками -->
      <div v-if="error" class="text-sm text-left text-red-500 mb-3 p-2 bg-red-50 border border-red-200 rounded">
        {{ error }}
      </div>
      
      <div class="flex justify-between items-center mb-4">
        <div></div> <!-- Пустой div для сохранения выравнивания -->
        <button 
          type="button" 
          class="text-sm text-blue-500 hover:text-blue-700"
          @click="handleForgotPassword"
        >
          Забыли пароль?
        </button>
      </div>
      
      <button
        type="submit"
        class="bg-blue-500 hover:bg-blue-600 transition-all duration-200 w-full text-blue-50 rounded-lg p-2"
      >
        Войти
      </button>
    </form>
  </div>
</template> 