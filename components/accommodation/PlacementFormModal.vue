<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Затемнение фона -->
      <div class="fixed inset-0 transition-opacity" @click="closeModal">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <!-- Модальное окно -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                {{ isEditing ? 'Редактирование размещения' : 'Новое размещение' }}
              </h3>

              <div class="mt-2">
                <form @submit.prevent="submitForm">
                  <!-- Информация о комнате -->
                  <div class="mb-4">
                    <div class="text-sm text-gray-500">
                      Корпус {{ room?.building }}, этаж {{ room?.floor }}, комната {{ room?.number }}, место {{ slot }}
                    </div>
                  </div>

                  <!-- Выбор пользователя -->
                  <div class="mb-4">
                    <SearchableSelect
                      v-model="formData.userId"
                      :options="userOptions"
                      label="Пользователь"
                      placeholder="Выберите пользователя"
                      required
                      @update:modelValue="handleUserChange"
                    />
                  </div>

                  <!-- Даты заезда/отъезда -->
                  <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Дата заезда</label>
                      <input 
                        v-model="formData.datefrom" 
                        type="date" 
                        class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Дата отъезда</label>
                      <input 
                        v-model="formData.dateto" 
                        type="date" 
                        class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <!-- Статус размещения -->
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">Статус</label>
                    <select 
                      v-model="formData.type" 
                      class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <option :value="PlacementStatus.BOOKED">Забронировано</option>
                      <option :value="PlacementStatus.PAID">Оплачено</option>
                      <option :value="PlacementStatus.SETTLED">Расселено</option>
                      <option :value="PlacementStatus.SPECIAL">Спец-гость</option>
                    </select>
                  </div>

                  <!-- Комментарий -->
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">Комментарий</label>
                    <textarea 
                      v-model="formData.comment" 
                      rows="3" 
                      class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                    ></textarea>
                  </div>

                  <!-- Дети пользователя -->
                  <div v-if="selectedUser && userChildren.length > 0" class="mb-4">
                    <div class="text-sm font-medium text-gray-700 mb-2">Дети, которым нужна кровать:</div>
                    <div v-for="child in userChildren" :key="child.id" class="flex items-center mb-2">
                      <input 
                        :id="`child-${child.id}`" 
                        type="checkbox" 
                        v-model="selectedChildren[child.id]" 
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label :for="`child-${child.id}`" class="ml-2 block text-sm text-gray-700">
                        {{ getChildDisplayName(child) }} ({{ formatDate(child.birthdate) }})
                      </label>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button 
            type="button" 
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            @click="submitForm"
          >
            {{ isEditing ? 'Сохранить' : 'Создать' }}
          </button>
          <button 
            type="button" 
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-gray-100 text-base font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            @click="closeModal"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';
import type { Room, Placement, PlacementFormData, UserChild } from '~/types/accommodation';
import { PlacementStatus } from '~/types/accommodation';
import SearchableSelect from '~/components/ui/SearchableSelect.vue';

// Определение входных параметров
const props = defineProps<{
  show: boolean;
  placement: Placement | null;
  room: Room | null;
  slot: number | null;
}>();

// Определение событий
const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'submit', formData: PlacementFormData): void;
}>();

// Проверка режима редактирования
const isEditing = computed(() => !!props.placement);

// Данные формы
const formData = reactive<PlacementFormData>({
  roomId: props.room?.id || 0,
  slot: props.slot || 1,
  userId: props.placement?.userId || 0,
  type: props.placement?.type || PlacementStatus.BOOKED,
  datefrom: props.placement?.datefrom || null,
  dateto: props.placement?.dateto || null,
  comment: props.placement?.comment || ''
});

// Пользователи
const users = ref<any[]>([]);
const selectedUser = ref<any>(null);

