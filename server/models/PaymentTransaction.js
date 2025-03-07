// server/models/PaymentTransaction.js
import { DataTypes } from 'sequelize';
import BaseModel from './BaseModel.js';

class PaymentTransaction extends BaseModel {
  static init() {
    return super.init({
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
    }, {
      tableName: 'fest_payments',
      timestamps: false
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'customer_id', as: 'User' });
    this.belongsTo(models.User, { foreignKey: 'admin_id', as: 'Registrator' });
  }
}

export default PaymentTransaction;