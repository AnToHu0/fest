<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { User } from '~/types/user';
import type { Festival } from '~/types/festival';
import type { Payment } from '~/types/payment';
import type { FestivalRegistration } from '~/types/registration';
import Modal from '~/components/ui/Modal.vue';
import { Icon } from '@iconify/vue';

interface Props {
  isOpen: boolean;
  user: User;
  currentFestival: Festival | null;
  currentAdmin: User | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'submit']);

const paymentForm = ref({
  amount: '',
  paymentType: 'Наличные менеджеру',
  paymentDest: 'Участие',
  comment: ''
});

const paymentTypes = [
  { id: 'Наличные менеджеру', label: 'Наличные менеджеру' },
  { id: 'На карту менеджеру', label: 'На карту менеджеру' }
];

const paymentDests = [
  { id: 'Участие', label: 'Оплата за участие' },
  { id: 'Проживание', label: 'Оплата за проживание' },
  { id: 'Автомобиль', label: 'Оплата за автомобиль' },
  { id: 'Животное', label: 'Оплата за животное' }
];

// Загрузка платежей пользователя
const userPayments = ref<Payment[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const loadUserPayments = async () => {
  if (!props.user?.id || !props.currentFestival?.id) {
    error.value = 'Не удалось загрузить платежи: отсутствуют данные пользователя или фестиваля';
    isLoading.value = false;
    return;
  }
  
  try {
    const response = await $fetch<{ success: boolean; payments: Payment[] }>(`/api/admin/payments/user/${props.user.id}`, {
      params: {
        festivalId: props.currentFestival.id
      }
    });
    if (response.success) {
      userPayments.value = response.payments;
    } else {
      error.value = 'Не удалось загрузить платежи';
    }
  } catch (err: any) {
    error.value = err.message || 'Произошла ошибка при загрузке платежей';
  } finally {
    isLoading.value = false;
  }
};

// Загрузка регистрации пользователя
const registration = ref<FestivalRegistration | null>(null);
const loadingRegistration = ref(true);

const loadRegistration = async () => {
  if (!props.user?.id || !props.currentFestival?.id) {
    loadingRegistration.value = false;
    return;
  }

  try {
    const response = await $fetch<{ success: boolean; registration: FestRegistration }>(`/api/admin/registration/${props.user.id}`);
    if (response.success) {
      registration.value = response.registration;
    }
  } catch (err) {
    // Ошибка обрабатывается тихо
  } finally {
    loadingRegistration.value = false;
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

  if (!isLoading.value && !error.value) {
    userPayments.value.forEach(payment => {
      if (payment.paymentDest in sums) {
        sums[payment.paymentDest] += payment.amount;
      }
    });
  }

  return sums;
});

// Вычисляем рекомендуемые суммы оплаты
const recommendedPayments = computed(() => {
  if (!registration.value || !props.currentFestival) return null;

  const festival = props.currentFestival;
  const reg = registration.value;

  // Вычисляем количество дней
  const arrival = new Date(reg.arrivalDate);
  const departure = new Date(reg.departureDate);
  const days = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));

  // Базовая стоимость проживания для взрослого
  let adultAccommodation = days * festival.adultPrice;

  // Стоимость проживания для подростков и детей
  let teenAccommodation = 0;
  let childAccommodation = 0;

  if (reg.children) {
    reg.children.forEach(child => {
      if (child.birthDate) {
        const age = Math.floor((new Date().getTime() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365));
        if (age >= 12 && age < 18) {
          teenAccommodation += days * festival.teenPrice;
        } else if (age < 12) {
          childAccommodation += days * festival.childPrice;
        }
      }
    });
  }

  // Дополнительные услуги
  const carPrice = reg.hasCar ? festival.carPrice : 0;
  const petPrice = reg.hasPet ? festival.petPrice : 0;

  // Общая сумма
  const total = adultAccommodation + teenAccommodation + childAccommodation + carPrice + petPrice;

  return {
    adultAccommodation,
    teenAccommodation,
    childAccommodation,
    carPrice,
    petPrice,
    days,
    total
  };
});

