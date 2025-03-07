// server/models/FestPlacement.js
import { DataTypes } from 'sequelize';
import BaseModel from './BaseModel.js';

class FestPlacement extends BaseModel {
  static init() {
    return super.init({
      room_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      slot: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      manager_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      type: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ''
      },
      datefrom: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },
      dateto: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ''
      },
    }, {
      tableName: 'fest_placement',
      timestamps: false
    });
  }

  static associate(models) {
    this.belongsTo(models.FestRoom, { foreignKey: 'room_id' });
    this.belongsTo(models.User, { foreignKey: 'manager_id', as: 'Manager' });
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'User' });
  }
}

export default FestPlacement;