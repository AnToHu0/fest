<template>
  <div class="bg-white rounded-lg shadow p-4">
    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>

    <!-- Нет данных -->
    <div v-else-if="!rooms.length" class="py-12 text-center text-gray-500">
      <p>Нет доступных комнат с указанными параметрами</p>
    </div>

    <!-- Таблица комнат -->
    <div v-else class="accommodation-timeline">
      <!-- Заголовок таблицы -->
      <div class="timeline-header grid grid-cols-[200px_1fr]">
        <div class="p-3 font-medium text-gray-700 bg-white sticky left-0 z-10">Комната</div>
        <div class="p-3 font-medium text-gray-700 overflow-x-auto" ref="timelineHeader" @scroll="onHeaderScroll">
          <div class="grid" :style="`grid-template-columns: repeat(${totalDays}, 100px); min-width: ${totalDays * 100}px;`">
            <template v-for="(day, index) in allDates" :key="index">
              <div :class="getDayClass(day)" class="text-center">
                {{ formatDate(day) }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Основная область таймлайна -->
      <div class="timeline-content overflow-auto" ref="timelineContent" @scroll="onContentScroll">
        <div v-for="room in paginatedRooms" :key="room.id" class="timeline-row">
          <!-- Для каждой комнаты создаем строки для каждого слота -->
          <div v-for="slot in room.size" :key="`${room.id}-${slot}`" class="timeline-slot">
            <!-- Информация о комнате (фиксированная часть) -->
            <div class="timeline-room-info sticky left-0 z-10 bg-white p-3 border-r border-gray-200" :style="`width: 200px;`">
              <template v-if="slot === 1">
                <div class="font-medium">Корпус {{ room.building }}, этаж {{ room.floor }}</div>
                <div class="text-sm text-gray-500">Комната {{ room.number }}</div>
              </template>
              <div class="text-sm">Место {{ slot }}</div>
            </div>
            
            <!-- Слот комнаты (прокручиваемая часть) -->
            <div class="timeline-slot-content">
              <div class="grid relative w-full" :style="`grid-template-columns: repeat(${totalDays}, 100px); min-width: ${totalDays * 100}px;`">
                <!-- Ячейки дней -->
                <div 
                  v-for="(day, index) in allDates" 
                  :key="`${room.id}-${slot}-${index}`" 
                  :class="getDayClass(day, true)"
                  class="rounded relative"
                  @click="handleCellClick(room.id, slot, day)"
                >
                  <!-- Иконка добавления при наведении -->
                  <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-gray-200 bg-opacity-50 rounded cursor-pointer">
                    <Icon name="mdi:plus" class="text-indigo-600" />
                  </div>
                </div>

                <!-- Размещения -->
                <div 
                  v-for="placement in getPlacementsForSlot(room, slot)" 
                  :key="placement.id"
                  :style="getPlacementStyle(placement)"
                  :class="getPlacementClass(placement)"
                  class="absolute rounded px-2 flex items-center cursor-pointer"
                  @click.stop="$emit('edit-placement', placement)"
                >
                  <div class="truncate text-sm">
                    {{ getUserName(placement) }}
                  </div>
                  <button 
                    @click.stop="$emit('delete-placement', placement.id)" 
                    class="ml-auto text-white opacity-0 group-hover:opacity-100"
                  >
                    <Icon name="mdi:close" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Пагинация -->
      <div class="mt-4 flex justify-between items-center">
        <div class="text-sm text-gray-600">
          Показано {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, rooms.length) }} из {{ rooms.length }} комнат
        </div>
        <div class="flex space-x-2">
          <button 
            @click="previousPage" 
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Назад
          </button>
          <span class="flex items-center px-2">
            Страница {{ currentPage }} из {{ totalPages }}
          </span>
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages"
            class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Вперед
          </button>
        </div>
        <div class="flex items-center space-x-2">
          <label class="text-sm text-gray-600">Комнат на странице:</label>
          <select 
            v-model="pageSize" 
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { PlacementStatus } from '~/types/accommodation';
import type { Room, Placement } from '~/types/accommodation';
import { getUserFullName } from './UserHelper';

// Определение входных параметров
const props = defineProps<{
  rooms: Room[];
  loading: boolean;
  festivalInfo: any;
}>();

