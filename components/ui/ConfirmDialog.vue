<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Подтвердить',
  cancelText: 'Отмена',
  confirmButtonClass: 'bg-red-600 hover:bg-red-700',
  zIndex: 50
});

const emit = defineEmits(['confirm', 'cancel']);

const handleConfirm = (event: Event) => {
  event.stopPropagation();
  emit('confirm');
};

const handleCancel = (event: Event) => {
  event.stopPropagation();
  emit('cancel');
};

// Предотвращаем всплытие события клика
const stopPropagation = (event: Event) => {
  event.stopPropagation();
};

// Функция для проверки наличия открытых модальных окон
const checkOpenModals = (): boolean => {
  return document.querySelectorAll('.fixed.inset-0.overflow-y-auto').length > 0;
};

// Восстановление прокрутки страницы при закрытии модального окна
const enableBodyScroll = () => {
  if (!checkOpenModals()) {
    document.body.style.overflow = '';
  }
};

// Наблюдаем за изменением свойства isOpen
watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    // Когда модальное окно закрывается, проверяем, нужно ли восстановить прокрутку
    setTimeout(() => {
      enableBodyScroll();
    }, 100);
  }
});

// При размонтировании компонента восстанавливаем прокрутку, если нет других модальных окон
onBeforeUnmount(() => {
  if (props.isOpen) {
    setTimeout(() => {
      enableBodyScroll();
    }, 100);
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        :style="{ zIndex: zIndex }"
        class="fixed inset-0 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
        @click.stop="stopPropagation"
      >
        <!-- Затемнение фона -->
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          @click.stop="handleCancel"
        />

        <!-- Модальное окно -->
        <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0" @click.stop="stopPropagation">
          <div
            class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
            @click.stop="stopPropagation"
          >
            <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div
                  class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
                >
                  <Icon name="mdi:alert" class="h-6 w-6 text-red-600" />
                </div>
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3
                    class="text-lg font-medium leading-6 text-gray-900"
                    id="modal-title"
                  >
                    {{ title }}
                  </h3>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500">
                      {{ message }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="button"
                :class="[
                  confirmButtonClass,
                  'inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto'
                ]"
                @click.stop="handleConfirm"
              >
                {{ confirmText }}
              </button>
              <button
                type="button"
                class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                @click.stop="handleCancel"
              >
                {{ cancelText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template> 