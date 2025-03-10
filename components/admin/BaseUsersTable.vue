<script setup lang="ts">
import type { User } from '~/types/user';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import Modal from '~/components/ui/Modal.vue';
import UserForm from '~/components/user/UserForm.vue';
import PaymentReceiptModal from './PaymentReceiptModal.vue';
import { usePhoneFormat } from '~/composables/usePhoneFormat';

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
  showRoles?: boolean;
  showRegistrationButton?: boolean;
  showPaymentButton?: boolean;
  allowRoleManagement?: boolean;
  showAddButton?: boolean;
  currentFestival?: Festival;
  showRegistrationFilter?: boolean;
  highlightRegistered?: boolean;
  currentAdmin?: User | null;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  showRoles: true,
  showRegistrationButton: false,
  showPaymentButton: false,
  allowRoleManagement: true,
  showAddButton: true,
  currentFestival: undefined,
  showRegistrationFilter: false,
  highlightRegistered: false,
  currentAdmin: null
});

const emit = defineEmits(['update:page', 'update:search', 'update:limit', 'update:sort', 'edit', 'delete', 'refresh', 'register', 'payment']);

const searchQuery = ref('');
const showOnlyRegistered = ref(false);
let searchTimeout: NodeJS.Timeout;

// Состояние диалога подтверждения удаления
const isConfirmDialogOpen = ref(false);
const userToDelete = ref<User | null>(null);

// Состояние модального окна редактирования
const isEditModalOpen = ref(false);
const selectedUser = ref<User | null>(null);
const isCreatingNewUser = ref(false);

const recentlyRegisteredUserId = ref<number | null>(null);
const recentlyDeregisteredUserId = ref<number | null>(null);

// Состояние модального окна оплаты
const isPaymentModalOpen = ref(false);
const selectedUserForPayment = ref<User | null>(null);

const { formatPhone } = usePhoneFormat();

// Следим за изменением поискового запроса с debounce
watch(searchQuery, (newValue) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    emit('update:search', newValue);
  }, 300);
});

// Следим за изменением фильтра зарегистрированных
watch(showOnlyRegistered, (newValue) => {
  emit('update:search', searchQuery.value, newValue);
});

// Очищаем таймер при размонтировании компонента
onBeforeUnmount(() => {
  clearTimeout(searchTimeout);
});

// Обработка изменения страницы
const handlePageChange = (newPage: number) => {
  emit('update:page', newPage);
};

// Обработка изменения размера страницы
const handleLimitChange = (event: Event) => {
  const newLimit = parseInt((event.target as HTMLSelectElement).value);
  emit('update:limit', newLimit);
};

// Обработка изменения сортировки
const handleSort = (field: string) => {
  if (props.sortField === field) {
    emit('update:sort', field, props.sortOrder === 'asc' ? 'desc' : 'asc');
  } else {
    emit('update:sort', field, 'asc');
  }
};

// Получение иконки сортировки
const getSortIcon = (field: string) => {
  if (props.sortField !== field) {
    return 'mdi:unfold-more-horizontal';
  }
  return props.sortOrder === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending';
};

// Получение стилей для роли
const getRoleBadgeClasses = (role: string) => {
  switch (role) {
    case 'user':
      return 'bg-green-50 text-green-700 border border-green-200';
    case 'admin':
      return 'bg-red-50 text-red-700 border border-red-200';
    default:
      return 'bg-orange-50 text-orange-700 border border-orange-200';
  }
};

// Получение названия роли
const getRoleTitle = (role: string) => {
  switch (role) {
    case 'user':
      return 'Пользователь';
    case 'admin':
      return 'Администратор';
    case 'accommodation_manager':
      return 'Ответственный за расселение';
    case 'registrar':
      return 'Регистратор';
    default:
      return role;
  }
};

// Обработка редактирования пользователя
const handleEdit = (user: User) => {
  selectedUser.value = user;
  isCreatingNewUser.value = false;
  isEditModalOpen.value = true;
};

