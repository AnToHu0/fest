<script setup lang="ts">
import type { Festival, FestivalDepartment } from '~/types/festival';
import type { User } from '~/types/user';
import type { FestivalRegistrationFormData } from '~/types/registration';
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import MultiSelect from '~/components/ui/MultiSelect.vue';

const props = defineProps<{
  festival: Festival;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [formData: FestivalRegistrationFormData];
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
const modalRef = ref<HTMLElement | null>(null);

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

// Инициализация формы при изменении фестиваля
const initForm = () => {
  if (props.festival) {
    const arrivalDate = props.festival.startDate.split('T')[0];
    const departureDate = props.festival.endDate.split('T')[0];
    
    formData.value = {
      arrivalDate,
      departureDate,
      hasCar: false,
      freeSeatsInCar: 0,
      hasPet: false,
      notes: '',
      departmentIds: [],
      children: []
    };
  }
};

// Обработчик клика вне модального окна
const handleClickOutside = (event: MouseEvent) => {
  if (modalRef.value && !modalRef.value.contains(event.target as Node)) {
    handleClose();
  }
};

// Добавляем и удаляем обработчик клика при монтировании/размонтировании компонента
onMounted(() => {
  initForm();
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

// Сбрасываем форму при изменении фестиваля
watch(() => props.festival, () => {
  initForm();
}, { immediate: true });

// Загрузка списка детей пользователя
const fetchChildren = async () => {
  isLoading.value = true;
  try {
    const { data } = await useFetch('/api/user/children');
    if (data.value) {
      children.value = data.value;
    }
  } catch (error) {
    console.error('Ошибка при загрузке списка детей:', error);
  } finally {
    isLoading.value = false;
  }
};

// Обработчик отправки формы
const handleSubmit = async () => {
  emit('submit', formData.value);
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

// Загрузка данных при открытии формы
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    initForm();
    fetchChildren();
  }
}, { immediate: true });

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
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div ref="modalRef" class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-800">
            Регистрация на фестиваль {{ festival.year }}
          </h2>
          <button @click="handleClose" class="text-gray-500 hover:text-gray-700">
            <Icon name="mdi:close" class="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div class="p-6">
        <form @submit.prevent="handleSubmit">
          <!-- Информация о фестивале -->
          <div class="mb-6 p-4 bg-purple-50 rounded-lg">
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
                class="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p class="text-xs text-gray-500 mt-1">
                Укажите, сколько человек вы готовы подвезти
              </p>
            </div>
            
            <div class="flex items-center mt-4">
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
          
          <!-- Выбор департаментов для служения -->
          <div v-if="hasDepartments" class="mb-6">
            <h3 class="text-lg font-medium text-gray-800 mb-3">Служение в департаментах</h3>
            <p class="text-sm text-gray-600 mb-3">
              Выберите департаменты, в которых вы хотели бы служить во время фестиваля
            </p>
            
            <div class="mb-2 text-xs text-gray-500">
              Доступно департаментов: {{ departments.length }}
            </div>
            
            <MultiSelect
              label="Департаменты"
              :options="departmentOptions"
              v-model="formData.departmentIds"
              placeholder="Выберите департаменты"
            />
          </div>
          
          <!-- Выбор детей -->
          <div v-if="hasChildren" class="mb-6">
            <h3 class="text-lg font-medium text-gray-800 mb-3">Дети</h3>
            <p class="text-sm text-gray-600 mb-3">
              Выберите детей, которые поедут с вами на фестиваль
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                v-for="child in children" 
                :key="child.id"
                class="border rounded-lg p-4 hover:bg-gray-50"
                :class="{ 'border-blue-500 bg-blue-50': isChildSelected(child.id), 'border-gray-200': !isChildSelected(child.id) }"
              >
                <div class="flex items-start">
                  <div class="flex-shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      :checked="isChildSelected(child.id)"
                      @change="toggleChild(child.id)"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div class="ml-3 flex-1">
                    <div class="text-sm font-medium text-gray-900">{{ child.fullName }}</div>
                    <div class="text-xs text-gray-500 mt-1">
                      {{ child.birthDate ? new Date(child.birthDate).toLocaleDateString('ru-RU') : 'Дата рождения не указана' }}
                    </div>
                    
                    <div class="mt-3 flex items-center" :class="{ 'opacity-50': !isChildSelected(child.id) }">
                      <input 
                        type="checkbox" 
                        :id="`bed-${child.id}`"
                        :checked="getChildSeparateBed(child.id)"
                        @change="toggleSeparateBed(child.id)"
                        :disabled="!isChildSelected(child.id)"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label :for="`bed-${child.id}`" class="ml-2 text-sm text-gray-700">
                        Требуется отдельная кровать
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Дополнительные замечания -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">Дополнительные замечания</label>
            <textarea 
              v-model="formData.notes"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Укажите любую дополнительную информацию, которая может быть полезна организаторам"
            ></textarea>
          </div>
          
          <!-- Кнопки формы -->
          <div class="flex justify-end space-x-3">
            <button 
              type="button"
              @click="handleClose"
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
              Зарегистрироваться
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template> 