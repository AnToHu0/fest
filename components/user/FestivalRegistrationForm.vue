<script setup lang="ts">
import type { Festival, FestivalDepartment } from '~/types/festival';
import type { User } from '~/types/user';
import type { FestivalRegistrationFormData } from '~/types/registration';
import { ref, computed, watch, onMounted } from 'vue';
import MultiSelect from '~/components/ui/MultiSelect.vue';

const props = defineProps<{
  festival: Festival;
  userId?: number;
  initialData?: FestivalRegistration;
  showFestivalInfo?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [formData: FestivalRegistrationFormData];
  update: [formData: FestivalRegistrationFormData];
  delete: [];
}>();

// Состояние формы
const isLoading = ref(false);
const children = ref<User[]>([]);
const hasChildren = computed(() => children.value.length > 0);
const departments = computed(() => {
  return props.festival.Departments || props.festival.departments || [];
});
const hasDepartments = computed(() => {
  return departments.value.length > 0;
});

// Формирование начальных и конечных дат для выбора
const minArrivalDate = computed(() => {
  // Пользователь может приехать немного раньше даты начала фестиваля (за 7 дней)
  const date = new Date(props.festival.startDate);
  date.setDate(date.getDate() - 7);
  return date.toISOString().split('T')[0];
});

const maxDepartureDate = computed(() => {
  // Пользователь может уехать немного позже даты окончания фестиваля (через 7 дней)
  const date = new Date(props.festival.endDate);
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
});

// Данные формы
const formData = ref<FestivalRegistrationFormData>({
  arrivalDate: '',
  departureDate: '',
  hasCar: false,
  freeSeatsInCar: 0,
  hasPet: false,
  notes: '',
  departmentIds: [],
  children: []
});

// Инициализация формы
onMounted(async () => {
  await fetchChildren();
  
  if (props.initialData) {
    // Если есть начальные данные, используем их
    formData.value = {
      arrivalDate: new Date(props.initialData.arrivalDate).toISOString().split('T')[0],
      departureDate: new Date(props.initialData.departureDate).toISOString().split('T')[0],
      hasCar: props.initialData.hasCar,
      freeSeatsInCar: props.initialData.freeSeatsInCar,
      hasPet: props.initialData.hasPet,
      notes: props.initialData.notes,
      departmentIds: props.initialData.departmentIds || [],
      children: props.initialData.children?.map(child => ({
        id: child.id,
        needsSeparateBed: child.needsSeparateBed
      })) || []
    };
  } else {
    // Иначе используем даты фестиваля как начальные значения
    formData.value = {
      arrivalDate: new Date(props.festival.startDate).toISOString().split('T')[0],
      departureDate: new Date(props.festival.endDate).toISOString().split('T')[0],
      hasCar: false,
      freeSeatsInCar: 0,
      hasPet: false,
      notes: '',
      departmentIds: [],
      children: []
    };
  }
});

// Загрузка списка детей пользователя
const fetchChildren = async () => {
  isLoading.value = true;
  try {
    const endpoint = props.userId 
      ? `/api/user/${props.userId}/children`
      : '/api/user/children';
      
    const { data } = await useFetch(endpoint);
    if (data.value) {
      children.value = data.value;
    }
  } catch (error) {
    console.error('Ошибка при загрузке списка детей:', error);
  } finally {
    isLoading.value = false;
  }
};

// Обработчик отправки формы для новой регистрации
const handleSubmit = async () => {
  emit('submit', formData.value);
};

// Обработчик отправки формы для обновления
const handleUpdate = async () => {
  emit('update', formData.value);
};

// Обработчик закрытия формы
const handleClose = () => {
  emit('close');
};

// Обработчик выбора ребенка
const toggleChild = (childId: number) => {
  const index = formData.value.children.findIndex(c => c.id === childId);
  if (index === -1) {
    formData.value.children.push({ id: childId, needsSeparateBed: false });
  } else {
    formData.value.children.splice(index, 1);
  }
};

// Обработчик изменения флага отдельной кровати
const toggleSeparateBed = (childId: number) => {
  const child = formData.value.children.find(c => c.id === childId);
  if (child) {
    child.needsSeparateBed = !child.needsSeparateBed;
  }
};

// Проверка, выбран ли ребенок
const isChildSelected = (childId: number) => {
  return formData.value.children.some(c => c.id === childId);
};

// Получение флага отдельной кровати для ребенка
const getChildSeparateBed = (childId: number) => {
  const child = formData.value.children.find(c => c.id === childId);
  return child ? child.needsSeparateBed : false;
};

// Обработчик изменения флага наличия автомобиля
watch(() => formData.value.hasCar, (hasCar) => {
  if (!hasCar) {
    formData.value.freeSeatsInCar = 0;
  }
});

