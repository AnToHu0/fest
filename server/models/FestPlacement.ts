import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';


export interface FestPlacementAttributes {
  id: number;
  room_id: number;
  slot: number;
  manager_id: number;
  user_id: number;
  type: string;
  datefrom: Date | null;
  dateto: Date | null;
  comment: string;
}


export interface FestPlacementCreationAttributes extends Optional<FestPlacementAttributes, 'id' | 'type' | 'datefrom' | 'dateto' | 'comment'> { }


export class FestPlacement extends Model<FestPlacementAttributes, FestPlacementCreationAttributes> implements FestPlacementAttributes {
  declare id: number;
  declare room_id: number;
  declare slot: number;
  declare manager_id: number;
  declare user_id: number;
  declare type: string;
  declare datefrom: Date | null;
  declare dateto: Date | null;
  declare comment: string;

  
  static associate(models: any) {
    this.belongsTo(models.FestRoom, { foreignKey: 'room_id' });
    this.belongsTo(models.User, { foreignKey: 'manager_id', as: 'Manager' });
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'User' });
  }
}


FestPlacement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
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
    }
  },
  {
    tableName: 'fest_placement',
    sequelize,
    timestamps: false
  }
);

export default FestPlacement; 
