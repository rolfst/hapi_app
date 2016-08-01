import Sequelize from 'sequelize';
import { db as model } from 'connections';

const Integration = model.define('Integration', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  tableName: 'services',
  timestamps: false,
});

export default Integration;
