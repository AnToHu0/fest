<script setup lang="ts">
import type { Festival, FestivalFormData } from '~/types/festival';

const props = defineProps<{
  isEditing: boolean;
  currentFestival: Festival | null;
  departments: { id: number; title: string }[];
  buildings: string[];
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  save: [data: FestivalFormData];
  cancel: [];
}>();

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

// Инициализация формы при редактировании
watchEffect(() => {
  if (props.isEditing && props.currentFestival) {
    const festival = props.currentFestival;
    const festivalDepartments = festival.departments || festival.Departments || [];
    
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
  } else {
    // Сброс формы для создания
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
      departments: props.departments.map(dept => dept.id)
    };
  }
});

// Обработчик клика вне выпадающих списков
const handleClickOutside = (event: MouseEvent) => {
  if (buildingsDropdownRef.value && !buildingsDropdownRef.value.contains(event.target as Node)) {
    showBuildingsDropdown.value = false;
  }
  if (departmentsDropdownRef.value && !departmentsDropdownRef.value.contains(event.target as Node)) {
    showDepartmentsDropdown.value = false;
  }
};

// Добавляем и удаляем обработчик при монтировании/размонтировании
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
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
  const dept = props.departments.find(d => d.id === deptId);
  return dept ? dept.title : '';
};

// Удаление корпуса напрямую
const removeBuilding = (building: string, event?: Event) => {
  if (event) {
    event.stopPropagation();
  }
  const index = formData.value.availableBuildings.indexOf(building);
  if (index !== -1) {
    formData.value.availableBuildings.splice(index, 1);
  }
};

// Удаление департамента напрямую
const removeDepartment = (deptId: number, event?: Event) => {
  if (event) {
    event.stopPropagation();
  }
  const index = formData.value.departments!.indexOf(deptId);
  if (index !== -1) {
    formData.value.departments!.splice(index, 1);
  }
};

// Обработчик отправки формы
const handleSubmit = () => {
  if (!formData.value.startDate || !formData.value.endDate || !formData.value.year) {
    alert('Пожалуйста, заполните все обязательные поля');
    return;
  }
  emit('save', formData.value);
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    <div class="relative" ref="buildingsDropdownRef">
      <label class="block text-sm font-medium text-gray-700 mb-1">Доступные корпуса</label>
      <div 
        @click="showBuildingsDropdown = !showBuildingsDropdown"
        class="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div class="flex flex-wrap gap-2">
          <div 
            v-for="building in formData.availableBuildings" 
            :key="building"
            class="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center"
          >
            <span>{{ building }}</span>
            <button 
              type="button"
              @click="removeBuilding(building, $event)"
              class="ml-1 text-blue-600 hover:text-blue-800"
            >
              <Icon name="mdi:close" class="w-4 h-4" />
            </button>
          </div>
          <div v-if="formData.availableBuildings.length === 0" class="text-gray-500 text-sm">
            Выберите корпуса
          </div>
        </div>
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
            <span>{{ building }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Департаменты -->
    <div class="relative" ref="departmentsDropdownRef">
      <label class="block text-sm font-medium text-gray-700 mb-1">Департаменты</label>
      <div 
        @click="showDepartmentsDropdown = !showDepartmentsDropdown"
        class="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div class="flex flex-wrap gap-2">
          <div 
            v-for="deptId in formData.departments" 
            :key="deptId"
            class="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center"
          >
            <span>{{ getDepartmentTitle(deptId) }}</span>
            <button 
              type="button"
              @click="removeDepartment(deptId, $event)"
              class="ml-1 text-blue-600 hover:text-blue-800"
            >
              <Icon name="mdi:close" class="w-4 h-4" />
            </button>
          </div>
          <div v-if="formData.departments.length === 0" class="text-gray-500 text-sm">
            Выберите департаменты
          </div>
        </div>
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
    <div>
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
        @click="emit('cancel')"
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
</template> 