// Определение событий
const emit = defineEmits<{
  (e: 'create-placement', roomId: number, slot: number, date?: Date): void;
  (e: 'edit-placement', placement: Placement): void;
  (e: 'delete-placement', placementId: number): void;
}>();

// Ссылки на DOM-элементы для синхронизации скролла
const timelineHeader = ref<HTMLElement | null>(null);
const timelineContent = ref<HTMLElement | null>(null);

// Флаг для предотвращения бесконечной синхронизации скролла
const isScrolling = ref(false);

// Данные фестиваля
const festival = ref<any>(null);
const festivalStartDate = ref<Date | null>(null);
const festivalEndDate = ref<Date | null>(null);

// Все даты для отображения (включая неделю до и неделю после фестиваля)
const allDates = ref<Date[]>([]);
const totalDays = computed(() => allDates.value.length);

// Параметры пагинации
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = computed(() => Math.ceil(props.rooms.length / pageSize.value));

// Вычисляем комнаты для текущей страницы
const paginatedRooms = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return props.rooms.slice(start, end);
});

// Методы пагинации
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// При изменении размера страницы сбрасываем текущую страницу
watch(pageSize, () => {
  currentPage.value = 1;
});

// При изменении списка комнат (например, при фильтрации) сбрасываем на первую страницу
watch(() => props.rooms, () => {
  currentPage.value = 1;
}, { deep: true });

// Обработчики скролла
const onHeaderScroll = (e: Event) => {
  if (isScrolling.value) return;
  isScrolling.value = true;
  
  if (timelineContent.value && e.target) {
    timelineContent.value.scrollLeft = (e.target as HTMLElement).scrollLeft;
  }
  
  setTimeout(() => {
    isScrolling.value = false;
  }, 10);
};

const onContentScroll = (e: Event) => {
  if (isScrolling.value) return;
  isScrolling.value = true;
  
  if (timelineHeader.value && e.target) {
    timelineHeader.value.scrollLeft = (e.target as HTMLElement).scrollLeft;
  }
  
  setTimeout(() => {
    isScrolling.value = false;
  }, 10);
};

// Загрузка данных активного фестиваля
const loadActiveFestival = () => {
  try {
    console.log('Информация о фестивале из пропса:', props.festivalInfo);
    
    if (props.festivalInfo) {
      festival.value = props.festivalInfo;
      console.log('Даты фестиваля:', festival.value.startDate, festival.value.endDate);
      
      // Преобразуем строковые даты в объекты Date, учитывая формат
      // Убеждаемся, что время установлено в начало дня (00:00)
      try {
        // Вариант 1: Пробуем использовать непосредственно Date
        festivalStartDate.value = new Date(festival.value.startDate);
        festivalEndDate.value = new Date(festival.value.endDate);
        
        // Сбрасываем время на начало дня
        festivalStartDate.value.setHours(0, 0, 0, 0);
        festivalEndDate.value.setHours(0, 0, 0, 0);
        
        console.log('Преобразованные даты (1):', 
          festivalStartDate.value.toISOString(), 
          festivalEndDate.value.toISOString()
        );
        
        // Проверяем, корректно ли преобразовались даты
        if (isNaN(festivalStartDate.value.getTime()) || isNaN(festivalEndDate.value.getTime())) {
          throw new Error('Некорректные даты');
        }
      } catch (e) {
        // Вариант 2: Парсим вручную компоненты даты
        console.warn('Ошибка при преобразовании дат, пробуем альтернативный метод', e);
        
        // Предполагаем формат даты 'YYYY-MM-DD'
        const startParts = festival.value.startDate.split('-');
        const endParts = festival.value.endDate.split('-');
        
        if (startParts.length === 3 && endParts.length === 3) {
          festivalStartDate.value = new Date(
            parseInt(startParts[0]), 
            parseInt(startParts[1]) - 1, // месяцы в JS с 0
            parseInt(startParts[2])
          );
          
          festivalEndDate.value = new Date(
            parseInt(endParts[0]), 
            parseInt(endParts[1]) - 1, 
            parseInt(endParts[2])
          );
          
          console.log('Преобразованные даты (2):', 
            festivalStartDate.value.toISOString(), 
            festivalEndDate.value.toISOString()
          );
        } else {
          // Вариант 3: Если все способы не сработали, используем сегодняшнюю дату
          console.error('Невозможно распарсить даты фестиваля, используем текущую дату');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          festivalStartDate.value = today;
          festivalEndDate.value = new Date(today);
          festivalEndDate.value.setDate(today.getDate() + 7);
        }
      }
      
      // Создаем расширенный диапазон дат (неделя до и неделя после)
      const extendedStartDate = new Date(festivalStartDate.value);
      extendedStartDate.setDate(extendedStartDate.getDate() - 7);
      
      const extendedEndDate = new Date(festivalEndDate.value);
      extendedEndDate.setDate(extendedEndDate.getDate() + 7);
      
      console.log('Расширенный диапазон:', 
        extendedStartDate.toISOString(), 
        extendedEndDate.toISOString()
      );
      
      generateDateRange(extendedStartDate, extendedEndDate);
    } else {
      // Если нет активного фестиваля, используем текущую дату как основу
      console.warn('Нет информации о фестивале, используем текущую дату');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 21); // 3 недели
      
      festivalStartDate.value = today;
      festivalEndDate.value = new Date(today);
      festivalEndDate.value.setDate(today.getDate() + 7);
      
      generateDateRange(startDate, endDate);
    }
  } catch (error) {
    console.error('Ошибка при обработке информации о фестивале:', error);
    // В случае ошибки используем текущую дату
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 21); // 3 недели
    
    festivalStartDate.value = today;
    festivalEndDate.value = new Date(today);
    festivalEndDate.value.setDate(today.getDate() + 7);
    
    generateDateRange(startDate, endDate);
  }
};

