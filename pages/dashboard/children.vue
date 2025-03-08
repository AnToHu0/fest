<script setup lang="ts">
import ChildrenTable from '~/components/user/ChildrenTable.vue';
import type { User } from '~/types/user';
import { computed, onMounted } from 'vue';
import { useRoles } from '~/composables/useRoles';

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
});

const { data: session } = useAuth();
const user = computed(() => session.value?.user as unknown as User);
const { hasRole } = useRoles();

// Проверяем, есть ли у пользователя роль user
const canAccessChildren = computed(() => hasRole('user'));

// Если у пользователя нет роли user, перенаправляем его на главную страницу дашборда
onMounted(() => {
  if (!canAccessChildren.value) {
    navigateTo('/dashboard');
  }
});

// Заголовок страницы
useHead({
  title: 'Управление детьми - Личный кабинет'
});
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Управление детьми</h1>
      <p class="text-gray-600 mt-2">
        Здесь вы можете добавить информацию о ваших детях, которые будут участвовать в фестивале
      </p>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <ChildrenTable 
        v-if="user"
        :userId="user.id" 
        :parentData="user"
      />
      <div v-else class="py-8 text-center text-gray-500">
        Загрузка данных пользователя...
      </div>
    </div>
  </div>
</template> 