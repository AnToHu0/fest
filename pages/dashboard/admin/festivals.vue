<script setup lang="ts">
import type { Festival, FestivalFormData } from '~/types/festival';
import FestivalCard from '~/components/admin/FestivalCard.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

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
  
  // Сброс формы и автоматический выбор всех департаментов
  formData.value = {
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
    departments: departments.value.map(dept => dept.id) // Выбираем все департаменты по умолчанию
  };
  
  showModal.value = true;
};

// Открытие модального окна для редактирования фестиваля
const openEditModal = (festival: Festival) => {
  isEditing.value = true;
  currentFestival.value = festival;
  
  // Получаем департаменты с учетом возможных вариантов имени свойства
  const festivalDepartments = festival.departments || festival.Departments || [];
  
  // Заполнение формы данными фестиваля
  formData.value = {
    startDate: festival.startDate.split('T')[0],
    endDate: festival.endDate.split('T')[0],
    isActive: festival.isActive,
    availableBuildings: [...festival.availableBuildings],
    announcementText: festival.announcementText,
    year: festival.year,
    adultPrice: festival.adultPrice,
    teenPrice: festival.teenPrice,
    childPrice: festival.childPrice,
    petPrice: festival.petPrice,
    carPrice: festival.carPrice,
    departments: festivalDepartments.map(d => d.id)
  };
  
  showModal.value = true;
};

// Закрытие модального окна
const closeModal = () => {
  showModal.value = false;
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
const saveFestival = async () => {
  if (!formData.value.startDate || !formData.value.endDate || !formData.value.year) {
    alert('Пожалуйста, заполните все обязательные поля');
    return;
  }
  
  isLoading.value = true;
  
  try {
    if (isEditing.value && currentFestival.value) {
      // Обновление существующего фестиваля
      const response = await $fetch(`/api/admin/festivals/${currentFestival.value.id}`, {
        method: 'PUT',
        body: formData.value
      });
      
      if (response.success) {
        await refreshData();
        closeModal();
      }
    } else {
      // Создание нового фестиваля
      const response = await $fetch('/api/admin/festivals', {
        method: 'POST',
        body: formData.value
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
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold text-gray-800">
                {{ isEditing ? 'Редактирование фестиваля' : 'Создание нового фестиваля' }}
              </h2>
              <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
                <Icon name="mdi:close" class="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div class="p-6">
            <form @submit.prevent="saveFestival">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <!-- Основная информация -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Год фестиваля *</label>
                  <input 
                    v-model.number="formData.year"
                    type="number" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                  <div class="flex items-center">
                    <input 
                      v-model="formData.isActive"
                      type="checkbox" 
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span class="ml-2 text-sm text-gray-700">Активный фестиваль</span>
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Дата начала *</label>
                  <input 
                    v-model="formData.startDate"
                    type="date" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Дата окончания *</label>
                  <input 
                    v-model="formData.endDate"
                    type="date" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <!-- Стоимость участия -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Стоимость для взрослого</label>
                  <input 
                    v-model.number="formData.adultPrice"
                    type="number" 
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Стоимость для подростка</label>
                  <input 
                    v-model.number="formData.teenPrice"
                    type="number" 
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Стоимость для ребенка</label>
                  <input 
                    v-model.number="formData.childPrice"
                    type="number" 
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Стоимость для животного</label>
                  <input 
                    v-model.number="formData.petPrice"
                    type="number" 
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Стоимость за автомобиль</label>
                  <input 
                    v-model.number="formData.carPrice"
                    type="number" 
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <!-- Доступные корпуса -->
              <div class="mb-6 relative" ref="buildingsDropdownRef">
                <label class="block text-sm font-medium text-gray-700 mb-1">Доступные корпуса</label>
                <div 
                  @click="showBuildingsDropdown = !showBuildingsDropdown"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex justify-between items-center"
                >
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-if="formData.availableBuildings.length === 0" 
                      class="text-gray-500"
                    >
                      Выберите корпуса
                    </span>
                    <span 
                      v-else
                      v-for="building in formData.availableBuildings" 
                      :key="building"
                      class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center"
                    >
                      Корпус {{ building }}
                      <button 
                        type="button"
                        @click="removeBuilding(building, $event)" 
                        class="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                      >
                        <Icon name="mdi:close-circle" class="w-4 h-4" />
                      </button>
                    </span>
                  </div>
                  <Icon 
                    :name="showBuildingsDropdown ? 'mdi:chevron-up' : 'mdi:chevron-down'" 
                    class="w-5 h-5 text-gray-500"
                  />
                </div>
                
                <div 
                  v-if="showBuildingsDropdown"
                  class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  <div class="p-2">
                    <div 
                      v-for="building in buildings" 
                      :key="building"
                      @click="toggleBuilding(building)"
                      class="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md"
                    >
                      <div 
                        class="w-4 h-4 border rounded mr-2 flex items-center justify-center"
                        :class="{ 'bg-blue-500 border-blue-500': isBuildingSelected(building), 'border-gray-300': !isBuildingSelected(building) }"
                      >
                        <Icon 
                          v-if="isBuildingSelected(building)"
                          name="mdi:check" 
                          class="w-3 h-3 text-white"
                        />
                      </div>
                      <span>Корпус {{ building }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Департаменты -->
              <div class="mb-6 relative" ref="departmentsDropdownRef">
                <label class="block text-sm font-medium text-gray-700 mb-1">Департаменты</label>
                <div 
                  @click="showDepartmentsDropdown = !showDepartmentsDropdown"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex justify-between items-center"
                >
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-if="formData.departments?.length === 0" 
                      class="text-gray-500"
                    >
                      Выберите департаменты
                    </span>
                    <span 
                      v-else
                      v-for="deptId in formData.departments" 
                      :key="deptId"
                      class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center"
                    >
                      {{ getDepartmentTitle(deptId) }}
                      <button 
                        type="button"
                        @click="removeDepartment(deptId, $event)" 
                        class="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                      >
                        <Icon name="mdi:close-circle" class="w-4 h-4" />
                      </button>
                    </span>
                  </div>
                  <Icon 
                    :name="showDepartmentsDropdown ? 'mdi:chevron-up' : 'mdi:chevron-down'" 
                    class="w-5 h-5 text-gray-500"
                  />
                </div>
                
                <div 
                  v-if="showDepartmentsDropdown"
                  class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  <div class="p-2">
                    <div 
                      v-for="dept in departments" 
                      :key="dept.id"
                      @click="toggleDepartment(dept.id)"
                      class="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md"
                    >
                      <div 
                        class="w-4 h-4 border rounded mr-2 flex items-center justify-center"
                        :class="{ 'bg-blue-500 border-blue-500': isDepartmentSelected(dept.id), 'border-gray-300': !isDepartmentSelected(dept.id) }"
                      >
                        <Icon 
                          v-if="isDepartmentSelected(dept.id)"
                          name="mdi:check" 
                          class="w-3 h-3 text-white"
                        />
                      </div>
                      <span>{{ dept.title }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Текст анонса -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-1">Текст анонса</label>
                <textarea 
                  v-model="formData.announcementText"
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите текст анонса фестиваля"
                ></textarea>
              </div>
              
              <div class="flex justify-end space-x-3">
                <button 
                  type="button"
                  @click="closeModal"
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button 
                  type="submit"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  :disabled="isLoading"
                >
                  <span v-if="isLoading" class="mr-2">
                    <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  </span>
                  {{ isEditing ? 'Сохранить изменения' : 'Создать фестиваль' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
    
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