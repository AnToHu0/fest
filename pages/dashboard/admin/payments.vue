<script setup lang="ts">
definePageMeta({
  middleware: "auth",
  layout: "dashboard"
});

const { hasRole } = useRoles();

// Проверяем, есть ли у пользователя роль admin
const canAccess = computed(() => hasRole('admin'));

// Если у пользователя нет роли admin, перенаправляем его на главную страницу дашборда
onMounted(() => {
  if (!canAccess.value) {
    navigateTo('/dashboard');
  }
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Управление платежами</h1>
    <div class="bg-white rounded-lg shadow p-6">
      <p class="text-gray-500">Здесь будет интерфейс управления платежами</p>
    </div>
  </div>
</template> 