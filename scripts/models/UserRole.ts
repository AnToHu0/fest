import { Model, DataTypes } from 'sequelize';
import sequelize from './database';
import User from './User';
import Role from './Role';

export class UserRole extends Model {
  declare id: number;
  declare userId: number;
  declare roleId: number;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

UserRole.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Role,
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    createdAt: {
      type: DataTypes.DATE
    },
    updatedAt: {
      type: DataTypes.DATE
    }
  },
  {
    tableName: 'fest_user_roles',
    sequelize,
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'roleId'],
        unique: false,
        name: 'userRoleIdx'
      }
    ]
  }
);

// Определяем связи
User.belongsToMany(Role, { 
  through: UserRole,
  foreignKey: 'userId',
  otherKey: 'roleId'
});

Role.belongsToMany(User, { 
  through: UserRole,
  foreignKey: 'roleId',
  otherKey: 'userId'
});

export default UserRole; 