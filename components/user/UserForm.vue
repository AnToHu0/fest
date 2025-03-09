<script setup lang="ts">
import type { User } from '~/types/user';
import ChildrenTable from './ChildrenTable.vue';

interface Props {
  userData: User;
  isAdmin?: boolean;
  isCreatingNew?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['saved', 'cancel']);

// Разбиваем ФИО на составляющие при инициализации
const [lastName = '', firstName = '', middleName = ''] = (props.userData.fullName || '').split(' ');

const form = ref({
  lastName,
  firstName,
  middleName,
  spiritualName: props.userData.spiritualName || '',
  email: props.userData.email,
  phone: props.userData.phone || '',
  city: props.userData.city || '',
  adminNotes: props.userData.adminNotes || '',
  birthDate: props.userData.birthDate ? new Date(props.userData.birthDate).toISOString().split('T')[0] : '',
  agreeToTerms: false
});

// Функции для форматирования телефона
const formatPhone = (value: string) => {
  if (!value) return '';

  const startsWithPlus7 = value.startsWith('+7');

  let digits = value.replace(/\D/g, '');

  if (startsWithPlus7 && digits.startsWith('7')) {
    digits = digits.substring(1);
  }

  if (!digits.length) return '+7';

  if (digits.length <= 3) {
    return `+7 (${digits}`;
  } else if (digits.length <= 6) {
    return `+7 (${digits.substring(0, 3)}) ${digits.substring(3)}`;
  } else if (digits.length <= 8) {
    return `+7 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  } else {
    return `+7 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`;
  }
};

const handlePhoneInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const cursorPosition = input.selectionStart;
  const oldValue = input.value;
  const newValue = formatPhone(input.value);

  form.value.phone = newValue;

  nextTick(() => {
    if (cursorPosition !== null) {
      let newCursorPosition = cursorPosition + (newValue.length - oldValue.length);

      if (newCursorPosition > 2 && newCursorPosition < 4 && newValue.length >= 4) {
        newCursorPosition = 4;
      }

      input.setSelectionRange(newCursorPosition, newCursorPosition);
    }
  });
};

// Инициализация телефона с маской при загрузке компонента
onMounted(() => {
  if (form.value.phone) {
    form.value.phone = formatPhone(form.value.phone);
  }
});

// Вычисляемое полное имя для отправки на сервер
const fullName = computed(() => {
  return [form.value.lastName, form.value.firstName, form.value.middleName]
    .filter(Boolean)
    .join(' ')
    .trim();
});

const isLoading = ref(false);
const errorMessage = ref('');

const handleSubmit = async (closeAfterSave = false) => {
  isLoading.value = true;
  errorMessage.value = '';

  if (props.isCreatingNew && !form.value.agreeToTerms) {
    errorMessage.value = 'Необходимо согласие на обработку персональных данных';
    isLoading.value = false;
    return;
  }

  try {
    const endpoint = props.isAdmin 
      ? props.userData.id ? `/api/admin/users/${props.userData.id}` : '/api/admin/users'
      : '/api/user/profile';

    const response = await $fetch(endpoint, {
      method: props.userData.id ? 'PUT' : 'POST',
      body: {
        ...form.value,
        fullName: fullName.value
      }
    });
    
    // Если это было создание нового пользователя, обновляем userData всеми данными с сервера
    if (!props.userData.id && response) {
      // Обновляем все поля userData данными из ответа сервера
      Object.assign(props.userData, response);
    }
    
    emit('saved', closeAfterSave);
  } catch (error: any) {
    console.error('Ошибка при сохранении пользователя:', error);
    errorMessage.value = error.data?.message || 'Ошибка при сохранении пользователя';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Форма пользователя -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div v-if="errorMessage" class="p-3 bg-red-50 text-red-700 border border-red-200 rounded">
        {{ errorMessage }}
      </div>

      <!-- ФИО разбито на три поля -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
          <input
            id="lastName"
            v-model="form.lastName"
            type="text"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">Имя</label>
          <input
            id="firstName"
            v-model="form.firstName"
            type="text"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label for="middleName" class="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
          <input
            id="middleName"
            v-model="form.middleName"
            type="text"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      <!-- Духовное имя и дата рождения в одной строке -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="spiritualName" class="block text-sm font-medium text-gray-700 mb-1">Духовное имя</label>
          <input
            id="spiritualName"
            v-model="form.spiritualName"
            type="text"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label for="birthDate" class="block text-sm font-medium text-gray-700 mb-1">Дата рождения</label>
          <input
            id="birthDate"
            v-model="form.birthDate"
            type="date"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      <!-- Email и телефон в одной строке -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            placeholder="+7 (___) ___-__-__"
            @input="handlePhoneInput"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label for="city" class="block text-sm font-medium text-gray-700 mb-1">Город</label>
        <input
          id="city"
          v-model="form.city"
          type="text"
          class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      <!-- Поле для примечаний администратора (только для админов) -->
      <div v-if="isAdmin">
        <label for="adminNotes" class="block text-sm font-medium text-gray-700 mb-1">Примечания администратора</label>
        <textarea
          id="adminNotes"
          v-model="form.adminNotes"
          rows="4"
          class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          placeholder="Примечания видны только администраторам"
        ></textarea>
      </div>

      <!-- Согласие на обработку персональных данных (только при создании нового пользователя) -->
      <div v-if="isCreatingNew" class="mt-4">
        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="agreeToTerms"
              v-model="form.agreeToTerms"
              type="checkbox"
              class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="agreeToTerms" class="font-medium text-gray-700">Согласие на обработку персональных данных</label>
            <p class="text-gray-500">Пользователь соглашается на обработку персональных данных в соответствии с политикой конфиденциальности.</p>
          </div>
        </div>
      </div>

      <div class="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          @click="emit('cancel')"
          class="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Отмена
        </button>
        <button
          type="button"
          @click="handleSubmit(false)"
          :disabled="isLoading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <span v-if="isLoading" class="flex items-center">
            <Icon name="mdi:loading" class="animate-spin mr-2" />
            Сохранение...
          </span>
          <span v-else>Сохранить</span>
        </button>
        <button
          type="submit"
          :disabled="isLoading"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          <span v-if="isLoading" class="flex items-center">
            <Icon name="mdi:loading" class="animate-spin mr-2" />
            Сохранение...
          </span>
          <span v-else>Сохранить и закрыть</span>
        </button>
      </div>
    </form>

    <!-- Таблица детей -->
    <div v-if="userData.id" class="pt-6 border-t">
      <ChildrenTable
        :userId="userData.id"
        :parentData="userData"
      />
    </div>
  </div>
</template> 