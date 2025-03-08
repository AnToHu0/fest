<script setup lang="ts">
import Loader from '~/components/ui/Loader.vue';
import type { User } from '~/types/user';

interface MenuItem {
  path?: string;
  label: string;
  icon?: string;
  roles?: string[];
  type?: 'link' | 'divider';
}

const { data: session, status, signOut } = useAuth();
const { hasRole } = useRoles();
const route = useRoute();
const router = useRouter();

// Проверка загрузки данных
const isLoading = computed(() => status.value === 'loading');

// Получаем данные пользователя
const user = computed(() => session.value?.user as unknown as User);

// Определяем пункты меню с иконками и правами доступа
const menuItems = computed((): MenuItem[] => {
  const items: MenuItem[] = [
    { 
      path: '/dashboard', 
      label: 'Главная',
      icon: 'mdi:home',
      roles: ['user', 'admin'],
      type: 'link'
    }
  ];

  // Добавляем пункты меню для обычного пользователя
  if (hasRole('user')) {
    items.push(
      { 
        path: '/dashboard/profile', 
        label: 'Профиль',
        icon: 'mdi:account',
        roles: ['user'],
        type: 'link'
      },
      { 
        path: '/dashboard/children', 
        label: 'Дети',
        icon: 'mdi:account-child',
        roles: ['user'],
        type: 'link'
      },
      { 
        path: '/dashboard/festivals', 
        label: 'Фестивали',
        icon: 'mdi:calendar',
        roles: ['user'],
        type: 'link'
      }
    );
  }

  // Добавляем пункты меню для администратора
  if (hasRole('admin')) {
    items.push(
      {
        type: 'divider',
        label: 'Администрирование'
      },
      {
        path: '/dashboard/admin/users',
        label: 'Пользователи',
        icon: 'mdi:account-group',
        roles: ['admin'],
        type: 'link'
      },
      {
        path: '/dashboard/admin/payments',
        label: 'Платежи',
        icon: 'mdi:currency-usd',
        roles: ['admin'],
        type: 'link'
      },
      {
        path: '/dashboard/admin/festivals',
        label: 'Управление фестивалями',
        icon: 'mdi:calendar-edit',
        roles: ['admin'],
        type: 'link'
      },
      {
        path: '/dashboard/admin/departments',
        label: 'Департаменты',
        icon: 'mdi:domain',
        roles: ['admin'],
        type: 'link'
      },
      {
        path: '/dashboard/admin/accommodation',
        label: 'Размещение',
        icon: 'mdi:bed',
        roles: ['admin'],
        type: 'link'
      }
    );
  }

  return items;
});

// Функция для выхода из системы
const handleSignOut = async () => {
  await signOut({ redirect: true, callbackUrl: '/' });
};
</script>

<template>
  <aside class="bg-white shadow-lg w-64 min-h-screen fixed left-0 top-0 z-10">
    <div class="p-4">
      <div class="flex items-center justify-center mb-8">
        <img src="/img/logo.png" alt="Логотип" class="h-12">
      </div>

      <div v-if="isLoading" class="flex justify-center py-4">
        <Loader />
      </div>
      
      <nav v-else class="space-y-1">
        <template v-for="(item, index) in menuItems" :key="index">
          <!-- Разделитель -->
          <div 
            v-if="item.type === 'divider'" 
            class="pt-4 pb-2"
          >
            <p class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {{ item.label }}
            </p>
          </div>

          <!-- Пункт меню -->
          <NuxtLink
            v-else
            :to="item.path!"
            class="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            :class="{ 'bg-gray-100': route.path === item.path }"
          >
            <Icon :name="item.icon!" class="w-5 h-5 mr-3" />
            {{ item.label }}
          </NuxtLink>
        </template>
      </nav>
    </div>

    <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
      <button
        @click="handleSignOut"
        class="flex items-center w-full px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
      >
        <Icon name="mdi:logout" class="w-5 h-5 mr-3" />
        Выйти
      </button>
    </div>
  </aside>
</template>

<style scoped>
.router-link-active {
  @apply bg-gray-100;
}
</style> 