// Генерация диапазона дат
const generateDateRange = (startDate: Date, endDate: Date) => {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  allDates.value = dates;
  console.log(`Сгенерирован диапазон дат: ${dates.length} дней`, 
    dates[0].toISOString(), 
    dates[dates.length - 1].toISOString()
  );
};

// Установка начальной позиции скролла (на дату начала фестиваля)
const scrollToFestivalStart = () => {
  if (festivalStartDate.value && allDates.value.length > 0) {
    // Находим индекс даты начала фестиваля в массиве всех дат
    const startIndex = allDates.value.findIndex(date => 
      date.getFullYear() === festivalStartDate.value!.getFullYear() &&
      date.getMonth() === festivalStartDate.value!.getMonth() &&
      date.getDate() === festivalStartDate.value!.getDate()
    );
    
    if (startIndex !== -1) {
      // Устанавливаем скролл на дату начала фестиваля с небольшим отступом слева (2-3 дня)
      const scrollOffset = Math.max(0, (startIndex - 2) * 100); // 2 дня отступа слева
      
      // Используем setTimeout, чтобы DOM успел обновиться после отрисовки компонента
      setTimeout(() => {
        if (timelineHeader.value) timelineHeader.value.scrollLeft = scrollOffset;
        if (timelineContent.value) timelineContent.value.scrollLeft = scrollOffset;
      }, 100); // Небольшая задержка для более надежной работы
    }
  }
};

// Получение класса для дня (выделение дней фестиваля)
const getDayClass = (date: Date, isCell = false) => {
  const classes = [];
  
  // Проверка на праздничные дни (выходные)
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  if (isWeekend) {
    classes.push('bg-gray-100');
  }
  
  // Если день находится в пределах фестиваля
  if (festivalStartDate.value && festivalEndDate.value && 
      date >= festivalStartDate.value && date <= festivalEndDate.value) {
    classes.push('font-bold');
    
    if (isCell) {
      classes.push('bg-blue-50');
    } else {
      classes.push('text-blue-600');
    }
  } else {
    if (isCell) {
      classes.push(isWeekend ? 'bg-gray-200' : 'bg-gray-100');
    }
  }
  
  return classes.join(' ');
};

// Форматирование даты
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('ru-RU', { 
    day: 'numeric', 
    month: 'short',
    weekday: 'short'
  }).format(date);
};

// Получение размещений для конкретного слота
const getPlacementsForSlot = (room: Room, slot: number) => {
  if (!room.placements) return [];
  return room.placements.filter(p => p.slot === slot);
};

