<script setup lang="ts">
import type { Payment } from '~/types/payment';
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { usePhoneFormat } from '~/composables/usePhoneFormat';
import PaymentEditModal from './PaymentEditModal.vue';
import Modal from '~/components/ui/Modal.vue';

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
const festivalId = ref<number | string>('');
const managerId = ref<number | string>('');
const paymentDest = ref<string>('');
const sortField = ref('date');
const sortOrder = ref<'asc' | 'desc'>('desc');
const availableFestivals = ref<{ id: number; year: number }[]>([]);
const availableManagers = ref<{ id: number; fullName: string }[]>([]);

// Назначения платежей для фильтра
const paymentDests = [
  { id: 'Участие', label: 'Оплата за участие' },
  { id: 'Проживание', label: 'Оплата за проживание' },
  { id: 'Автомобиль', label: 'Оплата за автомобиль' },
  { id: 'Животное', label: 'Оплата за животное' }
];

// Опции для размера страницы
const pageSizeOptions = [
  { label: '10 записей', value: 10 },
  { label: '25 записей', value: 25 },
  { label: '50 записей', value: 50 }
];

// Добавляем состояния для модального окна и выбранного платежа
const isEditModalOpen = ref(false);
const selectedPayment = ref<Payment | null>(null);
const isConfirmDeleteOpen = ref(false);