// Обработка создания нового пользователя
const handleCreateUser = () => {
  selectedUser.value = {
    id: 0,
    fullName: '',
    email: '',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as User;
  isCreatingNewUser.value = true;
  isEditModalOpen.value = true;
};

// Обработка регистрации на фестиваль
const handleRegister = (user: User) => {
  emit('register', user);
};

// Обработка удаления пользователя
const handleDelete = (user: User) => {
  userToDelete.value = user;
  isConfirmDialogOpen.value = true;
};

// Подтверждение удаления пользователя
const confirmDelete = () => {
  if (userToDelete.value) {
    emit('delete', userToDelete.value);
  }
  isConfirmDialogOpen.value = false;
  userToDelete.value = null;
};

// Отмена удаления пользователя
const cancelDelete = () => {
  isConfirmDialogOpen.value = false;
  userToDelete.value = null;
};

// Закрытие модального окна редактирования
const closeEditModal = () => {
  isEditModalOpen.value = false;
  selectedUser.value = null;
  isCreatingNewUser.value = false;
};

// Обработка успешного сохранения
const handleSaved = (closeAfterSave = true) => {
  if (closeAfterSave) {
    closeEditModal();
  }
  emit('refresh');
};

const getRowClasses = (user: User) => {
  const classes = ['transition-all duration-1000'];
  
  if (recentlyRegisteredUserId.value === user.id) {
    classes.push('bg-green-200');
    setTimeout(() => {
      recentlyRegisteredUserId.value = null;
    }, 3000);
  } else if (props.highlightRegistered && user.isRegistered) {
    classes.push('bg-green-50');
  }
  
  return classes.join(' ');
};

const setRecentlyRegistered = (userId: number) => {
  recentlyRegisteredUserId.value = userId;
  setTimeout(() => {
    recentlyRegisteredUserId.value = null;
  }, 2000);
};

const setRecentlyDeregistered = (userId: number) => {
  recentlyDeregisteredUserId.value = userId;
  setTimeout(() => {
    recentlyDeregisteredUserId.value = null;
  }, 2000);
};

const isRecentlyRegistered = (userId: number) => {
  return recentlyRegisteredUserId.value === userId;
};

defineExpose({
  setRecentlyRegistered,
  setRecentlyDeregistered
});

// Обработчик открытия модального окна оплаты
const handlePayment = (user: User) => {
  selectedUserForPayment.value = user;
  isPaymentModalOpen.value = true;
};

// Обработчик закрытия модального окна оплаты
const handleClosePaymentModal = () => {
  isPaymentModalOpen.value = false;
  selectedUserForPayment.value = null;
};

// Обработчик отправки формы оплаты
const handleSubmitPayment = (payment: Payment) => {
  emit('payment', payment);
  handleClosePaymentModal();
};

const isRecentlyDeregistered = (userId: number) => {
  return recentlyDeregisteredUserId.value === userId;
};
</script>

<template>
  <div class="space-y-4">
    <!-- Поиск и кнопка добавления -->
    <div class="flex justify-between items-center">
      <div class="flex items-center gap-4 flex-1 max-w-2xl">
        <div class="relative flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по ФИО, email, телефону или городу..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
          <Icon 
            name="mdi:magnify" 
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
          />
        </div>
        <div class="flex items-center" v-if="showRegistrationFilter && currentFestival">
          <input
            v-model="showOnlyRegistered"
            type="checkbox"
            id="showRegistered"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          >
          <label for="showRegistered" class="ml-2 text-sm text-gray-700">
            Только зарегистрированные
          </label>
        </div>
      </div>
      <button
        v-if="showAddButton"
        @click="handleCreateUser"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
      >
        <Icon name="mdi:plus" class="w-5 h-5 mr-1" />
        <span>Добавить пользователя</span>
      </button>
    </div>

    <!-- Таблица -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                @click="handleSort('fullName')"
              >
                <div class="flex items-center">
                  <span>ФИО</span>
                  <Icon 
                    :name="getSortIcon('fullName')" 
                    class="ml-1 w-4 h-4 opacity-50 group-hover:opacity-100"
                    :class="{ 'opacity-100': sortField === 'fullName' }"
                  />
                </div>
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Телефон
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Город
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дети
              </th>
              <th v-if="showRoles" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Роли
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="isLoading">
              <td :colspan="showRoles ? 7 : 6" class="px-6 py-2.5 text-center text-sm text-gray-500">
                Загрузка...
              </td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td :colspan="showRoles ? 7 : 6" class="px-6 py-2.5 text-center text-sm text-gray-500">
                Пользователи не найдены
              </td>
            </tr>
            <tr v-for="user in users" :key="user.id" :class="{
              'transition-colors duration-1000': true,
              'bg-green-100': user.isRegistered && !isRecentlyRegistered(user.id) && !isRecentlyDeregistered(user.id),
              'bg-green-300': isRecentlyRegistered(user.id),
              'bg-white': isRecentlyDeregistered(user.id) || (!user.isRegistered && !isRecentlyRegistered(user.id))
            }">
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
              <td class="px-6 py-2.5 whitespace-nowrap text-sm text-gray-500">
                {{ user.city || '-' }}
              </td>
              <td class="px-6 py-2.5 whitespace-nowrap text-sm text-gray-500">
                {{ user.childrenCount || 0 }}
              </td>
              <td v-if="showRoles" class="px-6 py-2.5 whitespace-nowrap text-sm text-gray-500 max-w-[12rem]">
                <div class="flex items-center">
                  <div class="flex flex-wrap gap-0.5">
                    <span 
                      v-for="role in user.roles" 
                      :key="role"
                      class="px-1.5 py-0.5 text-[10px] leading-none rounded-full"
                      :class="getRoleBadgeClasses(role)"
                    >
                      {{ getRoleTitle(role) }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-2.5 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end">
                  <button
                    v-if="showPaymentButton && user.isRegistered"
                    @click="handlePayment(user)"
                    class="text-green-600 hover:text-green-900 mr-3"
                    title="Принять оплату"
                  >
                    <Icon name="mdi:currency-usd" class="w-5 h-5" />
                  </button>
                  <button
                    v-if="showRegistrationButton"
                    @click="handleRegister(user)"
                    class="text-blue-600 hover:text-blue-900 mr-3"
                    :title="user.isRegistered ? 'Редактировать регистрацию' : 'Регистрация на фестиваль'"
                  >
                    <Icon 
                      :name="user.isRegistered ? 'mdi:calendar-edit' : 'mdi:calendar-plus'" 
                      class="w-5 h-5" 
                    />
                  </button>
                  <button
                    @click="handleEdit(user)"
                    class="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Icon name="mdi:pencil" class="w-5 h-5" />
                  </button>
                  <button
                    @click="handleDelete(user)"
                    class="text-red-600 hover:text-red-900"
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
      <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-700">
              Показано {{ (pagination.page - 1) * pagination.limit + 1 }} - 
              {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
              из {{ pagination.total }} результатов
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-700">Показывать:</span>
              <select
                :value="pagination.limit"
                @change="handleLimitChange"
                class="border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
          <div class="flex space-x-2">
            <button
              v-for="pageNum in pagination.totalPages"
              :key="pageNum"
              @click="handlePageChange(pageNum)"
              :class="[
                'px-3 py-1 rounded-md text-sm',
                pageNum === pagination.page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              ]"
            >
              {{ pageNum }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно редактирования/создания пользователя -->
    <Modal
      v-if="isEditModalOpen"
      :title="isCreatingNewUser ? 'Добавление пользователя' : 'Редактирование пользователя'"
      @close="closeEditModal"
      size="xl"
    >
      <UserForm
        v-if="selectedUser"
        :userData="selectedUser"
        :isAdmin="allowRoleManagement"
        :isCreatingNew="isCreatingNewUser"
        :allowRoleManagement="allowRoleManagement"
        @saved="handleSaved"
        @cancel="closeEditModal"
      />
    </Modal>

    <!-- Диалог подтверждения удаления -->
    <ConfirmDialog
      :is-open="isConfirmDialogOpen"
      title="Удаление пользователя"
      :message="userToDelete ? `Вы действительно хотите удалить пользователя ${userToDelete.fullName}?` : ''"
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Модальное окно оплаты -->
    <PaymentReceiptModal
      v-if="selectedUserForPayment"
      :is-open="isPaymentModalOpen"
      :user="selectedUserForPayment"
      :current-festival="currentFestival"
      :current-admin="currentAdmin"
      @close="handleClosePaymentModal"
      @submit="handleSubmitPayment"
    />
  </div>
</template> 