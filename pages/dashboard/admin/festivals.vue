<script setup lang="ts">
import type { Festival, FestivalFormData } from '~/types/festival';
import FestivalCard from '~/components/admin/FestivalCard.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import FestivalForm from '~/components/admin/FestivalForm.vue';
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

// Состояние страницы
const isLoading = ref(false);
const festivals = ref<Festival[]>([]);
const departments = ref<{ id: number; title: string }[]>([]);
const buildings = ref<string[]>([]);
const showModal = ref(false);
const isEditing = ref(false);
const currentFestival = ref<Festival | null>(null);

// Состояние диалога подтверждения удаления
const showConfirmDialog = ref(false);
const festivalToDelete = ref<number | null>(null);

// Состояние выпадающих списков
const showBuildingsDropdown = ref(false);
const buildingsDropdownRef = ref<HTMLElement | null>(null);
const showDepartmentsDropdown = ref(false);
const departmentsDropdownRef = ref<HTMLElement | null>(null);

// Форма
const formData = ref<FestivalFormData>({
  startDate: '',
  endDate: '',
  isActive: false,
  availableBuildings: [],
  announcementText: '',
  year: new Date().getFullYear(),
  adultPrice: 0,
  teenPrice: 0,
  childPrice: 0,
  petPrice: 0,
  carPrice: 0,
  departments: []
});

// Загрузка данных фестивалей
const { data: festivalsData, pending: festivalsLoading } = await useFetch('/api/admin/festivals', {
  key: 'festivals-data',
  server: true,
  lazy: false
});

// Загрузка данных департаментов
const { data: departmentsData } = await useFetch('/api/admin/festivals/departments', {
  key: 'departments-data',
  server: true,
  lazy: false
});

// Загрузка данных корпусов
const { data: buildingsData } = await useFetch('/api/admin/festivals/buildings', {
  key: 'buildings-data',
  server: true,
  lazy: false
});

// Обновляем состояние на основе полученных данных
watch(festivalsData, (newData) => {
  if (newData?.success && newData.festivals) {
    festivals.value = newData.festivals;
  }
}, { immediate: true });

watch(departmentsData, (newData) => {
  if (newData?.success && newData.departments) {
    departments.value = newData.departments;
  }
}, { immediate: true });

watch(buildingsData, (newData) => {
  if (newData?.success && newData.buildings) {
    buildings.value = newData.buildings;
  }
}, { immediate: true });

// Отслеживаем состояние загрузки
watch(festivalsLoading, (loading) => {
  isLoading.value = loading;
}, { immediate: true });

// Обработчик клика вне выпадающих списков
const handleClickOutside = (event: MouseEvent) => {
  if (buildingsDropdownRef.value && !buildingsDropdownRef.value.contains(event.target as Node)) {
    showBuildingsDropdown.value = false;
  }
  if (departmentsDropdownRef.value && !departmentsDropdownRef.value.contains(event.target as Node)) {
    showDepartmentsDropdown.value = false;
  }
};

// Добавляем обработчик клика вне выпадающих списков при монтировании компонента
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  // Удаляем обработчик при размонтировании компонента
  document.removeEventListener('click', handleClickOutside);
});

// Переключение выбора корпуса
const toggleBuilding = (building: string) => {
  const index = formData.value.availableBuildings.indexOf(building);
  if (index === -1) {
    formData.value.availableBuildings.push(building);
  } else {
    formData.value.availableBuildings.splice(index, 1);
  }
};

// Проверка, выбран ли корпус
const isBuildingSelected = (building: string) => {
  return formData.value.availableBuildings.includes(building);
};

// Переключение выбора департамента
const toggleDepartment = (deptId: number) => {
  const index = formData.value.departments!.indexOf(deptId);
  if (index === -1) {
    formData.value.departments!.push(deptId);
  } else {
    formData.value.departments!.splice(index, 1);
  }
};

// Проверка, выбран ли департамент
const isDepartmentSelected = (deptId: number) => {
  return formData.value.departments!.includes(deptId);
};

// Получение названия департамента по ID
const getDepartmentTitle = (deptId: number) => {
  const dept = departments.value.find(d => d.id === deptId);
  return dept ? dept.title : '';
};

// Открытие модального окна для создания нового фестиваля
const openCreateModal = () => {
  isEditing.value = false;
  currentFestival.value = null;
  showModal.value = true;
};

// Открытие модального окна для редактирования фестиваля
const openEditModal = (festival: Festival) => {
  isEditing.value = true;
  currentFestival.value = festival;
  showModal.value = true;
};

// Закрытие модального окна
const closeModal = () => {
  showModal.value = false;
  currentFestival.value = null;
  isEditing.value = false;
};

