const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

const Poll = model.define('Poll', {
  messageId: {
    type: Sequelize.INTEGER,
    field: 'message_id',
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
