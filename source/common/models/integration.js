import Sequelize from 'sequelize';
import model from 'connection';

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
