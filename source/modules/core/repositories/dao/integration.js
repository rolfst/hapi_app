import Sequelize from 'sequelize';
import model from '../../../../shared/configs/sequelize';

const Integration = model.define('Integration', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  token: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  tableName: 'services',
  timestamps: false,
});

export default Integration;
