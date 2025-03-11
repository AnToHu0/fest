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
        
        // Проверяем searchField
        const searchField = placement.user.searchField ? placement.user.searchField.toLowerCase() : '';
        
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
               searchField.includes(searchLower) ||
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
    
    // Вместо полной перезагрузки данных, обновляем локальное состояние
    // Удаляем размещение из всех комнат
    rooms.value = rooms.value.map(room => {
      if (room.placements && room.placements.length > 0) {
        return {
          ...room,
          placements: room.placements.filter(p => p.id !== placementId)
        };
      }
      return room;
    });
    
    console.log('Размещение успешно удалено');
  } catch (error) {
    console.error('Ошибка при удалении размещения:', error);
  }
};

// Функция для обновления размещений в комнате
const updateRoomPlacements = async (roomId: number) => {
  try {
    console.log(`Запрашиваем обновленные данные о размещениях в комнате ${roomId}...`);
    
    // Добавляем небольшую задержку, чтобы дать API время на обработку изменений
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const roomResponse = await $fetch(`/api/accommodation/rooms/${roomId}`, {
      query: {
        withPlacements: 'true',
      },
    });
    
    console.log('Ответ API для комнаты:', roomResponse);
    
    if (roomResponse.room && roomResponse.room.placements) {
      const placements = roomResponse.room.placements;
      console.log(`Получено ${placements.length} размещений для комнаты ${roomId}:`, placements);
      
      // Проверяем, есть ли размещения типа 'child'
      const childPlacements = placements.filter(p => p.type === 'child');
      console.log(`Найдено ${childPlacements.length} детских размещений:`, childPlacements);
      
      // Обновляем размещения в комнате
      rooms.value = rooms.value.map(room => {
        if (room.id === roomId) {
          console.log(`Обновляем размещения в комнате ${roomId} с ${room.placements?.length || 0} на ${placements.length}`);
          return {
            ...room,
            placements: placements
          };
        }
        return room;
      });
      
      console.log(`Обновлены размещения в комнате ${roomId}, найдено ${placements.length} размещений`);
      return true;
    } else {
      console.warn(`API не вернул размещения для комнаты ${roomId}`);
    }
  } catch (error) {
    console.error(`Ошибка при получении обновленных данных о комнате ${roomId}:`, error);
  }
  
  // Если не удалось обновить через API, попробуем получить все комнаты
  try {
    console.log('Пробуем получить все комнаты с размещениями...');
    const response = await $fetch('/api/accommodation/rooms', {
      query: {
        withPlacements: 'true',
      },
    });
    
    if (response.rooms) {
      const updatedRoom = response.rooms.find(r => r.id === roomId);
      if (updatedRoom && updatedRoom.placements) {
        console.log(`Найдена комната ${roomId} с ${updatedRoom.placements.length} размещениями`);
        
        // Обновляем размещения в комнате
        rooms.value = rooms.value.map(room => {
          if (room.id === roomId) {
            return {
              ...room,
              placements: updatedRoom.placements
            };
          }
          return room;
        });
        
        console.log(`Обновлены размещения в комнате ${roomId} через общий запрос`);
        return true;
      }
    }
  } catch (error) {
    console.error('Ошибка при получении всех комнат:', error);
  }
  
  return false;
};

