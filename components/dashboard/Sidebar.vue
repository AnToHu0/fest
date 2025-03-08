<script setup lang="ts">
import Loader from '~/components/ui/Loader.vue';
import type { User } from '~/types/user';

const { data: session, status, signOut } = useAuth();
const route = useRoute();
const router = useRouter();

// Проверка загрузки данных
const isLoading = computed(() => status.value === 'loading');

// Получаем данные пользователя
const user = computed(() => session.value?.user as unknown as User);

// Определяем пункты меню с иконками
const menuItems = [
  { 
    path: '/dashboard', 
    label: 'Главная',
    icon: 'mdi:home'
  },
  { 
    path: '/dashboard/profile', 
    label: 'Профиль',
    icon: 'mdi:account'
  },
  { 
    path: '/dashboard/children', 
    label: 'Дети',
    icon: 'mdi:account-child'
  },
  { 
    path: '/dashboard/events', 
    label: 'Мероприятия',
    icon: 'mdi:calendar'
  }
];

// Функция для выхода из системы
const handleSignOut = async () => {
  await signOut({ redirect: true, callbackUrl: '/' });
};
</script>

<template>
  <aside class="w-full md:w-64 mb-6 md:mb-0 md:mr-8">
    <div class="bg-white rounded-lg shadow p-4">
      <!-- Информация о пользователе -->
      <div class="mb-4 pb-3 border-b border-gray-200">
        <div v-if="isLoading" class="py-2">
          <Loader size="sm" />
        </div>
        <template v-else>
          <div class="font-medium text-gray-700">{{ user?.fullName }}</div>
          <div class="text-sm text-gray-500">{{ user?.email }}</div>
        </template>
      </div>
      
      <!-- Навигационное меню -->
      <nav class="space-y-1">
        <NuxtLink 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path" 
          class="block px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center"
          :class="route.path === item.path ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'"
        >
          <Icon 
            :name="item.icon" 
            class="mr-3 h-4 w-4" 
            :class="route.path === item.path ? 'text-blue-500' : 'text-gray-400'"
          />
          <span>{{ item.label }}</span>
        </NuxtLink>
        
        <!-- Кнопка выхода -->
        <a 
          href="javascript:void(0)" 
          @click="handleSignOut"
          class="block px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center text-red-600 hover:bg-red-50"
        >
          <Icon 
            name="mdi:logout" 
            class="mr-3 h-4 w-4 text-red-500" 
          />
          <span>Выйти</span>
        </a>
      </nav>
    </div>
  </aside>
</template> 