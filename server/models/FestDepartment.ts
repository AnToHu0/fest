import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import sequelize from '~/config/database';
import { User } from './User';

// Атрибуты модели FestDepartment
export interface FestDepartmentAttributes {
  id: number;
  title: string;
  admin_id: number;
  public: boolean;
  additional_emails: string;
}

// Атрибуты для создания нового отдела
export interface FestDepartmentCreationAttributes extends Optional<FestDepartmentAttributes, 'id'> { }

// Класс модели FestDepartment
export class FestDepartment extends Model<FestDepartmentAttributes, FestDepartmentCreationAttributes> implements FestDepartmentAttributes {
  declare id: number;
  declare title: string;
  declare admin_id: number;
  declare public: boolean;
  declare additional_emails: string;

  // Ассоциации
  static associate(models: any) {
    this.belongsTo(models.User, { foreignKey: 'admin_id', as: 'User' });
  }
}

// Инициализация модели
FestDepartment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ''
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    public: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    additional_emails: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ''
    }
  },
  {
    tableName: 'fest_departments',
    sequelize,
    timestamps: false
  }
);

export default FestDepartment; 