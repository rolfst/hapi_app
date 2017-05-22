const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');
const { EActionTypes } = require('../../definitions');

const Action = model.define('Action', {
  workflowId: {
    type: Sequelize.INTEGER,
    field: 'workflow_id',
    allowNull: false,
  },
  type: {
    type: Sequelize.ENUM.apply(null, Object.values(EActionTypes)),
    allowNull: false,
  },
  meta: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'workflow_actions',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Action;
