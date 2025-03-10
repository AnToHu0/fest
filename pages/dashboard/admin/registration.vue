<script setup lang="ts">
import type { User } from '~/types/user';
import type { FestivalRegistrationFormData } from '~/types/registration';
import type { Payment } from '~/types/payment';
import type { Festival } from '~/types/festival';
import BaseUsersTable from '~/components/admin/BaseUsersTable.vue';
import AdminFestivalRegistrationModal from '~/components/admin/AdminFestivalRegistrationModal.vue';

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
});

const { hasRole, currentUser } = useRoles();

// Получаем данные текущего пользователя напрямую
const { data: authData } = useAuth();
const currentUserData = computed(() => {
  const user = authData.value?.user;
  if (user) {
    return {
      id: user.id || authData.value?.userId,
      ...user
    };
  }
  return null;
});

// Проверяем, есть ли у пользователя роль admin или registrar
const canAccess = computed(() => hasRole('admin') || hasRole('registrar'));

// Если у пользователя нет нужных ролей, перенаправляем его на главную страницу дашборда
onMounted(() => {
  if (!canAccess.value) {
    navigateTo('/dashboard');
  }
});

// Состояние для списка пользователей
const users = ref<User[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Состояние пагинации
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});

// Состояние сортировки
const sortField = ref('fullName');
const sortOrder = ref<'asc' | 'desc'>('asc');

// Состояние поиска
const searchQuery = ref('');
const showOnlyRegistered = ref(false);

// Состояние модального окна регистрации
const isRegistrationModalOpen = ref(false);
const selectedUser = ref<User | null>(null);

// Загрузка пользователей
const fetchUsers = async () => {
  try {
    isLoading.value = true;
    const response = await $fetch('/api/admin/users', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.limit,
        sort: sortField.value,
        order: sortOrder.value,
        search: searchQuery.value,
        showOnlyRegistered: showOnlyRegistered.value
      }
    });
    users.value = response.users;
    pagination.value = response.pagination;
  } catch (e: any) {
    error.value = e.message || 'Ошибка при загрузке пользователей';
  } finally {
    isLoading.value = false;
  }
};

// Обработчики событий таблицы
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchUsers();
};

const handleLimitChange = (limit: number) => {
  pagination.value.limit = limit;
  pagination.value.page = 1;
  fetchUsers();
};

const handleSortChange = (field: string, order: 'asc' | 'desc') => {
  sortField.value = field;
  sortOrder.value = order;
  fetchUsers();
};

const handleSearchChange = (query: string, onlyRegistered: boolean = showOnlyRegistered.value) => {
  searchQuery.value = query;
  showOnlyRegistered.value = onlyRegistered;
  pagination.value.page = 1;
  fetchUsers();
};

// Обработчик регистрации на фестиваль
const handleRegister = (user: User) => {
  selectedUser.value = user;
  isRegistrationModalOpen.value = true;
};

// Обработчик закрытия модального окна регистрации
const handleCloseRegistrationModal = () => {
  isRegistrationModalOpen.value = false;
  selectedUser.value = null;
};

// Обработчик отправки формы регистрации
const handleSubmitRegistration = async (formData: FestivalRegistrationFormData) => {
  try {
    const response = await $fetch('/api/admin/registration/create', {
      method: 'POST',
      body: formData
    });

    if (response.success) {
      // Сначала закрываем модальное окно
      handleCloseRegistrationModal();
      // Затем обновляем данные
      await refreshData();
      // И только после этого подсвечиваем строку
      usersTableRef.value?.setRecentlyRegistered(formData.userId);
    }
  } catch (error) {
    console.error('Ошибка при создании регистрации:', error);
    alert('Ошибка при создании регистрации');
  }
};

