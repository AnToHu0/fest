<script setup lang="ts">
import type { Festival, FestivalDepartment } from '~/types/festival';
import type { FestivalRegistration } from '~/types/registration';
import type { Payment } from '~/types/payment';
import { ref, onMounted, computed } from 'vue';

const props = defineProps<{
  festival: Festival;
}>();

const emit = defineEmits<{
  close: [];
}>();

const isLoading = ref(false);
const registration = ref<FestivalRegistration | null>(null);
const departments = ref<FestivalDepartment[]>([]);
const payments = ref<Payment[]>([]);
const isLoadingPayments = ref(false);
const showPaymentHistory = ref(false);

// Загрузка данных о регистрации пользователя
const fetchRegistrationData = async () => {
  if (!props.festival || !props.festival.id) return;
  
  isLoading.value = true;
  try {
    const response = await $fetch(`/api/festivals/${props.festival.id}/registration`);
    if (response.success) {
      registration.value = response.registration;
      departments.value = response.departments || [];
    } else {
      registration.value = null;
      departments.value = [];
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных о регистрации:', error);
    registration.value = null;
    departments.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Загрузка платежей пользователя
const fetchPayments = async () => {
  if (!props.festival?.id) return;
  
  isLoadingPayments.value = true;
  try {
    const response = await $fetch<{ success: boolean; payments: Payment[] }>(`/api/festivals/${props.festival.id}/payments`);
    if (response.success) {
      payments.value = response.payments;
    }
  } catch (error) {
    console.error('Ошибка при загрузке платежей:', error);
    payments.value = [];
  } finally {
    isLoadingPayments.value = false;
  }
};

// Вычисляем суммы по категориям
const paymentSums = computed(() => {
  const sums = {
    Участие: 0,
    Проживание: 0,
    Автомобиль: 0,
    Животное: 0
  };

  payments.value.forEach(payment => {
    if (payment.paymentDest in sums) {
      sums[payment.paymentDest] += payment.amount;
    }
  });

  return sums;
});

// Вычисляем общую сумму платежей
const totalPayment = computed(() => {
  return Object.values(paymentSums.value).reduce((sum, current) => sum + current, 0);
});

// Форматирование даты
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

// Загружаем данные при создании компонента
onMounted(() => {
  fetchRegistrationData();
  fetchPayments();
});
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-semibold text-gray-800">
        Фестиваль {{ festival.year }}
      </h2>
      <button @click="emit('close')" class="text-gray-500 hover:text-gray-700">
        <Icon name="mdi:close" class="w-6 h-6" />
      </button>
    </div>
    
    <!-- Загрузка -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else>
      <!-- Анонс фестиваля -->
      <div class="mb-6 p-4 bg-purple-50 rounded-lg">
        <h3 class="text-lg font-medium text-purple-800 mb-2">Информация о фестивале</h3>
        <p class="text-sm text-gray-700 mb-2">
          <span class="font-medium">Даты проведения:</span> 
          {{ formatDate(festival.startDate) }} - 
          {{ formatDate(festival.endDate) }}
        </p>
        <p v-if="festival.announcementText" class="text-sm text-gray-700">
          {{ festival.announcementText }}
        </p>
      </div>
      
      <!-- Информация о регистрации пользователя -->
      <div v-if="registration" class="mb-6">
        <h3 class="text-lg font-medium text-gray-800 mb-3">Ваша регистрация</h3>
        
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-sm text-gray-600 mb-1">Дата заезда:</p>
              <p class="font-medium">{{ formatDate(registration.arrivalDate) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600 mb-1">Дата выезда:</p>
              <p class="font-medium">{{ formatDate(registration.departureDate) }}</p>
            </div>
          </div>
          
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-1">Транспорт:</p>
            <p v-if="registration.hasCar" class="font-medium">
              Приезжает на автомобиле
              <span v-if="registration.freeSeatsInCar > 0">
                (свободных мест: {{ registration.freeSeatsInCar }})
              </span>
            </p>
            <p v-else class="font-medium">Без автомобиля</p>
          </div>
          
          <div v-if="registration.hasPet" class="mb-4">
            <p class="text-sm text-gray-600 mb-1">Домашние животные:</p>
            <p class="font-medium">Приезжает с домашним животным</p>
          </div>
          
          <div v-if="departments.length > 0" class="mb-4">
            <p class="text-sm text-gray-600 mb-1">Выбранные департаменты:</p>
            <div class="flex flex-wrap gap-2 mt-1">
              <span 
                v-for="dept in departments" 
                :key="dept.id"
                class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {{ dept.title }}
              </span>
            </div>
          </div>
          
          <div v-if="registration.children && registration.children.length > 0" class="mb-4">
            <p class="text-sm text-gray-600 mb-1">Дети:</p>
            <ul class="list-disc list-inside">
              <li v-for="child in registration.children" :key="child.id" class="text-sm">
                {{ child.fullName }}
                <span v-if="child.needsSeparateBed" class="text-gray-500">(отдельная кровать)</span>
              </li>
            </ul>
          </div>
          
          <div v-if="registration.notes" class="mb-4">
            <p class="text-sm text-gray-600 mb-1">Дополнительные замечания:</p>
            <p class="text-sm">{{ registration.notes }}</p>
          </div>
        </div>
      </div>
      
      <!-- Раздел с оплатами -->
      <div class="mb-6">
        <h3 class="text-lg font-medium text-gray-800 mb-3">Оплаты</h3>
        
        <div v-if="isLoadingPayments" class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div class="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          <span class="text-gray-500">Загрузка платежей...</span>
        </div>

        <div v-else-if="payments.length === 0" class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p class="text-gray-500">Платежи пока не внесены</p>
        </div>

        <div v-else class="bg-white border border-gray-200 rounded-lg p-4">
          <!-- Суммы по категориям -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">За участие:</span>
              <span class="font-medium">{{ paymentSums.Участие }} ₽</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">За проживание:</span>
              <span class="font-medium">{{ paymentSums.Проживание }} ₽</span>
            </div>
            <div v-if="registration?.hasCar" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">За автомобиль:</span>
              <span class="font-medium">{{ paymentSums.Автомобиль }} ₽</span>
            </div>
            <div v-if="registration?.hasPet" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">За животное:</span>
              <span class="font-medium">{{ paymentSums.Животное }} ₽</span>
            </div>
          </div>

          <!-- Общая сумма -->
          <div class="border-t border-gray-100 pt-4">
            <div class="flex justify-between items-center p-2 bg-blue-50 rounded">
              <span class="text-sm font-medium text-blue-700">Общая сумма оплат:</span>
              <span class="font-bold text-blue-700">{{ totalPayment }} ₽</span>
            </div>
          </div>

          <!-- История платежей -->
          <div class="mt-4">
            <button 
              @click="showPaymentHistory = !showPaymentHistory"
              class="flex items-center text-sm font-medium text-gray-700 mb-2 hover:text-blue-600 transition-colors"
            >
              <Icon 
                :name="showPaymentHistory ? 'mdi:chevron-down' : 'mdi:chevron-right'" 
                class="w-5 h-5 mr-1"
              />
              История платежей
            </button>
            
            <div v-show="showPaymentHistory" class="space-y-2">
              <div 
                v-for="payment in payments" 
                :key="payment.id" 
                class="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
              >
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="text-gray-600">{{ formatDate(payment.date) }}</span>
                    <span class="text-gray-400">·</span>
                    <span>{{ payment.paymentDest }}</span>
                    <span class="text-gray-400">·</span>
                    <span class="text-gray-500">{{ payment.paymentType }}</span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    Принял оплату: {{ payment.Registrator?.fullName || 'Система' }}
                  </div>
                </div>
                <span class="font-medium">{{ payment.amount }} ₽</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Кнопка закрытия -->
      <div class="flex justify-end">
        <button 
          @click="emit('close')"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template> 