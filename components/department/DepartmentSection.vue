<script setup lang="ts">
import DepartmentUsersTable from './DepartmentUsersTable.vue';

interface User {
  id: number;
  fullName: string;
  spiritualName: string | null;
  email: string;
  phone: string | null;
}

interface Props {
  id: number;
  title: string;
  users: User[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
});

const emit = defineEmits(['update:search']);

const handleSearch = (query: string) => {
  emit('update:search', {
    search: query,
    departmentId: props.id
  });
};
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-200">{{ title }}</h2>
    <DepartmentUsersTable
      :users="users"
      :is-loading="isLoading"
      @update:search="handleSearch"
    />
  </div>
</template> 