import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';


export interface FestDepartmentAdminAttributes {
  id: number;
  department_id: number;
  user_id: number;
  is_main: boolean;
}


export interface FestDepartmentAdminCreationAttributes extends Optional<FestDepartmentAdminAttributes, 'id'> { }


export class FestDepartmentAdmin extends Model<FestDepartmentAdminAttributes, FestDepartmentAdminCreationAttributes> implements FestDepartmentAdminAttributes {
  declare id: number;
  declare department_id: number;
  declare user_id: number;
  declare is_main: boolean;

  
  static associate(models: Models) {
    this.belongsTo(models.FestDepartment, { foreignKey: 'department_id', as: 'Department' });
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'User' });
  }
}


FestDepartmentAdmin.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'fest_users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    is_main: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    tableName: 'fest_department_admins',
    sequelize,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['department_id', 'user_id']
      }
    ]
  }
);

export default FestDepartmentAdmin; 