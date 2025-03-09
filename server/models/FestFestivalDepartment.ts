import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';


export interface FestFestivalDepartmentAttributes {
  id: number;
  festivalId: number;
  departmentId: number;
}


export interface FestFestivalDepartmentCreationAttributes extends Optional<FestFestivalDepartmentAttributes, 'id'> { }


export class FestFestivalDepartment extends Model<FestFestivalDepartmentAttributes, FestFestivalDepartmentCreationAttributes> implements FestFestivalDepartmentAttributes {
  declare id: number;
  declare festivalId: number;
  declare departmentId: number;

  
  static associate(models: Models) {
    this.belongsTo(models.Festival, { foreignKey: 'festivalId', as: 'Festival' });
    this.belongsTo(models.FestDepartment, { foreignKey: 'departmentId', as: 'Department' });
  }
}


FestFestivalDepartment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    festivalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'festivalId',
      references: {
        model: 'fest_festivals',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'departmentId',
      references: {
        model: 'fest_departments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  },
  {
    sequelize,
    tableName: 'fest_festival_departments',
    timestamps: false,
    indexes: [
      {
        unique: false,
        fields: ['festivalId', 'departmentId'],
        name: 'fest_festival_departments_index'
      }
    ]
  }
);

export default FestFestivalDepartment; 