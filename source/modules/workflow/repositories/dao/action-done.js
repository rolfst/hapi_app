const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

const ActionDone = model.define('ActionDone', {
  workflowId: {
    type: Sequelize.INTEGER,
    field: 'workflow_id',
    allowNull: false,
  },
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
}, {
  tableName: 'workflow_actionsdone',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ActionDone;