// Вычисляем доступные категории платежей
const availablePaymentDests = computed(() => {
  const dests = [
    { id: 'Участие', label: 'Оплата за участие' },
    { id: 'Проживание', label: 'Оплата за проживание' }
  ];

  if (registration.value?.hasCar) {
    dests.push({ id: 'Автомобиль', label: 'Оплата за автомобиль' });
  }

  if (registration.value?.hasPet) {
    dests.push({ id: 'Животное', label: 'Оплата за животное' });
  }

  return dests;
});

// Состояние для уведомления
const showSuccessMessage = ref(false);
const successMessage = ref('');
const isClosing = ref(false);

// Обновляем handleSubmit для добавления festivalId
const handleSubmit = () => {
  if (!props.currentAdmin?.id || !props.currentFestival?.id) return;
  
  const payment: Payment = {
    customerId: props.user.id,
    adminId: props.currentAdmin.id,
    festivalId: props.currentFestival.id,
    amount: Number(paymentForm.value.amount),
    paymentType: paymentForm.value.paymentType,
    paymentDest: paymentForm.value.paymentDest,
    date: new Date().toISOString()
  };

  emit('submit', payment);
};

const handleClose = () => {
  paymentForm.value = {
    amount: '',
    paymentType: 'Наличные менеджеру',
    paymentDest: 'Участие',
    comment: ''
  };
  emit('close');
};

const isFormValid = computed(() => {
  return paymentForm.value.amount && Number(paymentForm.value.amount) > 0;
});

// Загружаем данные при открытии модального окна
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    loadUserPayments();
    loadRegistration();
  }
}, { immediate: true });

// Также загружаем данные при монтировании, если окно открыто
onMounted(() => {
  if (props.isOpen) {
    loadUserPayments();
    loadRegistration();
  }
});

// Сбрасываем состояние при размонтировании
onUnmounted(() => {
  userPayments.value = [];
  registration.value = null;
  error.value = null;
  isLoading.value = true;
  loadingRegistration.value = true;
});

const handleSubmitOnly = async () => {
  const { data: authData } = useAuth();
  const currentUserId = authData.value?.user?.id;
  
  let adminId = props.currentAdmin?.id || currentUserId;
  
  if (!adminId) {
    adminId = 1;
  }
  
  if (!props.currentFestival?.id) {
    return;
  }
  
  const payment: Payment = {
    customerId: props.user.id,
    adminId: adminId,
    festivalId: props.currentFestival.id,
    amount: Number(paymentForm.value.amount),
    paymentType: paymentForm.value.paymentType,
    paymentDest: paymentForm.value.paymentDest,
    date: new Date().toISOString()
  };
  
  try {
    const response = await $fetch('/api/admin/payments/create', {
      method: 'POST',
      body: payment
    });
    
    if (response.success) {
      // Сбрасываем форму на дефолтные значения
      paymentForm.value = {
        amount: '',
        paymentType: 'Наличные менеджеру',
        paymentDest: 'Участие',
        comment: ''
      };
      
      // Обновляем платежи после успешной отправки
      await loadUserPayments();
      
      // Показываем уведомление об успешном платеже
      isClosing.value = false;
      successMessage.value = 'Оплата успешно принята';
      showSuccessMessage.value = true;
      
      // Начинаем анимацию затухания через 2 секунды
      setTimeout(() => {
        isClosing.value = true;
        // Скрываем уведомление после завершения анимации
        setTimeout(() => {
          showSuccessMessage.value = false;
          isClosing.value = false;
        }, 1000);
      }, 2000);
    } else {
      // Показываем уведомление об ошибке
      isClosing.value = false;
      successMessage.value = 'Ошибка при создании платежа: ' + response.message;
      showSuccessMessage.value = true;
      
      // Начинаем анимацию затухания через 2 секунды
      setTimeout(() => {
        isClosing.value = true;
        // Скрываем уведомление после завершения анимации
        setTimeout(() => {
          showSuccessMessage.value = false;
          isClosing.value = false;
        }, 1000);
      }, 2000);
    }
  } catch (error) {
    // Показываем уведомление об ошибке
    isClosing.value = false;
    successMessage.value = 'Ошибка при отправке запроса';
    showSuccessMessage.value = true;
    
    // Начинаем анимацию затухания через 2 секунды
    setTimeout(() => {
      isClosing.value = true;
      // Скрываем уведомление после завершения анимации
      setTimeout(() => {
        showSuccessMessage.value = false;
        isClosing.value = false;
      }, 1000);
    }, 2000);
  }
};

