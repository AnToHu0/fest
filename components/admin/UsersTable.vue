<script setup lang="ts">
import type { User } from '~/types/user';
import BaseUsersTable from './BaseUsersTable.vue';

interface Props {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  isLoading?: boolean;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

const props = defineProps<Props>();
const emit = defineEmits(['update:page', 'update:search', 'update:limit', 'update:sort', 'edit', 'delete', 'refresh']);
</script>

<template>
  <BaseUsersTable
    v-bind="$props"
    :show-roles="true"
    :show-registration-button="false"
    :allow-role-management="true"
    :sort-field="props.sortField"
    :sort-order="props.sortOrder"
    :highlight-registered="false"
    @update:page="$emit('update:page', $event)"
    @update:search="$emit('update:search', $event)"
    @update:limit="$emit('update:limit', $event)"
    @update:sort="(field, order) => $emit('update:sort', field, order)"
    @edit="$emit('edit', $event)"
    @delete="$emit('delete', $event)"
    @refresh="$emit('refresh')"
  />
</template> 