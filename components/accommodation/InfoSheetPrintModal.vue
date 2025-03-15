<template>
  <div>
    <!-- Модальное окно -->
    <UiModal :show="show" @close="$emit('update:show', false)" :title="title" size="xl">
      <div class="p-4">
        <div class="mb-4 flex justify-between">
          <button 
            @click="print" 
            class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center"
          >
            <Icon name="mdi:printer" class="mr-2" />
            Печать
          </button>
          <button 
            @click="$emit('update:show', false)" 
            class="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Закрыть
          </button>
        </div>
        
        <!-- Контент для печати -->
        <div ref="printContent" class="print-content">
          <div v-for="(placement, index) in normalizedPlacements" :key="index" class="info-sheet page-break">
            <div class="info-sheet-content">
              <h2 class="text-center text-xl font-bold mb-4">Инфо лист</h2>
              
              <div class="info-row">
                <span class="label">№ корпуса</span>
                <span class="value">{{ placement.room?.building }}</span>
                <span class="label ml-4">№ комнаты</span>
                <span class="value">{{ placement.room?.number }}</span>
              </div>
              
              <div class="info-row">
                <span class="label">ФИО</span>
                <span class="value">{{ getUserFullName(placement) }}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Дата рождения</span>
                <span class="value">{{ getUserBirthDate(placement) }}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Дата заезда</span>
                <span class="value">{{ formatDate(placement.datefrom) }}</span>
                <span class="label ml-4">Дата выезда</span>
                <span class="value">{{ formatDate(placement.dateto) }}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Количество дней</span>
                <span class="value">{{ calculateDays(placement.datefrom, placement.dateto) }}</span>
              </div>
              
              <div class="info-row">
                <span class="label">Количество человек</span>
                <span class="value">{{ getPersonCount(placement) }}</span>
              </div>
              
              <div class="info-note mt-8">
                <p>*Данная информация предназначена для удобства вашего расселения.</p>
                <p>Обратитесь с ней, пожалуйста, в ВАШ КОРПУС к сотруднику базы</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Placement, Room } from '~/types/accommodation';
import { formatDate as formatDateUtil } from '~/utils/date';

const props = defineProps<{
  show: boolean;
  placements?: Placement | Placement[];
  room?: Room;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
}>();

// Заголовок модального окна
const title = computed(() => {
  if (Array.isArray(props.placements) && props.placements.length > 1) {
    return `Печать инфо-листов для комнаты ${props.room?.building}-${props.room?.number}`;
  }
  return 'Печать инфо-листа';
});

// Нормализуем размещения в массив
const normalizedPlacements = computed(() => {
  if (!props.placements) return [];
  return Array.isArray(props.placements) ? props.placements : [props.placements];
});

// Ссылка на контент для печати
const printContent = ref<HTMLElement | null>(null);

// Функция для печати
const print = () => {
  const content = printContent.value;
  if (!content) return;
  
  // Создаем iframe для печати
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'absolute';
  printIframe.style.top = '-9999px';
  printIframe.style.left = '-9999px';
  document.body.appendChild(printIframe);
  
  // Добавляем стили для печати
  const printDocument = printIframe.contentDocument;
  if (!printDocument) return;
  
  printDocument.open();
  printDocument.write(`
    <html>
      <head>
        <title>Инфо-лист</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          .info-sheet {
            page-break-after: always;
            height: 100%;
            padding: 10mm;
            box-sizing: border-box;
          }
          .info-sheet:last-child {
            page-break-after: auto;
          }
          .info-sheet-content {
            border: 1px solid #000;
            padding: 10mm;
            height: calc(100% - 20mm);
          }
          h2 {
            text-align: center;
            font-size: 18pt;
            margin-bottom: 15mm;
          }
          .info-row {
            margin-bottom: 10mm;
            display: flex;
            align-items: center;
          }
          .label {
            font-weight: normal;
            margin-right: 5mm;
          }
          .value {
            border-bottom: 1px solid #000;
            flex: 1;
            min-width: 50mm;
            padding-bottom: 2mm;
          }
          .ml-4 {
            margin-left: 10mm;
          }
          .info-note {
            margin-top: 20mm;
            font-style: italic;
            font-size: 10pt;
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
    </html>
  `);
  printDocument.close();
  
  // Печать и удаление iframe
  printIframe.onload = () => {
    setTimeout(() => {
      printIframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printIframe);
      }, 100);
    }, 500);
  };
};

// Получение полного имени пользователя
const getUserFullName = (placement: Placement): string => {
  if (!placement.user) return 'Н/Д';
  
  if (placement.user.fullName) {
    return placement.user.fullName;
  }
  
  if (placement.User && placement.User.fullName) {
    return placement.User.fullName;
  }
  
  return 'Н/Д';
};

// Получение даты рождения пользователя
const getUserBirthDate = (placement: Placement): string => {
  if (!placement.user) return 'Н/Д';
  
  if (placement.user.birthDate) {
    return formatDateUtil(placement.user.birthDate);
  }
  
  if (placement.User && placement.User.birthDate) {
    return formatDateUtil(placement.User.birthDate);
  }
  
  return 'Н/Д';
};

// Форматирование даты
const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'Н/Д';
  return formatDateUtil(date);
};

// Расчет количества дней
const calculateDays = (startDate: string | Date | null | undefined, endDate: string | Date | null | undefined): number => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Разница в миллисекундах
  const diffTime = Math.abs(end.getTime() - start.getTime());
  // Разница в днях
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Получение количества человек (включая детей)
const getPersonCount = (placement: Placement): number => {
  // Начинаем с 1 (основной гость)
  let count = 1;
  
  // Добавляем детей
  if (placement.children && Array.isArray(placement.children)) {
    count += placement.children.length;
  }
  
  return count;
};
</script>

<style scoped>
/* Стили для предпросмотра */
.print-content {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

.info-sheet {
  background-color: white;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  page-break-after: always;
  min-height: 297mm;
  width: 210mm;
  margin: 0 auto 20px;
}

.info-sheet-content {
  border: 1px solid #000;
  padding: 20px;
  height: 100%;
}

.info-row {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.label {
  font-weight: 500;
  margin-right: 10px;
}

.value {
  border-bottom: 1px solid #000;
  flex: 1;
  padding-bottom: 5px;
}

.info-note {
  margin-top: 40px;
  font-style: italic;
  font-size: 0.9rem;
}

/* Стили для печати */
@media print {
  .page-break {
    page-break-after: always;
  }
  
  .info-sheet {
    box-shadow: none;
  }
}
</style> 