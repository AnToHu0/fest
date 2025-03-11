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

                  <!-- Блок для размещения ребёнка -->
                  <div v-if="isChildPlacement" class="mb-4">
                    <div class="text-sm text-orange-600 font-medium mb-2">
                      Это размещение ребенка. Изменение пользователя недоступно.
                    </div>
                    <div v-if="childName" class="mt-1 text-sm font-medium text-gray-800">
                      Ребёнок: {{ childName }}
                    </div>
                    <div v-else-if="props.placement?.User" class="mt-1 text-sm font-medium text-gray-800">
                      Ребёнок: {{ getChildDisplayName(props.placement.User) }}
                    </div>
                    <div v-else-if="props.placement?.userId" class="mt-1 text-sm font-medium text-gray-800">
                      <span v-if="loadingChildName">Загрузка данных ребёнка...</span>
                      <span v-else>Ребёнок (ID: {{ props.placement.userId }})</span>
                    </div>
                    <div v-if="parentUser" class="mt-1 text-sm text-gray-600">
                      Родитель: {{ getParentDisplayName(parentUser) }}
                    </div>
                  </div>

                  <!-- Выбор пользователя (только для не-детских размещений) -->
                  <div v-if="!isChildPlacement" class="mb-4">
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

                  <!-- Статус размещения (только для не-детских размещений) -->
                  <div v-if="!isChildPlacement" class="mb-4">
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

                  <!-- Дети пользователя (только для не-детских размещений) -->
                  <div v-if="!isChildPlacement && selectedUser" class="mb-4">
                    <div class="text-sm font-medium text-gray-700 mb-2">
                      Дети пользователя:
                      <span v-if="isLoadingChildren" class="ml-2 inline-block">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </span>
                    </div>
                    <div v-if="userChildren.length === 0 && !isLoadingChildren" class="text-sm text-gray-500 mb-2">
                      У пользователя нет зарегистрированных детей
                    </div>
                    <div v-if="userChildren.length > 0">
                      <div v-for="child in userChildren" :key="child.id" class="flex flex-col mb-4 p-3 border border-gray-200 rounded" :class="{'bg-gray-100': hasChildSeparatePlacement(child.id)}">
                        <div class="flex items-center mb-2">
                      <input 
                        :id="`child-${child.id}`" 
                        type="checkbox" 
                        v-model="selectedChildren[child.id]" 
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            :disabled="hasChildSeparatePlacement(child.id)"
                      />
                          <label :for="`child-${child.id}`" class="ml-2 block text-sm font-medium text-gray-900">
                        {{ getChildDisplayName(child) }} ({{ formatDate(child.birthdate) }})
                      </label>
                        </div>
                        
                        <div v-if="selectedChildren[child.id]" class="ml-6 mt-1">
                          <div v-if="hasChildSeparatePlacement(child.id)" class="text-sm text-orange-600 font-medium mb-2">
                            Ребенок уже размещен в отдельном месте. Для изменения размещения необходимо отредактировать его отдельно.
                          </div>
                          <div v-else class="flex items-center mb-2">
                            <input 
                              :id="`child-bed-${child.id}`" 
                              type="checkbox" 
                              v-model="child.needsSeparateBed" 
                              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              :disabled="hasChildSeparatePlacement(child.id)"
                            />
                            <label :for="`child-bed-${child.id}`" class="ml-2 block text-sm text-gray-700">
                              Нужна отдельная кровать
                            </label>
                          </div>
                          
                          <div v-if="!hasChildSeparatePlacement(child.id)" class="text-sm" :class="child.needsSeparateBed ? 'text-orange-600' : 'text-green-600'">
                            <span v-if="child.needsSeparateBed">
                              ⚠️ Для ребёнка будет создано отдельное размещение в этой же комнате
                            </span>
                            <span v-else>
                              ✓ Ребёнок будет добавлен к размещению родителя
                            </span>
                          </div>
                        </div>
                      </div>
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

// Проверка, является ли размещение детским
const isChildPlacement = computed(() => props.placement?.type === 'child');

