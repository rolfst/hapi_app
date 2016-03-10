import Sequelize from 'sequelize';
import model from 'connection';

const Conversation = model.define('Conversation', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Conversation;
