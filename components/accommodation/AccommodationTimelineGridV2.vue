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
      <div class="timeline-table-container" ref="tableContainer">
        <table class="timeline-table">
          <thead>
            <tr>
              <!-- Фиксированная ячейка заголовка -->
              <th class="room-header sticky top-0 left-0 z-40 bg-white">
                <div class="font-medium">Комнаты</div>
              </th>
              
              <!-- Даты -->
              <th 
                v-for="(date, index) in allDates" 
                :key="index" 
                class="date-header sticky top-0 z-30"
                :class="{ 'weekend': isWeekend(date), 'current-date': isCurrentDate(date) }"
              >
                <div class="date-day">{{ formatDay(date) }}</div>
                <div class="date-weekday">{{ formatWeekday(date) }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(room, roomIndex) in paginatedRooms" :key="room.id">
              <tr 
                v-for="(slot, slotIndex) in room.size" 
                :key="`${room.id}-${slot}`" 
                class="timeline-row"
                :class="{ 'last-slot': slotIndex === room.size - 1 }"
              >
                <!-- Информация о комнате (фиксированная ячейка) -->
                <td class="room-info-cell sticky left-0 z-20 bg-white">
                  <div class="room-info-container">
                    <template v-if="slot === 1">
                      <div class="text-xs font-medium">Корпус {{ room.building }}, этаж {{ room.floor }}, комн. {{ room.number }}</div>
                    </template>
                    <template v-else>
                      <div class="text-xs invisible">Корпус {{ room.building }}, этаж {{ room.floor }}, комн. {{ room.number }}</div>
                    </template>
                    <div class="text-sm">Место {{ slot }}</div>
                  </div>
                </td>
                
                <!-- Ячейки дней -->
                <td 
                  v-for="(day, index) in allDates" 
                  :key="`${room.id}-${slot}-${index}`" 
                  :class="getDayClass(day, true)"
                  class="day-cell relative"
                  @click="handleCellClick(room.id, slot, day)"
                >
                  <!-- Иконка добавления при наведении -->
                  <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-gray-200 bg-opacity-50 rounded cursor-pointer add-icon">
                    <Icon name="mdi:plus" class="text-indigo-600" />
                  </div>
                  
                  <!-- Размещения - используем компонент PlacementCard -->
                  <template v-for="placement in getPlacementsForSlot(room, slot)" :key="placement.id">
                    <PlacementCard
                      v-if="isPlacementVisible(placement, index)"
                      :style="getPlacementStyle(placement, index)"
                      :status="placement.type || ''"
                      :guest-name="getUserFullName(placement)"
                      :start-date="formatDate(placement.datefrom || '')"
                      :end-date="formatDate(placement.dateto || '')"
                      @edit="$emit('edit-placement', placement)"
                      @delete="$emit('delete-placement', placement.id)"
                    />
                  </template>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Пагинация -->
      <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-sm">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div class="flex items-center space-x-4 w-full sm:w-auto">
            <div class="text-sm text-gray-700">
              Показано {{ paginatedRooms.length ? (currentPage - 1) * pageSize + 1 : 0 }} - 
              {{ Math.min(currentPage * pageSize, rooms.length) }}
              из {{ rooms.length }} комнат
            </div>
          </div>
          
          <div class="flex space-x-2 overflow-x-auto py-1 w-full sm:w-auto justify-center">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="px-3 py-1 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Назад
            </button>
            
            <!-- Страницы пагинации -->
            <template v-for="(page, index) in paginationPages" :key="index">
              <!-- Многоточие -->
              <span 
                v-if="page === 'start-ellipsis' || page === 'end-ellipsis'" 
                class="px-2 py-1 text-gray-500 ellipsis"
              >
                ...
              </span>
              
              <!-- Кнопка страницы -->
              <button
                v-else
                @click="handlePageChange(page)"
                :class="[
                  'px-3 py-1 rounded-md text-sm',
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                ]"
              >
                {{ page }}
              </button>
            </template>
            
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Вперед
            </button>
          </div>
          
          <div class="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span class="text-sm text-gray-700">Показывать:</span>
            <select
              v-model="pageSize"
              class="border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { PlacementStatus } from '~/types/accommodation';
