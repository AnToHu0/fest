<script lang="ts" setup>
definePageMeta({
  middleware: "auth",
});

const { data } = useAuth();
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Личный кабинет</h1>
    <p class="mb-4">Это защищенная страница, доступная только авторизованным пользователям.</p>
    
    <div class="bg-gray-100 p-4 rounded-lg mb-4">
      <h2 class="text-lg font-semibold mb-2">Информация о пользователе</h2>
      <p><strong>Имя:</strong> {{ (data?.user as any)?.fullName }}</p>
      <p><strong>Email:</strong> {{ (data?.user as any)?.email }}</p>
    </div>
    
    <NuxtLink to="/" class="text-blue-500 hover:underline">
      Вернуться на главную
    </NuxtLink>
  </div>
</template> 