// server/models/FestDepartment.js
import { DataTypes } from 'sequelize';
import BaseModel from './BaseModel.js';

class FestDepartment extends BaseModel {
  static init() {
    return super.init({
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: ''
      },
      admin_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      public: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true
      },
      additional_emails: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: ''
      }
    }, {
      tableName: 'fest_departments',
      timestamps: false
    });
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'admin_id', as: 'User' });
  }
}

export default FestDepartment;