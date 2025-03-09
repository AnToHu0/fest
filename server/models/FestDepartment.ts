import { Model, DataTypes, Optional } from 'sequelize';
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
      through: 'fest_department_admins',
      foreignKey: 'department_id',
      otherKey: 'user_id',
      as: 'Admins'
    });
    
    this.belongsToMany(models.Festival, { 
      through: 'fest_festival_departments',
      foreignKey: 'department_id',
      otherKey: 'festival_id',
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
      defaultValue: true,
      field: 'public' // Сохраняем имя поля в базе данных как 'public'
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
