<script setup lang="ts">
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  maxWidth: {
    type: String,
    default: 'md'
  }
});

const emit = defineEmits(['close']);

// Закрытие модального окна
const closeModal = () => {
  emit('close');
};

// Предотвращение закрытия при клике на содержимое модального окна
const preventClose = (e: Event) => {
  e.stopPropagation();
};

// Размеры модального окна
const maxWidthClass = computed(() => {
  switch (props.maxWidth) {
    case 'sm': return 'max-w-sm';
    case 'md': return 'max-w-md';
    case 'lg': return 'max-w-lg';
    case 'xl': return 'max-w-xl';
    case '2xl': return 'max-w-2xl';
    default: return 'max-w-md';
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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        @click="closeModal"
      >
        <Transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="transform opacity-0 scale-95"
          enter-to-class="transform opacity-100 scale-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="transform opacity-100 scale-100"
          leave-to-class="transform opacity-0 scale-95"
        >
          <div 
            v-if="isOpen" 
            :class="['bg-white rounded-lg shadow-xl overflow-hidden w-full', maxWidthClass]"
            @click="preventClose"
          >
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 class="text-lg font-medium text-gray-900">{{ title }}</h3>
              <button 
                type="button" 
                class="text-gray-400 hover:text-gray-500 focus:outline-none"
                @click="closeModal"
              >
                <span class="sr-only">Закрыть</span>
                <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div class="px-6 py-4">
              <slot></slot>
            </div>
            
            <div v-if="$slots.footer" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template> 