// Опции для компонента выбора пользователя
const userOptions = computed(() => users.value.map(user => {
  // Определяем имя для отображения, проверяя наличие различных полей
  const displayName = (user.name && user.surname) ? `${user.name} ${user.surname}` :
                      (user.fullName) ? user.fullName :
                      (user.displayName) ? user.displayName :
                      (user.email) ? user.email.split('@')[0] : 
                      `Пользователь ID:${user.id}`;
  
  // Проверяем наличие духовного имени в разных возможных полях
  const spiritualName = user.spiritualName || user.spiritual_name || user.spiritual || '';
  
  // Формируем метку с духовным именем в скобках, если оно есть
  const label = spiritualName 
    ? `${displayName} (${spiritualName})`
    : displayName;
  
  return {
    id: user.id,
    label: label
  };
}));

// Дети пользователя
const userChildren = ref<UserChild[]>([]);
const selectedChildren = reactive<Record<number, boolean>>({});

// Загрузка списка пользователей
const loadUsers = async () => {
  try {
    let activeFestival = null;
    // Пытаемся получить текущий активный фестиваль
    try {
      const festivalsResponse = await $fetch('/api/festivals/active');
      console.log('Ответ от API фестивалей:', festivalsResponse);
      
      if (festivalsResponse.festivals && festivalsResponse.festivals.length > 0) {
        activeFestival = festivalsResponse.festivals[0];
        console.log('Найден активный фестиваль:', activeFestival);
      } else {
        console.warn('Активные фестивали не найдены в ответе API, попробуем получить через другой эндпоинт');
        
        // Пробуем получить список всех фестивалей и найти активный
        const allFestivalsResponse = await $fetch('/api/festivals');
        console.log('Получен список всех фестивалей:', allFestivalsResponse);
        
        if (allFestivalsResponse.festivals && allFestivalsResponse.festivals.length > 0) {
          // Находим самый последний фестиваль или активный
          const festivals = allFestivalsResponse.festivals;
          activeFestival = festivals.find(f => f.isActive === true) || 
                           festivals.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
          
          console.log('Выбран фестиваль:', activeFestival);
        }
      }
    } catch (festError) {
      console.error('Ошибка при загрузке фестивалей:', festError);
    }
    
    // Загружаем всех пользователей даже если фестиваль не найден
    const usersResponse = await $fetch('/api/admin/users', {
      params: {
        limit: 1000,
        showOnlyRegistered: activeFestival ? true : false // Если фестиваль не найден, показываем всех пользователей
      }
    });
    
    if (!usersResponse.users || usersResponse.users.length === 0) {
      console.error('Не удалось загрузить пользователей');
      return;
    }
    
    // Логируем примеры пользователей для анализа структуры данных
    console.log('Пример данных пользователя 1:', usersResponse.users[0]);
    if (usersResponse.users.length > 1) {
      console.log('Пример данных пользователя 2:', usersResponse.users[1]);
    }
    console.log('Доступные поля пользователя:', Object.keys(usersResponse.users[0]).join(', '));
    
    // Фильтрация пользователей
    let filteredUsers = usersResponse.users;
    
    // Если нашли активный фестиваль, можем выполнить дополнительную фильтрацию
    if (activeFestival) {
      // Проверяем, содержат ли данные пользователей информацию о регистрациях
      const hasRegistrationInfo = usersResponse.users.some(user => 
        user.festRegistrations || user.festivals || user.registrations);
      
      let registeredUserIds: number[] = [];
      
      // Если информации о регистрациях нет, делаем дополнительный запрос
      if (!hasRegistrationInfo) {
        try {
          // Получаем все регистрации на текущий фестиваль
          const registrationsResponse = await $fetch(`/api/festivals/${activeFestival.id}/registrations`);
          
          if (registrationsResponse.registrations) {
            // Собираем ID всех пользователей, зарегистрированных на фестиваль
            registeredUserIds = registrationsResponse.registrations.map((reg: any) => reg.userId);
            console.log(`Получено ${registeredUserIds.length} регистраций на фестиваль`);
          }
        } catch (error) {
          console.error('Ошибка при загрузке регистраций:', error);
          // В случае ошибки, считаем всех пользователей зарегистрированными
          registeredUserIds = usersResponse.users.map(user => user.id);
        }
      }
      
      // Получаем список всех размещений, чтобы исключить уже размещенных пользователей
      let placedUserIds: number[] = [];
      try {
        // Получаем все размещения
        const placementsResponse = await $fetch('/api/accommodation/placements');
        
        if (placementsResponse.placements) {
          // Если редактируем существующее размещение, исключаем текущего пользователя из списка размещенных
          if (props.placement) {
            placedUserIds = placementsResponse.placements
              .filter((p: any) => p.userId !== props.placement?.userId)
              .map((p: any) => p.userId);
          } else {
            placedUserIds = placementsResponse.placements.map((p: any) => p.userId);
          }
          console.log(`Получено ${placedUserIds.length} размещений`);
        }
      } catch (error) {
        console.error('Ошибка при загрузке размещений:', error);
        // В случае ошибки, считаем, что нет размещенных пользователей
        placedUserIds = [];
      }
      
      // Фильтруем пользователей
      filteredUsers = usersResponse.users.filter(user => {
        // Проверяем, что пользователь не ребенок
        const isNotChild = !user.age || user.age >= 18;
        
        // Если нет активного фестиваля, просто включаем всех не-детей
        if (!activeFestival) {
          return isNotChild;
        }
        
        // Проверяем, что у пользователя есть регистрация на текущий фестиваль
        let hasRegistration = false;
        
        // Если у нас есть список ID зарегистрированных пользователей, используем его
        if (registeredUserIds.length > 0) {
          hasRegistration = registeredUserIds.includes(user.id);
        }
        // Иначе проверяем через поля пользователя
        else if (user.festRegistrations) {
          hasRegistration = user.festRegistrations.some(reg => 
            reg.festivalId === activeFestival.id);
        } 
        else if (user.festivals) {
          hasRegistration = user.festivals.some(fest => 
            fest.id === activeFestival.id);
        } 
        else if (user.registrations) {
          hasRegistration = user.registrations.some(reg => 
            reg.festivalId === activeFestival.id);
        }
        // Если не удалось проверить регистрацию, просто включаем пользователя в список
        else {
          hasRegistration = true;
          console.log(`Не удалось проверить регистрацию для пользователя ${user.id}: ${JSON.stringify({fullName: user.fullName, email: user.email})}`);
        }
        
        // Проверяем, что пользователь еще не размещен
        // Если редактируем существующее размещение, разрешаем текущего пользователя
        const isNotPlaced = !placedUserIds.includes(user.id);
        
        return isNotChild && hasRegistration && isNotPlaced;
      });
    } else {
      // Если нет активного фестиваля, просто фильтруем по возрасту
      filteredUsers = usersResponse.users.filter(user => !user.age || user.age >= 18);
      console.log('Фестиваль не найден, список пользователей не фильтруется по регистрациям');
    }
    
    users.value = filteredUsers;
    
    console.log(`Загружено ${users.value.length} пользователей${activeFestival ? ', зарегистрированных на фестиваль и не размещенных' : ''}`);
    
    // Если редактируем существующее размещение, находим выбранного пользователя
    if (props.placement) {
      // Если пользователь не найден в отфильтрованном списке (например, уже размещен),
      // добавляем его в список, чтобы можно было редактировать
      const userExists = users.value.some(u => u.id === props.placement?.userId);
      
      if (!userExists && props.placement?.userId) {
        try {
          // Получаем данные пользователя
          const userResponse = await $fetch(`/api/admin/users/${props.placement.userId}`);
          
          if (userResponse.user) {
            // Добавляем пользователя в список
            users.value.push(userResponse.user);
            console.log(`Добавлен пользователь ${userResponse.user.id} для редактирования размещения`);
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error);
        }
      }
      
      selectedUser.value = users.value.find(u => u.id === props.placement?.userId);
      if (selectedUser.value) {
        loadUserChildren(selectedUser.value.id);
      }
    }
  } catch (error) {
    console.error('Ошибка при загрузке пользователей:', error);
  }
};

