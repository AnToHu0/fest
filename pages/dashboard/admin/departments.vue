<script setup lang="ts">
import AddAdminModal from '~/components/admin/AddAdminModal.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import Modal from '~/components/ui/Modal.vue';

definePageMeta({
  middleware: "auth",
  layout: "dashboard"
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

// Состояние для списка департаментов
const departments = ref<any[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Состояние для модального окна редактирования департамента
const isEditModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const currentDepartment = ref<any>(null);

// Состояние для модального окна подтверждения удаления департамента
const isDeleteConfirmOpen = ref(false);
const departmentToDelete = ref<number | null>(null);

// Состояние для модального окна подтверждения удаления администратора
const isRemoveAdminConfirmOpen = ref(false);
const adminToRemove = ref<{ departmentId: number; userId: number } | null>(null);

// Состояние для модального окна управления начальниками департамента
const isManageAdminsModalOpen = ref(false);
const currentDepartmentForAdmins = ref<any>(null);

// Состояние для поиска пользователей
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const isSearching = ref(false);
let searchTimeout: NodeJS.Timeout;

// Форма департамента
const departmentForm = ref({
  id: null as number | null,
  title: '',
  isPublic: true,
  joinText: ''
});

// Состояние для уведомлений
const notification = ref<{
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}>({
  message: '',
  type: 'success',
  visible: false
});

// Функция для показа уведомления
function showNotification(message: string, type: 'success' | 'error' = 'success') {
  notification.value = {
    message,
    type,
    visible: true
  };
  
  // Скрываем уведомление через 3 секунды
  setTimeout(() => {
    notification.value.visible = false;
  }, 3000);
}

// Загрузка списка департаментов
async function fetchDepartments() {
  isLoading.value = true;
  error.value = null;
  
  try {
    departments.value = await $fetch('/api/admin/departments');
  } catch (err: any) {
    error.value = err.message || 'Ошибка при загрузке департаментов';
    console.error('Ошибка при загрузке департаментов:', err);
  } finally {
    isLoading.value = false;
  }
}

// Открытие модального окна для создания нового департамента
function openCreateModal() {
  departmentForm.value = {
    id: null,
    title: '',
    isPublic: true,
    joinText: ''
  };
  modalMode.value = 'create';
  isEditModalOpen.value = true;
}

// Открытие модального окна для редактирования департамента
function openEditModal(department: any) {
  departmentForm.value = {
    id: department.id,
    title: department.title,
    isPublic: department.isPublic,
    joinText: department.joinText || ''
  };
  currentDepartment.value = department;
  modalMode.value = 'edit';
  isEditModalOpen.value = true;
}

// Открытие модального окна для управления начальниками департамента
function openManageAdminsModal(department: any) {
  currentDepartmentForAdmins.value = department;
  isManageAdminsModalOpen.value = true;
  searchQuery.value = '';
  searchResults.value = [];
}

// Закрытие модального окна для управления начальниками департамента
function closeManageAdminsModal() {
  isManageAdminsModalOpen.value = false;
  currentDepartmentForAdmins.value = null;
  searchQuery.value = '';
  searchResults.value = [];
}

// Поиск пользователей
async function searchUsers() {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  
  isSearching.value = true;
  
  try {
    searchResults.value = await $fetch('/api/admin/users/search', {
      params: { 
        q: searchQuery.value,
        onlyAdults: 'true' // Только взрослые пользователи
      }
    });
  } catch (err: any) {
    console.error('Ошибка при поиске пользователей:', err);
  } finally {
    isSearching.value = false;
  }
}

// Наблюдаем за изменением поискового запроса
watch(searchQuery, (newValue) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (newValue.length >= 2) {
      searchUsers();
    } else {
      searchResults.value = [];
    }
  }, 300);
});

