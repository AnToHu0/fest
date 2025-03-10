<script setup lang="ts">
import DepartmentSection from '~/components/department/DepartmentSection.vue';

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
});

interface User {
  id: number;
  fullName: string;
  spiritualName: string | null;
  email: string;
  phone: string | null;
}

interface Department {
  id: number;
  title: string;
  users: User[];
}

const departments = ref<Department[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Загрузка данных
const fetchDepartments = async (search?: string, searchDepartmentId?: number) => {
  try {
    isLoading.value = true;
    const response = await $fetch<{ departments: Department[] }>('/api/departments/my/users', {
      params: {
        search,
        searchDepartmentId
      }
    });
    departments.value = response.departments;
  } catch (e: any) {
    error.value = e.message || 'Ошибка при загрузке данных';
    console.error('Ошибка при загрузке департаментов:', e);
  } finally {
    isLoading.value = false;
  }
};

// Обработчик поиска для конкретного департамента
const handleDepartmentSearch = async ({ search, departmentId }: { search: string; departmentId: number }) => {
  await fetchDepartments(search, departmentId);
};

// Первоначальная загрузка данных
onMounted(() => {
  fetchDepartments();
});
</script>

<template>
  <div class="space-y-8">
    <h1 class="text-2xl font-bold text-gray-900">Мои департаменты</h1>
    
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {{ error }}
    </div>

    <div v-if="departments.length === 0 && !isLoading" class="text-gray-500 text-center py-8">
      У вас нет департаментов под управлением
    </div>

    <div v-else class="space-y-10">
      <DepartmentSection
        v-for="department in departments"
        :key="department.id"
        :id="department.id"
        :title="department.title"
        :users="department.users"
        :is-loading="isLoading"
        @update:search="handleDepartmentSearch"
      />
    </div>
  </div>
</template> 