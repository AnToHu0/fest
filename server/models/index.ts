import { User } from './User';
import { FestDepartment } from './FestDepartment';
import { PaymentTransaction } from './PaymentTransaction';
import { FestPlacement } from './FestPlacement';
import { FestRoom } from './FestRoom';

// Интерфейс для типизации моделей
export interface Models {
  User: typeof User;
  FestDepartment: typeof FestDepartment;
  PaymentTransaction: typeof PaymentTransaction;
  FestPlacement: typeof FestPlacement;
  FestRoom: typeof FestRoom;
  [key: string]: any;
}

// Объект с моделями
const models: Models = {
  User,
  FestDepartment,
  PaymentTransaction,
  FestPlacement,
  FestRoom
};

// Установка ассоциаций между моделями
Object.values(models).forEach(model => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

export default models; 