// Обновление данных
const refreshData = async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      $fetch('/api/admin/festivals').then(data => {
        if (data.success && data.festivals) {
          festivals.value = data.festivals;
        }
      }),
      $fetch('/api/admin/festivals/departments').then(data => {
        if (data.success && data.departments) {
          departments.value = data.departments;
        }
      }),
      $fetch('/api/admin/festivals/buildings').then(data => {
        if (data.success && data.buildings) {
          buildings.value = data.buildings;
        }
      })
    ]);
  } catch (error) {
    console.error('Ошибка при обновлении данных:', error);
  } finally {
    isLoading.value = false;
  }
};

// Сохранение фестиваля
const saveFestival = async (formData: FestivalFormData) => {
  if (!formData.startDate || !formData.endDate || !formData.year) {
    alert('Пожалуйста, заполните все обязательные поля');
    return;
  }
  
  isLoading.value = true;
  
  try {
    if (isEditing.value && currentFestival.value) {
      // Обновление существующего фестиваля
      const response = await $fetch(`/api/admin/festivals/${currentFestival.value.id}`, {
        method: 'PUT',
        body: formData
      });
      
      if (response.success) {
        await refreshData();
        closeModal();
      }
    } else {
      // Создание нового фестиваля
      const response = await $fetch('/api/admin/festivals', {
        method: 'POST',
        body: formData
      });
      
      if (response.success) {
        await refreshData();
        closeModal();
      }
    }
  } catch (error) {
    console.error('Ошибка при сохранении фестиваля:', error);
    alert('Произошла ошибка при сохранении фестиваля');
  } finally {
    isLoading.value = false;
  }
};

// Открытие диалога подтверждения удаления
const confirmDelete = (id: number) => {
  festivalToDelete.value = id;
  showConfirmDialog.value = true;
};

// Отмена удаления
const cancelDelete = () => {
  festivalToDelete.value = null;
  showConfirmDialog.value = false;
};

// Подтверждение удаления
const confirmDeleteAction = async () => {
  if (festivalToDelete.value === null) return;
  
  isLoading.value = true;
  
  try {
    const response = await $fetch(`/api/admin/festivals/${festivalToDelete.value}`, {
      method: 'DELETE'
    });
    
    if (response.success) {
      await refreshData();
    }
  } catch (error) {
    console.error('Ошибка при удалении фестиваля:', error);
    alert('Произошла ошибка при удалении фестиваля');
  } finally {
    isLoading.value = false;
    showConfirmDialog.value = false;
    festivalToDelete.value = null;
  }
};

// Удаление корпуса напрямую
const removeBuilding = (building: string, event?: Event) => {
  if (event) {
    event.stopPropagation(); // Предотвращаем открытие/закрытие выпадающего списка
  }
  const index = formData.value.availableBuildings.indexOf(building);
  if (index !== -1) {
    formData.value.availableBuildings.splice(index, 1);
  }
};

// Удаление департамента напрямую
const removeDepartment = (deptId: number, event?: Event) => {
  if (event) {
    event.stopPropagation(); // Предотвращаем открытие/закрытие выпадающего списка
  }
  const index = formData.value.departments!.indexOf(deptId);
  if (index !== -1) {
    formData.value.departments!.splice(index, 1);
  }
};
</script>

<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-800">Управление фестивалями</h1>
      <button 
        @click="openCreateModal"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
      >
        <Icon name="mdi:plus" class="w-5 h-5 mr-1" />
        Добавить фестиваль
      </button>
    </div>
    
    <div v-if="isLoading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="festivals.length === 0" class="bg-white rounded-lg shadow p-6 text-center">
      <Icon name="mdi:calendar-blank" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">Нет фестивалей</h3>
      <p class="text-gray-500 mb-4">Создайте первый фестиваль, нажав на кнопку "Добавить фестиваль"</p>
      <button 
        @click="openCreateModal"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Добавить фестиваль
      </button>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <FestivalCard 
        v-for="festival in festivals" 
        :key="festival.id" 
        :festival="festival"
        @edit="openEditModal"
        @delete="confirmDelete"
      />
    </div>
    
    <!-- Модальное окно для создания/редактирования фестиваля -->
    <Modal
      v-if="showModal"
      :title="isEditing ? 'Редактирование фестиваля' : 'Создание нового фестиваля'"
      @close="closeModal"
      size="xl"
    >
      <FestivalForm
        :is-editing="isEditing"
        :current-festival="currentFestival"
        :departments="departments"
        :buildings="buildings"
        :is-loading="isLoading"
        @save="saveFestival"
        @cancel="closeModal"
      />
    </Modal>
    
    <!-- Диалог подтверждения удаления -->
    <ConfirmDialog
      :is-open="showConfirmDialog"
      title="Удаление фестиваля"
      message="Вы уверены, что хотите удалить этот фестиваль? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="confirmDeleteAction"
      @cancel="cancelDelete"
    />
  </div>
</template> 