// Сохранение департамента (создание или обновление)
async function saveDepartment() {
  try {
    if (modalMode.value === 'create') {
      // Создание нового департамента
      const newDepartment = await $fetch('/api/admin/departments', {
        method: 'POST',
        body: departmentForm.value
      });
      departments.value.push(newDepartment);
      showNotification('Департамент успешно создан');
    } else {
      // Обновление существующего департамента
      const updatedDepartment = await $fetch(`/api/admin/departments/${departmentForm.value.id}`, {
        method: 'PUT',
        body: departmentForm.value
      });
      
      // Обновляем департамент в списке
      const index = departments.value.findIndex(d => d.id === updatedDepartment.id);
      if (index !== -1) {
        departments.value[index] = {
          ...departments.value[index],
          ...updatedDepartment
        };
      }
      
      showNotification('Департамент успешно обновлен');
    }
    
    isEditModalOpen.value = false;
  } catch (err: any) {
    showNotification(err.message || 'Ошибка при сохранении департамента', 'error');
    console.error('Ошибка при сохранении департамента:', err);
  }
}

// Открытие модального окна подтверждения удаления департамента
function confirmDeleteDepartment(id: number) {
  departmentToDelete.value = id;
  isDeleteConfirmOpen.value = true;
}

// Закрытие модального окна подтверждения удаления департамента
function cancelDeleteDepartment() {
  isDeleteConfirmOpen.value = false;
  departmentToDelete.value = null;
}

// Удаление департамента
async function deleteDepartment() {
  if (!departmentToDelete.value) return;
  
  try {
    await $fetch(`/api/admin/departments/${departmentToDelete.value}`, {
      method: 'DELETE'
    });
    
    // Удаляем департамент из списка
    departments.value = departments.value.filter(d => d.id !== departmentToDelete.value);
    
    showNotification('Департамент успешно удален');
  } catch (err: any) {
    showNotification(err.message || 'Ошибка при удалении департамента', 'error');
    console.error('Ошибка при удалении департамента:', err);
  } finally {
    isDeleteConfirmOpen.value = false;
    departmentToDelete.value = null;
  }
}

// Добавление начальника департамента
async function addAdmin(userId: number) {
  if (!currentDepartmentForAdmins.value) return;
  
  try {
    await $fetch(`/api/admin/departments/${currentDepartmentForAdmins.value.id}/admins`, {
      method: 'POST',
      body: { userId }
    });
    
    // Обновляем список департаментов
    await fetchDepartments();
    
    // Обновляем данные в модальном окне управления начальниками
    const updatedDepartment = departments.value.find(d => d.id === currentDepartmentForAdmins.value.id);
    if (updatedDepartment) {
      currentDepartmentForAdmins.value = updatedDepartment;
    }
    
    showNotification('Начальник успешно добавлен');
    
    // Очищаем поиск
    searchQuery.value = '';
    searchResults.value = [];
  } catch (err: any) {
    showNotification(err.message || 'Ошибка при добавлении начальника', 'error');
    console.error('Ошибка при добавлении начальника:', err);
  }
}

// Открытие модального окна подтверждения удаления администратора
function confirmRemoveAdmin(departmentId: number, userId: number) {
  adminToRemove.value = { departmentId, userId };
  isRemoveAdminConfirmOpen.value = true;
}

// Закрытие модального окна подтверждения удаления администратора
function cancelRemoveAdmin() {
  isRemoveAdminConfirmOpen.value = false;
  adminToRemove.value = null;
}

// Удаление начальника департамента
async function removeAdmin() {
  if (!adminToRemove.value) return;
  
  try {
    await $fetch(`/api/admin/departments/${adminToRemove.value.departmentId}/admins/${adminToRemove.value.userId}`, {
      method: 'DELETE'
    });
    
    // Обновляем список департаментов
    await fetchDepartments();
    
    // Обновляем данные в модальном окне управления начальниками
    if (currentDepartmentForAdmins.value && currentDepartmentForAdmins.value.id === adminToRemove.value.departmentId) {
      const updatedDepartment = departments.value.find(d => d.id === adminToRemove.value.departmentId);
      if (updatedDepartment) {
        currentDepartmentForAdmins.value = updatedDepartment;
      }
    }
    
    showNotification('Начальник успешно удален');
  } catch (err: any) {
    showNotification(err.message || 'Ошибка при удалении начальника', 'error');
    console.error('Ошибка при удалении начальника:', err);
  } finally {
    // Закрываем только модальное окно подтверждения удаления
    isRemoveAdminConfirmOpen.value = false;
    adminToRemove.value = null;
    // НЕ закрываем модальное окно управления начальниками
  }
}

