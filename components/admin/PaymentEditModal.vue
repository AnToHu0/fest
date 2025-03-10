<script setup lang="ts">
import type { Payment } from '~/types/payment';
import type { User } from '~/types/user';
import Modal from '~/components/ui/Modal.vue';
import SearchableSelect from '~/components/ui/SearchableSelect.vue';

interface Props {
  isOpen: boolean;
  payment?: Payment | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'save']);

const title = computed(() => props.payment ? 'Редактирование платежа' : 'Создание платежа');
const buttonText = computed(() => props.payment ? 'Сохранить' : 'Создать');

// Состояния
const isLoading = ref(false);
const error = ref('');
const users = ref<User[]>([]);
const managers = ref<User[]>([]);
const festivals = ref<{ id: string; name: string; isActive: boolean; year: number }[]>([]);

// Состояние формы
const formData = ref<Partial<Payment>>({
  amount: 0,
  paymentType: 'Наличные менеджеру',
  paymentDest: 'Участие',
  date: new Date().toISOString().replace('Z', '').slice(0, 16),
  userId: '',
  registratorId: '',
  festivalId: ''
});

// Сброс формы
const resetForm = () => {
  formData.value = {
    amount: 0,
    paymentType: 'Наличные менеджеру',
    paymentDest: 'Участие',
    date: new Date().toISOString().replace('Z', '').slice(0, 16),
    userId: '',
    registratorId: '',
    festivalId: ''
  };
};

// Инициализация формы при открытии
const initForm = () => {
  if (props.payment) {
    formData.value = {
      ...props.payment,
      userId: props.payment.customerId,
      registratorId: props.payment.adminId,
      date: props.payment.date ? props.payment.date.replace('Z', '').slice(0, 16) : new Date().toISOString().replace('Z', '').slice(0, 16)
    };
  } else {
    resetForm();
  }
};

// Преобразуем списки пользователей и менеджеров в формат для селекта
const userOptions = computed(() => users.value.map(user => ({
  id: user.id,
  label: user.fullName
})));

const managerOptions = computed(() => managers.value.map(manager => ({
  id: manager.id,
  label: manager.fullName
})));

// Загрузка списка пользователей
const loadUsers = async () => {
  try {
    const response = await $fetch('/api/admin/users', {
      params: {
        limit: 1000,
        showOnlyRegistered: false
      }
    });
    if (response.users) {
      users.value = response.users;
      managers.value = response.users; // Используем те же данные для менеджеров
    }
  } catch (err) {
    console.error('Ошибка при загрузке пользователей:', err);
    error.value = 'Ошибка при загрузке списка пользователей';
  }
};

// Загрузка списка фестивалей
const loadFestivals = async () => {
  try {
    const response = await $fetch('/api/admin/festivals');
    if (response.festivals) {
      // Сортируем фестивали по году в обратном порядке (новые сверху)
      festivals.value = response.festivals.sort((a, b) => b.year - a.year);
      // Если нет выбранного фестиваля, устанавливаем активный
      if (!formData.value.festivalId) {
        const activeFestival = festivals.value.find(f => f.isActive);
        if (activeFestival) {
          formData.value.festivalId = activeFestival.id;
        }
      }
    }
  } catch (err) {
    console.error('Ошибка при загрузке фестивалей:', err);
    error.value = 'Ошибка при загрузке списка фестивалей';
  }
};

// Типы платежей
const paymentTypes = [
  { id: 'Наличные менеджеру', label: 'Наличные менеджеру' },
  { id: 'На карту менеджеру', label: 'На карту менеджеру' }
];

// Назначения платежей
const paymentDests = [
  { id: 'Участие', label: 'Оплата за участие' },
  { id: 'Проживание', label: 'Оплата за проживание' },
  { id: 'Автомобиль', label: 'Оплата за автомобиль' },
  { id: 'Животное', label: 'Оплата за животное' }
];

// Загрузка данных при открытии модального окна
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    initForm();
    await Promise.all([
      loadUsers(),
      loadFestivals()
    ]);
  }
}, { immediate: true });

// Следим за изменением платежа
watch(() => props.payment, (newPayment) => {
  if (newPayment) {
    formData.value = {
      ...newPayment,
      userId: newPayment.customerId,
      registratorId: newPayment.adminId,
      date: newPayment.date ? newPayment.date.replace('Z', '').slice(0, 16) : new Date().toISOString().replace('Z', '').slice(0, 16)
    };
  } else {
    formData.value = {
      amount: 0,
      paymentType: 'Наличные менеджеру',
      paymentDest: 'Участие',
      date: new Date().toISOString().replace('Z', '').slice(0, 16),
      userId: '',
      registratorId: '',
      festivalId: ''
    };
  }
});

