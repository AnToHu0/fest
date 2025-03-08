import { Model, DataTypes } from 'sequelize';
import sequelize from './database';
import { User } from './User';
import { Role } from './Role';

export class UserRole extends Model {
  declare userId: number;
  declare roleId: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

UserRole.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'fest_users',
        key: 'id'
      }
    },
    roleId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'fest_roles',
        key: 'id'
      }
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
        name: 'user_role_composite'
      }
    ]
  }
);

User.belongsToMany(Role, {
  through: {
    model: UserRole,
    unique: false
  },
  foreignKey: 'userId',
  otherKey: 'roleId',
  as: 'roles'
});

Role.belongsToMany(User, {
  through: {
    model: UserRole,
    unique: false
  },
  foreignKey: 'roleId',
  otherKey: 'userId',
  as: 'users'
});

export default UserRole; 