import { Model, DataTypes } from 'sequelize';
import sequelize from './database';
import bcrypt from 'bcrypt';

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
  children?: UserAttributes[];
}

export class User extends Model {
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
  declare createdAt: Date;
  declare updatedAt: Date;
  declare parentId: number | null;
  declare children?: User[];

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
      allowNull: false
    },
    spiritualName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: true
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
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
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
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'fest_users',
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
    tableName: 'fest_users',
    sequelize,
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          user.password = await User.hashPassword(user.password);
        }
        user.searchField = [
          user.fullName,
          user.spiritualName,
          user.city
        ].filter(value => value != null && value !== '').join(' ').toLowerCase();
      },
      beforeUpdate: async (user: User) => {
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
      }
    }
  }
);

User.hasMany(User, {
  as: 'children',
  foreignKey: 'parentId'
});

User.belongsTo(User, {
  as: 'parent',
  foreignKey: 'parentId'
});

export default User; 