// Имя ребёнка для отображения в форме
const childName = computed(() => {
  if (isChildPlacement.value) {
    console.log('Вычисление имени ребёнка для размещения типа "child"');
    
    // Если есть загруженное имя, используем его
    if (loadedChildName.value) {
      return loadedChildName.value;
    }
    
    // Если есть выбранный пользователь, используем его имя
    if (selectedUser.value) {
      console.log('Используем имя из selectedUser:', selectedUser.value);
      return getChildDisplayName(selectedUser.value);
    }
    
    // Проверяем наличие данных о ребенке в Children
    if (props.placement?.Children && props.placement.Children.length > 0) {
      const childData = props.placement.Children[0];
      console.log('Используем имя из props.placement.Children[0]:', childData);
      return getChildDisplayName(childData);
    }
    
    // Иначе пытаемся получить имя из props.placement.User
    if (props.placement?.User) {
      console.log('Используем имя из props.placement.User:', props.placement.User);
      return getChildDisplayName(props.placement.User);
    }
    
    // Если загрузка идет, показываем сообщение о загрузке
    if (loadingChildName.value) {
      return `Загрузка...`;
    }
    
    // Если ничего не нашли, возвращаем ID
    if (props.placement?.userId) {
      return `Ребенок (ID:${props.placement.userId})`;
    }
    
    return 'Неизвестный ребенок';
  }
  return '';
});

// Добавляем состояние для загрузки имени ребенка
const loadingChildName = ref(false);
const loadedChildName = ref('');

