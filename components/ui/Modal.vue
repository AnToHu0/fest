<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  maxWidth: {
    type: String,
    default: '600px'
  }
});

const emit = defineEmits(['close']);

const modalRef = ref<HTMLElement | null>(null);

// Закрытие модального окна при клике вне его содержимого
const handleClickOutside = (event: MouseEvent) => {
  if (modalRef.value && !modalRef.value.contains(event.target as Node)) {
    emit('close');
  }
};

// Закрытие модального окна при нажатии Escape
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close');
  }
};

// Блокировка прокрутки страницы при открытом модальном окне
const disableBodyScroll = () => {
  document.body.style.overflow = 'hidden';
};

// Восстановление прокрутки страницы при закрытии модального окна
const enableBodyScroll = () => {
  document.body.style.overflow = '';
};

// Добавление обработчиков событий при монтировании компонента
onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);
  disableBodyScroll();
});

// Удаление обработчиков событий перед размонтированием компонента
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
  enableBodyScroll();
});
</script>

<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Затемнение фона -->
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <!-- Центрирование модального окна -->
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <!-- Модальное окно -->
      <div 
        ref="modalRef"
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full"
        :style="{ maxWidth: maxWidth }"
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-headline"
      >
        <!-- Заголовок -->
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 id="modal-headline" class="text-lg font-medium text-gray-900">
            {{ title }}
          </h3>
          <button 
            type="button" 
            class="text-gray-400 hover:text-gray-500 focus:outline-none"
            @click="emit('close')"
          >
            <span class="sr-only">Закрыть</span>
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Содержимое -->
        <div class="bg-white p-6">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template> 