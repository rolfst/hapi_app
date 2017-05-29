const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

const WorkFlow = model.define('WorkFlow', {
  organisationId: {
    type: Sequelize.INTEGER,
    field: 'organisation_id',
    allowNull: false,
  },
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    defaultValue: null,
  },
  name: Sequelize.STRING,
  meta: Sequelize.TEXT,
  startDate: {
    type: Sequelize.DATE,
    field: 'start_date',
  },
  expirationDate: {
    type: Sequelize.DATE,
    field: 'expiration_date',
  },
  lastCheck: {
    type: Sequelize.DATE,
    field: 'last_check',
  },
  done: Sequelize.BOOLEAN,
}, {
  tableName: 'workflows',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = WorkFlow;
