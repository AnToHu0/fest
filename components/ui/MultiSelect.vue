<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Option {
  id: string | number;
  label: string;
}

const props = defineProps<{
  label: string;
  options: Option[];
  modelValue: (string | number)[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [(string | number)[]];
}>();

const showDropdown = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

// Проверка, выбрана ли опция
const isSelected = (id: string | number) => {
  return props.modelValue.includes(id);
};

// Переключение выбора опции
const toggleOption = (id: string | number) => {
  const newValue = [...props.modelValue];
  const index = newValue.indexOf(id);
  
  if (index === -1) {
    newValue.push(id);
  } else {
    newValue.splice(index, 1);
  }
  
  emit('update:modelValue', newValue);
};

// Удаление опции напрямую
const removeOption = (id: string | number, event?: Event) => {
  if (event) {
    event.stopPropagation(); // Предотвращаем открытие/закрытие выпадающего списка
  }
  
  const newValue = [...props.modelValue];
  const index = newValue.indexOf(id);
  
  if (index !== -1) {
    newValue.splice(index, 1);
    emit('update:modelValue', newValue);
  }
};

// Обработчик клика вне выпадающего списка
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false;
  }
};

// Добавляем и удаляем обработчик клика при монтировании/размонтировании компонента
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <div 
      @click="showDropdown = !showDropdown"
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex justify-between items-center"
    >
      <div class="flex flex-wrap gap-1">
        <span 
          v-if="modelValue.length === 0" 
          class="text-gray-500"
        >
          {{ placeholder || 'Выберите опции' }}
        </span>
        <span 
          v-else
          v-for="id in modelValue" 
          :key="id"
          class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center"
        >
          {{ options.find(opt => opt.id === id)?.label }}
          <button 
            type="button"
            @click="removeOption(id, $event)" 
            class="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            <Icon name="mdi:close-circle" class="w-4 h-4" />
          </button>
        </span>
      </div>
      <Icon 
        :name="showDropdown ? 'mdi:chevron-up' : 'mdi:chevron-down'" 
        class="w-5 h-5 text-gray-500"
      />
    </div>
    
    <div 
      v-if="showDropdown"
      class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
    >
      <div class="p-2">
        <div 
          v-for="option in options" 
          :key="option.id"
          @click="toggleOption(option.id)"
          class="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md"
        >
          <div 
            class="w-4 h-4 border rounded mr-2 flex items-center justify-center"
            :class="{ 'bg-blue-500 border-blue-500': isSelected(option.id), 'border-gray-300': !isSelected(option.id) }"
          >
            <Icon 
              v-if="isSelected(option.id)"
              name="mdi:check" 
              class="w-3 h-3 text-white"
            />
          </div>
          <span>{{ option.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template> 