<script lang="ts" setup>
const form = ref({
  email: "",
  fullName: "",
  password: "",
});
const regError = ref('')

const isLoading = ref(false);

async function handleFormSubmit() {
  try {
    isLoading.value = true;
    const { data, status, error } = await useFetch("/api/auth/register", {
      method: "POST",
      body: form.value,
    });
    if (error.value) {
      console.log(error.value.data.message)
      regError.value = error.value.data.message
    } else {
      useRouter().push({
        name: "login",
      });
    }
  } catch (e: any) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
}
</script>
<template>
  <div>
    <h1 class="mb-4 text-xl font-bold">Регистрация</h1>
    <form @submit.prevent="handleFormSubmit">
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
          'opcatiy-20 cursor-not-allowed': isLoading,
        }"
      >
        Зарегистрироваться
      </button>
    </form>
  </div>
</template>

<style></style>
