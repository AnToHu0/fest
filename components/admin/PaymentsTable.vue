<script setup lang="ts">
import type { Payment } from '~/types/payment';
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { usePhoneFormat } from '~/composables/usePhoneFormat';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const props = defineProps<{
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  'update:page': [number];
  'update:limit': [number];
  'update:search': [string];
  'update:festivalYear': [number];
}>();

const { formatPhone } = usePhoneFormat();

// Состояние таблицы
const payments = ref<Payment[]>([]);
const pagination = ref<Pagination>({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0
});

// Фильтры
const searchField = ref('');
const festivalId = ref<number | null>(null);
const managerId = ref<number | null>(null);
const availableFestivals = ref<{ id: number; year: number }[]>([]);
const availableManagers = ref<{ id: number; fullName: string }[]>([]);

// Опции для размера страницы
const pageSizeOptions = [
  { label: '10 записей', value: 10 },
  { label: '25 записей', value: 25 },
  { label: '50 записей', value: 50 }
];

// Загрузка данных
const loadPayments = async () => {
  try {
    const response = await $fetch('/api/admin/payments', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.limit,
        searchField: searchField.value,
        festivalId: festivalId.value,
        managerId: managerId.value
      }
    });

    if (response.success) {
      payments.value = response.payments;
      pagination.value = response.pagination;
      // Обновляем список менеджеров только при первой загрузке
      if (availableManagers.value.length === 0 && response.managers) {
        availableManagers.value = response.managers;
      }
    }
  } catch (error) {
    console.error('Ошибка при загрузке платежей:', error);
  }
};

// Загрузка списка фестивалей
const loadFestivals = async () => {
  try {
    const response = await $fetch('/api/admin/festivals');
    if (response.success) {
      availableFestivals.value = response.festivals.map(f => ({
        id: f.id,
        year: f.year
      })).sort((a, b) => b.year - a.year);
    }
  } catch (error) {
    console.error('Ошибка при загрузке списка фестивалей:', error);
  }
};

// Форматирование даты
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Обработчики изменений
const handlePageChange = (newPage: number) => {
  pagination.value.page = newPage;
  emit('update:page', newPage);
  loadPayments();
};

const handleLimitChange = (newLimit: number) => {
  pagination.value.limit = newLimit;
  pagination.value.page = 1;
  emit('update:limit', newLimit);
  loadPayments();
};

const handleSearchChange = (value: string) => {
  searchField.value = value;
  pagination.value.page = 1;
  emit('update:search', value);
  loadPayments();
};

const handleFestivalChange = (value: number | null) => {
  festivalId.value = value;
  pagination.value.page = 1;
  emit('update:festivalYear', value || 0);
  loadPayments();
};

const handleManagerChange = (event: Event) => {
  const select = event.target as HTMLSelectElement;
  managerId.value = select.value ? Number(select.value) : null;
  pagination.value.page = 1;
  loadPayments();
};

// Загружаем данные при монтировании
onMounted(() => {
  loadFestivals();
  loadPayments();
});

// Таймер для дебаунса
let searchTimer: NodeJS.Timeout | null = null;

// Следим за изменениями поискового запроса с задержкой
watch(searchField, (newValue) => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  if (newValue.length >= 3 || newValue.length === 0) {
    searchTimer = setTimeout(() => {
      handleSearchChange(newValue);
    }, 300);
  }
});

// Очищаем таймер при размонтировании компонента
onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
});
</script>

<template>
  <div class="bg-white rounded-lg shadow">
    <!-- Фильтры -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex flex-col md:flex-row gap-4">
        <!-- Поиск -->
        <div class="flex-1">
          <input
            v-model="searchField"
            type="text"
            placeholder="Поиск по имени или телефону..."
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <!-- Выбор фестиваля -->
        <div class="w-full md:w-48">
          <select
            v-model="festivalId"
            @change="handleFestivalChange($event.target.value)"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="null">Все фестивали</option>
            <option v-for="festival in availableFestivals" :key="festival.id" :value="festival.id">
              {{ festival.year }} (ID: {{ festival.id }})
            </option>
          </select>
        </div>

        <!-- Выбор менеджера -->
        <div class="w-full md:w-48">
          <select
            v-model="managerId"
            @change="handleManagerChange"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="null">Все менеджеры</option>
            <option v-for="manager in availableManagers" :key="manager.id" :value="manager.id">
              {{ manager.fullName }}
            </option>
          </select>
        </div>
        
        <!-- Размер страницы -->
        <div class="w-full md:w-48">
          <select
            v-model="pagination.limit"
            @change="handleLimitChange($event.target.value)"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="option in pageSizeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Таблица -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Дата
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Участник
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Фестиваль
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Тип платежа
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Назначение
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Сумма
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Менеджер
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="props.isLoading" class="animate-pulse">
            <td colspan="7" class="px-6 py-4">
              <div class="flex justify-center">
                <div class="w-6 h-6 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
              </div>
            </td>
          </tr>
          <tr v-else-if="payments.length === 0">
            <td colspan="7" class="px-6 py-4 text-center text-gray-500">
              Платежи не найдены
            </td>
          </tr>
          <tr v-for="payment in payments" :key="payment.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatDate(payment.date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ payment.User.fullName }}</div>
              <div class="text-sm text-gray-500">{{ formatPhone(payment.User.phone) }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ payment.Festival.year }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ payment.paymentType }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ payment.paymentDest }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ payment.amount }} ₽
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ payment.Registrator.fullName }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Пагинация -->
    <div class="px-4 py-3 border-t border-gray-200">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Показано {{ (pagination.page - 1) * pagination.limit + 1 }} - 
          {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
          из {{ pagination.total }} записей
        </div>
        <div class="flex gap-2">
          <button
            v-for="pageNum in pagination.totalPages"
            :key="pageNum"
            @click="handlePageChange(pageNum)"
            :class="[
              'px-3 py-1 text-sm rounded-md',
              pageNum === pagination.page
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            ]"
          >
            {{ pageNum }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template> 