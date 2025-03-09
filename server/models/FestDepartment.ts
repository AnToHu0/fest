import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';


export interface FestDepartmentAttributes {
  id: number;
  title: string;
  public: boolean;
}


export interface FestDepartmentCreationAttributes extends Optional<FestDepartmentAttributes, 'id'> { }


export class FestDepartment extends Model<FestDepartmentAttributes, FestDepartmentCreationAttributes> implements FestDepartmentAttributes {
  declare id: number;
  declare title: string;
  declare public: boolean;

  
  static associate(models: Models) {
    this.belongsToMany(models.User, { 
      through: 'fest_department_admins',
      foreignKey: 'department_id',
      otherKey: 'user_id',
      as: 'Admins'
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
    public: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  },
  {
    tableName: 'fest_departments',
    sequelize,
    timestamps: false
  }
);

export default FestDepartment; 
