import { Sequelize, Model, DataTypes } from 'sequelize';
import type { Optional } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';


export interface FestDepartmentAttributes {
  id: number;
  title: string;
  isPublic: boolean;
  joinText: string; // Текст, появляющийся при вступлении в департамент
}


export interface FestDepartmentCreationAttributes extends Optional<FestDepartmentAttributes, 'id' | 'joinText'> { }


export class FestDepartment extends Model<FestDepartmentAttributes, FestDepartmentCreationAttributes> implements FestDepartmentAttributes {
  declare id: number;
  declare title: string;
  declare isPublic: boolean;
  declare joinText: string;

  
  static associate(models: Models) {
    this.belongsToMany(models.User, { 
      through: {
        model: models.FestDepartmentAdmin,
        unique: false
      },
      foreignKey: 'departmentId',
      otherKey: 'userId',
      as: 'Admins'
    });
    
    this.belongsToMany(models.Festival, { 
      through: {
        model: models.FestFestivalDepartment,
        unique: false
      },
      foreignKey: 'departmentId',
      otherKey: 'festivalId',
      as: 'Festivals'
    });
  }
}


FestDepartment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ''
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    joinText: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    }
  },
  {
    tableName: 'fest_departments',
    sequelize,
    timestamps: false
  }
);

export default FestDepartment; 
