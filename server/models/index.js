import User from './User.js';
import FestDepartment from './FestDepartment.js';
import PaymentTransaction from './PaymentTransaction.js';
import FestPlacement from './FestPlacement.js';
import FestRoom from './FestRoom.js';

const models = {
  FestDepartment,
  PaymentTransaction,
  FestPlacement,
  FestRoom,
  User
};

// Инициализация всех моделей
Object.values(models).forEach(model => {
  if (typeof model.init === 'function') {
    model.init();
  }
});

// Установка ассоциаций между моделями
Object.values(models).forEach(model => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

export default models;