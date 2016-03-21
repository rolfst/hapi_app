import Sequelize from 'sequelize';
import model from 'connection';

const Message = model.define('Message', {
  text: Sequelize.TEXT,
  parentId: { type: Sequelize.INTEGER, field: 'parent_id' },
  parentType: { type: Sequelize.STRING, field: 'parent_type' },
  messageType: { type: Sequelize.STRING, field: 'message_type' },
  createdBy: { type: Sequelize.INTEGER, field: 'created_by' },
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  getterMethods: {
    modelType: () => 'messages',
  },
});

export default Message;
