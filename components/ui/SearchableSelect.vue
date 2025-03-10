<!-- SearchableSelect.vue -->
<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';

interface Option {
  id: string | number;
  label: string;
}

const props = defineProps<{
  modelValue: string | number;
  options: Option[];
  placeholder?: string;
  label?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const search = ref('');
const selectedOption = ref<Option | null>(null);

const filteredOptions = computed(() => {
  if (!search.value) return props.options;
  const searchLower = search.value.toLowerCase();
  return props.options.filter(option => 
    option.label.toLowerCase().includes(searchLower)
  );
});

// Обновляем выбранную опцию при изменении значения или опций
watch([() => props.modelValue, () => props.options], () => {
  selectedOption.value = props.options.find(opt => opt.id === props.modelValue) || null;
}, { immediate: true });

// Закрываем дропдаун при клике вне компонента
const dropdownRef = ref<HTMLElement | null>(null);
onClickOutside(dropdownRef, () => {
  isOpen.value = false;
});

// Обработчики
const handleSelect = (option: Option) => {
  selectedOption.value = option;
  emit('update:modelValue', option.id);
  search.value = '';
  isOpen.value = false;
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    search.value = '';
  }
};
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>

    <!-- Input trigger -->
    <div
      @click="toggleDropdown"
      class="w-full px-4 py-2 border border-gray-300 rounded-md bg-white cursor-pointer flex items-center justify-between"
      :class="{ 'ring-2 ring-blue-500': isOpen }"
    >
      <span v-if="selectedOption" class="text-gray-900">{{ selectedOption.label }}</span>
      <span v-else class="text-gray-400">{{ placeholder || 'Выберите значение' }}</span>
      <Icon
        :name="isOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
        class="w-5 h-5 text-gray-400"
      />
    </div>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg"
    >
      <!-- Search input -->
      <div class="p-2 border-b border-gray-200">
        <input
          v-model="search"
          type="text"
          class="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Поиск..."
          @click.stop
        >
      </div>

      <!-- Options list -->
      <div class="max-h-60 overflow-auto">
        <template v-if="filteredOptions.length">
          <div
            v-for="option in filteredOptions"
            :key="option.id"
            @click="handleSelect(option)"
            class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            :class="{ 'bg-blue-50': option.id === modelValue }"
          >
            {{ option.label }}
          </div>
        </template>
        <div v-else class="px-4 py-2 text-gray-500">
          Ничего не найдено
        </div>
      </div>
    </div>
  </div>
</template> 