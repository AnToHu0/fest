<script setup lang="ts">
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';
import Modal from '~/components/ui/Modal.vue';
import BuildingBlock from '~/components/admin/BuildingBlock.vue';

definePageMeta({
  middleware: "auth",
  layout: "dashboard"
});

const { hasRole } = useRoles();
const route = useRoute();

// Проверяем, есть ли у пользователя роль admin
const canAccess = computed(() => hasRole('admin'));

// Если у пользователя нет роли admin, перенаправляем его на главную страницу дашборда
onMounted(() => {
  if (!canAccess.value) {
    navigateTo('/dashboard');
  }
});

// Состояние для списка комнат
const rooms = ref<any[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Состояние для модального окна добавления/редактирования комнаты
const isRoomModalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const currentRoom = ref<any>({
  building: '',
  floor: '',
  number: '',
  size: '',
  description: ''
});

// Состояние для модального окна подтверждения удаления комнаты
const isDeleteConfirmOpen = ref(false);
const roomToDelete = ref<number | null>(null);

// Получение списка комнат
const fetchRooms = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Используем $fetch вместо useFetch для гарантированной загрузки данных
    const response = await $fetch('/api/admin/rooms', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (response && response.rooms) {
      rooms.value = response.rooms;
      console.log('Загружено комнат:', rooms.value.length);
    } else {
      rooms.value = [];
      console.log('Нет доступных комнат или неверный формат данных:', response);
    }
  } catch (err: any) {
    error.value = err.message || 'Ошибка при загрузке комнат';
    console.error('Ошибка при загрузке комнат:', err);
  } finally {
    isLoading.value = false;
  }
};

// Группировка комнат по корпусам
const roomsByBuilding = computed(() => {
  const grouped: Record<number, any[]> = {};
  
  rooms.value.forEach(room => {
    if (room && room.building !== undefined && room.building !== null) {
      const buildingNumber = Number(room.building);
      if (!grouped[buildingNumber]) {
        grouped[buildingNumber] = [];
      }
      grouped[buildingNumber].push(room);
    }
  });
  
  return grouped;
});

// Открытие модального окна для создания новой комнаты
const openCreateRoomModal = (buildingNumber = '') => {
  modalMode.value = 'create';
  currentRoom.value = {
    building: buildingNumber,
    floor: '',
    number: '',
    size: '',
    description: ''
  };
  isRoomModalOpen.value = true;
};

// Открытие модального окна для редактирования комнаты
const openEditRoomModal = (room: any) => {
  modalMode.value = 'edit';
  currentRoom.value = { ...room };
  isRoomModalOpen.value = true;
};

// Открытие диалога подтверждения удаления комнаты
const openDeleteConfirm = (roomId: number) => {
  roomToDelete.value = roomId;
  isDeleteConfirmOpen.value = true;
};

// Сохранение комнаты (создание или обновление)
const saveRoom = async () => {
  try {
    if (modalMode.value === 'create') {
      await $fetch('/api/admin/rooms', {
        method: 'POST',
        body: currentRoom.value
      });
    } else {
      await $fetch(`/api/admin/rooms/${currentRoom.value.id}`, {
        method: 'PUT',
        body: currentRoom.value
      });
    }
    
    isRoomModalOpen.value = false;
    await fetchRooms();
  } catch (err: any) {
    console.error(err);
    alert(err.message || 'Ошибка при сохранении комнаты');
  }
};

// Удаление комнаты
const deleteRoom = async () => {
  if (!roomToDelete.value) return;
  
  try {
    await $fetch(`/api/admin/rooms/${roomToDelete.value}`, {
      method: 'DELETE'
    });
    
    isDeleteConfirmOpen.value = false;
    roomToDelete.value = null;
    await fetchRooms();
  } catch (err: any) {
    console.error(err);
    alert(err.message || 'Ошибка при удалении комнаты');
  }
};

// Загрузка данных при монтировании компонента
onMounted(fetchRooms);
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Управление жильём</h1>
      
      <button 
        @click="openCreateRoomModal()" 
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
      >
        <Icon name="mdi:plus" class="w-5 h-5 mr-1" />
        Добавить комнату
      </button>
    </div>
    
    <div v-if="isLoading" class="flex justify-center my-8">
      <Icon name="mdi:loading" class="animate-spin text-blue-500 w-8 h-8" />
    </div>
    
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>
    
    <div v-else-if="Object.keys(roomsByBuilding).length === 0" class="bg-white rounded-lg shadow p-6 text-center">
      <p class="text-gray-500">Нет доступных комнат. Добавьте первую комнату, чтобы начать.</p>
    </div>
    
    <div v-else class="space-y-8">
      <BuildingBlock
        v-for="(buildingRooms, building) in roomsByBuilding" 
        :key="`building-${building}`"
        :building="Number(building)"
        :rooms="buildingRooms"
        @edit="openEditRoomModal"
        @delete="openDeleteConfirm"
        @add="openCreateRoomModal"
      />
    </div>
    
    <!-- Модальное окно добавления/редактирования комнаты -->
    <Modal 
      v-if="isRoomModalOpen"
      :title="modalMode === 'create' ? 'Добавить комнату' : 'Редактировать комнату'"
      @close="isRoomModalOpen = false"
    >
      <form @submit.prevent="saveRoom" class="space-y-4" v-if="currentRoom">
        <!-- Корпус и этаж в одной строке -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="building" class="block text-sm font-medium text-gray-700 mb-1">Корпус</label>
            <input 
              id="building" 
              v-model="currentRoom.building" 
              type="number" 
              min="1"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          
          <div>
            <label for="floor" class="block text-sm font-medium text-gray-700 mb-1">Этаж</label>
            <input 
              id="floor" 
              v-model="currentRoom.floor" 
              type="number" 
              min="1"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>
        
        <!-- Номер комнаты и вместимость в одной строке -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="number" class="block text-sm font-medium text-gray-700 mb-1">Номер комнаты</label>
            <input 
              id="number" 
              v-model="currentRoom.number" 
              type="number" 
              min="1"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          
          <div>
            <label for="size" class="block text-sm font-medium text-gray-700 mb-1">Вместимость (человек)</label>
            <input 
              id="size" 
              v-model="currentRoom.size" 
              type="number" 
              min="1"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>
        
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <textarea 
            id="description" 
            v-model="currentRoom.description" 
            rows="3"
            class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
          ></textarea>
        </div>
        
        <div class="flex justify-end space-x-3 pt-4">
          <button 
            type="button"
            @click="isRoomModalOpen = false"
            class="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Отмена
          </button>
          <button 
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {{ modalMode === 'create' ? 'Создать' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </Modal>
    
    <!-- Диалог подтверждения удаления -->
    <ConfirmDialog
      :isOpen="isDeleteConfirmOpen"
      v-model="isDeleteConfirmOpen"
      title="Удаление комнаты"
      message="Вы уверены, что хотите удалить эту комнату? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      @confirm="deleteRoom"
    />
  </div>
</template> 