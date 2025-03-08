<script setup lang="ts">
const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  color: {
    type: String,
    default: 'blue'
  },
  fullPage: {
    type: Boolean,
    default: false
  }
});

// Определение размеров в зависимости от переданного параметра
const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'h-4 w-4';
    case 'md': return 'h-6 w-6';
    case 'lg': return 'h-8 w-8';
    case 'xl': return 'h-12 w-12';
    default: return 'h-6 w-6';
  }
});

// Определение цвета в зависимости от переданного параметра
const colorClass = computed(() => {
  switch (props.color) {
    case 'blue': return 'text-blue-500';
    case 'red': return 'text-red-500';
    case 'green': return 'text-green-500';
    case 'yellow': return 'text-yellow-500';
    case 'gray': return 'text-gray-500';
    case 'white': return 'text-white';
    default: return 'text-blue-500';
  }
});

// Определение класса контейнера в зависимости от режима отображения
const containerClass = computed(() => {
  return props.fullPage 
    ? 'fixed inset-0 z-50 flex justify-center items-center bg-white bg-opacity-80' 
    : 'flex justify-center items-center';
});
</script>

<template>
  <div :class="containerClass">
    <svg 
      :class="[sizeClass, colorClass, 'animate-spin']" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        class="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        stroke-width="4"
      ></circle>
      <path 
        class="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </div>
</template> 