import type { Room, Placement } from '~/types/accommodation';
import { getUserFullName } from './UserHelper';
import PlacementCard from './PlacementCard.vue';

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

// Ссылка на контейнер таблицы
const tableContainer = ref<HTMLElement | null>(null);

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
  if (festivalStartDate.value && allDates.value.length > 0 && tableContainer.value) {
    // Находим индекс даты начала фестиваля в массиве всех дат
    const startIndex = allDates.value.findIndex(date => 
      date.getFullYear() === festivalStartDate.value!.getFullYear() &&
      date.getMonth() === festivalStartDate.value!.getMonth() &&
      date.getDate() === festivalStartDate.value!.getDate()
    );
    
    if (startIndex !== -1) {
      // Устанавливаем скролл на дату начала фестиваля с небольшим отступом слева (2-3 дня)
      const scrollOffset = Math.max(0, (startIndex - 2) * 100 + 200); // 200px - ширина колонки с комнатами
      
      // Используем nextTick и requestAnimationFrame для более надежной работы
      nextTick(() => {
        requestAnimationFrame(() => {
          if (tableContainer.value) {
            tableContainer.value.scrollLeft = scrollOffset;
          }
        });
      });
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

// Форматирование даты для отображения в карточке
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  } catch (e) {
    console.error('Ошибка при форматировании даты:', e);
    return '';
  }
};

// Получение размещений для конкретного слота
const getPlacementsForSlot = (room: Room, slot: number) => {
  if (!room || !room.placements || !Array.isArray(room.placements)) return [];
  return room.placements.filter(p => p && typeof p === 'object' && p.slot === slot);
};

// Проверка видимости размещения в конкретной ячейке
const isPlacementVisible = (placement: Placement, dayIndex: number) => {
  if (!placement || !placement.datefrom || !placement.dateto || !allDates.value.length) return false;

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
  if (startIndex === -1 || endIndex === -1) return false;
  
  // Размещение видимо только в первой ячейке его диапазона
  return dayIndex === startIndex;
};

// Вычисление стиля для отображения размещения на таймлайне
const getPlacementStyle = (placement: Placement, dayIndex: number) => {
  if (!placement || !placement.datefrom || !placement.dateto || !allDates.value.length) return {};

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
  
  // Вычисляем ширину (в ячейках)
  const cellWidth = 120; // Ширина ячейки
  const width = (endIndex - startIndex + 1) * cellWidth - 6; // Ширина с отступами по 3px с каждой стороны
  
  return {
    width: `${width}px`,
    height: 'calc(100% - 6px)', // Высота с отступами по 3px сверху и снизу
    position: 'absolute',
    left: '3px',
    top: '3px',
    zIndex: 10
  };
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

// Настройка после монтирования компонента
onMounted(() => {
  // После монтирования устанавливаем начальный скролл
  nextTick(() => {
    scrollToFestivalStart();
  });
});

// Функции для форматирования даты
const formatDay = (date: Date) => {
  return date.getDate();
};

const formatWeekday = (date: Date) => {
  return date.toLocaleDateString('ru-RU', { weekday: 'short' });
};

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = воскресенье, 6 = суббота
};

const isCurrentDate = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

// Обработка изменения страницы
const handlePageChange = (newPage: number) => {
  currentPage.value = newPage;
};

