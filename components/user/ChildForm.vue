<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import Loader from '~/components/ui/Loader.vue';
import type { User, Child, ChildFormData } from '~/types/user';

const props = defineProps({
  parentId: {
    type: Number,
    required: true
  },
  parentData: {
    type: Object as () => User,
    required: true
  },
  childData: {
    type: Object as () => Child | null,
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['saved', 'cancel']);

const isLoading = ref(false);
const errorMessage = ref('');

// Разбивка полного имени на составляющие для формы
const lastName = ref('');
const firstName = ref('');
const middleName = ref('');

// Инициализация данных формы
const formData = ref<ChildFormData>({
  id: null,
  fullName: '',
  spiritualName: '',
  birthDate: '',
  city: '',
  parentId: props.parentId
});

// Обновление полного имени при изменении составляющих
const updateFullName = () => {
  const parts = [lastName.value, firstName.value, middleName.value].filter(Boolean);
  formData.value.fullName = parts.join(' ');
};

// Заполнение формы данными ребенка при редактировании
const initFormData = () => {
  if (props.childData) {
    formData.value = {
      ...formData.value,
      id: props.childData.id,
      fullName: props.childData.fullName,
      spiritualName: props.childData.spiritualName || '',
      birthDate: props.childData.birthDate ? new Date(props.childData.birthDate).toISOString().split('T')[0] : '',
      city: props.childData.city || '',
      parentId: props.parentId
    };
    
    // Разбиваем полное имя на составляющие
    const nameParts = props.childData.fullName.split(' ');
    lastName.value = nameParts[0] || '';
    firstName.value = nameParts[1] || '';
    middleName.value = nameParts.slice(2).join(' ') || '';
  } else {
    // Заполняем данные из родителя при создании нового ребенка
    formData.value.city = props.parentData.city || '';
    formData.value.parentId = props.parentId;
    
    // Очищаем составляющие имени
    lastName.value = '';
    firstName.value = '';
    middleName.value = '';
  }
};

// Отправка формы
const submitForm = async () => {
  // Обновляем полное имя перед отправкой
  updateFullName();
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    let url;
    
    if (props.isAdmin) {
      // Используем админские эндпоинты
      url = formData.value.id 
        ? `/api/admin/users/${props.parentId}/children/${formData.value.id}` 
        : `/api/admin/users/${props.parentId}/children`;
    } else {
      // Используем обычные эндпоинты
      url = formData.value.id 
        ? `/api/user/children/${formData.value.id}` 
        : '/api/user/children';
    }
    
    const method = formData.value.id ? 'PUT' : 'POST';
    
    await $fetch(url, {
      method,
      body: formData.value
    });
    
    emit('saved');
  } catch (error: any) {
    console.error('Ошибка при сохранении данных ребенка:', error);
    errorMessage.value = error.data?.message || 'Ошибка при сохранении данных ребенка';
  } finally {
    isLoading.value = false;
  }
};

// Отмена и закрытие формы
const cancel = () => {
  emit('cancel');
};

// Инициализация данных при монтировании компонента
onMounted(() => {
  initFormData();
});

// Отслеживание изменений childData
watch(() => props.childData, () => {
  initFormData();
}, { deep: true });
</script>

<template>
  <form @submit.prevent="submitForm" class="space-y-4">
    <div v-if="errorMessage" class="p-3 bg-red-50 text-red-700 border border-red-200 rounded mb-4">
      {{ errorMessage }}
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
        <input
          id="lastName"
          v-model="lastName"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
          @input="updateFullName"
        />
      </div>
      
      <div>
        <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">Имя</label>
        <input
          id="firstName"
          v-model="firstName"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
          @input="updateFullName"
        />
      </div>
      
      <div>
        <label for="middleName" class="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
        <input
          id="middleName"
          v-model="middleName"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
          @input="updateFullName"
        />
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="spiritualName" class="block text-sm font-medium text-gray-700 mb-1">Духовное имя</label>
        <input
          id="spiritualName"
          v-model="formData.spiritualName"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label for="birthDate" class="block text-sm font-medium text-gray-700 mb-1">Дата рождения</label>
        <input
          id="birthDate"
          v-model="formData.birthDate"
          type="date"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
    </div>
    
    <div>
      <label for="city" class="block text-sm font-medium text-gray-700 mb-1">Город</label>
      <input
        id="city"
        v-model="formData.city"
        type="text"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    
    <div class="flex justify-end space-x-3 pt-4">
      <button
        type="button"
        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        @click="cancel"
        :disabled="isLoading"
      >
        Отмена
      </button>
      
      <button
        type="submit"
        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[120px] h-10 flex items-center justify-center"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="flex items-center">
          <Loader size="sm" class="mr-2" />
          <span>Сохранение...</span>
        </span>
        <span v-else>Сохранить</span>
      </button>
    </div>
  </form>
</template> 