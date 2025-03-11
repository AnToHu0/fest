import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '~/server/database';
import type { Models } from './index';

export interface FestPlacementChildAttributes {
  id: number;
  placementId: number;
  childId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FestPlacementChildCreationAttributes extends Optional<FestPlacementChildAttributes, 
  'id' | 'createdAt' | 'updatedAt'> { }

export class FestPlacementChild extends Model<FestPlacementChildAttributes, FestPlacementChildCreationAttributes> implements FestPlacementChildAttributes {
  declare id: number;
  declare placementId: number;
  declare childId: number;
  declare createdAt?: Date;
  declare updatedAt?: Date;

  static associate(models: Models) {
    // Связь с размещением
    this.belongsTo(models.FestPlacement, {
      foreignKey: 'placementId',
      as: 'Placement'
    });

    // Связь с ребенком (через FestRegistrationChild)
    this.belongsTo(models.FestRegistrationChild, {
      foreignKey: 'childId',
      as: 'Child'
    });
  }
}

FestPlacementChild.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    placementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'placementId',
      references: {
        model: 'fest_placement',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    childId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'childId',
      references: {
        model: 'fest_registration_children',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  },
  {
    tableName: 'fest_placement_children',
    sequelize,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['placementId', 'childId'],
        name: 'fest_placement_children_index'
      }
    ]
  }
);

export default FestPlacementChild; 