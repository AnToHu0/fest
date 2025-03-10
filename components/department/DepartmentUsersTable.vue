<script setup lang="ts">
import { usePhoneFormat } from '~/composables/usePhoneFormat';

interface User {
  id: number;
  fullName: string;
  spiritualName: string | null;
  email: string;
  phone: string | null;
}

interface Props {
  users: User[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
});

const emit = defineEmits(['update:search']);

const searchQuery = ref('');
const { formatPhone } = usePhoneFormat();

let searchTimeout: NodeJS.Timeout;

// Следим за изменением поискового запроса с debounce
watch(searchQuery, (newValue) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    emit('update:search', newValue);
  }, 300);
});

// Очищаем таймер при размонтировании компонента
onBeforeUnmount(() => {
  clearTimeout(searchTimeout);
});
</script>

<template>
  <div class="space-y-4">
    <!-- Поиск -->
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-4 flex-1 max-w-2xl">
        <div class="relative flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по ФИО, email или телефону..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
          <Icon 
            name="mdi:magnify" 
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
          />
        </div>
      </div>
    </div>

    <!-- Таблица -->
    <div class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ФИО
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Телефон
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="isLoading">
              <td colspan="3" class="px-6 py-2.5 text-center text-sm text-gray-500">
                Загрузка...
              </td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="3" class="px-6 py-2.5 text-center text-sm text-gray-500">
                Пользователи не найдены
              </td>
            </tr>
            <tr v-for="user in users" :key="user.id">
              <td class="px-6 py-2.5 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ user.fullName }}</div>
                <div v-if="user.spiritualName" class="text-sm text-gray-500">{{ user.spiritualName }}</div>
              </td>
              <td class="px-6 py-2.5 whitespace-nowrap text-sm text-gray-500">
                {{ user.email }}
              </td>
              <td class="px-6 py-2.5 whitespace-nowrap text-sm text-gray-500">
                {{ formatPhone(user.phone) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template> 