import Sequelize from 'sequelize';
import { db as model } from '../../../connections';
import * as dateUtils from '../../../shared/utils/date';

const Message = model.define('Message', {
  text: Sequelize.TEXT,
  parentId: { type: Sequelize.INTEGER, field: 'parent_id' },
  parentType: { type: Sequelize.STRING, field: 'parent_type' },
  messageType: { type: Sequelize.STRING, field: 'message_type' },
  createdBy: { type: Sequelize.INTEGER, field: 'created_by' },
}, {
  tableName: 'old_messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  defaultScope: {
    where: {
      parentType: 'FlexAppeal\\Entities\\Conversation',
    },
  },
  instanceMethods: {
    toJSON: function () { // eslint-disable-line func-names, object-shorthand
      let output = {
        type: 'conversation_message',
        id: this.id.toString(),
        conversation_id: this.parentId.toString(),
        text: this.text,
        created_at: dateUtils.toISOString(this.created_at),
        updated_at: dateUtils.toISOString(this.updated_at),
        created_by: this.User.toSimpleJSON(),
      };

      if (this.Conversation) {
        output = Object.assign(output, { conversation: this.Conversation.toJSON() });
      }

      return output;
    },
  },
});

export default Message;
