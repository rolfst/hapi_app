import Sequelize from 'sequelize';
import model from 'connection';

const Conversation = model.define('Conversation', {
  type: {
    type: Sequelize.ENUM,
    values: ['private', 'group'],
    validate: {
      isIn: ['private', 'group'],
    },
  },
  users: {
    type: Sequelize.ARRAY(Sequelize.NUMBER),
    allowNull: false,
    validate: {
      isArray: true,
    },
  },
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Conversation;