// Обработчик изменения выбранного пользователя
const handleUserChange = (userId: number) => {
  formData.userId = userId;
  
  // Находим выбранного пользователя
  selectedUser.value = users.value.find(u => u.id === userId);
  
  if (selectedUser.value) {
    // Загружаем данные регистрации пользователя на фестиваль
    loadUserRegistration(userId);
    
    // Загружаем детей пользователя
    loadUserChildren(userId);
  }
};

// Загрузка регистрации пользователя на фестиваль
const loadUserRegistration = async (userId: number) => {
  try {
    // Получаем текущий активный фестиваль
    let activeFestival = null;
    try {
      const festivalsResponse = await $fetch('/api/festivals/active');
      if (festivalsResponse.festivals && festivalsResponse.festivals.length > 0) {
        activeFestival = festivalsResponse.festivals[0];
      } else {
        // Пробуем получить список всех фестивалей и найти активный
        const allFestivalsResponse = await $fetch('/api/festivals');
        if (allFestivalsResponse.festivals && allFestivalsResponse.festivals.length > 0) {
          const festivals = allFestivalsResponse.festivals;
          activeFestival = festivals.find(f => f.isActive === true) || 
                           festivals.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
        }
      }
    } catch (festError) {
      console.error('Ошибка при загрузке фестивалей:', festError);
    }
    
    if (!activeFestival) {
      console.warn('Не найден активный фестиваль для загрузки регистрации');
      return;
    }
    
    const festivalId = activeFestival.id;
    
    // Загружаем данные регистрации пользователя
    try {
      const response = await $fetch(`/api/festivals/${festivalId}/registrations/user/${userId}`);
      
      if (response.registration) {
        // Если у пользователя есть регистрация, устанавливаем даты из нее
        const registration = response.registration;
        
        if (registration.arrivalDate) {
          // Создаем дату заезда в полдень
          const arrivalDate = new Date(registration.arrivalDate);
          arrivalDate.setHours(12, 0, 0, 0);
          formData.datefrom = formatDateForInput(arrivalDate);
        }
        
        if (registration.departureDate) {
          // Создаем дату отъезда в полдень
          const departureDate = new Date(registration.departureDate);
          departureDate.setHours(12, 0, 0, 0);
          formData.dateto = formatDateForInput(departureDate);
        }
      } else if (!props.placement && activeFestival) {
        // Если нет регистрации и это новое размещение, используем даты фестиваля
        formData.datefrom = formatDateForInput(new Date(activeFestival.startDate));
        formData.dateto = formatDateForInput(new Date(activeFestival.endDate));
      }
    } catch (error) {
      console.error('Ошибка при загрузке регистрации пользователя:', error);
      // В случае ошибки используем даты фестиваля, если есть
      if (!props.placement && activeFestival) {
        formData.datefrom = formatDateForInput(new Date(activeFestival.startDate));
        formData.dateto = formatDateForInput(new Date(activeFestival.endDate));
      }
    }
  } catch (error) {
    console.error('Ошибка при загрузке регистрации пользователя:', error);
  }
};