// Преобразуем департаменты в формат для мультиселекта
const departmentOptions = computed(() => {
  return departments.value.map(dept => ({
    id: dept.id,
    label: dept.title
  }));
});
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <!-- Информация о фестивале -->
    <div v-if="showFestivalInfo" class="mb-6 p-4 bg-purple-50 rounded-lg">
      <h3 class="text-lg font-medium text-purple-800 mb-2">Информация о фестивале</h3>
      <p class="text-sm text-gray-700 mb-2">
        <span class="font-medium">Даты проведения:</span> 
        {{ new Date(festival.startDate).toLocaleDateString('ru-RU') }} - 
        {{ new Date(festival.endDate).toLocaleDateString('ru-RU') }}
      </p>
      <p v-if="festival.announcementText" class="text-sm text-gray-700">
        {{ festival.announcementText }}
      </p>
    </div>
    
    <!-- Даты заезда и выезда -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Дата заезда *</label>
        <input 
          :value="formData.arrivalDate"
          @input="(e) => formData.arrivalDate = (e.target as HTMLInputElement).value"
          type="date" 
          :min="minArrivalDate"
          :max="formData.departureDate"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Дата выезда *</label>
        <input 
          :value="formData.departureDate"
          @input="(e) => formData.departureDate = (e.target as HTMLInputElement).value"
          type="date" 
          :min="formData.arrivalDate"
          :max="maxDepartureDate"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
    </div>
    
    <!-- Информация о транспорте -->
    <div class="mb-6">
      <h3 class="text-lg font-medium text-gray-800 mb-3">Информация о транспорте</h3>
      
      <div class="flex items-center mb-3">
        <input 
          v-model="formData.hasCar"
          type="checkbox" 
          id="hasCar"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label for="hasCar" class="ml-2 text-sm text-gray-700">
          Я приеду на автомобиле
        </label>
      </div>
      
      <div v-if="formData.hasCar" class="ml-6">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Количество свободных мест в автомобиле
        </label>
        <input 
          v-model.number="formData.freeSeatsInCar"
          type="number"
          min="0"
          max="10"
          class="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
    
    <!-- Информация о животных -->
    <div class="mb-6">
      <div class="flex items-center">
        <input 
          v-model="formData.hasPet"
          type="checkbox" 
          id="hasPet"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label for="hasPet" class="ml-2 text-sm text-gray-700">
          Я приеду с домашним животным
        </label>
      </div>
    </div>
    
    <!-- Выбор департаментов -->
    <div v-if="hasDepartments" class="mb-6">
      <h3 class="text-lg font-medium text-gray-800 mb-3">Выбор департаментов</h3>
      <MultiSelect
        v-model="formData.departmentIds"
        :options="departmentOptions"
        label="Департаменты"
        placeholder="Выберите департаменты"
      />
      <div class="mt-2 text-sm text-gray-500">
        Выберите департаменты, в которых вы хотели бы служить во время фестиваля
      </div>
    </div>
    
    <!-- Информация о детях -->
    <div v-if="hasChildren" class="mb-6">
      <h3 class="text-lg font-medium text-gray-800 mb-3">Информация о детях</h3>
      <div class="space-y-3">
        <div v-for="child in children" :key="child.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center">
            <input 
              :checked="isChildSelected(child.id)"
              @change="toggleChild(child.id)"
              type="checkbox" 
              :id="'child-' + child.id"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label :for="'child-' + child.id" class="ml-2 text-sm text-gray-700">
              {{ child.fullName }}
            </label>
          </div>
          
          <div v-if="isChildSelected(child.id)" class="flex items-center">
            <input 
              :checked="getChildSeparateBed(child.id)"
              @change="toggleSeparateBed(child.id)"
              type="checkbox" 
              :id="'child-bed-' + child.id"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label :for="'child-bed-' + child.id" class="ml-2 text-sm text-gray-700">
              Нужна отдельная кровать
            </label>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Дополнительные примечания -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-1">Дополнительные примечания</label>
      <textarea 
        v-model="formData.notes"
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Укажите любую дополнительную информацию, которую нам следует знать"
      ></textarea>
    </div>
    
    <!-- Кнопки -->
    <div class="flex justify-between space-x-3">
      <!-- Кнопка удаления (показывается только при редактировании) -->
      <div>
        <button 
          v-if="props.initialData"
          type="button"
          @click="$emit('delete')"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Удалить регистрацию
        </button>
      </div>

      <!-- Правая группа кнопок -->
      <div class="flex space-x-3">
        <button 
          type="button"
          @click="handleClose"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Отмена
        </button>
        
        <!-- Кнопка регистрации (показывается только для новой регистрации) -->
        <button 
          v-if="!props.initialData"
          type="button"
          @click="handleSubmit"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Зарегистрироваться
        </button>
        
        <!-- Кнопка сохранения изменений (показывается только при редактировании) -->
        <button 
          v-if="props.initialData"
          type="button"
          @click="handleUpdate"
          class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Сохранить изменения
        </button>
      </div>
    </div>
  </form>
</template> 