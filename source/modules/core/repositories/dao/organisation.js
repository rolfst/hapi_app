const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

const Organisation = model.define('Organisation', {
  name: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  brandIcon: {
    type: Sequelize.STRING,
    field: 'brand_icon',
  },
  externalConfig: {
    type: Sequelize.TEXT,
    field: 'external_config',
  },
}, {
  tableName: 'organisations',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Organisation;