// Вычисление стиля для отображения размещения на таймлайне
const getPlacementStyle = (placement: Placement) => {
  if (!placement.datefrom || !placement.dateto || !allDates.value.length) return {};

  const startDate = new Date(placement.datefrom);
  const endDate = new Date(placement.dateto);
  
  // Получаем индексы дат в массиве
  const startIndex = allDates.value.findIndex(date => 
    date.getFullYear() === startDate.getFullYear() &&
    date.getMonth() === startDate.getMonth() &&
    date.getDate() === startDate.getDate()
  );
  
  const endIndex = allDates.value.findIndex(date => 
    date.getFullYear() === endDate.getFullYear() &&
    date.getMonth() === endDate.getMonth() &&
    date.getDate() === endDate.getDate()
  );
  
  // Если размещение не попадает в отображаемый диапазон
  if (startIndex === -1 || endIndex === -1) return { display: 'none' };
  
  // Вычисляем позицию и ширину
  const left = `${startIndex * 100}px`;
  const width = `${(endIndex - startIndex + 1) * 100}px`;
  const height = '40px'; // Высота соответствует ячейкам дней
  
  return {
    left,
    width,
    height,
    top: '8px', // Отступ, соответствующий margin ячеек
  };
};

// Определение класса для размещения в зависимости от статуса
const getPlacementClass = (placement: Placement) => {
  const baseClass = 'group z-10';
  
  switch (placement.type) {
    case PlacementStatus.BOOKED:
      return `${baseClass} bg-yellow-500 text-white`;
    case PlacementStatus.PAID:
      return `${baseClass} bg-green-500 text-white`;
    case PlacementStatus.SETTLED:
      return `${baseClass} bg-blue-500 text-white`;
    case PlacementStatus.SPECIAL:
      return `${baseClass} bg-purple-500 text-white`;
    default:
      return `${baseClass} bg-gray-500 text-white`;
  }
};

// Получение имени пользователя
const getUserName = (placement: any) => {
  return getUserFullName(placement);
};

// Обработчик клика по ячейке
const handleCellClick = (roomId: number, slot: number, date: Date) => {
  emit('create-placement', roomId, slot, date);
};

// Отслеживаем изменения в информации о фестивале
watch(() => props.festivalInfo, (newValue) => {
  if (newValue) {
    loadActiveFestival();
    // После загрузки данных фестиваля устанавливаем скролл
    nextTick(() => {
      scrollToFestivalStart();
    });
  }
}, { immediate: true });

// Отслеживаем изменения в списке комнат для прокрутки
watch(() => props.loading, (newValue) => {
  if (!newValue && props.rooms.length > 0) {
    // Когда загрузка завершена, устанавливаем скролл на начало фестиваля
    scrollToFestivalStart();
  }
});

// После изменения пагинированных комнат также обновляем скролл
watch(paginatedRooms, () => {
  nextTick(() => {
    scrollToFestivalStart();
  });
});

// Загрузка данных фестиваля при монтировании компонента
onMounted(() => {
  // После монтирования также устанавливаем начальный скролл
  scrollToFestivalStart();
});
</script>

<style scoped>
/* Стили для таймлайна */
.accommodation-timeline {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

/* Заголовок таймлайна */
.timeline-header {
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: white;
}

/* Содержимое таймлайна */
.timeline-content {
  max-height: 70vh;
  overflow: auto;
}

/* Строка таймлайна (комната) */
.timeline-row {
  border-bottom: 1px solid #e5e7eb;
}

.timeline-row:last-child {
  border-bottom: none;
}

/* Слот комнаты */
.timeline-slot {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  min-height: 56px; /* Увеличенная минимальная высота для слота */
}

.timeline-slot:last-child {
  border-bottom: none;
}

/* Информация о комнате */
.timeline-room-info {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
  background-color: white; /* Явно указываем белый фон */
  z-index: 10; /* Высокий z-index для отображения поверх остального контента */
}

/* Содержимое слота */
.timeline-slot-content {
  flex-grow: 1;
  display: flex;
  align-items: center;
  position: relative;
}

/* Грид для ячеек дней */
.timeline-slot-content .grid {
  height: 100%;
  display: grid;
  align-items: center;
}

/* Ячейки дней */
.timeline-slot-content .grid > div {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0;
}

/* Прокрутка только по горизонтали для заголовка */
.overflow-x-auto {
  overflow-x: auto;
  overflow-y: hidden;
}
</style> 