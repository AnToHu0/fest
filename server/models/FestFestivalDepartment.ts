import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';


export interface FestFestivalDepartmentAttributes {
  id: number;
  festival_id: number;
  department_id: number;
}


export interface FestFestivalDepartmentCreationAttributes extends Optional<FestFestivalDepartmentAttributes, 'id'> { }


export class FestFestivalDepartment extends Model<FestFestivalDepartmentAttributes, FestFestivalDepartmentCreationAttributes> implements FestFestivalDepartmentAttributes {
  declare id: number;
  declare festival_id: number;
  declare department_id: number;

  
  static associate(models: Models) {
    this.belongsTo(models.Festival, { foreignKey: 'festival_id', as: 'Festival' });
    this.belongsTo(models.FestDepartment, { foreignKey: 'department_id', as: 'Department' });
  }
}


FestFestivalDepartment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    festival_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'fest_festivals',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
        fields: ['festival_id', 'department_id'],
        name: 'fest_festival_departments_index'
      }
    ]
  }
);

export default FestFestivalDepartment; 