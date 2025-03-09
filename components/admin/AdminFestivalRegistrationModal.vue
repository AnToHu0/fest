<script setup lang="ts">
import type { User } from '~/types/user';
import type { Festival } from '~/types/festival';
import type { FestivalRegistrationFormData } from '~/types/registration';
import Modal from '~/components/ui/Modal.vue';
import FestivalRegistrationForm from '~/components/user/FestivalRegistrationForm.vue';

interface Props {
  isOpen: boolean;
  user: User;
  currentFestival: Festival | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'submit']);

// Загрузка существующей регистрации
const { data: registrationData, refresh: refreshRegistration } = await useFetch(`/api/admin/registration/${props.user.id}`, {
  key: `registration-${props.user.id}`,
  transform: (response: any) => {
    if (response.success && response.registration) {
      return response.registration;
    }
    return null;
  }
});

// Обновляем данные при открытии модального окна
watch(() => props.isOpen, async (isOpen) => {
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

// Формируем начальные данные для формы
const getInitialData = () => {
  if (registrationData.value) {
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
    :title="`${registrationData ? 'Редактирование' : 'Регистрация на фестиваль'}: ${user.fullName}`"
    @close="handleClose"
    size="xl"
  >
    <div v-if="!props.currentFestival" class="text-center text-gray-500">
      Нет активных фестивалей для регистрации
    </div>
    <FestivalRegistrationForm
      v-else
      :festival="props.currentFestival"
      :userId="user.id"
      :initial-data="getInitialData()"
      @close="handleClose"
      @submit="handleSubmit"
    />
  </Modal>
</template> 