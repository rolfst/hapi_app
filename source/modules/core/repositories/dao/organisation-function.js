const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

const OrganisationFunction = model.define('OrganisationFunction', {
  organisationId: {
    type: Sequelize.INTEGER,
    field: 'organisation_id',
    allowNull: false
  },
  name: {
    type: Sequelize.STRING,
    field: 'name'
  }
}, {
  tableName: 'organisation_function',
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = OrganisationFunction;
