const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

const Poll = model.define('Poll', {
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
  networkId: {
    type: Sequelize.INTEGER,
    field: 'network_id',
    allowNull: false,
  },
  question: {
    type: Sequelize.STRING,
    field: 'question',
    allowNull: false,
  },
}, {
  tableName: 'polls',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Poll;
