<script setup lang="ts">
const isLoading = ref(false);
const message = ref('');
const isSuccess = ref(false);
const errorDetails = ref('');
const showErrorDetails = ref(false);

// Функция для инициализации базы данных
const initDatabase = async () => {
  isLoading.value = true;
  message.value = '';
  errorDetails.value = '';
  isSuccess.value = false;
  showErrorDetails.value = false;
  
  try {
    const response = await $fetch('/api/admin/database/init', {
      method: 'POST'
    });
    
    if (response.success) {
      isSuccess.value = true;
      message.value = response.message || 'База данных успешно инициализирована';
    } else {
      isSuccess.value = false;
      message.value = response.message || 'Ошибка при инициализации базы данных';
    }
  } catch (error: any) {
    isSuccess.value = false;
    
    // Получаем сообщение об ошибке
    if (error.data?.data) {
      message.value = error.data.message || 'Ошибка при инициализации базы данных';
      errorDetails.value = JSON.stringify(error.data.data, null, 2);
    } else {
      message.value = error.message || 'Ошибка при инициализации базы данных';
      errorDetails.value = error.toString();
    }
    
    console.error('Ошибка при инициализации базы данных:', error);
  } finally {
    isLoading.value = false;
  }
};

// Функция для переключения отображения деталей ошибки
const toggleErrorDetails = () => {
  showErrorDetails.value = !showErrorDetails.value;
};
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Управление базой данных</h1>
    
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Инициализация базы данных</h2>
      <p class="text-gray-600 mb-4">
        Эта функция создаст все необходимые таблицы в базе данных, если они не существуют, или обновит их структуру, если она изменилась.
        Существующие данные будут сохранены.
      </p>
      
      <div class="flex items-center">
        <button 
          @click="initDatabase" 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="mr-2">
            <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
          </span>
          Инициализировать базу данных
        </button>
      </div>
      
      <div v-if="message" class="mt-4 p-3 rounded-md" :class="isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
        <div class="flex justify-between items-start">
          <div>{{ message }}</div>
          <button 
            v-if="!isSuccess && errorDetails" 
            @click="toggleErrorDetails" 
            class="text-red-800 hover:text-red-900 ml-2"
          >
            {{ showErrorDetails ? 'Скрыть детали' : 'Показать детали' }}
          </button>
        </div>
        
        <div v-if="showErrorDetails && errorDetails" class="mt-3 p-3 bg-white rounded border border-red-200 overflow-auto max-h-96">
          <pre class="text-xs text-gray-800">{{ errorDetails }}</pre>
        </div>
      </div>
    </div>
  </div>
</template> 