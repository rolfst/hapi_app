import Sequelize from 'sequelize';
import model from 'connection';
import User from 'models/User';

const Conversation = model.define('Conversation', {
  type: {
    type: Sequelize.ENUM,
    values: ['PRIVATE', 'GROUP'],
    validate: {
      isIn: ['PRIVATE', 'GROUP'],
    },
  },
  createdBy: {
    type: Sequelize.INTEGER,
    field: 'created_by',
  },
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  getterMethods: {
    modelType: () => 'conversations',
  },
  defaultScope: {
    include: [{ model: User }]
  },
});

export default Conversation;