// Обработчик сохранения
const handleSubmit = async () => {
  isLoading.value = true;
  error.value = '';

  try {
    if (!formData.value.userId || !formData.value.registratorId) {
      throw new Error('Необходимо выбрать пользователя и менеджера');
    }

    if (!formData.value.festivalId) {
      throw new Error('Необходимо выбрать фестиваль');
    }

    if (!formData.value.amount || formData.value.amount <= 0) {
      throw new Error('Сумма должна быть больше нуля');
    }

    // Формируем данные платежа без дублирования полей
    const paymentData = {
      id: props.payment?.id,
      amount: formData.value.amount,
      paymentType: formData.value.paymentType,
      paymentDest: formData.value.paymentDest,
      date: `${formData.value.date}Z`,
      customerId: formData.value.userId,
      adminId: formData.value.registratorId,
      festivalId: formData.value.festivalId
    };

    // Определяем URL и метод в зависимости от того, создаем или обновляем платеж
    const url = props.payment 
      ? `/api/admin/payments/${props.payment.id}`
      : '/api/admin/payments/create';
    
    const method = props.payment ? 'PUT' : 'POST';

    // Делаем запрос к API
    const response = await $fetch(url, {
      method,
      body: paymentData
    });

    if (!response.success) {
      throw new Error(response.message || 'Ошибка при сохранении платежа');
    }

    // Если всё успешно, эмитим событие с данными платежа
    emit('save', response.payment);

    // Закрываем модальное окно после успешного сохранения
    handleClose();
  } catch (err: any) {
    console.error('Ошибка при сохранении:', err);
    error.value = err.message || 'Ошибка при сохранении платежа';
  } finally {
    isLoading.value = false;
  }
};

// Обработчик закрытия
const handleClose = () => {
  error.value = '';
  resetForm();
  emit('close');
};

// Обработчик сохранения без закрытия
const handleSubmitOnly = async () => {
  await handleSubmit();
};

// Обработчик сохранения и закрытия
const handleSubmitAndClose = async () => {
  await handleSubmit();
  if (!error.value) {
    handleClose();
  }
};
</script>

<template>
  <Modal
    v-if="props.isOpen"
    :title="title"
    @close="handleClose"
  >
    <div class="p-6">
      <!-- Форма -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Ошибка -->
        <div v-if="error" class="p-3 bg-red-50 text-red-700 border border-red-200 rounded">
          {{ error }}
        </div>

        <!-- Выбор фестиваля -->
        <div>
          <label for="festival" class="block text-sm font-medium text-gray-700">
            Фестиваль
          </label>
          <select
            id="festival"
            v-model="formData.festivalId"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            required
          >
            <option v-for="festival in festivals" :key="festival.id" :value="festival.id">
              Фестиваль {{ festival.year }} {{ festival.isActive ? '(текущий)' : '' }}
            </option>
          </select>
        </div>

        <!-- Выбор пользователя -->
        <SearchableSelect
          v-model="formData.userId"
          :options="userOptions"
          label="Пользователь"
          placeholder="Выберите пользователя"
          required
        />

        <!-- Выбор менеджера -->
        <SearchableSelect
          v-model="formData.registratorId"
          :options="managerOptions"
          label="Менеджер"
          placeholder="Выберите менеджера"
          required
        />

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
              v-model="formData.amount"
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
          <label for="paymentType" class="block text-sm font-medium text-gray-700">
            Тип оплаты
          </label>
          <select
            id="paymentType"
            v-model="formData.paymentType"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            required
          >
            <option v-for="type in paymentTypes" :key="type.id" :value="type.id">
              {{ type.label }}
            </option>
          </select>
        </div>

        <!-- Назначение платежа -->
        <div>
          <label for="paymentDest" class="block text-sm font-medium text-gray-700">
            Назначение платежа
          </label>
          <select
            id="paymentDest"
            v-model="formData.paymentDest"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            required
          >
            <option v-for="dest in paymentDests" :key="dest.id" :value="dest.id">
              {{ dest.label }}
            </option>
          </select>
        </div>

        <!-- Дата -->
        <div>
          <label for="date" class="block text-sm font-medium text-gray-700">
            Дата платежа
          </label>
          <input
            type="datetime-local"
            id="date"
            v-model="formData.date"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            required
          />
        </div>

        <!-- Кнопки -->
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            @click="handleClose"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            :disabled="isLoading"
          >
            <Icon v-if="isLoading" name="mdi:loading" class="w-5 h-5 animate-spin" />
            {{ buttonText }}
          </button>
        </div>
      </form>
    </div>
  </Modal>
</template> 