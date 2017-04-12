const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

const WorkFlow = model.define('WorkFlow', {
  organisationId: {
    type: Sequelize.INTEGER,
    field: 'organisation_id',
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  meta: Sequelize.TEXT,
  startDate: {
    type: Sequelize.DATE,
    field: 'start_date',
  },
  expirationDate: {
    type: Sequelize.DATE,
    field: 'expiration_date',
  },
}, {
  tableName: 'workflows',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = WorkFlow;