// Загрузка детей пользователя
const loadUserChildren = async (userId: number) => {
  try {
    // Получаем текущий активный фестиваль
    let activeFestival = null;
    try {
      const festivalsResponse = await $fetch('/api/festivals/active');
      if (festivalsResponse.festivals && festivalsResponse.festivals.length > 0) {
        activeFestival = festivalsResponse.festivals[0];
      } else {
        // Пробуем получить список всех фестивалей и найти активный
        const allFestivalsResponse = await $fetch('/api/festivals');
        if (allFestivalsResponse.festivals && allFestivalsResponse.festivals.length > 0) {
          const festivals = allFestivalsResponse.festivals;
          activeFestival = festivals.find(f => f.isActive === true) || 
                           festivals.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
        }
      }
    } catch (festError) {
      console.error('Ошибка при загрузке фестивалей:', festError);
      return;
    }
    
    if (!activeFestival) {
      console.warn('Не найден активный фестиваль для загрузки детей');
      return;
    }
    
    // Сначала получаем регистрацию пользователя на фестиваль
    try {
      const regResponse = await $fetch(`/api/festivals/${activeFestival.id}/registrations/user/${userId}`);
      
      if (regResponse.registration) {
        const registrationId = regResponse.registration.id;
        
        // Теперь получаем детей из регистрации
        const response = await $fetch(`/api/festivals/registrations/${registrationId}/children`, {
          query: {
            needsBed: 'true'
          }
        });
        
        if (response.children) {
          userChildren.value = response.children;
          console.log(`Загружено ${userChildren.value.length} детей для пользователя ${userId}`);
        } else {
          userChildren.value = [];
          console.log(`Нет детей в регистрации для пользователя ${userId}`);
        }
      } else {
        // Если нет регистрации, то и детей нет
        userChildren.value = [];
        console.log(`Нет регистрации для пользователя ${userId}, поэтому нет и детей`);
      }
    } catch (error) {
      console.error('Ошибка при загрузке детей:', error);
      userChildren.value = [];
    }
    
    // Сбрасываем выбранных детей
    Object.keys(selectedChildren).forEach(key => {
      selectedChildren[parseInt(key)] = false;
    });
  } catch (error) {
    console.error('Ошибка при загрузке детей:', error);
    userChildren.value = [];
  }
};