const handleSubmitAndClose = async () => {
  await handleSubmitOnly();
  handleClose();
};

// Проверяем достаточность платежей
const paymentsStatus = computed(() => {
  if (!recommendedPayments.value) return {};

  return {
    Проживание: paymentSums.value.Проживание >= 
      (recommendedPayments.value.adultAccommodation + 
       recommendedPayments.value.teenAccommodation + 
       recommendedPayments.value.childAccommodation),
    Автомобиль: paymentSums.value.Автомобиль >= recommendedPayments.value.carPrice,
    Животное: paymentSums.value.Животное >= recommendedPayments.value.petPrice
  };
});
</script>

<template>
  <Modal
    v-if="isOpen"
    :title="`Приём оплаты: ${user.fullName}`"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Информация о текущих платежах -->
      <div class="bg-gray-50 p-4 rounded-lg space-y-2">
        <h3 class="text-sm font-medium text-gray-700 mb-2">Внесённые платежи за фестиваль:</h3>
        <div v-if="isLoading || loadingRegistration" class="text-sm text-gray-500 p-2 text-center">
          <span class="inline-block animate-spin mr-2">⌛</span> Загрузка данных...
        </div>
        <div v-else-if="error" class="text-sm text-red-600 p-2">
          {{ error }}
        </div>
        <div v-else class="grid grid-cols-2 gap-4">
          <!-- Базовые категории -->
          <div class="flex justify-between items-center p-2 bg-white rounded shadow-sm">
            <span class="text-sm text-gray-600">За участие:</span>
            <span class="text-sm font-medium">{{ paymentSums.Участие }} ₽</span>
          </div>
          <div class="flex justify-between items-center p-2 rounded shadow-sm"
            :class="{
              'bg-white': !paymentsStatus.Проживание,
              'bg-green-50 border border-green-200': paymentsStatus.Проживание
            }"
          >
            <span class="text-sm" :class="paymentsStatus.Проживание ? 'text-green-700' : 'text-gray-600'">За проживание:</span>
            <span class="text-sm font-medium" :class="paymentsStatus.Проживание ? 'text-green-700' : ''">{{ paymentSums.Проживание }} ₽</span>
          </div>
          <!-- Условные категории -->
          <div v-if="registration?.hasCar" 
            class="flex justify-between items-center p-2 rounded shadow-sm"
            :class="{
              'bg-white': !paymentsStatus.Автомобиль,
              'bg-green-50 border border-green-200': paymentsStatus.Автомобиль
            }"
          >
            <span class="text-sm" :class="paymentsStatus.Автомобиль ? 'text-green-700' : 'text-gray-600'">За автомобиль:</span>
            <span class="text-sm font-medium" :class="paymentsStatus.Автомобиль ? 'text-green-700' : ''">{{ paymentSums.Автомобиль }} ₽</span>
          </div>
          <div v-if="registration?.hasPet" 
            class="flex justify-between items-center p-2 rounded shadow-sm"
            :class="{
              'bg-white': !paymentsStatus.Животное,
              'bg-green-50 border border-green-200': paymentsStatus.Животное
            }"
          >
            <span class="text-sm" :class="paymentsStatus.Животное ? 'text-green-700' : 'text-gray-600'">За животное:</span>
            <span class="text-sm font-medium" :class="paymentsStatus.Животное ? 'text-green-700' : ''">{{ paymentSums.Животное }} ₽</span>
          </div>
        </div>
      </div>

      <!-- Рекомендуемые платежи -->
      <div v-if="recommendedPayments" class="bg-blue-50 p-4 rounded-lg space-y-2 mt-4">
        <h3 class="text-sm font-medium text-blue-700 mb-2">Рекомендуемые суммы оплаты:</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex justify-between items-center p-2 bg-white rounded shadow-sm">
            <span class="text-sm text-gray-600">Проживание (взрослый):</span>
            <span class="text-sm font-medium">{{ recommendedPayments.adultAccommodation }} ₽</span>
          </div>
          <div v-if="recommendedPayments.teenAccommodation > 0" class="flex justify-between items-center p-2 bg-white rounded shadow-sm">
            <span class="text-sm text-gray-600">Проживание (12-18 лет):</span>
            <span class="text-sm font-medium">{{ recommendedPayments.teenAccommodation }} ₽</span>
          </div>
          <div v-if="recommendedPayments.childAccommodation > 0" class="flex justify-between items-center p-2 bg-white rounded shadow-sm">
            <span class="text-sm text-gray-600">Проживание (до 12 лет):</span>
            <span class="text-sm font-medium">{{ recommendedPayments.childAccommodation }} ₽</span>
          </div>
          <div v-if="recommendedPayments.carPrice > 0" class="flex justify-between items-center p-2 bg-white rounded shadow-sm">
            <span class="text-sm text-gray-600">Автомобиль:</span>
            <span class="text-sm font-medium">{{ recommendedPayments.carPrice }} ₽</span>
          </div>
          <div v-if="recommendedPayments.petPrice > 0" class="flex justify-between items-center p-2 bg-white rounded shadow-sm">
            <span class="text-sm text-gray-600">Животное:</span>
            <span class="text-sm font-medium">{{ recommendedPayments.petPrice }} ₽</span>
          </div>
        </div>
        <div class="border-t border-blue-100 mt-4 pt-4">
          <div class="flex justify-between items-center p-2 bg-white rounded shadow-sm">
            <span class="text-sm font-medium text-blue-700">Итого рекомендуемый взнос:</span>
            <span class="text-sm font-bold text-blue-700">{{ recommendedPayments.total }} ₽</span>
          </div>
        </div>
        <div class="text-xs text-blue-600 mt-2">
          * Расчет за {{ recommendedPayments.days }} дней пребывания
        </div>
      </div>

      <!-- Сумма -->
      <div>
        <label for="amount" class="block text-sm font-medium text-gray-700">
          Сумма оплаты
        </label>
        <div class="mt-1 relative rounded-md shadow-sm">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-gray-500 sm:text-sm">₽</span>
          </div>
          <input
            type="number"
            id="amount"
            v-model="paymentForm.amount"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors pl-7"
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>

      <!-- Тип оплаты -->
      <div>
        <label class="block text-sm font-medium text-gray-700">
          Способ оплаты
        </label>
        <div class="mt-1 space-y-2">
          <div v-for="type in paymentTypes" :key="type.id" class="flex items-center">
            <input
              type="radio"
              :id="type.id"
              v-model="paymentForm.paymentType"
              :value="type.id"
              class="h-4 w-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <label :for="type.id" class="ml-3 block text-sm font-medium text-gray-700">
              {{ type.label }}
            </label>
          </div>
        </div>
      </div>

      <!-- Назначение платежа -->
      <div>
        <label class="block text-sm font-medium text-gray-700">
          Назначение платежа
        </label>
        <div class="mt-1">
          <select
            v-model="paymentForm.paymentDest"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option v-for="dest in availablePaymentDests" :key="dest.id" :value="dest.id">
              {{ dest.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Комментарий -->
      <div v-if="paymentForm.paymentDest === 'Другое'">
        <label for="comment" class="block text-sm font-medium text-gray-700">
          Комментарий
        </label>
        <div class="mt-1">
          <textarea
            id="comment"
            v-model="paymentForm.comment"
            rows="3"
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Укажите назначение платежа"
          />
        </div>
      </div>

      <!-- Кнопки и уведомление -->
      <div class="flex items-center justify-between">
        <!-- Уведомление -->
        <div
          v-if="showSuccessMessage"
          class="text-green-700 text-xs flex items-center max-w-[200px]"
          :class="{ 
            'opacity-100 transition-opacity duration-[2000ms]': showSuccessMessage && !isClosing,
            'opacity-0 transition-opacity duration-[1000ms]': isClosing 
          }"
        >
          <Icon name="mdi:check-circle" class="w-4 h-4 mr-1 flex-shrink-0" />
          {{ successMessage }}
        </div>
        <div v-else class="flex-grow"></div>

        <!-- Кнопки -->
        <div class="flex space-x-3">
          <button
            type="button"
            class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="handleClose"
          >
            Отмена
          </button>
          <button
            type="button"
            :disabled="!isFormValid"
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleSubmitOnly"
          >
            Оплатить
          </button>
          <button
            type="button"
            :disabled="!isFormValid"
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleSubmitAndClose"
          >
            Оплатить и закрыть
          </button>
        </div>
      </div>
    </form>
  </Modal>
</template> 