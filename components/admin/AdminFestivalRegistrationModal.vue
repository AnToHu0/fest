<script setup lang="ts">
import type { User } from '~/types/user';
import type { Festival } from '~/types/festival';
import type { FestivalRegistrationFormData } from '~/types/registration';
import Modal from '~/components/ui/Modal.vue';
import FestivalRegistrationForm from '~/components/user/FestivalRegistrationForm.vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

interface Props {
  isOpen: boolean;
  user: User;
  currentFestival: Festival | null;
  isRegistered: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'submit', 'update', 'delete']);

// Состояние диалога подтверждения удаления
const isConfirmDialogOpen = ref(false);

// Состояние регистрации (изначально берем из пропса, потом обновляем из API)
const hasRegistration = ref(props.isRegistered);

// Загрузка существующей регистрации
const { data: registrationData, refresh: refreshRegistration } = await useFetch(
  () => props.currentFestival && props.isRegistered
    ? `/api/admin/registration/${props.user.id}?festivalId=${props.currentFestival.id}`
    : null,
  {
    key: `registration-${props.user.id}`,
    transform: (response: any) => {
      if (response?.success && response.registration) {
        hasRegistration.value = true;
        return response.registration;
      }
      hasRegistration.value = false;
      return null;
    }
  }
);

// Обновляем данные при открытии модального окна и изменении фестиваля
watch([() => props.isOpen, () => props.currentFestival?.id], async ([isOpen]) => {
  if (isOpen) {
    await refreshRegistration();
  }
});

// Обработчик закрытия модального окна
const handleClose = () => {
  emit('close');
};

// Обработчик отправки формы
const handleSubmit = async (formData: FestivalRegistrationFormData) => {
  if (!props.currentFestival?.id) return;
  emit('submit', { ...formData, userId: props.user.id, festivalId: props.currentFestival.id });
};

// Обработчик обновления регистрации
const handleUpdate = async (formData: FestivalRegistrationFormData) => {
  if (!props.currentFestival?.id || !registrationData.value?.id) return;
  emit('update', { ...formData, userId: props.user.id, festivalId: props.currentFestival.id, registrationId: registrationData.value.id });
};

// Обработчик удаления регистрации
const handleDelete = async () => {
  isConfirmDialogOpen.value = true;
};

// Подтверждение удаления
const confirmDelete = () => {
  if (registrationData.value?.id) {
    emit('delete', registrationData.value.id);
  }
  isConfirmDialogOpen.value = false;
};

// Отмена удаления
const cancelDelete = () => {
  isConfirmDialogOpen.value = false;
};

// Формируем начальные данные для формы
const getInitialData = () => {
  if (hasRegistration.value && registrationData.value) {
    return registrationData.value;
  }

  if (props.currentFestival) {
    return {
      arrivalDate: props.currentFestival.startDate,
      departureDate: props.currentFestival.endDate,
      hasCar: false,
      freeSeatsInCar: 0,
      hasPet: false,
      notes: '',
      departmentIds: [],
      children: []
    };
  }

  return undefined;
};
</script>

<template>
  <Modal
    v-if="isOpen"
    :title="`${hasRegistration ? 'Редактирование' : 'Регистрация на фестиваль'}: ${user.fullName}`"
    @close="handleClose"
    size="xl"
  >
    <div v-if="!props.currentFestival" class="text-center text-gray-500">
      Нет активных фестивалей для регистрации
    </div>
    <template v-else>
      <FestivalRegistrationForm
        :festival="props.currentFestival"
        :userId="user.id"
        :initial-data="hasRegistration ? getInitialData() : undefined"
        :show-festival-info="false"
        @close="handleClose"
        @submit="handleSubmit"
        @update="handleUpdate"
        @delete="handleDelete"
      />
    </template>
  </Modal>

  <!-- Диалог подтверждения удаления -->
  <ConfirmDialog
    :is-open="isConfirmDialogOpen"
    title="Удаление регистрации"
    message="Вы уверены, что хотите удалить регистрацию? Это действие нельзя отменить."
    confirm-text="Удалить"
    cancel-text="Отмена"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template> 