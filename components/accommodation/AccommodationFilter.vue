<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
      <!-- Фильтр по корпусу -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Корпус</label>
        <select 
          v-model="filters.building" 
          class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <option :value="null">Все корпуса</option>
          <option v-for="building in buildings" :key="building" :value="building">
            {{ building }}
          </option>
        </select>
      </div>

      <!-- Фильтр по этажу -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Этаж</label>
        <select 
          v-model="filters.floor" 
          class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <option :value="null">Все этажи</option>
          <option v-for="floor in floors" :key="floor" :value="floor">
            {{ floor }}
          </option>
        </select>
      </div>

      <!-- Фильтр по номеру комнаты -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Номер комнаты</label>
        <input 
          v-model.number="filters.number" 
          type="number" 
          placeholder="Введите номер"
          class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      <!-- Фильтр по занятости -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Статус комнат</label>
        <select 
          v-model="filters.occupancy" 
          class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <option value="all">Все комнаты</option>
          <option value="occupied">Занятые</option>
          <option value="available">Свободные</option>
        </select>
      </div>

      <!-- Поиск по имени/email/телефону -->
      <div class="md:col-span-2 relative">
        <label class="block text-sm font-medium text-gray-700">Поиск по ФИО/Email/Телефону</label>
        <div class="relative">
          <input 
            v-model="filters.searchUser" 
            type="text" 
            placeholder="Введите ФИО, email или телефон"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors pr-10"
          />
          <div v-if="filters.searchUser" class="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-400 hover:text-gray-600" @click="clearSearch">
            <Icon name="mdi:close-circle" class="w-5 h-5" />
          </div>
        </div>
      </div>

      <!-- Кнопка сброса всех фильтров -->
      <div class="flex justify-end items-center md:col-start-6 md:row-start-1 md:col-span-1">
        <button 
          @click="resetFilters" 
          class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-2"
          title="Сбросить все фильтры"
        >
          <Icon name="mdi:filter-remove" class="w-5 h-5" />
          <span>Сбросить</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';

// Определение типа для фильтров
interface FilterOptions {
  building: number | null;
  floor: number | null;
  number: number | null;
  occupancy: 'all' | 'occupied' | 'available';
  searchUser: string;
}

// Начальные значения фильтров
const defaultFilters: FilterOptions = {
  building: null,
  floor: null,
  number: null,
  occupancy: 'all',
  searchUser: '',
};

// Реактивное состояние фильтров
const filters = reactive<FilterOptions>({ ...defaultFilters });

// Списки доступных значений для выпадающих списков
const buildings = ref<number[]>([]);
const floors = ref<number[]>([]);

// Загрузка доступных значений для фильтров
const loadFilterOptions = async () => {
  try {
    // Получаем комнаты напрямую, они уже отфильтрованы по корпусам из активного фестиваля
    const response = await $fetch('/api/accommodation/rooms');
    
    // Получаем уникальные значения корпусов и этажей
    const uniqueBuildings = new Set<number>();
    const uniqueFloors = new Set<number>();
    
    response.rooms.forEach((room: any) => {
      uniqueBuildings.add(room.building);
      uniqueFloors.add(room.floor);
    });
    
    buildings.value = Array.from(uniqueBuildings).sort((a, b) => a - b);
    floors.value = Array.from(uniqueFloors).sort((a, b) => a - b);
    
    console.log('Доступные корпуса:', buildings.value);
    console.log('Доступные этажи:', floors.value);
  } catch (error) {
    console.error('Ошибка при загрузке опций фильтра:', error);
  }
};

// Сброс фильтров
const resetFilters = () => {
  Object.assign(filters, defaultFilters);
};

// Очистка поля поиска
const clearSearch = () => {
  filters.searchUser = '';
};

// Определение события для передачи фильтров родительскому компоненту
const emit = defineEmits<{
  (e: 'filter', filters: FilterOptions): void;
}>();

// Отслеживаем изменения всех фильтров и автоматически применяем их
watch(filters, (newFilters) => {
  emit('filter', { ...newFilters });
}, { deep: true });

// Загрузка опций фильтра при монтировании компонента
onMounted(() => {
  loadFilterOptions();
});
</script> 