import { Model, DataTypes } from 'sequelize';
import sequelize from '~/config/database.js';

class BaseModel extends Model {
  static init(attributes, options = {}) {
    const baseAttributes = {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ...attributes
    };

    return super.init(baseAttributes, {
      sequelize,
      ...options
    });
  }
}

export default BaseModel;