// Обработчик отправки формы размещения
const handleSubmitPlacement = async (formData: PlacementFormData) => {
  try {
    let updatedPlacements = [];
    let hasChildrenWithSeparateBeds = false;
    
    // Проверяем, есть ли дети с отдельными кроватями
    if (formData.children && formData.children.length > 0) {
      hasChildrenWithSeparateBeds = formData.children.some(child => child.needsSeparateBed);
      console.log(`Форма содержит ${formData.children.length} детей, из них ${formData.children.filter(c => c.needsSeparateBed).length} с отдельными кроватями`);
    }
    
    // Убедимся, что даты в правильном формате
    const formattedData = {
      ...formData,
      // Если даты уже в формате строки, оставляем как есть
      datefrom: formData.datefrom,
      dateto: formData.dateto
    };
    
    if (currentPlacement.value) {
      // Обновление существующего размещения
      console.log(`Обновляем размещение ${currentPlacement.value.id} в комнате ${formData.roomId}`);
      const response = await $fetch(`/api/accommodation/placements/${currentPlacement.value.id}`, {
        method: 'PUT',
        body: formattedData,
      });
      
      console.log('Ответ API при обновлении размещения:', response);
      
      // Получаем обновленные размещения из ответа API
      // Проверяем, есть ли в ответе массив placements (для детей) или одиночное размещение
      if (response.placements && Array.isArray(response.placements)) {
        updatedPlacements = response.placements;
        console.log(`Получено ${updatedPlacements.length} размещений из ответа API`);
      } else if (response.placement) {
        updatedPlacements = [response.placement];
        console.log('Получено 1 размещение из ответа API');
      }
      
      // Если в форме были дети, всегда обновляем размещения в комнате
      if (hasChildrenWithSeparateBeds || (formData.children && formData.children.length > 0)) {
        console.log('Форма содержит детей, обновляем все размещения в комнате');
        await updateRoomPlacements(formData.roomId);
      } else {
        // Обновляем размещения в локальном состоянии
        if (updatedPlacements.length > 0) {
          // Сначала удаляем старое размещение
          rooms.value = rooms.value.map(room => {
            if (room.placements) {
              return {
                ...room,
                placements: room.placements.filter(p => p.id !== currentPlacement.value.id)
              };
            }
            return room;
          });
          
          // Затем добавляем все обновленные размещения
          rooms.value = rooms.value.map(room => {
            // Находим размещения для текущей комнаты
            const roomPlacements = updatedPlacements.filter(p => p.roomId === room.id);
            
            if (roomPlacements.length > 0) {
              // Создаем копию массива размещений или инициализируем новый массив
              const placements = [...(room.placements || [])];
              
              // Добавляем новые размещения
              placements.push(...roomPlacements);
              
              return {
                ...room,
                placements
              };
            }
            return room;
          });
        }
      }
      
      console.log('Размещение успешно обновлено, включая размещения детей:', updatedPlacements.length);
    } else {
      // Создание нового размещения
      console.log(`Создаем новое размещение в комнате ${formData.roomId}`);
      const response = await $fetch('/api/accommodation/placements', {
        method: 'POST',
        body: formattedData,
      });
      
      console.log('Ответ API при создании размещения:', response);
      
      // Получаем новые размещения из ответа API
      if (response.placements && Array.isArray(response.placements)) {
        updatedPlacements = response.placements;
        console.log(`Получено ${updatedPlacements.length} размещений из ответа API`);
      } else if (response.placement) {
        updatedPlacements = [response.placement];
        console.log('Получено 1 размещение из ответа API');
      }
      
      // Если в форме были дети, всегда обновляем размещения в комнате
      if (hasChildrenWithSeparateBeds || (formData.children && formData.children.length > 0)) {
        console.log('Форма содержит детей, обновляем все размещения в комнате');
        await updateRoomPlacements(formData.roomId);
      } else {
        // Добавляем новые размещения в локальное состояние
        if (updatedPlacements.length > 0) {
          rooms.value = rooms.value.map(room => {
            // Находим размещения для текущей комнаты
            const roomPlacements = updatedPlacements.filter(p => p.roomId === room.id);
            
            if (roomPlacements.length > 0) {
              // Создаем копию массива размещений или инициализируем новый массив
              const placements = [...(room.placements || [])];
              
              // Добавляем новые размещения
              placements.push(...roomPlacements);
              
              return {
                ...room,
                placements
              };
            }
            return room;
          });
        }
      }
      
      console.log('Размещения успешно созданы:', updatedPlacements.length);
    }
    
    // Закрываем модальное окно
    showPlacementModal.value = false;
  } catch (error) {
    console.error('Ошибка при сохранении размещения:', error);
  }
};

// Загрузка данных при монтировании компонента
onMounted(() => {
  fetchRooms();
});
</script> 