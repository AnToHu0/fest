<script setup lang="ts">
import type { User } from '~/types/user';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import Modal from '~/components/ui/Modal.vue';
import UserEditForm from './UserEditForm.vue';
import UserForm from '~/components/user/UserForm.vue';

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

const searchQuery = ref('');
let searchTimeout: NodeJS.Timeout;

// Состояние диалога подтверждения удаления
const isConfirmDialogOpen = ref(false);
const userToDelete = ref<User | null>(null);

// Состояние модального окна редактирования
const isEditModalOpen = ref(false);
const selectedUser = ref<User | null>(null);
const isCreatingNewUser = ref(false);

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

// Форматирование телефона
const formatPhone = (phone: string | null) => {
  if (!phone) return '-';
  return phone;
};

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
  // Если уже сортируем по этому полю, меняем порядок сортировки
  if (props.sortField === field) {
    emit('update:sort', field, props.sortOrder === 'asc' ? 'desc' : 'asc');
  } else {
    // Иначе сортируем по новому полю в порядке возрастания
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
</script>

<template>
  <div class="space-y-4">
    <!-- Поиск и кнопка добавления -->
    <div class="flex justify-between items-center">
      <div class="relative flex-1 max-w-md">
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
      <button
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
                    :class="{ 'opacity-100': props.sortField === 'fullName' }"
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
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="isLoading">
              <td colspan="6" class="px-6 py-2.5 text-center text-sm text-gray-500">
                Загрузка...
              </td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="6" class="px-6 py-2.5 text-center text-sm text-gray-500">
                Пользователи не найдены
              </td>
            </tr>
            <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
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
              <td class="px-6 py-2.5 whitespace-nowrap text-right text-sm font-medium">
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
        :isAdmin="true"
        :isCreatingNew="isCreatingNewUser"
        @saved="handleSaved"
        @cancel="closeEditModal"
      />
    </Modal>
  </div>
</template> 