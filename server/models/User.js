import { DataTypes } from 'sequelize';
import BaseModel from './BaseModel.js';
import bcrypt from 'bcrypt';

class User extends BaseModel {
  static init() {
    return super.init({
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      emailConfirmed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }, {
      tableName: 'fest_users',
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await User.hashPassword(user.password);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await User.hashPassword(user.password);
          }
        },
      },
    });
  }

  static async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }
}

export default User;