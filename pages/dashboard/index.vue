<script lang="ts" setup>
definePageMeta({
  middleware: "auth",
  layout: "dashboard"
});

const { data } = useAuth();
const user = computed(() => data.value?.user as any);

// Получаем текущее время суток
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'утро';
  if (hour >= 12 && hour < 18) return 'день';
  if (hour >= 18 && hour < 23) return 'вечер';
  return 'ночь';
};

// Получаем имя пользователя для приветствия
const getUserName = () => {
  if (!user.value) return '';

  // Если есть духовное имя, используем его
  if (user.value.spiritualName) {
    return user.value.spiritualName;
  }

  // Иначе пытаемся получить имя из ФИО
  if (user.value.fullName) {
    const nameParts = user.value.fullName.split(' ');
    if (nameParts.length >= 2) {
      return nameParts[1]; // Имя обычно второй элемент в ФИО
    }
  }

  // Если ничего не нашли, возвращаем пустую строку
  return '';
};

// Приветствие в зависимости от времени суток
const greeting = computed(() => {
  const userName = getUserName();
  return userName ? `Добрый ${getTimeOfDay()}, ${userName}!` : `Добрый ${getTimeOfDay()}!`;
});

// Быстрые ссылки для навигации
const quickLinks = [
  {
    title: 'Профиль',
    description: 'Управление личными данными',
    icon: 'mdi:account',
    path: '/dashboard/profile',
    color: 'bg-blue-500'
  },
  {
    title: 'Фестивали',
    description: 'Информация о фестивалях',
    icon: 'mdi:calendar',
    path: '/dashboard/festivals',
    color: 'bg-green-500'
  }
];
</script>

<template>
  <div class="space-y-8">
    <!-- Логотип и приветствие -->
    <div class="text-center">
      <img src="/img/logo.png" alt="Крымский Вайшнавский Фестиваль" class="mx-auto mb-6 max-w-xs">
      <h1 class="text-2xl font-bold mb-2">{{ greeting }}</h1>
      <p class="text-gray-600">Добро пожаловать в личный кабинет Крымского Вайшнавского Фестиваля</p>
    </div>
    
    <!-- Быстрые ссылки -->
    <div>
      <h2 class="text-xl font-semibold mb-4">Быстрый доступ</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NuxtLink 
          v-for="link in quickLinks" 
          :key="link.path"
          :to="link.path" 
          class="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 cursor-pointer flex items-start"
        >
          <div :class="`${link.color} text-white p-3 rounded-lg mr-4 flex items-center justify-center`">
            <Icon :name="link.icon" class="h-5 w-5" />
          </div>
          <div>
            <h3 class="font-medium text-gray-900">{{ link.title }}</h3>
            <p class="text-sm text-gray-500">{{ link.description }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>
    
    <!-- Информация о фестивале -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center mb-4">
        <Icon name="mdi:calendar" class="h-5 w-5 text-blue-500 mr-2" />
        <h2 class="text-xl font-semibold">Ближайший фестиваль</h2>
      </div>
      <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p class="text-blue-700">Информация о ближайшем фестивале будет доступна в ближайшее время.</p>
      </div>
    </div>
  </div>
</template> 