// Загружаем департаменты при монтировании компонента
onMounted(() => {
  if (canAccess.value) {
    fetchDepartments();
  }
});
</script>

<template>
  <div v-if="canAccess">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Управление департаментами</h1>
      <div class="flex items-center gap-4">
        <!-- Уведомление -->
        <transition name="fade">
          <div 
            v-if="notification.visible" 
            :class="[
              'px-4 py-2 rounded-md transition-opacity duration-300',
              notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            ]"
          >
            {{ notification.message }}
          </div>
        </transition>
        
        <button 
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          @click="openCreateModal"
        >
          <Icon name="mdi:plus" class="w-5 h-5 mr-1" />
          Добавить департамент
        </button>
      </div>
    </div>

    <!-- Загрузка и ошибки -->
    <div v-if="isLoading" class="flex justify-center my-8">
      <Icon name="mdi:loading" class="animate-spin text-blue-500 w-8 h-8" />
    </div>
    
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>

    <!-- Список департаментов (табличное отображение) -->
    <div v-if="!isLoading && !error && departments.length === 0" class="text-center my-8">
      <p class="text-gray-500">Департаменты не найдены</p>
    </div>

    <div v-if="!isLoading && departments.length > 0" class="overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Начальники департамента</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="department in departments" :key="department.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ department.title }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span v-if="department.isPublic" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Публичный
              </span>
              <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Скрытый
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <div v-if="department.Admins && department.Admins.length > 0" class="flex flex-wrap items-center">
                  <template v-for="(admin, index) in department.Admins" :key="admin.id">
                    <span class="text-sm">{{ admin.spiritualName || admin.fullName }}</span>
                    <span v-if="index < department.Admins.length - 1" class="text-gray-400">, </span>
                  </template>
                </div>
                <div v-else class="text-sm text-gray-500 italic">
                  Нет начальников
                </div>
                <button 
                  class="text-blue-600 hover:text-blue-800 flex items-center ml-2"
                  @click="openManageAdminsModal(department)"
                >
                  <Icon name="mdi:account-cog" class="w-4 h-4" />
                </button>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-end gap-2">
                <button 
                  class="text-blue-600 hover:text-blue-900 p-1"
                  @click="openEditModal(department)"
                >
                  <Icon name="mdi:pencil" class="w-5 h-5" />
                </button>
                <button 
                  class="text-red-600 hover:text-red-900 p-1"
                  @click="confirmDeleteDepartment(department.id)"
                >
                  <Icon name="mdi:delete" class="w-5 h-5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модальное окно для создания/редактирования департамента -->
    <Modal 
      v-if="isEditModalOpen" 
      :title="modalMode === 'create' ? 'Создание департамента' : 'Редактирование департамента'"
      @close="isEditModalOpen = false"
      :z-index="50"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Название департамента <span class="text-red-500">*</span></label>
          <input 
            v-model="departmentForm.title" 
            placeholder="Введите название департамента" 
            class="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="departmentForm.isPublic" 
              class="h-4 w-4 text-blue-600 rounded"
            />
            <span class="ml-2 text-sm text-gray-700">Публичный департамент</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">Публичные департаменты видны всем пользователям</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Текст при вступлении</label>
          <textarea
            v-model="departmentForm.joinText"
            placeholder="Введите текст, который будет показан пользователю при вступлении в департамент"
            rows="4"
            class="w-full border rounded-md px-3 py-2"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button 
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
            @click="isEditModalOpen = false"
          >
            Отмена
          </button>
          <button 
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
            @click="saveDepartment"
          >
            <Icon v-if="isLoading" name="mdi:loading" class="animate-spin mr-2 w-4 h-4" />
            {{ modalMode === 'create' ? 'Создать' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </Modal>

    <!-- Модальное окно для управления начальниками департамента -->
    <Modal 
      v-if="isManageAdminsModalOpen" 
      title="Управление начальниками департамента"
      @close="closeManageAdminsModal"
      :max-width="'700px'"
      :z-index="55"
    >
      <div v-if="currentDepartmentForAdmins" class="space-y-4">
        <h3 class="text-lg font-medium">{{ currentDepartmentForAdmins.title }}</h3>
        
        <!-- Текущие начальники -->
        <div>
          <h4 class="font-medium text-gray-700 mb-2">Текущие начальники</h4>
          <div v-if="currentDepartmentForAdmins.Admins && currentDepartmentForAdmins.Admins.length > 0" class="space-y-2">
            <div v-for="admin in currentDepartmentForAdmins.Admins" :key="admin.id" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <span class="font-medium">{{ admin.fullName }}</span>
                <span v-if="admin.spiritualName" class="text-gray-500 ml-1">({{ admin.spiritualName }})</span>
                <div class="text-sm text-gray-500">{{ admin.email }}</div>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  class="text-xs bg-red-100 hover:bg-red-200 text-red-700 p-1 rounded"
                  @click="confirmRemoveAdmin(currentDepartmentForAdmins.id, admin.id)"
                >
                  <Icon name="mdi:close" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500 italic p-2">
            Нет начальников
          </div>
        </div>
        
        <!-- Добавление нового начальника -->
        <div class="mt-6">
          <h4 class="font-medium text-gray-700 mb-2">Добавить нового начальника</h4>
          
          <div class="relative">
            <input
              v-model="searchQuery"
              placeholder="Поиск пользователя..."
              class="w-full border rounded-md px-3 py-2 pr-8"
            />
            <Icon 
              v-if="isSearching" 
              name="mdi:loading" 
              class="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin w-4 h-4" 
            />
            <Icon 
              v-else 
              name="mdi:magnify" 
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" 
            />
          </div>
          
          <div v-if="searchResults.length > 0" class="mt-4 border rounded max-h-60 overflow-y-auto">
            <div 
              v-for="user in searchResults" 
              :key="user.id" 
              class="p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b last:border-b-0"
              @click="addAdmin(user.id)"
            >
              <div>
                <div class="font-medium">{{ user.fullName }}</div>
                <div class="text-sm text-gray-500">{{ user.email }}</div>
              </div>
              <button class="text-xs bg-green-500 hover:bg-green-600 text-white p-1 rounded">
                <Icon name="mdi:plus" class="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div v-else-if="searchQuery.length >= 2 && !isSearching" class="mt-4 text-gray-500 text-center p-2 border rounded">
            Пользователи не найдены
          </div>
          
          <div v-else-if="searchQuery.length > 0 && searchQuery.length < 2" class="mt-4 text-gray-500 text-center p-2 border rounded">
            Введите не менее 2 символов для поиска
          </div>
        </div>
        
        <div class="flex justify-end mt-6">
          <button 
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
            @click="closeManageAdminsModal"
          >
            Закрыть
          </button>
        </div>
      </div>
    </Modal>

    <!-- Модальное окно подтверждения удаления департамента -->
    <ConfirmDialog
      :is-open="isDeleteConfirmOpen"
      title="Удаление департамента"
      message="Вы уверены, что хотите удалить этот департамент? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="deleteDepartment"
      @cancel="cancelDeleteDepartment"
      :z-index="60"
    />

    <!-- Модальное окно подтверждения удаления начальника -->
    <ConfirmDialog
      :is-open="isRemoveAdminConfirmOpen"
      title="Удаление начальника"
      message="Вы уверены, что хотите удалить этого начальника из департамента?"
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="removeAdmin"
      @cancel="cancelRemoveAdmin"
      :z-index="60"
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style> 