// Форматирование даты для отображения
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU').format(date);
};

// Форматирование даты для input type="date"
const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Отправка формы
const submitForm = async () => {
  // Проверка обязательных полей
  if (!formData.userId) {
    alert('Необходимо выбрать пользователя');
    return;
  }
  
  if (!formData.datefrom || !formData.dateto) {
    alert('Необходимо указать даты заезда и отъезда');
    return;
  }
  
  try {
    // Создаем копию данных формы для отправки
    const formDataToSubmit = { ...formData };
    
    // Проверяем, что даты в правильном формате
    // Если даты уже в формате строки YYYY-MM-DD, оставляем как есть
    // Если нет, преобразуем их
    if (formDataToSubmit.datefrom && !(typeof formDataToSubmit.datefrom === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(formDataToSubmit.datefrom))) {
      formDataToSubmit.datefrom = formatDateForInput(new Date(formDataToSubmit.datefrom));
    }
    
    if (formDataToSubmit.dateto && !(typeof formDataToSubmit.dateto === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(formDataToSubmit.dateto))) {
      formDataToSubmit.dateto = formatDateForInput(new Date(formDataToSubmit.dateto));
    }
    
    // Отправляем данные формы
    await emit('submit', formDataToSubmit);
    
    // Создаем размещения для выбранных детей
    const selectedChildrenIds = Object.entries(selectedChildren)
      .filter(([_, selected]) => selected)
      .map(([id]) => parseInt(id));
    
    if (selectedChildrenIds.length > 0) {
      for (const childId of selectedChildrenIds) {
        const child = userChildren.value.find(c => c.id === childId);
        if (child) {
          // Создаем данные для размещения ребенка
          const childFormData: PlacementFormData = {
            ...formDataToSubmit,
            userId: child.id, // Используем ID ребенка как ID пользователя
            comment: `Ребенок пользователя ${formDataToSubmit.userId}` // Не используем name и surname
          };
          
          try {
            const response = await $fetch('/api/accommodation/placements', {
              method: 'POST',
              body: childFormData
            });
            console.log('Размещение для ребенка создано:', response);
          } catch (error) {
            console.error(`Ошибка при создании размещения для ребенка ${childId}:`, error);
          }
        }
      }
    }
    
    // Закрываем модальное окно
    closeModal();
  } catch (error) {
    console.error('Ошибка при создании размещения:', error);
    alert('Произошла ошибка при сохранении размещения. Пожалуйста, попробуйте еще раз.');
  }
};

