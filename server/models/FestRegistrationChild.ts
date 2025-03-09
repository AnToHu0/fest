import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';

export interface FestRegistrationChildAttributes {
  id: number;
  registrationId: number;
  childId: number;
  needsSeparateBed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FestRegistrationChildCreationAttributes extends Optional<FestRegistrationChildAttributes, 
  'id' | 'needsSeparateBed' | 'createdAt' | 'updatedAt'> { }

export class FestRegistrationChild extends Model<FestRegistrationChildAttributes, FestRegistrationChildCreationAttributes> implements FestRegistrationChildAttributes {
  declare id: number;
  declare registrationId: number;
  declare childId: number;
  declare needsSeparateBed: boolean;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  static associate(models: Models) {
    // Связь с регистрацией
    this.belongsTo(models.FestRegistration, {
      foreignKey: 'registrationId',
      as: 'Registration'
    });

    // Связь с ребенком (пользователем)
    this.belongsTo(models.User, {
      foreignKey: 'childId',
      as: 'RegisteredChild'
    });
  }
}

FestRegistrationChild.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    registrationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'registrationId',
      references: {
        model: 'fest_registrations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    childId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'childId',
      references: {
        model: 'fest_users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    needsSeparateBed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'needsSeparateBed'
    }
  },
  {
    tableName: 'fest_registration_children',
    sequelize,
    timestamps: true,
    indexes: [
      {
        unique: false,
        fields: ['registrationId', 'childId'],
        name: 'fest_registration_children_index'
      }
    ]
  }
);

export default FestRegistrationChild; 