import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import bcrypt from 'bcrypt';
import sequelize from '~/server/database';


export interface UserAttributes {
  id: number;
  fullName: string;
  email: string;
  password: string;
  isActive: boolean;
  emailVerificationToken: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'emailVerificationToken' | 'createdAt' | 'updatedAt'> { }


export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare fullName: string;
  declare email: string;
  declare password: string;
  declare isActive: boolean;
  declare emailVerificationToken: string | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;


  async verifyPassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }


  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }
}


User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
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
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    createdAt: {
      type: DataTypes.DATE
    },
    updatedAt: {
      type: DataTypes.DATE
    }
  },
  {
    tableName: 'fest_users',
    sequelize,
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          user.password = await User.hashPassword(user.password);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          user.password = await User.hashPassword(user.password);
        }
      },
    },
  }
);

export default User; 