// Функция для загрузки имени ребенка по ID
const loadChildNameById = async (childId: number) => {
  // Если уже загружаем или имя уже загружено, не делаем ничего
  if (loadingChildName.value || loadedChildName.value) {
    return;
  }
  
  try {
    console.log(`Загрузка имени ребёнка с ID ${childId}`);
    loadingChildName.value = true;
    
    // Получаем данные ребенка
    const childData = await $fetch(`/api/admin/users/${childId}`);
    
    if (childData) {
      loadedChildName.value = getChildDisplayName(childData);
      console.log(`Загружено имя ребёнка: ${loadedChildName.value}`);
    } else {
      console.warn(`Не удалось получить данные ребенка с ID ${childId}`);
      loadedChildName.value = `Ребенок (ID:${childId})`;
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных ребенка:', error);
    loadedChildName.value = `Ребенок (ID:${childId})`;
  } finally {
    loadingChildName.value = false;
  }
};

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
const parentUser = ref<any>(null); // Родитель ребенка

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
const isLoadingChildren = ref(false);
const childrenWithSeparateBed = ref<any[]>([]);
const childrenWithParent = ref<any[]>([]);

// Загрузка списка пользователей
const loadUsers = async () => {
  try {
    console.log('Загрузка списка пользователей, isChildPlacement:', isChildPlacement.value);
    
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
        // Если это размещение ребёнка, не фильтруем по возрасту
        if (isChildPlacement.value || props.placement?.type === 'child') {
          console.log('Не фильтруем по возрасту, так как это размещение ребёнка');
          return true;
        }
        
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
      filteredUsers = usersResponse.users.filter(user => {
        // Если это размещение ребёнка, не фильтруем по возрасту
        if (isChildPlacement.value || props.placement?.type === 'child') {
          console.log('Не фильтруем по возрасту, так как это размещение ребёнка');
          return true;
        }
        
        return !user.age || user.age >= 18;
      });
      console.log('Фестиваль не найден, список пользователей не фильтруется по регистрациям');
    }
    
    users.value = filteredUsers;
    
    console.log(`Загружено ${users.value.length} пользователей${activeFestival ? ', зарегистрированных на фестиваль и не размещенных' : ''}`);
    
    // Если редактируем существующее размещение, находим выбранного пользователя
    if (props.placement) {
      // Проверяем, является ли размещение детским
      const isChildPlacement = props.placement.type === 'child';
      
      // Если пользователь не найден в отфильтрованном списке (например, уже размещен или это ребенок),
      // добавляем его в список, чтобы можно было редактировать
      const userExists = users.value.some(u => u.id === props.placement?.userId);
      
      if (!userExists && props.placement?.userId) {
        try {
          // Получаем данные пользователя
          const userData = await $fetch(`/api/admin/users/${props.placement.userId}`);
          
          if (userData) {
            // Добавляем пользователя в список
            users.value.push(userData);
            console.log(`Добавлен пользователь ${userData.id} для редактирования размещения`);
          } else if (isChildPlacement) {
            // Если это размещение ребенка и не удалось получить данные через стандартный API,
            // пробуем получить данные ребенка напрямую
            try {
              const childData = await $fetch(`/api/admin/users/${props.placement.userId}`);
              
              if (childData) {
                // Добавляем ребенка в список пользователей
                const childUser = {
                  id: childData.id,
                  fullName: childData.fullName || `${childData.name || ''} ${childData.surname || ''}`.trim(),
                  email: childData.email || '',
                  spiritualName: childData.spiritualName || '',
                  birthdate: childData.birthdate,
                  isChild: true
                };
                
                users.value.push(childUser);
                console.log(`Добавлен ребенок ${childUser.id} для редактирования размещения`, childUser);
              }
            } catch (childError) {
              console.error('Ошибка при загрузке данных ребенка:', childError);
            }
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error);
          
          // Если это размещение ребенка и произошла ошибка, пробуем получить данные ребенка через другой API
          if (isChildPlacement) {
            try {
              const childData = await $fetch(`/api/admin/users/${props.placement.userId}`);
              
              if (childData) {
                // Добавляем ребенка в список пользователей
                const childUser = {
                  id: childData.id,
                  fullName: childData.fullName || `${childData.name || ''} ${childData.surname || ''}`.trim(),
                  email: childData.email || '',
                  spiritualName: childData.spiritualName || '',
                  birthdate: childData.birthdate,
                  isChild: true
                };
                
                users.value.push(childUser);
                console.log(`Добавлен ребенок ${childUser.id} для редактирования размещения`, childUser);
              }
            } catch (childError) {
              console.error('Ошибка при загрузке данных ребенка:', childError);
            }
          }
        }
      }
      
      selectedUser.value = users.value.find(u => u.id === props.placement?.userId);
      console.log('Выбранный пользователь:', selectedUser.value);
      
      if (selectedUser.value) {
        // Если это размещение ребенка, не загружаем его детей
        if (!isChildPlacement) {
        loadUserChildren(selectedUser.value.id);
        }
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
    isLoadingChildren.value = true;
    userChildren.value = [];
    childrenWithSeparateBed.value = [];
    childrenWithParent.value = [];
    
    // Загружаем всех детей пользователя
    const response = await $fetch(`/api/accommodation/users/${userId}/children`);
    if (response && response.children) {
      userChildren.value = response.children;
      console.log(`[DEBUG] Загружено ${response.children.length} детей для пользователя ${userId}`);
      
      // Добавляем отладочный вывод для проверки структуры данных о детях
      console.log('[DEBUG] Структура данных о детях:');
      for (const child of userChildren.value) {
        console.log(`Ребенок ${child.id}:`, {
          id: child.id,
          childId: child.childId,
          fullName: child.fullName,
          birthdate: child.birthdate,
          spiritualName: child.spiritualName,
          needsSeparateBed: child.needsSeparateBed
        });
      }
    }
    
    // Если редактируем существующее размещение, загружаем информацию о размещениях детей
    if (isEditing.value) {
      const placementsResponse = await $fetch(`/api/accommodation/users/${userId}/children-placements`);
      
      if (placementsResponse) {
        childrenWithParent.value = placementsResponse.childrenWithParent || [];
        childrenWithSeparateBed.value = placementsResponse.childrenWithSeparateBed || [];
        
        console.log(`[DEBUG] Загружено ${childrenWithParent.value.length} детей с родителем и ${childrenWithSeparateBed.value.length} детей с отдельной кроватью`);
        
        // Устанавливаем выбранных детей и их статус needsSeparateBed
        for (const child of childrenWithParent.value) {
          selectedChildren[child.id] = true;
          
          // Находим ребенка в списке userChildren и устанавливаем needsSeparateBed = false
          const userChild = userChildren.value.find(c => c.id === child.id);
          if (userChild) {
            userChild.needsSeparateBed = false;
            console.log(`[DEBUG] Установлен needsSeparateBed = false для ребенка ${child.id}`);
          }
        }
        
        for (const child of childrenWithSeparateBed.value) {
          selectedChildren[child.id] = true;
          
          // Находим ребенка в списке userChildren и устанавливаем needsSeparateBed = true
          const userChild = userChildren.value.find(c => c.id === child.id);
          if (userChild) {
            userChild.needsSeparateBed = true;
            console.log(`[DEBUG] Установлен needsSeparateBed = true для ребенка ${child.id}`);
          }
        }
        
        // Выводим отладочную информацию о состоянии детей
        console.log('[DEBUG] Состояние детей после загрузки:');
        for (const child of userChildren.value) {
          console.log(`[DEBUG] Ребенок ${child.id}: needsSeparateBed = ${child.needsSeparateBed}, выбран = ${selectedChildren[child.id] || false}`);
        }
      }
    }
  } catch (error) {
    console.error('Ошибка при загрузке детей:', error);
    userChildren.value = [];
  } finally {
    isLoadingChildren.value = false;
  }
};

// Проверка, имеет ли ребенок отдельное размещение
const hasChildSeparatePlacement = (childId: number) => {
  return childrenWithSeparateBed.value.some(child => child.id === childId);
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
    
    // Выводим отладочную информацию о состоянии детей перед отправкой
    console.log('[DEBUG] Состояние детей перед отправкой формы:');
    for (const child of userChildren.value) {
      console.log(`[DEBUG] Ребенок ${child.id}: needsSeparateBed = ${child.needsSeparateBed}, выбран = ${selectedChildren[child.id] || false}, имеет отдельное размещение = ${hasChildSeparatePlacement(child.id)}`);
    }
    
    // Подготавливаем данные о выбранных детях
    const selectedChildrenArray = Object.entries(selectedChildren)
      .filter(([_, selected]) => selected)
      .map(([id]) => {
        const childId = parseInt(id);
        const child = userChildren.value.find(c => c.id === childId);
        if (!child) return null;
        
        // Проверяем, имеет ли ребенок отдельное размещение
        const hasSeparatePlacement = hasChildSeparatePlacement(childId);
        
        // Определяем, нужна ли отдельная кровать
        // Если у ребенка уже есть отдельное размещение, но галочка снята - нужно удалить размещение
        // Если у ребенка нет отдельного размещения, но галочка установлена - нужно создать размещение
        const needsSeparateBed = child.needsSeparateBed;
        
        // Добавляем флаг, указывающий на изменение статуса размещения ребенка
        const statusChanged = hasSeparatePlacement !== needsSeparateBed;
        
        console.log(`[DEBUG] Подготовка данных для ребенка ${childId}:`, {
          id: child.id,
          childId: child.childId,
          needsSeparateBed: needsSeparateBed,
          hasSeparatePlacement: hasSeparatePlacement,
          statusChanged: statusChanged
        });
        
        return {
          id: child.id,
          childId: child.childId,
          needsSeparateBed: needsSeparateBed,
          selected: true,
          hasSeparatePlacement: hasSeparatePlacement,
          statusChanged: statusChanged, // Флаг изменения статуса
          fullName: child.fullName,
          birthdate: child.birthdate,
          spiritualName: child.spiritualName
        };
      })
      .filter(child => child !== null);
    
    // Добавляем детей к данным формы
    formDataToSubmit.children = selectedChildrenArray;
    
    // Добавляем дополнительный отладочный вывод для проверки данных о детях
    console.log('[DEBUG] Данные о детях перед отправкой:', formDataToSubmit.children);
    console.log('[DEBUG] Проверка наличия childId у каждого ребенка:');
    for (const child of formDataToSubmit.children) {
      console.log(`Ребенок ${child.id}: childId = ${child.childId}, needsSeparateBed = ${child.needsSeparateBed}, hasSeparatePlacement = ${child.hasSeparatePlacement}, statusChanged = ${child.statusChanged}`);
      
      // Проверяем, что id и childId имеют правильные значения
      if (!child.id) {
        console.error(`[ОШИБКА] У ребенка отсутствует id (запись FestRegistrationChild)!`);
      }
      if (!child.childId) {
        console.error(`[ОШИБКА] У ребенка ${child.id} отсутствует childId (ID пользователя-ребенка)!`);
      }
    }
    
    // Добавляем информацию о детях, которые были отмечены, но теперь не выбраны
    // Это нужно для удаления связей с родительским размещением
    const unselectedChildren = childrenWithParent.value
      .filter(child => !selectedChildren[child.id])
      .map(child => {
        console.log(`[DEBUG] Ребенок ${child.id} был размещен с родителем, но теперь не выбран`);
        return {
          id: child.id,
          childId: child.childId,
          selected: false,
          needsSeparateBed: false,
          hasSeparatePlacement: false,
          statusChanged: true, // Отмечаем, что статус изменился (ребенок был удален из выбора)
          fullName: child.fullName,
          birthdate: child.birthdate,
          spiritualName: child.spiritualName
        };
      });
    
    // Добавляем информацию о детях с отдельным размещением, которые теперь не выбраны
    // Это нужно для удаления их отдельных размещений
    const unselectedSeparateChildren = childrenWithSeparateBed.value
      .filter(child => !selectedChildren[child.id])
      .map(child => {
        console.log(`[DEBUG] Ребенок ${child.id} имел отдельное размещение, но теперь не выбран`);
        return {
          id: child.id,
          childId: child.childId,
          selected: false,
          needsSeparateBed: true,
          hasSeparatePlacement: true,
          statusChanged: true, // Отмечаем, что статус изменился (ребенок был удален из выбора)
          fullName: child.fullName,
          birthdate: child.birthdate,
          spiritualName: child.spiritualName
        };
      });
    
    // Объединяем все данные о детях
    formDataToSubmit.children = [
      ...formDataToSubmit.children,
      ...unselectedChildren,
      ...unselectedSeparateChildren
    ];
    
    // Добавляем флаг, указывающий, что это редактирование существующего размещения
    formDataToSubmit.isEditing = isEditing.value;
    
    console.log('Отправляем данные формы:', formDataToSubmit);
    console.log('Данные о детях:', formDataToSubmit.children);
    
    // Отправляем данные формы
    await emit('submit', formDataToSubmit);
    
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
watch(() => props.placement, async (newPlacement) => {
  console.log('Изменение props.placement:', newPlacement);
  
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
    if (users.value.length && newPlacement.type !== 'child') {
      selectedUser.value = users.value.find(u => u.id === newPlacement.userId);
      console.log('Выбранный пользователь (из watch):', selectedUser.value);
      
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
    console.log('Открытие модального окна, props.placement:', props.placement);
    
    // Сбрасываем состояние загрузки имени ребёнка при открытии модального окна
    loadingChildName.value = false;
    loadedChildName.value = '';
    parentUser.value = null;
    
    // Загружаем пользователей
    await loadUsers();
    
    // Если это размещение ребёнка, загружаем данные ребёнка напрямую
    if (props.placement && props.placement.type === 'child' && props.placement.userId) {
      console.log('Это размещение ребёнка, загружаем данные ребёнка напрямую');
      // Загружаем данные ребенка
      await loadChildNameById(props.placement.userId);
    }
    
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
  if (!child) return 'Неизвестный ребенок';
  
  // Проверяем различные варианты наличия имени
  if (child.fullName && child.fullName.trim()) return child.fullName.trim();
  
  // Проверяем наличие имени и фамилии
  const name = child.name || '';
  const surname = child.surname || '';
  if (name && surname) return `${name} ${surname}`.trim();
  if (name) return name.trim();
  
  // Проверяем наличие имени в RegisteredChild
  if (child.RegisteredChild) {
    if (child.RegisteredChild.fullName && child.RegisteredChild.fullName.trim()) 
      return child.RegisteredChild.fullName.trim();
    
    const regName = child.RegisteredChild.name || '';
    const regSurname = child.RegisteredChild.surname || '';
    if (regName && regSurname) return `${regName} ${regSurname}`.trim();
    if (regName) return regName.trim();
  }
  
  // Проверяем наличие имени в User
  if (child.User) {
    if (child.User.fullName && child.User.fullName.trim()) 
      return child.User.fullName.trim();
    
    const userName = child.User.name || '';
    const userSurname = child.User.surname || '';
    if (userName && userSurname) return `${userName} ${userSurname}`.trim();
    if (userName) return userName.trim();
  }
  
  // Проверяем наличие имени в FestRegistrationChild
  if (child.FestRegistrationChild) {
    if (child.FestRegistrationChild.fullName && child.FestRegistrationChild.fullName.trim()) 
      return child.FestRegistrationChild.fullName.trim();
  }
  
  // Если ничего не нашли, возвращаем ID
  return `Ребенок (ID:${child.id || child.childId || 'неизвестен'})`;
};

// Функция получения отображаемого имени родителя
const getParentDisplayName = (parent: any) => {
  if (parent.fullName) return parent.fullName;
  if (parent.name && parent.surname) return `${parent.name} ${parent.surname}`;
  if (parent.name) return parent.name;
  
  // Добавляем духовное имя, если оно есть
  const spiritualName = parent.spiritualName || parent.spiritual_name || parent.spiritual || '';
  if (spiritualName) {
    return `${parent.fullName || parent.name || `Пользователь ID:${parent.id}`} (${spiritualName})`;
  }
  
  return `Пользователь ID:${parent.id}`;
};

// Загружаем данные о родителе при редактировании размещения ребенка
watch(() => props.placement, async (newPlacement) => {
  if (newPlacement && newPlacement.type === 'child' && newPlacement.userId) {
    // Загружаем данные родителя
    try {
      console.log(`Загрузка данных о родителе для ребёнка с ID ${newPlacement.userId}`);
      
      // Получаем данные ребенка
      const childData = await $fetch(`/api/admin/users/${newPlacement.userId}`);
      
      if (childData && childData.parentId) {
        const parentId = childData.parentId;
        console.log(`Найден ID родителя: ${parentId}`);
        
        // Получаем данные родителя
        const parentData = await $fetch(`/api/admin/users/${parentId}`);
        
        if (parentData) {
          parentUser.value = parentData;
          console.log(`Загружены данные родителя для ребенка ${newPlacement.userId}:`, parentUser.value);
        } else {
          console.warn(`Не удалось получить данные родителя с ID ${parentId}`);
          parentUser.value = null;
        }
      } else {
        console.warn(`У ребёнка с ID ${newPlacement.userId} не указан родитель или не удалось получить данные ребёнка`);
        parentUser.value = null;
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных родителя:', error);
      parentUser.value = null;
    }
  } else {
    parentUser.value = null;
  }
}, { immediate: true });

// Загрузка данных о ребёнке
const loadChildData = async (childId: number) => {
  try {
    console.log(`Загрузка данных о ребёнке с ID ${childId}`);
    
    // Получаем данные ребенка
    const childData = await $fetch(`/api/admin/users/${childId}`);
    
    if (childData) {
      console.log('Получены данные ребёнка из API:', childData);
      
      // Создаем объект с данными ребенка
      const childUser = {
        id: childData.id,
        fullName: childData.fullName || '',
        email: childData.email || '',
        spiritualName: childData.spiritualName || '',
        birthdate: childData.birthdate,
        isChild: true
      };
      
      // Добавляем ребенка в список пользователей
      const existingIndex = users.value.findIndex(u => u.id === childId);
      if (existingIndex >= 0) {
        users.value[existingIndex] = childUser;
      } else {
        users.value.push(childUser);
      }
      
      // Устанавливаем ребенка как выбранного пользователя
      selectedUser.value = childUser;
      console.log(`Ребенок ${childUser.id} установлен как выбранный пользователь:`, childUser);
      
      // Устанавливаем имя ребенка для отображения
      loadedChildName.value = getChildDisplayName(childUser);
      
      return childUser;
    } else {
      console.warn(`Не удалось получить данные ребенка с ID ${childId}`);
      loadedChildName.value = `Ребенок (ID:${childId})`;
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных ребенка:', error);
    loadedChildName.value = `Ребенок (ID:${childId})`;
  }
  
  return null;
};

watch(() => selectedUser.value, async (newUser) => {
  if (newUser) {
    await loadUserChildren(newUser.id);
  } else {
    userChildren.value = [];
  }
});
</script> 