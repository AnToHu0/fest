import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';

// Атрибуты модели PaymentTransaction
export interface PaymentTransactionAttributes {
  id: number;
  customer_id: number;
  admin_id: number;
  payment_type: string;
  payment_dest: string;
  amount: number;
  date: Date | null;
}

// Атрибуты для создания новой транзакции
export interface PaymentTransactionCreationAttributes extends Optional<PaymentTransactionAttributes, 'id' | 'payment_type' | 'payment_dest' | 'date'> { }

// Класс модели PaymentTransaction
export class PaymentTransaction extends Model<PaymentTransactionAttributes, PaymentTransactionCreationAttributes> implements PaymentTransactionAttributes {
  declare id: number;
  declare customer_id: number;
  declare admin_id: number;
  declare payment_type: string;
  declare payment_dest: string;
  declare amount: number;
  declare date: Date | null;

  // Ассоциации
  static associate(models: any) {
    this.belongsTo(models.User, { foreignKey: 'customer_id', as: 'User' });
    this.belongsTo(models.User, { foreignKey: 'admin_id', as: 'Registrator' });
  }
}

// Инициализация модели
PaymentTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    payment_type: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'Наличные'
    },
    payment_dest: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'Взнос'
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    tableName: 'fest_payments',
    sequelize,
    timestamps: false
  }
);

export default PaymentTransaction; 