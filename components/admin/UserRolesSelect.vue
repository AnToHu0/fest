<script setup lang="ts">
import type { User } from '~/types/user';
import MultiSelect from '~/components/ui/MultiSelect.vue';

interface Props {
  user: User;
}

const props = defineProps<Props>();
const emit = defineEmits(['update']);

// Список всех доступных ролей
const availableRoles = [
  { id: 'user', title: 'Пользователь' },
  { id: 'admin', title: 'Администратор' },
  { id: 'accommodation_manager', title: 'Ответственный за расселение' },
  { id: 'registrar', title: 'Регистратор' }
];

// Преобразуем роли пользователя в формат для MultiSelect
const selectedRoles = ref((props.user.roles || []).map(role => role));

// Обработчик изменения ролей
const handleRolesChange = (roles: string[]) => {
  selectedRoles.value = roles;
  emit('update', roles);
};
</script>

<template>
  <div class="mb-6">
    <h3 class="text-lg font-medium text-gray-900 mb-2">
      Роли пользователя {{ user.fullName }}
    </h3>
    <p class="text-sm text-gray-500">
      Выберите роли, которые хотите назначить пользователю
    </p>
    
    <div class="mt-4">
      <MultiSelect
        v-model="selectedRoles"
        :options="availableRoles.map(role => ({ id: role.id, label: role.title }))"
        :label="'Роли'"
        placeholder="Выберите роли"
        class="relative z-50"
        @update:modelValue="handleRolesChange"
      />
    </div>
  </div>
</template> 