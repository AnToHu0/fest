import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';

export interface FestRegistrationDepartmentAttributes {
  id: number;
  registrationId: number;
  departmentId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FestRegistrationDepartmentCreationAttributes extends Optional<FestRegistrationDepartmentAttributes, 
  'id' | 'createdAt' | 'updatedAt'> { }

export class FestRegistrationDepartment extends Model<FestRegistrationDepartmentAttributes, FestRegistrationDepartmentCreationAttributes> implements FestRegistrationDepartmentAttributes {
  declare id: number;
  declare registrationId: number;
  declare departmentId: number;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  static associate(models: Models) {
    // Связи не нужны, так как это промежуточная таблица
  }
}

FestRegistrationDepartment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    registrationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'registration_id',
      references: {
        model: 'fest_registrations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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
    }
  },
  {
    tableName: 'fest_registration_departments',
    sequelize,
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: false,
        fields: ['registration_id', 'department_id'],
        name: 'fest_registration_departments_index'
      }
    ]
  }
);

export default FestRegistrationDepartment; 