const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');
const { EConditionOperators } = require('../../h');

const Condition = model.define('Condition', {
  workflowId: {
    type: Sequelize.INTEGER,
    field: 'workflow_id',
    allowNull: false,
  },
  field: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  operator: {
    type: Sequelize.ENUM.apply(null, Object.values(EConditionOperators)),
    allowNull: false,
  },
  value: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  tableName: 'workflow_conditions',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Condition;