// Закрытие модального окна
const closeModal = () => {
  emit('update:show', false);
};

// Обновление данных формы при изменении входных параметров
watch(() => props.placement, (newPlacement) => {
  if (newPlacement) {
    formData.roomId = newPlacement.roomId;
    formData.slot = newPlacement.slot;
    formData.userId = newPlacement.userId;
    formData.type = newPlacement.type;
    
    // Форматируем даты для input type="date"
    if (newPlacement.datefrom) {
      formData.datefrom = formatDateForInput(new Date(newPlacement.datefrom));
    }
    
    if (newPlacement.dateto) {
      formData.dateto = formatDateForInput(new Date(newPlacement.dateto));
    }
    
    formData.comment = newPlacement.comment;
    
    // Находим выбранного пользователя и загружаем его детей
    if (users.value.length) {
      selectedUser.value = users.value.find(u => u.id === newPlacement.userId);
      if (selectedUser.value) {
        loadUserChildren(selectedUser.value.id);
      }
    }
  } else {
    // Сброс формы для нового размещения
    formData.roomId = props.room?.id || 0;
    formData.slot = props.slot || 1;
    formData.userId = 0;
    formData.type = PlacementStatus.BOOKED;
    formData.datefrom = null;
    formData.dateto = null;
    formData.comment = '';
    
    selectedUser.value = null;
    userChildren.value = [];
  }
}, { immediate: true });

// Загрузка пользователей при открытии модального окна
watch(() => props.show, async (newShow) => {
  if (newShow) {
    // Загружаем пользователей
    await loadUsers();
    
    // Если это новое размещение, устанавливаем даты фестиваля
    if (!props.placement) {
      try {
        // Получаем текущий активный фестиваль
        const festivalsResponse = await $fetch('/api/festivals/active');
        if (festivalsResponse.festivals && festivalsResponse.festivals.length > 0) {
          const activeFestival = festivalsResponse.festivals[0];
          
          // Устанавливаем даты фестиваля
          formData.datefrom = formatDateForInput(new Date(activeFestival.startDate));
          formData.dateto = formatDateForInput(new Date(activeFestival.endDate));
          
          console.log('Установлены даты фестиваля по умолчанию:', formData.datefrom, formData.dateto);
        } else {
          // Пробуем получить список всех фестивалей и найти активный
          const allFestivalsResponse = await $fetch('/api/festivals');
          if (allFestivalsResponse.festivals && allFestivalsResponse.festivals.length > 0) {
            const festivals = allFestivalsResponse.festivals;
            const activeFestival = festivals.find(f => f.isActive === true) || 
                                 festivals.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
            
            // Устанавливаем даты фестиваля
            formData.datefrom = formatDateForInput(new Date(activeFestival.startDate));
            formData.dateto = formatDateForInput(new Date(activeFestival.endDate));
            
            console.log('Установлены даты фестиваля по умолчанию:', formData.datefrom, formData.dateto);
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке дат фестиваля:', error);
      }
    }
  }
}, { immediate: true });

// Обновление roomId и slot при изменении входных параметров
watch(() => props.room, (newRoom) => {
  if (newRoom) {
    formData.roomId = newRoom.id;
  }
}, { immediate: true });

watch(() => props.slot, (newSlot) => {
  if (newSlot) {
    formData.slot = newSlot;
  }
}, { immediate: true });

// Функция получения отображаемого имени ребенка
const getChildDisplayName = (child: any) => {
  if (child.fullName) return child.fullName;
  if (child.name && child.surname) return `${child.name} ${child.surname}`;
  if (child.name) return child.name;
  return `Ребенок ID:${child.id}`;
};
</script> 