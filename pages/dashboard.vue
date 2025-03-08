<script lang="ts" setup>
definePageMeta({
  middleware: "auth",
  layout: "dashboard"
});

const { data } = useAuth();
const user = computed(() => data.value?.user as any);
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Личный кабинет</h1>
    <p class="mb-4">Добро пожаловать в личный кабинет участника Крымского Вайшнавского Фестиваля!</p>
    
    <div class="bg-white p-4 rounded-lg shadow mb-4">
      <h2 class="text-lg font-semibold mb-2">Информация о пользователе</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <p><strong>Имя:</strong> {{ user?.fullName }}</p>
          <p><strong>Email:</strong> {{ user?.email }}</p>
          <p v-if="user?.spiritualName"><strong>Духовное имя:</strong> {{ user?.spiritualName }}</p>
        </div>
        <div>
          <p v-if="user?.phone"><strong>Телефон:</strong> {{ user?.phone }}</p>
          <p v-if="user?.city"><strong>Город:</strong> {{ user?.city }}</p>
          <p v-if="user?.birthDate"><strong>Дата рождения:</strong> {{ new Date(user?.birthDate).toLocaleDateString() }}</p>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-2">Мои регистрации</h2>
        <p class="text-gray-600">У вас пока нет активных регистраций на мероприятия.</p>
        <button class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Зарегистрироваться на мероприятие
        </button>
      </div>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-2">Мои платежи</h2>
        <p class="text-gray-600">У вас пока нет платежей.</p>
      </div>
    </div>
  </div>
</template> 