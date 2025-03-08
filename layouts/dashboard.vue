<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 class="text-xl font-bold text-gray-900">Крымский Вайшнавский Фестиваль</h1>
        <div class="flex items-center space-x-4">
          <NuxtLink to="/dashboard" class="text-gray-700 hover:text-blue-600">Личный кабинет</NuxtLink>
          <button 
            @click="handleSignOut" 
            class="text-red-600 hover:text-red-800"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup>
const { signOut } = useAuth();
const router = useRouter();

async function handleSignOut() {
  await signOut({ redirect: false });
  router.push('/');
}
</script> 