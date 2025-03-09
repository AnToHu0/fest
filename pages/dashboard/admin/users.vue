<script setup lang="ts">
import type { User } from '~/types/user';
import UsersTable from '~/components/admin/UsersTable.vue';

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

// Состояние таблицы
const users = ref<User[]>([]);
const isLoading = ref(false);
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0
});
const searchQuery = ref('');
const sortField = ref<string | undefined>(undefined);
const sortOrder = ref<'asc' | 'desc' | undefined>(undefined);

// Загрузка данных
const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const response = await $fetch<{
      users: User[];
      pagination: typeof pagination.value;
    }>('/api/admin/users', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.limit,
        search: searchQuery.value,
        sortField: sortField.value,
        sortOrder: sortOrder.value
      }
    });
    
    users.value = response.users;
    pagination.value = response.pagination;
  } catch (error: any) {
    console.error('Ошибка при загрузке пользователей:', error);
  } finally {
    isLoading.value = false;
  }
};

// Обработчики событий таблицы
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchUsers();
};

const handleLimitChange = (limit: number) => {
  pagination.value.limit = limit;
  pagination.value.page = 1; // Сбрасываем на первую страницу при изменении размера
  fetchUsers();
};

const handleSearchChange = (search: string) => {
  searchQuery.value = search;
  pagination.value.page = 1; // Сбрасываем на первую страницу при поиске
  fetchUsers();
};

const handleSortChange = (field: string, order: 'asc' | 'desc') => {
  sortField.value = field;
  sortOrder.value = order;
  pagination.value.page = 1; // Сбрасываем на первую страницу при изменении сортировки
  fetchUsers();
};

const handleUserDelete = async (user: User) => {
  try {
    await $fetch(`/api/admin/users/${user.id}`, {
      method: 'DELETE'
    });
    
    // Если на странице остался один пользователь и это не первая страница,
    // переходим на предыдущую страницу
    if (users.value.length === 1 && pagination.value.page > 1) {
      pagination.value.page--;
    }
    
    fetchUsers();
  } catch (error: any) {
    console.error('Ошибка при удалении пользователя:', error);
  }
};

// Первоначальная загрузка
onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Управление пользователями</h1>
    </div>

    <UsersTable
      :users="users"
      :pagination="pagination"
      :is-loading="isLoading"
      :sort-field="sortField"
      :sort-order="sortOrder"
      @update:page="handlePageChange"
      @update:limit="handleLimitChange"
      @update:search="handleSearchChange"
      @update:sort="handleSortChange"
      @delete="handleUserDelete"
      @refresh="fetchUsers"
    />
  </div>
</template> 