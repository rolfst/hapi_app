const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

const OrganisationUser = model.define('OrganisationUser', {
  organisationId: {
    type: Sequelize.INTEGER,
    field: 'organisation_id',
    allowNull: false,
  },
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
  functionId: {
    type: Sequelize.INTEGER,
    field: 'function_id',
    allowNull: true,
  },
  roleType: {
    type: Sequelize.STRING,
    field: 'role_type',
    defaultValue: 'EMPLOYEE',
  },
}, {
  tableName: 'organisation_user',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = OrganisationUser;
