import { Model, DataTypes } from 'sequelize';
import sequelize from '~/server/database';
import User from './User';
import Role from './Role';

export class UserRole extends Model {
  declare userId: number;
  declare roleId: number;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

UserRole.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Role,
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
    timestamps: true
  }
);

// Определяем связи
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId' });

export default UserRole; 