<script lang="ts" setup>
definePageMeta({
  middleware: "guest",
});

const form = ref({
  email: "",
  password: "",
});

const error = ref('')

const { signIn } = useAuth();

async function handleLogin() {
  try {
    const result = await signIn("credentials", { ...form.value, redirect: false });
    if (result.error) {
      console.log(result.error)
      error.value = result.error
    } else {
      useRouter().push({
        name: "index",
      });
    }
  } catch (e) {
    console.error(e)
  }
}
</script>
<template>
  <div>
    <h1 class="mb-4 text-xl font-bold">Login</h1>
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
        placeholder="Password"
      />
      <div v-show='error' class="text-sm text-left text-red-500 mb-3">{{ error }}</div>
      <button
        type="submit"
        class="bg-blue-500 hover:bg-blue-600 transition-all duration-200 w-full text-blue-50 rounded-lg p-2"
      >
        Login
      </button>
    </form>
  </div>
</template>

<style></style>
