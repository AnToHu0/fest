<script lang="ts" setup>
const form = ref({
  email: "",
  password: "",
});

const error = ref('')

const { signIn } = useAuth();
const emit = defineEmits(['login-success', 'forgot-password']);

async function handleLogin() {
  try {
    const result = await signIn("credentials", { ...form.value, redirect: false });
    if (result.error) {
      console.log(result.error)
      error.value = result.error
    } else {
      emit('login-success');
    }
  } catch (e) {
    console.error(e)
  }
}

function handleForgotPassword() {
  emit('forgot-password', form.email);
}
</script>
<template>
  <div>
    <h1 class="mb-4 text-xl font-bold">Вход</h1>
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
      <div class="flex justify-between items-center mb-4">
        <div v-show='error' class="text-sm text-left text-red-500">{{ error }}</div>
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