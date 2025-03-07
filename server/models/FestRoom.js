// server/models/FestRoom.js
import { DataTypes } from 'sequelize';
import BaseModel from './BaseModel.js';

class FestRoom extends BaseModel {
  static init() {
    return super.init({
      building: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      floor: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      number: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      desc: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ''
      }
    }, {
      tableName: 'fest_rooms',
      timestamps: false
    });
  }

  static associate(models) {
    this.hasMany(models.FestPlacement, { foreignKey: 'room_id', as: 'Placements' });
  }
}

export default FestRoom;