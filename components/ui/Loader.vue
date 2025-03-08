<script setup lang="ts">
type SizeType = 'sm' | 'md' | 'lg';
type ColorType = 'blue' | 'gray' | 'green' | 'red';

const props = defineProps({
  size: {
    type: String as () => SizeType,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg'].includes(value)
  },
  color: {
    type: String as () => ColorType,
    default: 'blue',
    validator: (value: string) => ['blue', 'gray', 'green', 'red'].includes(value)
  },
  fullPage: {
    type: Boolean,
    default: false
  }
});

// Размеры лоадера
const sizeMap: Record<SizeType, string> = {
  sm: 'h-6 w-6 border-2',
  md: 'h-10 w-10 border-b-2',
  lg: 'h-16 w-16 border-b-3'
};

// Цвета лоадера
const colorMap: Record<ColorType, string> = {
  blue: 'border-blue-500',
  gray: 'border-gray-500',
  green: 'border-green-500',
  red: 'border-red-500'
};
</script>

<template>
  <div 
    :class="[
      'flex justify-center items-center',
      fullPage ? 'fixed inset-0 bg-white bg-opacity-80 z-50' : 'py-6'
    ]"
  >
    <div 
      :class="[
        'animate-spin rounded-full',
        sizeMap[props.size],
        colorMap[props.color]
      ]"
    ></div>
  </div>
</template> 