<script setup lang="ts">
import type { User } from '~/types/user';
import ChildrenTable from './ChildrenTable.vue';

interface Props {
  userData: User;
  isAdmin?: boolean;
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

const handleSubmit = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const endpoint = props.isAdmin 
      ? `/api/admin/users/${props.userData.id}`
      : '/api/user/profile';

    await $fetch(endpoint, {
      method: props.userData.id ? 'PUT' : 'POST',
      body: {
        ...form.value,
        fullName: fullName.value
      }
    });
    
    emit('saved');
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
          class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
        />
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

      <div class="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          @click="emit('cancel')"
          class="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Отмена
        </button>
        <button
          type="submit"
          :disabled="isLoading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <span v-if="isLoading" class="flex items-center">
            <Icon name="mdi:loading" class="animate-spin mr-2" />
            Сохранение...
          </span>
          <span v-else>Сохранить</span>
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