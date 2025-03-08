<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import Modal from '~/components/ui/Modal.vue';
import Loader from '~/components/ui/Loader.vue';
import ChildForm from './ChildForm.vue';
import type { Child, User } from '~/types/user';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

const props = defineProps({
  userId: {
    type: Number,
    required: true
  },
  parentData: {
    type: Object as () => User,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

// Состояние компонента
const children = ref<Child[]>([]);
const isLoading = ref(false);
const isModalOpen = ref(false);
const selectedChild = ref<Child | null>(null);
const errorMessage = ref('');
const deleteConfirmationOpen = ref(false);
const childToDelete = ref<Child | null>(null);

// Состояние диалога подтверждения удаления
const isConfirmDialogOpen = ref(false);

// Загрузка списка детей
const fetchChildren = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    // Выбираем эндпоинт в зависимости от того, чьих детей загружаем
    const endpoint = `/api/admin/users/${props.userId}/children`;
      
    const data = await $fetch<Child[]>(endpoint);
    children.value = data;
  } catch (error: any) {
    console.error('Ошибка при загрузке списка детей:', error);
    errorMessage.value = error.data?.message || 'Ошибка при загрузке списка детей';
  } finally {
    isLoading.value = false;
  }
};

// Расчет возраста ребенка
const calculateAge = (birthDate: string | null | undefined) => {
  if (!birthDate) return '';
  
  const today = new Date();
  const birthDateObj = new Date(birthDate);
  
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }
  
  return age;
};

// Форматирование даты
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU');
};

// Открытие модального окна для добавления ребенка
const openAddChildModal = () => {
  selectedChild.value = null;
  isModalOpen.value = true;
};

// Открытие модального окна для редактирования ребенка
const openEditChildModal = (child: Child) => {
  selectedChild.value = child;
  isModalOpen.value = true;
};

// Закрытие модального окна
const closeModal = () => {
  isModalOpen.value = false;
  selectedChild.value = null;
};

// Обработка успешного сохранения
const handleSaved = () => {
  closeModal();
  fetchChildren();
};

// Обработка удаления ребенка
const handleDelete = (child: Child) => {
  childToDelete.value = child;
  isConfirmDialogOpen.value = true;
};

// Подтверждение удаления ребенка
const confirmDelete = async () => {
  if (childToDelete.value) {
    isLoading.value = true;
    errorMessage.value = '';
    
    try {
      const url = props.isAdmin
        ? `/api/admin/users/${props.userId}/children/${childToDelete.value.id}`
        : `/api/user/children/${childToDelete.value.id}`;
        
      await $fetch(url, {
        method: 'DELETE'
      });
      
      fetchChildren();
    } catch (error: any) {
      console.error('Ошибка при удалении ребенка:', error);
      errorMessage.value = error.data?.message || 'Ошибка при удалении ребенка';
    } finally {
      isLoading.value = false;
    }
  }
  isConfirmDialogOpen.value = false;
  childToDelete.value = null;
};

// Отмена удаления ребенка
const cancelDelete = () => {
  isConfirmDialogOpen.value = false;
  childToDelete.value = null;
};

// Загрузка данных при монтировании компонента
onMounted(() => {
  fetchChildren();
});
</script>

<template>
  <div>
    <div v-if="errorMessage" class="p-3 bg-red-50 text-red-700 border border-red-200 rounded mb-4">
      {{ errorMessage }}
    </div>
    
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-gray-800">Список детей</h2>
      <button
        @click="openAddChildModal"
        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Добавить ребенка
      </button>
    </div>
    
    <div v-if="isLoading" class="flex justify-center py-8">
      <Loader size="lg" />
    </div>
    
    <div v-else-if="children.length === 0" class="py-8 text-center text-gray-500">
      <p>У вас пока нет добавленных детей</p>
      <p class="mt-2">Нажмите "Добавить ребенка", чтобы добавить информацию о ребенке</p>
    </div>
    
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ФИО
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Возраст
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Дата рождения
            </th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="child in children" :key="child.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">
                {{ child.fullName }}
              </div>
              <div v-if="child.spiritualName" class="text-sm text-gray-500">
                {{ child.spiritualName }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ calculateAge(child.birthDate) }} лет
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(child.birthDate) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="openEditChildModal(child)"
                class="text-blue-600 hover:text-blue-900 mr-3"
                title="Редактировать"
              >
                <Icon name="mdi:pencil" class="w-5 h-5" />
              </button>
              <button
                @click="handleDelete(child)"
                class="text-red-600 hover:text-red-900"
                title="Удалить"
              >
                <Icon name="mdi:delete" class="w-5 h-5" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Модальное окно для добавления/редактирования ребенка -->
    <Modal
      v-if="isModalOpen"
      :title="selectedChild ? 'Редактирование данных ребенка' : 'Добавление ребенка'"
      @close="closeModal"
    >
      <ChildForm
        :parentId="userId"
        :parentData="parentData"
        :childData="selectedChild"
        :isAdmin="isAdmin"
        @saved="handleSaved"
        @cancel="closeModal"
      />
    </Modal>
    
    <!-- Диалог подтверждения удаления -->
    <ConfirmDialog
      :is-open="isConfirmDialogOpen"
      title="Удаление ребенка"
      :message="childToDelete ? `Вы действительно хотите удалить ребенка ${childToDelete.fullName}?` : ''"
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template> 