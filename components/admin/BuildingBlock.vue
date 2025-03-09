<script setup lang="ts">
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

const props = defineProps({
  building: {
    type: Number,
    required: true
  },
  rooms: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['edit', 'delete', 'add']);

// Состояние для фильтров
const filterFloor = ref<number | null>(null);
const filterSize = ref<number | null>(null);

// Состояние для пагинации
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Получение уникальных значений этажей для фильтра
const availableFloors = computed(() => {
  const floors = new Set<number>();
  props.rooms.forEach(room => {
    if (room && room.floor !== undefined && room.floor !== null) {
      floors.add(Number(room.floor));
    }
  });
  return Array.from(floors).sort((a, b) => a - b);
});

// Получение уникальных значений вместимости для фильтра
const availableSizes = computed(() => {
  const sizes = new Set<number>();
  props.rooms.forEach(room => {
    if (room && room.size !== undefined && room.size !== null) {
      sizes.add(Number(room.size));
    }
  });
  return Array.from(sizes).sort((a, b) => a - b);
});

// Фильтрация комнат
const filteredRooms = computed(() => {
  return props.rooms.filter(room => {
    // Фильтр по этажу
    if (filterFloor.value !== null && Number(room.floor) !== filterFloor.value) {
      return false;
    }
    
    // Фильтр по вместимости
    if (filterSize.value !== null && Number(room.size) !== filterSize.value) {
      return false;
    }
    
    return true;
  });
});

// Пагинация комнат
const paginatedRooms = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return filteredRooms.value.slice(startIndex, endIndex);
});

// Общее количество страниц для пагинации
const totalPages = computed(() => {
  return Math.ceil(filteredRooms.value.length / itemsPerPage.value) || 1;
});

// Сброс фильтров
const resetFilters = () => {
  filterFloor.value = null;
  filterSize.value = null;
  currentPage.value = 1;
  
  // Очищаем сохраненные фильтры
  if (typeof window !== 'undefined') {
    localStorage.removeItem(buildingKey.value);
  }
};

// Обработчики событий
const handleEdit = (room) => {
  emit('edit', room);
};

const handleDelete = (roomId) => {
  emit('delete', roomId);
};

const handleAddRoom = () => {
  emit('add', props.building);
};

// Сохраняем состояние фильтров при обновлении входных данных
const buildingKey = computed(() => `building-${props.building}`);

// Используем localStorage для сохранения состояния фильтров
const saveFilters = () => {
  if (typeof window !== 'undefined') {
    const filterState = {
      floor: filterFloor.value,
      size: filterSize.value,
      page: currentPage.value
    };
    localStorage.setItem(buildingKey.value, JSON.stringify(filterState));
  }
};

// Загружаем сохраненные фильтры при монтировании компонента
onMounted(() => {
  if (typeof window !== 'undefined') {
    try {
      const savedState = localStorage.getItem(buildingKey.value);
      if (savedState) {
        const { floor, size, page } = JSON.parse(savedState);
        filterFloor.value = floor;
        filterSize.value = size;
        currentPage.value = page || 1;
      }
    } catch (e) {
      console.error('Ошибка при загрузке сохраненных фильтров:', e);
    }
  }
});

// Сохраняем фильтры при их изменении
watch([filterFloor, filterSize, currentPage], saveFilters);
</script>

<template>
  <div class="bg-white rounded-lg shadow overflow-hidden mb-6">
    <div class="bg-gray-100 p-4 border-b flex justify-between items-center">
      <h2 class="text-xl font-semibold">Корпус {{ building }}</h2>
      
      <button 
        @click="handleAddRoom" 
        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition-colors flex items-center text-sm"
      >
        <Icon name="mdi:plus" class="w-4 h-4 mr-1" />
        Добавить комнату
      </button>
    </div>
    
    <div class="p-4 border-b">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Фильтр по этажу -->
        <div class="w-full sm:w-auto">
          <label :for="`floor-filter-${building}`" class="block text-sm font-medium text-gray-700 mb-1">Этаж</label>
          <select 
            :id="`floor-filter-${building}`" 
            v-model="filterFloor" 
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option :value="null">Все этажи</option>
            <option v-for="floor in availableFloors" :key="floor" :value="floor">{{ floor }}</option>
          </select>
        </div>
        
        <!-- Фильтр по вместимости -->
        <div class="w-full sm:w-auto">
          <label :for="`size-filter-${building}`" class="block text-sm font-medium text-gray-700 mb-1">Вместимость</label>
          <select 
            :id="`size-filter-${building}`" 
            v-model="filterSize" 
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option :value="null">Любая вместимость</option>
            <option v-for="size in availableSizes" :key="size" :value="size">{{ size }} чел.</option>
          </select>
        </div>
        
        <!-- Кнопка сброса фильтров -->
        <div class="w-full sm:w-auto sm:ml-auto">
          <button 
            @click="resetFilters" 
            class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Этаж</th>
            <th class="px-6 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Номер</th>
            <th class="px-6 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Вместимость</th>
            <th class="px-6 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
            <th class="px-6 py-1.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="paginatedRooms.length === 0">
            <td colspan="5" class="px-6 py-2 text-center text-gray-500">
              Нет комнат, соответствующих фильтрам
            </td>
          </tr>
          <tr v-for="room in paginatedRooms" :key="room.id" class="hover:bg-gray-50">
            <td class="px-6 py-2 whitespace-nowrap">{{ room.floor }}</td>
            <td class="px-6 py-2 whitespace-nowrap">{{ room.number }}</td>
            <td class="px-6 py-2 whitespace-nowrap">{{ room.size }}</td>
            <td class="px-6 py-2">
              <div class="max-w-xs truncate">{{ room.description || '-' }}</div>
            </td>
            <td class="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-end gap-2">
                <button 
                  @click="handleEdit(room)" 
                  class="text-blue-600 hover:text-blue-900 p-1"
                  title="Редактировать"
                >
                  <Icon name="mdi:pencil" class="w-5 h-5" />
                </button>
                <button 
                  @click="handleDelete(room.id)" 
                  class="text-red-600 hover:text-red-900 p-1"
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
    <div v-if="totalPages > 1" class="flex justify-center p-4 border-t">
      <nav class="flex items-center space-x-2">
        <button 
          @click="currentPage = Math.max(1, currentPage - 1)" 
          :disabled="currentPage === 1"
          class="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="mdi:chevron-left" class="w-5 h-5" />
        </button>
        
        <div v-for="page in totalPages" :key="page" class="flex-shrink-0">
          <button 
            @click="currentPage = page" 
            :class="[
              'px-3 py-1 rounded border',
              currentPage === page 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            ]"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          @click="currentPage = Math.min(totalPages, currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="mdi:chevron-right" class="w-5 h-5" />
        </button>
      </nav>
    </div>
  </div>
</template> 