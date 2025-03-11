<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Управление размещением</h1>
    
    <div class="mb-6">
      <AccommodationFilter @filter="handleFilter" />
    </div>

    <div>
      <AccommodationTimelineGridV2 
        :rooms="filteredRooms" 
        :loading="loading"
        :festival-info="festivalInfo"
        @create-placement="handleCreatePlacement"
        @edit-placement="handleEditPlacement"
        @delete-placement="handleDeletePlacement"
      />
    </div>

    <!-- Модальное окно для создания/редактирования размещения -->
    <PlacementFormModal
      v-model:show="showPlacementModal"
      :placement="currentPlacement"
      :room="selectedRoom"
      :slot="selectedSlot"
      @submit="handleSubmitPlacement"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Room, Placement, PlacementFormData } from '~/types/accommodation';
import { AccommodationFilter } from '~/components/accommodation';
import AccommodationTimelineGridV2 from '~/components/accommodation/AccommodationTimelineGridV2.vue';
import { PlacementFormModal } from '~/components/accommodation';

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard',
});

// Состояние загрузки
const loading = ref(true);

// Список комнат с размещениями
const rooms = ref<Room[]>([]);

// Информация о фестивале
const festivalInfo = ref(null);

// Фильтры
const filters = ref({
  building: null as number | null,
  floor: null as number | null,
  number: null as number | null,
  occupancy: 'all' as 'all' | 'occupied' | 'available',
  searchUser: '',
});

// Модальное окно размещения
const showPlacementModal = ref(false);
const currentPlacement = ref<Placement | null>(null);
const selectedRoom = ref<Room | null>(null);
const selectedSlot = ref<number | null>(null);

// Отфильтрованные комнаты
const filteredRooms = computed(() => {
  let result = [...rooms.value];

  // Фильтр по корпусу
  if (filters.value.building !== null) {
    result = result.filter(room => room.building === filters.value.building);
  }

  // Фильтр по этажу
  if (filters.value.floor !== null) {
    result = result.filter(room => room.floor === filters.value.floor);
  }

  // Фильтр по номеру
  if (filters.value.number !== null) {
    result = result.filter(room => room.number === filters.value.number);
  }

  // Фильтр по занятости
  if (filters.value.occupancy === 'occupied') {
    result = result.filter(room => room.placements && room.placements.length > 0);
  } else if (filters.value.occupancy === 'available') {
    result = result.filter(room => !room.placements || room.placements.length === 0);
  }

  // Фильтр по имени/email/телефону пользователя
  if (filters.value.searchUser) {
    const searchLower = filters.value.searchUser.toLowerCase();
    result = result.filter(room => {
      if (!room.placements) return false;
      return room.placements.some(placement => {
        if (!placement.user) return false;
        
        // Проверяем ФИО
        const fullName = placement.user.fullName ? placement.user.fullName.toLowerCase() : '';
        
        // Проверяем email
        const email = placement.user.email ? placement.user.email.toLowerCase() : '';
        
        // Проверяем телефон (обрабатываем разные варианты доступа к полю)
        let phone = '';
        if (placement.user.phone) {
          phone = placement.user.phone;
        } else if (placement.user.phoneNumber) {
          phone = placement.user.phoneNumber;
        } else if (placement.User && placement.User.phone) {
          phone = placement.User.phone;
        } else if (placement.User && placement.User.phoneNumber) {
          phone = placement.User.phoneNumber;
        }
        
        // Удаляем все нецифровые символы из строки поиска и телефона для сравнения
        const cleanSearchPhone = searchLower.replace(/\D/g, '');
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Проверяем, содержит ли какое-либо из полей строку поиска
        return fullName.includes(searchLower) || 
               email.includes(searchLower) || 
               (cleanPhone && cleanPhone.includes(cleanSearchPhone));
      });
    });
  }

  return result;
});

// Загрузка данных
const fetchRooms = async () => {
  loading.value = true;
  try {
    const response = await $fetch('/api/accommodation/rooms', {
      query: {
        withPlacements: 'true',
      },
    });
    rooms.value = response.rooms;
    
    // Если получена информация о фестивале, передаем её в компонент таймлайна
    festivalInfo.value = response.festivalInfo;
    
  } catch (error) {
    console.error('Ошибка при загрузке комнат:', error);
    showErrorToast('Не удалось загрузить список комнат');
  } finally {
    loading.value = false;
  }
};

// Обработчик фильтрации
const handleFilter = (newFilters: any) => {
  filters.value = { ...newFilters };
};

// Обработчик создания размещения
const handleCreatePlacement = (roomId: number, slot: number) => {
  const room = rooms.value.find(r => r.id === roomId);
  if (!room) return;

  selectedRoom.value = room;
  selectedSlot.value = slot;
  currentPlacement.value = null;
  showPlacementModal.value = true;
};

// Обработчик редактирования размещения
const handleEditPlacement = (placement: Placement) => {
  const room = rooms.value.find(r => r.id === placement.roomId);
  if (!room) return;

  selectedRoom.value = room;
  selectedSlot.value = placement.slot;
  currentPlacement.value = placement;
  showPlacementModal.value = true;
};

// Обработчик удаления размещения
const handleDeletePlacement = async (placementId: number) => {
  try {
    await $fetch(`/api/accommodation/placements/${placementId}`, {
      method: 'DELETE',
    });
    
    showSuccessToast('Размещение успешно удалено');
    
    // Обновляем список комнат
    await fetchRooms();
  } catch (error) {
    console.error('Ошибка при удалении размещения:', error);
    showErrorToast('Не удалось удалить размещение');
  }
};

// Обработчик отправки формы размещения
const handleSubmitPlacement = async (formData: PlacementFormData) => {
  try {
    if (currentPlacement.value) {
      // Обновление существующего размещения
      await $fetch(`/api/accommodation/placements/${currentPlacement.value.id}`, {
        method: 'PUT',
        body: formData,
      });
      showSuccessToast('Размещение успешно обновлено');
    } else {
      // Создание нового размещения
      await $fetch('/api/accommodation/placements', {
        method: 'POST',
        body: formData,
      });
      showSuccessToast('Размещение успешно создано');
    }
    
    // Закрываем модальное окно и обновляем данные
    showPlacementModal.value = false;
    await fetchRooms();
  } catch (error) {
    console.error('Ошибка при сохранении размещения:', error);
    showErrorToast('Не удалось сохранить размещение');
  }
};

// Вспомогательные функции для уведомлений
const showSuccessToast = (message: string) => {
  // Здесь будет код для показа уведомления об успехе
  console.log('Success:', message);
};

const showErrorToast = (message: string) => {
  // Здесь будет код для показа уведомления об ошибке
  console.error('Error:', message);
};

// Загрузка данных при монтировании компонента
onMounted(() => {
  fetchRooms();
});
</script> 