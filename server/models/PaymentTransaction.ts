import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';


export interface PaymentTransactionAttributes {
  id: number;
  customerId: number;
  adminId: number;
  paymentType: string;
  paymentDest: string;
  amount: number;
  date: Date | null;
}


export interface PaymentTransactionCreationAttributes extends Optional<PaymentTransactionAttributes, 'id' | 'paymentType' | 'paymentDest' | 'date'> { }


export class PaymentTransaction extends Model<PaymentTransactionAttributes, PaymentTransactionCreationAttributes> implements PaymentTransactionAttributes {
  declare id: number;
  declare customerId: number;
  declare adminId: number;
  declare paymentType: string;
  declare paymentDest: string;
  declare amount: number;
  declare date: Date | null;

  
  static associate(models: Models) {
    this.belongsTo(models.User, { foreignKey: 'customerId', as: 'User' });
    this.belongsTo(models.User, { foreignKey: 'adminId', as: 'Registrator' });
  }
}


PaymentTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'customerId'
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'adminId'
    },
    paymentType: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'Наличные',
      field: 'paymentType'
    },
    paymentDest: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'Взнос',
      field: 'paymentDest'
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
