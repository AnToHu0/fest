<script setup lang="ts">
import PaymentsTable from '~/components/admin/PaymentsTable.vue';

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
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

// Состояние загрузки
const isLoading = ref(false);

// Параметры фильтрации и пагинации
const currentPage = ref(1);
const pageSize = ref(10);
const searchQuery = ref('');
const selectedYear = ref<number | null>(null);

// Обработчики изменений
const handlePageChange = (page: number) => {
  currentPage.value = page;
};

const handleLimitChange = (limit: number) => {
  pageSize.value = limit;
};

const handleSearchChange = (query: string) => {
  searchQuery.value = query;
};

const handleYearChange = (year: number) => {
  selectedYear.value = year;
};
</script>

<template>
  <div v-if="canAccess" class="container mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">История платежей</h1>
      <p class="mt-2 text-sm text-gray-600">
        Просмотр и управление всеми платежами в системе
      </p>
    </div>

    <PaymentsTable
      :is-loading="isLoading"
      @update:page="handlePageChange"
      @update:limit="handleLimitChange"
      @update:search="handleSearchChange"
      @update:festivalYear="handleYearChange"
    />
  </div>
</template> 