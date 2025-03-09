import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';

export interface FestRegistrationAttributes {
  id: number;
  userId: number;
  festivalId: number;
  arrivalDate: Date;
  departureDate: Date;
  hasCar: boolean;
  freeSeatsInCar: number;
  hasPet: boolean;
  notes: string;
  registeredBy: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FestRegistrationCreationAttributes extends Optional<FestRegistrationAttributes, 
  'id' | 'hasCar' | 'freeSeatsInCar' | 'hasPet' | 'notes' | 'registeredBy' | 'createdAt' | 'updatedAt'> { }

export class FestRegistration extends Model<FestRegistrationAttributes, FestRegistrationCreationAttributes> implements FestRegistrationAttributes {
  declare id: number;
  declare userId: number;
  declare festivalId: number;
  declare arrivalDate: Date;
  declare departureDate: Date;
  declare hasCar: boolean;
  declare freeSeatsInCar: number;
  declare hasPet: boolean;
  declare notes: string;
  declare registeredBy: number | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  static associate(models: Models) {
    // Связь с пользователем
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'User'
    });

    // Связь с фестивалем
    this.belongsTo(models.Festival, {
      foreignKey: 'festivalId',
      as: 'Festival'
    });

    // Связь с администратором, который зарегистрировал
    this.belongsTo(models.User, {
      foreignKey: 'registeredBy',
      as: 'RegisteredByUser'
    });

    // Связь с департаментами через промежуточную таблицу
    this.belongsToMany(models.FestDepartment, {
      through: {
        model: models.FestRegistrationDepartment,
        unique: false
      },
      foreignKey: 'registrationId',
      otherKey: 'departmentId',
      as: 'Departments'
    });

    // Связь с детьми через промежуточную таблицу
    this.belongsToMany(models.User, {
      through: {
        model: models.FestRegistrationChild,
        unique: false
      },
      foreignKey: 'registrationId',
      otherKey: 'childId',
      as: 'RegisteredChildren'
    });
  }
}

FestRegistration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'userId',
      references: {
        model: 'fest_users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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
    arrivalDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'arrivalDate'
    },
    departureDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'departureDate'
    },
    hasCar: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'hasCar'
    },
    freeSeatsInCar: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'freeSeatsInCar'
    },
    hasPet: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'hasPet'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    registeredBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'registeredBy',
      references: {
        model: 'fest_users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  },
  {
    tableName: 'fest_registrations',
    sequelize,
    timestamps: true
  }
);

export default FestRegistration; 