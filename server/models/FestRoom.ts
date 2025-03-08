import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';


export interface FestRoomAttributes {
  id: number;
  building: number;
  floor: number;
  number: number;
  size: number;
  desc: string;
}


export interface FestRoomCreationAttributes extends Optional<FestRoomAttributes, 'id' | 'desc'> { }


export class FestRoom extends Model<FestRoomAttributes, FestRoomCreationAttributes> implements FestRoomAttributes {
  declare id: number;
  declare building: number;
  declare floor: number;
  declare number: number;
  declare size: number;
  declare desc: string;

  
  static associate(models: Models) {
    this.hasMany(models.FestPlacement, { foreignKey: 'room_id', as: 'Placements' });
  }
}


FestRoom.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
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
  },
  {
    tableName: 'fest_rooms',
    sequelize,
    timestamps: false
  }
);

export default FestRoom; 
