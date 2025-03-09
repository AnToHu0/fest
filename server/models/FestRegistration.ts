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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FestRegistrationCreationAttributes extends Optional<FestRegistrationAttributes, 
  'id' | 'hasCar' | 'freeSeatsInCar' | 'hasPet' | 'notes' | 'createdAt' | 'updatedAt'> { }

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
      field: 'arrival_date'
    },
    departureDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'departure_date'
    },
    hasCar: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'has_car'
    },
    freeSeatsInCar: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'free_seats_in_car'
    },
    hasPet: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'has_pet'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: 'fest_registrations',
    sequelize,
    timestamps: true,
    underscored: true
  }
);

export default FestRegistration; 