// Вычисляемое свойство для получения массива номеров страниц для пагинации
const paginationPages = computed(() => {
  const pages = [];
  
  // Всегда добавляем первую страницу
  if (totalPages.value > 0) {
    pages.push(1);
  }
  
  // Добавляем средние страницы
  if (totalPages.value <= 7) {
    // Если страниц мало, показываем все
    for (let i = 2; i < totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    // Если страниц много, показываем только нужные
    let startPage = Math.max(2, currentPage.value - 1);
    let endPage = Math.min(totalPages.value - 1, currentPage.value + 1);
    
    // Особые случаи для начала и конца
    if (currentPage.value <= 3) {
      startPage = 2;
      endPage = 5;
    } else if (currentPage.value >= totalPages.value - 2) {
      startPage = totalPages.value - 4;
      endPage = totalPages.value - 1;
    }
    
    // Добавляем многоточие в начале, если нужно
    if (startPage > 2) {
      pages.push('start-ellipsis');
    }
    
    // Добавляем средние страницы
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Добавляем многоточие в конце, если нужно
    if (endPage < totalPages.value - 1) {
      pages.push('end-ellipsis');
    }
  }
  
  // Всегда добавляем последнюю страницу, если она не совпадает с первой
  if (totalPages.value > 1) {
    pages.push(totalPages.value);
  }
  
  return pages;
});
</script>

<style scoped>
/* Стили для таймлайна */
.accommodation-timeline {
  position: relative;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Контейнер таблицы */
.timeline-table-container {
  max-height: 70vh;
  overflow: auto;
  position: relative;
}

/* Таблица таймлайна */
.timeline-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

/* Заголовок таблицы */
.timeline-table thead {
  position: sticky;
  top: 0;
  z-index: 30;
  background-color: white;
}

/* Ячейка заголовка с комнатами */
.room-header {
  width: 200px;
  padding: 0.75rem;
  text-align: center;
  background-color: #fff;
  border-bottom: 2px solid #d1d5db;
}

/* Ячейка заголовка с датами */
.date-header {
  width: 100px;
  padding: 0.75rem;
  text-align: center;
  background-color: #fff;
  border-bottom: 2px solid #d1d5db;
}

.date-day {
  font-weight: 500;
  font-size: 0.875rem;
}

.date-weekday {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Строка таймлайна */
.timeline-row {
  border-bottom: 1px solid #e5e7eb;
}

/* Более заметный бордер для последнего слота в комнате */
.timeline-row.last-slot td {
  border-bottom: 2px solid #d1d5db;
}

/* Последняя строка не должна иметь нижней границы */
.timeline-table tbody tr:last-child td {
  border-bottom: none;
}

.timeline-row:nth-child(even) {
  background-color: rgba(245, 247, 250, 0.5);
}

/* Ячейка с информацией о комнате */
.room-info-cell {
  padding: 0.75rem;
  border-right: 2px solid #d1d5db;
  min-width: 200px;
}

/* Контейнер для информации о комнате */
.room-info-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Ячейка дня */
.day-cell {
  padding: 0;
  min-width: 120px;
  height: 44px;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.day-cell:last-child {
  border-right: none;
}

/* Стили для выходных и текущей даты */
.weekend {
  background-color: #f9fafb;
}

.current-date {
  background-color: #eef2ff;
}

/* Улучшаем отображение кнопок пагинации */
button {
  transition: all 0.2s ease;
}

button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* Специальные стили для кнопок пагинации */
.flex.space-x-2 button:not(:disabled):hover {
  background-color: #f3f4f6;
  border-color: #6b7280;
}

/* Стили для активной кнопки пагинации */
.flex.space-x-2 button.bg-blue-600 {
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.flex.space-x-2 button.bg-blue-600:hover {
  background-color: #2563eb !important;
  transform: none;
}

/* Улучшаем отображение селекта пагинации */
select {
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

select:hover {
  border-color: #a5b4fc;
}

/* Удаляем дублирующиеся стили */
.mt-4 button,
.mt-4 select {
  transition: none;
}

.mt-4 button:not(:disabled):hover {
  background-color: inherit;
  transform: none;
  box-shadow: none;
}

.mt-4 select:hover {
  border-color: inherit;
}

.add-icon {
  transition: opacity 0.2s ease-in-out;
}

.timeline-table-container {
  overflow-x: auto;
  max-width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

/* Стили для многоточия в пагинации */
.ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  letter-spacing: 1px;
}

/* Адаптивные стили для пагинации */
@media (max-width: 640px) {
  .flex.flex-col.sm\:flex-row {
    gap: 1rem;
  }
  
  .flex.space-x-2.overflow-x-auto {
    padding-bottom: 0.5rem;
    justify-content: flex-start;
    -webkit-overflow-scrolling: touch;
  }
  
  .flex.space-x-2.overflow-x-auto::-webkit-scrollbar {
    height: 4px;
  }
  
  .flex.space-x-2.overflow-x-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .flex.space-x-2.overflow-x-auto::-webkit-scrollbar-thumb {
    background: #a5b4fc;
    border-radius: 10px;
  }
}
</style> 