// Обработчик обновления регистрации
const handleUpdateRegistration = async (formData: FestivalRegistrationFormData) => {
  try {
    const response = await $fetch(`/api/admin/registration/${formData.registrationId}`, {
      method: 'PUT',
      body: formData
    });

    if (response.success) {
      handleCloseRegistrationModal();
      await refreshData();
      // Подсвечиваем обновленную строку
      usersTableRef.value?.setRecentlyRegistered(formData.userId);
    }
  } catch (error) {
    console.error('Ошибка при обновлении регистрации:', error);
    alert('Ошибка при обновлении регистрации');
  }
};

// Обработчик удаления регистрации
const handleDeleteRegistration = async (registrationId: number) => {
  try {
    const response = await $fetch(`/api/admin/registration/${registrationId}`, {
      method: 'DELETE'
    });

    if (response.success) {
      const userId = selectedUser.value?.id;
      handleCloseRegistrationModal();
      await refreshData();
      if (userId) {
        usersTableRef.value?.setRecentlyDeregistered(userId);
      }
    }
  } catch (error) {
    console.error('Ошибка при удалении регистрации:', error);
    alert('Ошибка при удалении регистрации');
  }
};

// Обработчик обновления данных
const handleRefresh = () => {
  fetchUsers();
};

// Загружаем пользователей при монтировании компонента
onMounted(() => {
  fetchUsers();
});

const usersTableRef = ref<InstanceType<typeof BaseUsersTable> | null>(null);

const refreshData = async () => {
  await fetchUsers();
};

const currentFestival = ref<Festival | null>(null);

// Получение текущего активного фестиваля
const fetchCurrentFestival = async () => {
  try {
    const { data } = await useFetch('/api/festivals/current');
    if (data.value?.festival) {
      currentFestival.value = data.value.festival;
    } else {
      currentFestival.value = null;
    }
  } catch (error) {
    console.error('Ошибка при получении текущего фестиваля:', error);
    // Вместо showErrorNotification используем alert
    alert('Ошибка при получении текущего фестиваля');
  }
};

onMounted(async () => {
  await fetchCurrentFestival();
  await fetchUsers();
});

// Обработчик создания платежа
const handlePayment = async (payment: Payment) => {
  try {    
    // Отправляем запрос на создание платежа
    const response = await $fetch('/api/admin/payments/create', {
      method: 'POST',
      body: payment
    });
    
    if (response.success) {
      // Обновляем данные после успешного создания платежа
      await refreshData();
    } else {
      throw new Error(response.message || 'Ошибка при создании платежа');
    }
  } catch (error) {
    alert('Ошибка при создании платежа');
  }
};
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Регистрация на фестиваль</h1>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
      {{ error }}
    </div>

    <BaseUsersTable
      ref="usersTableRef"
      :users="users"
      :pagination="pagination"
      :is-loading="isLoading"
      :sort-field="sortField"
      :sort-order="sortOrder"
      :show-roles="false"
      :show-registration-button="true"
      :show-payment-button="true"
      :allow-role-management="false"
      :show-add-button="false"
      :current-festival="currentFestival"
      :current-admin="{
        id: currentUserData.value?.id || authData.value?.userId,
        fullName: currentUserData.value?.fullName || 'Администратор'
      }"
      :show-registration-filter="true"
      :highlight-registered="true"
      @update:page="handlePageChange"
      @update:limit="handleLimitChange"
      @update:sort="handleSortChange"
      @update:search="handleSearchChange"
      @register="handleRegister"
      @payment="handlePayment"
      @refresh="refreshData"
    />

    <!-- Модальное окно регистрации на фестиваль -->
    <AdminFestivalRegistrationModal
      v-if="selectedUser"
      :is-open="isRegistrationModalOpen"
      :user="selectedUser"
      :current-festival="currentFestival"
      :is-registered="selectedUser.isRegistered"
      @close="handleCloseRegistrationModal"
      @submit="handleSubmitRegistration"
      @update="handleUpdateRegistration"
      @delete="handleDeleteRegistration"
    />
  </div>
</template> 