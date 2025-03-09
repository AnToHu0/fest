import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import bcrypt from 'bcrypt';
import sequelize from '~/server/database';
import { Role } from './Role';
import type { FestDepartment } from './FestDepartment';
import type { Models } from './index';


export interface UserAttributes {
  id: number;
  fullName: string;
  spiritualName: string | null;
  birthDate: Date | null;
  email: string;
  phone: string | null;
  city: string | null;
  password: string;
  isActive: boolean;
  emailVerificationToken: string | null;
  searchField: string;
  adminNotes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  parentId: number | null;
  Roles?: Role[];
  Departments?: FestDepartment[];
}


export interface UserCreationAttributes extends Optional<UserAttributes,
  'id' | 'isActive' | 'emailVerificationToken' | 'createdAt' | 'updatedAt' |
  'spiritualName' | 'birthDate' | 'phone' | 'city' | 'parentId' | 'Roles' | 'searchField' | 'adminNotes' | 'Departments'> { }


export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare fullName: string;
  declare spiritualName: string | null;
  declare birthDate: Date | null;
  declare email: string;
  declare phone: string | null;
  declare city: string | null;
  declare password: string;
  declare isActive: boolean;
  declare emailVerificationToken: string | null;
  declare searchField: string;
  declare adminNotes: string | null;
  declare createdAt?: Date;
  declare updatedAt?: Date;
  declare parentId: number | null;
  declare Roles?: Role[];
  declare Departments?: FestDepartment[];

  // Добавляем метод setRoles
  declare setRoles: (roles: Role[], options?: any) => Promise<void>;

  async verifyPassword(password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      console.error('Ошибка при проверке пароля:', error);
      return false;
    }
  }


  static async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 10;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('Ошибка при хешировании пароля:', error);
      throw error;
    }
  }

  static associate(models: Models) {
    this.belongsToMany(models.FestDepartment, {
      through: {
        model: models.FestDepartmentAdmin,
        unique: false
      },
      foreignKey: 'user_id',
      otherKey: 'department_id',
      as: 'Departments'
    });

    // Связь с регистрациями на фестивали (как ребенок)
    this.belongsToMany(models.FestRegistration, {
      through: {
        model: models.FestRegistrationChild,
        unique: false
      },
      foreignKey: 'childId',
      otherKey: 'registrationId',
      as: 'Registrations'
    });

    // Связь родитель-ребенок через parentId
    this.belongsTo(models.User, {
      foreignKey: 'parentId',
      as: 'parent'
    });

    // Связь с детьми
    this.hasMany(models.User, {
      foreignKey: 'parentId',
      as: 'children'
    });
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
    spiritualName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
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
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'fest_users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    searchField: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    adminNotes: {
      type: DataTypes.TEXT,
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
        try {
          if (user.password) {
            user.password = await User.hashPassword(user.password);
          }
          user.searchField = [
            user.fullName,
            user.spiritualName,
            user.city
          ].filter(value => value != null && value !== '').join(' ').toLowerCase();
        } catch (error) {
          console.error('Ошибка в beforeCreate хуке:', error);
          throw error;
        }
      },
      beforeUpdate: async (user: User) => {
        try {
          if (user.changed('password')) {
            user.password = await User.hashPassword(user.password);
          }
          if (user.changed('fullName') || user.changed('spiritualName') || user.changed('city')) {
            user.searchField = [
              user.fullName,
              user.spiritualName,
              user.city
            ].filter(value => value != null && value !== '').join(' ').toLowerCase();
          }
        } catch (error) {
          console.error('Ошибка в beforeUpdate хуке:', error);
          throw error;
        }
      }
    }
  }
);

export default User; 
