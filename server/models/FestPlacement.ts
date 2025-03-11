import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';
import { FestPlacementChild } from './FestPlacementChild';


export interface FestPlacementAttributes {
  id: number;
  roomId: number;
  slot: number;
  managerId: number;
  userId: number;
  type: string;
  datefrom: Date | null;
  dateto: Date | null;
  comment: string;
  Children?: FestPlacementChild[];
}


export interface FestPlacementCreationAttributes extends Optional<FestPlacementAttributes, 'id' | 'type' | 'datefrom' | 'dateto' | 'comment' | 'Children'> { }


export class FestPlacement extends Model<FestPlacementAttributes, FestPlacementCreationAttributes> implements FestPlacementAttributes {
  declare id: number;
  declare roomId: number;
  declare slot: number;
  declare managerId: number;
  declare userId: number;
  declare type: string;
  declare datefrom: Date | null;
  declare dateto: Date | null;
  declare comment: string;
  declare Children?: FestPlacementChild[];

  
  static associate(models: Models) {
    this.belongsTo(models.FestRoom, { foreignKey: 'roomId' });
    this.belongsTo(models.User, { foreignKey: 'managerId', as: 'Manager' });
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'User' });
    this.hasMany(models.FestPlacementChild, { foreignKey: 'placementId', as: 'Children' });
  }
}


FestPlacement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'roomId'
    },
    slot: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'managerId'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'userId'
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
    }
  },
  {
    tableName: 'fest_placement',
    sequelize,
    timestamps: false
  }
);

export default FestPlacement; 
