<template>
  <div>
    <div 
      :style="style"
      :class="['placement-card', status]"
      @click.stop="$emit('edit')"
    >
      <div class="placement-info">
        <div class="placement-status">
          <span v-if="status === 'booked'" class="status-icon">🔒</span>
          <span v-else-if="status === 'paid'" class="status-icon">💰</span>
          <span v-else-if="status === 'settled'" class="status-icon">✓</span>
          <span v-else-if="status === 'special'" class="status-icon">⭐</span>
        </div>
        <div class="guest-name">
          {{ guestName }}
          <span v-if="childrenCount > 0" class="children-info" :title="childrenTooltip">
            +{{ childrenCount }} {{ childrenText }}
          </span>
        </div>
        <div class="placement-dates">{{ startDate }} - {{ endDate }}</div>
      </div>
      <button 
        @click.stop="handleDeleteClick" 
        class="delete-btn"
      >
        <Icon name="mdi:close" class="w-4 h-4" />
      </button>
    </div>
    
    <!-- Используем компонент ConfirmDialog -->
    <ConfirmDialog
      :is-open="showDeleteConfirm"
      title="Подтверждение удаления"
      :message="`Вы действительно хотите удалить размещение для гостя «${guestName}»?`"
      confirm-text="Удалить"
      cancel-text="Отмена"
      :z-index="1000"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ConfirmDialog from '~/components/ui/ConfirmDialog.vue';

const props = defineProps<{
  style: Record<string, string>;
  status: string;
  guestName: string;
  startDate: string;
  endDate: string;
  children?: any[];
}>();

// Отладочный вывод для проверки данных о детях
console.log('PlacementCard props:', {
  guestName: props.guestName,
  hasChildren: props.hasOwnProperty('children'),
  childrenType: props.children ? typeof props.children : 'undefined',
  isArray: props.children ? Array.isArray(props.children) : false,
  childrenLength: props.children && Array.isArray(props.children) ? props.children.length : 0,
  children: props.children
});

const childrenCount = computed(() => {
  if (!props.children) return 0;
  return Array.isArray(props.children) ? props.children.length : 0;
});

const childrenText = computed(() => {
  const count = childrenCount.value;
  if (count === 1) return 'ребенок';
  if (count >= 2 && count <= 4) return 'ребенка';
  return 'детей';
});

const childrenTooltip = computed(() => {
  if (!props.children || !Array.isArray(props.children) || props.children.length === 0) return '';
  
  // Отладочный вывод для анализа структуры данных
  console.log('Children data structure:', JSON.stringify(props.children[0], null, 2));
  
  // Улучшенная логика для получения имен детей
  return props.children.map(child => {
    // Проверяем различные пути к имени ребенка
    if (child.Child && child.Child.RegisteredChild && child.Child.RegisteredChild.fullName) {
      return child.Child.RegisteredChild.fullName;
    }
    
    if (child.childData && child.childData.RegisteredChild && child.childData.RegisteredChild.fullName) {
      return child.childData.RegisteredChild.fullName;
    }
    
    if (child.fullName) {
      return child.fullName;
    }
    
    return 'Ребенок';
  }).join(', ');
});

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'delete'): void;
}>();

const showDeleteConfirm = ref(false);

const handleDeleteClick = (event: Event) => {
  event.stopPropagation(); // Предотвращаем всплытие события
  showDeleteConfirm.value = true;
};

const confirmDelete = () => {
  showDeleteConfirm.value = false;
  emit('delete');
};
</script>

<style scoped>
/* Карточка размещения */
.placement-card {
  position: absolute;
  border-radius: 6px;
  padding: 4px 8px;
  color: white;
  font-size: 0.75rem;
  line-height: 1.2;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  animation: fadeIn 0.3s ease-in-out;
  z-index: 5;
  opacity: 1 !important;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}

/* Анимация появления карточек */
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Эффект при наведении на карточку */
.placement-card:hover {
  transform: scale(1.02);
  z-index: 9;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

/* Контейнер информации в карточке */
.placement-info {
  width: 100%;
  overflow: hidden;
  padding-right: 8px; /* Отступ от кнопки удаления */
}

/* Статус размещения с иконкой */
.placement-status {
  float: right;
  margin-left: 4px;
  margin-right: 4px; /* Отступ от кнопки удаления */
}

.status-icon {
  font-size: 12px;
  display: inline-block;
  margin-left: 2px;
  transform: translateY(1px);
}

/* Имя гостя в карточке */
.guest-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Даты размещения в карточке */
.placement-dates {
  font-size: 0.7rem;
  opacity: 0.9;
}

/* Кнопка удаления */
.delete-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.2s;
  opacity: 0;
  margin-left: auto;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placement-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

/* Цвета для статусов размещений */
.placement-card.booked {
  background-color: #93c5fd !important; /* Бледно-синий для забронировано */
}

.placement-card.paid {
  background-color: #3b82f6 !important; /* Ярко-синий для оплачено */
}

.placement-card.settled {
  background-color: #34d399 !important; /* Более тёплый зелёный для расселено */
}

.placement-card.special {
  background-color: #f97316 !important; /* Оранжевый (шафран) для спец-гостей */
}

/* Добавляем класс для неизвестного статуса */
.placement-card:not(.booked):not(.paid):not(.settled):not(.special) {
  background-color: #6b7280 !important; /* Серый для неизвестного статуса */
}

/* Информация о детях */
.children-info {
  font-size: 0.7rem;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  padding: 0 4px;
  margin-left: 4px;
  display: inline-block;
  cursor: help;
}
</style> 