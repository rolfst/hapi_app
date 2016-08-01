import Sequelize from 'sequelize';
import { db as model } from 'connections';
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
    toJSON: function () { // eslint-disable-line func-names, object-shorthand
      let output = {
        type: 'conversation_message',
        id: this.id.toString(),
        text: this.text,
        created_at: formatDate(this.created_at),
        updated_at: formatDate(this.updated_at),
        conversation_id: this.parentId.toString(),
        created_by: this.User.toJSON(),
      };

      if (this.Conversation) {
        output = Object.assign(output, { conversation: this.Conversation.toJSON() });
      }

      return output;
    },
  },
});

export default Message;
