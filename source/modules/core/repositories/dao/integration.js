const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

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

module.exports = Integration;
