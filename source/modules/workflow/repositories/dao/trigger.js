const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');
const { ETriggerTypes } = require('../../h');

const Trigger = model.define('Trigger', {
  workflowId: {
    type: Sequelize.INTEGER,
    field: 'workflow_id',
    allowNull: false,
  },
  type: {
    type: Sequelize.ENUM.apply(null, Object.values(ETriggerTypes)),
    allowNull: false,
  },
  value: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  tableName: 'workflow_triggers',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Trigger;