import Sequelize from 'sequelize';
import model from 'connection';
import User from 'models/User';

const Conversation = model.define('Conversation', {
  type: {
    type: Sequelize.ENUM,
    values: ['private', 'group'],
    validate: {
      isIn: ['private', 'group'],
    },
  },
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  getterMethods: {
    type: () => 'conversations',
  },
  defaultScope: {
    include: [{ model: User }]
  },
});

export default Conversation;
