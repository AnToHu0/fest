<script setup lang="ts">
import type { Festival, FestivalDepartment } from '~/types/festival';

const props = defineProps<{
  festival: Festival;
  departments: FestivalDepartment[];
}>();

const emit = defineEmits<{
  close: [];
}>();

// Обработчик закрытия окна
const handleClose = () => {
  emit('close');
};
</script>

<template>
  <div>
    <!-- Приветственное сообщение -->
    <div class="mb-6 p-4 bg-green-50 rounded-lg">
      <h3 class="text-lg font-medium text-green-800 mb-2">
        <Icon name="mdi:check-circle" class="w-6 h-6 inline-block mr-2" />
        Поздравляем!
      </h3>
      <p class="text-sm text-gray-700">
        Вы успешно зарегистрировались на фестиваль {{ festival.year }}. 
        Мы рады приветствовать вас и с нетерпением ждем встречи!
      </p>
    </div>
    
    <!-- Информация о фестивале -->
    <div class="mb-6">
      <h3 class="text-lg font-medium text-gray-800 mb-3">Информация о фестивале</h3>
      <p class="text-sm text-gray-700 mb-2">
        <span class="font-medium">Даты проведения:</span> 
        {{ new Date(festival.startDate).toLocaleDateString('ru-RU') }} - 
        {{ new Date(festival.endDate).toLocaleDateString('ru-RU') }}
      </p>
      <p v-if="festival.announcementText" class="text-sm text-gray-700">
        {{ festival.announcementText }}
      </p>
    </div>
    
    <!-- Сообщения от департаментов -->
    <div v-if="departments.length > 0" class="mb-6">
      <h3 class="text-lg font-medium text-gray-800 mb-3">Сообщения от департаментов</h3>
      
      <div v-for="dept in departments" :key="dept.id" class="mb-4 p-4 bg-blue-50 rounded-lg">
        <h4 class="text-md font-medium text-blue-800 mb-1">{{ dept.title }}</h4>
        <p v-if="dept.joinText" class="text-sm text-gray-700">
          {{ dept.joinText }}
        </p>
        <p v-else class="text-sm text-gray-500 italic">
          Нет дополнительной информации от этого департамента.
        </p>
      </div>
    </div>
    
    <!-- Дополнительная информация -->
    <div class="mb-6">
      <h3 class="text-lg font-medium text-gray-800 mb-3">Что дальше?</h3>
      <ul class="list-disc list-inside text-sm text-gray-700 space-y-2">
        <li>Вы можете просмотреть свои регистрации в разделе "Мои фестивали"</li>
        <li>Если у вас возникнут вопросы, обратитесь к организаторам фестиваля</li>
      </ul>
    </div>
    
    <!-- Кнопка закрытия -->
    <div class="flex justify-end">
      <button 
        @click="handleClose"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Закрыть
      </button>
    </div>
  </div>
</template> 