// Загрузка данных
const loadPayments = async () => {
  try {
    const response = await $fetch('/api/admin/payments', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.limit,
        searchField: searchField.value,
        festivalId: festivalId.value || null,
        managerId: managerId.value || null,
        paymentDest: paymentDest.value || null,
        sortField: sortField.value,
        sortOrder: sortOrder.value
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
  // Убираем 'Z' из конца строки, чтобы дата не преобразовывалась в локальный часовой пояс
  const [datePart, timePart] = dateString.replace('Z', '').split('T');
  const [year, month, day] = datePart.split('-');
  const [hours, minutes] = timePart.split(':');
  
  return `${day}.${month}.${year} ${hours}:${minutes}`;
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

const handleFestivalChange = (event: Event) => {
  const select = event.target as HTMLSelectElement;
  festivalId.value = select.value ? Number(select.value) : '';
  pagination.value.page = 1;
  emit('update:festivalYear', Number(festivalId.value) || 0);
  loadPayments();
};

const handleManagerChange = (event: Event) => {
  const select = event.target as HTMLSelectElement;
  managerId.value = select.value ? Number(select.value) : '';
  pagination.value.page = 1;
  loadPayments();
};

const handlePaymentDestChange = (event: Event) => {
  const select = event.target as HTMLSelectElement;
  paymentDest.value = select.value;
  pagination.value.page = 1;
  loadPayments();
};

const handleSort = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortOrder.value = 'desc';
  }
  loadPayments();
};

const getSortIcon = (field: string) => {
  if (sortField.value !== field) return 'mdi:unfold-more-horizontal';
  return sortOrder.value === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down';
};

// Добавляем функцию сброса фильтров
const resetFilters = () => {
  searchField.value = '';
  festivalId.value = '';
  managerId.value = '';
  paymentDest.value = '';
  sortField.value = 'date';
  sortOrder.value = 'desc';
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

// Обработчик редактирования
const handleEdit = (payment: Payment) => {
  selectedPayment.value = payment;
  isEditModalOpen.value = true;
};

// Обработчик удаления
const handleDelete = (payment: Payment) => {
  selectedPayment.value = payment;
  isConfirmDeleteOpen.value = true;
};

// Обработчик сохранения изменений
const handleSave = async (paymentData: Payment) => {
  try {
    const url = paymentData.id 
      ? `/api/admin/payments/${paymentData.id}`
      : '/api/admin/payments';
      
    const method = paymentData.id ? 'PUT' : 'POST';

    const response = await $fetch(url, {
      method,
      body: paymentData
    });

    if (response.success) {
      isEditModalOpen.value = false;
      selectedPayment.value = null;
      await loadPayments();
    }
  } catch (err) {
    console.error('Ошибка при сохранении платежа:', err);
  }
};

// Обработчик подтверждения удаления
const handleConfirmDelete = async () => {
  if (!selectedPayment.value) return;

  try {
    const response = await $fetch(`/api/admin/payments/${selectedPayment.value.id}`, {
      method: 'DELETE'
    });

    if (response.success) {
      isConfirmDeleteOpen.value = false;
      selectedPayment.value = null;
      await loadPayments();
    }
  } catch (err) {
    console.error('Ошибка при удалении платежа:', err);
  }
};

const handleCreate = () => {
  selectedPayment.value = null;
  isEditModalOpen.value = true;
};
</script>

<template>
  <div class="bg-white rounded-lg shadow">
    <!-- Заголовок и кнопка добавления -->
    <div class="p-4 border-b border-gray-200 flex justify-between items-center">
      <h2 class="text-xl font-semibold text-gray-800">Платежи</h2>
      <button
        @click="handleCreate"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-2"
        title="Добавить платеж"
      >
        <Icon name="mdi:plus" class="w-5 h-5" />
        <span>Добавить платеж</span>
      </button>
    </div>

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
            @change="handleFestivalChange"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все фестивали</option>
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
            <option value="">Все менеджеры</option>
            <option v-for="manager in availableManagers" :key="manager.id" :value="manager.id">
              {{ manager.fullName }}
            </option>
          </select>
        </div>

        <!-- Выбор назначения платежа -->
        <div class="w-full md:w-48">
          <select
            v-model="paymentDest"
            @change="handlePaymentDestChange"
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все назначения</option>
            <option v-for="dest in paymentDests" :key="dest.id" :value="dest.id">
              {{ dest.label }}
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

        <!-- Кнопка сброса фильтров -->
        <div class="w-full md:w-auto">
          <button
            @click="resetFilters"
            class="w-full md:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors flex items-center gap-2"
            title="Сбросить все фильтры"
          >
            <Icon name="mdi:filter-off" class="w-5 h-5" />
            <span>Сбросить фильтры</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Таблица -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" @click="handleSort('date')">
              <div class="flex items-center gap-1">
                Дата
                <Icon :name="getSortIcon('date')" class="w-4 h-4" />
              </div>
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" @click="handleSort('user')">
              <div class="flex items-center gap-1">
                Участник
                <Icon :name="getSortIcon('user')" class="w-4 h-4" />
              </div>
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Год
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Тип оплаты
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Назначение
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" @click="handleSort('amount')">
              <div class="flex items-center gap-1">
                Сумма
                <Icon :name="getSortIcon('amount')" class="w-4 h-4" />
              </div>
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Менеджер
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
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
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-end space-x-2">
                <button
                  @click="handleEdit(payment)"
                  class="text-blue-600 hover:text-blue-900"
                  title="Редактировать"
                >
                  <Icon name="mdi:pencil" class="w-5 h-5" />
                </button>
                <button
                  @click="handleDelete(payment)"
                  class="text-red-600 hover:text-red-900"
                  title="Удалить"
                >
                  <Icon name="mdi:delete" class="w-5 h-5" />
                </button>
              </div>
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

    <!-- Модальное окно редактирования -->
    <PaymentEditModal
      :is-open="isEditModalOpen"
      :payment="selectedPayment"
      @close="isEditModalOpen = false"
      @save="handleSave"
    />

    <!-- Диалог подтверждения удаления -->
    <Modal
      v-if="isConfirmDeleteOpen"
      title="Подтверждение удаления"
      @close="isConfirmDeleteOpen = false"
    >
      <div class="p-6">
        <p class="text-gray-700">
          Вы действительно хотите удалить этот платеж?
        </p>
        <div class="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            @click="isConfirmDeleteOpen = false"
          >
            Отмена
          </button>
          <button
            type="button"
            class="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            @click="handleConfirmDelete"
          >
            Удалить
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template> 