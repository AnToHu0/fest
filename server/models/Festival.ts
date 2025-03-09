import { Model, DataTypes, Optional, Op } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';


export interface FestivalAttributes {
  id: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  availableBuildings: string[]; // JSON массив доступных корпусов
  announcementText: string;
  year: number;
  adultPrice: number;
  teenPrice: number;
  childPrice: number;
  petPrice: number;
  carPrice: number;
}


export interface FestivalCreationAttributes extends Optional<FestivalAttributes, 'id'> { }


export class Festival extends Model<FestivalAttributes, FestivalCreationAttributes> implements FestivalAttributes {
  declare id: number;
  declare startDate: Date;
  declare endDate: Date;
  declare isActive: boolean;
  declare availableBuildings: string[];
  declare announcementText: string;
  declare year: number;
  declare adultPrice: number;
  declare teenPrice: number;
  declare childPrice: number;
  declare petPrice: number;
  declare carPrice: number;

  
  static associate(models: Models) {
    this.belongsToMany(models.FestDepartment, { 
      through: 'fest_festival_departments',
      foreignKey: 'festival_id',
      otherKey: 'department_id',
      as: 'Departments'
    });
  }
}


Festival.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    availableBuildings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    announcementText: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    adultPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    teenPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    childPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    petPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    carPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: 'fest_festivals',
    timestamps: true,
    hooks: {
      beforeSave: async (festival: Festival) => {
        // Если фестиваль становится активным, деактивируем все остальные
        if (festival.isActive) {
          await Festival.update(
            { isActive: false },
            { 
              where: { 
                id: { [Op.ne]: festival.id } 
              } 
            }
          );
        }
      }
    }
  }
);

export default Festival; 