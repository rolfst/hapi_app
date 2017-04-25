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
  invitedAt: {
    type: Sequelize.DATE,
    field: 'invited_at',
    allowNull: true,
  },
  deletedAt: {
    type: Sequelize.DATE,
    field: 'deleted_at',
    allowNull: true,
  },
  externalId: {
    type: Sequelize.STRING,
    field: 'external_id',
    allowNull: true,
  },
}, {
  tableName: 'organisation_user',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = OrganisationUser;
