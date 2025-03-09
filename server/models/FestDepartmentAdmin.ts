import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';


export interface FestDepartmentAdminAttributes {
  id: number;
  departmentId: number;
  userId: number;
}


export interface FestDepartmentAdminCreationAttributes extends Optional<FestDepartmentAdminAttributes, 'id'> { }


export class FestDepartmentAdmin extends Model<FestDepartmentAdminAttributes, FestDepartmentAdminCreationAttributes> implements FestDepartmentAdminAttributes {
  declare id: number;
  declare departmentId: number;
  declare userId: number;

  
  static associate(models: Models) {
    this.belongsTo(models.FestDepartment, { foreignKey: 'departmentId', as: 'Department' });
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'User' });
  }
}


FestDepartmentAdmin.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'department_id',
      references: {
        model: 'fest_departments',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'fest_users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  },
  {
    tableName: 'fest_department_admins',
    sequelize,
    timestamps: false,
    indexes: [
      {
        unique: false,
        fields: ['department_id', 'user_id'],
        name: 'fest_department_admins_index'
      }
    ]
  }
);

export default FestDepartmentAdmin; 