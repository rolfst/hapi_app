import Sequelize from 'sequelize';
import model from 'connection';
import User from 'common/models/user';
import formatDate from 'common/utils/format-date';

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
  defaultScope: {
    include: [{ model: User }],
  },
  instanceMethods: {
    toJSON: function() {
      return {
        type: 'conversation_message',
        id: this.id.toString(),
        text: this.text,
        created_at: formatDate(this.created_at),
        updated_at: formatDate(this.updated_at),
        conversation_id: item.parentId.toString(),
        created_by: item.User.toJSON(),
      }
    }
  }
});

export default Message;
