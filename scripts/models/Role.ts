import { Model, DataTypes } from 'sequelize';
import sequelize from './database';

export interface RoleAttributes {
  id: number;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Role extends Model {
  declare id: number;
  declare name: string;
  declare description: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE
    },
    updatedAt: {
      type: DataTypes.DATE
    }
  },
  {
    tableName: 'fest_roles',
    sequelize,
    timestamps: true
  }
);

export default Role; 