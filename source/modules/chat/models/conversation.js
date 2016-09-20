import Sequelize from 'sequelize';
import { db as model } from 'connections';
import formatDate from 'shared/utils/format-date';

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
  instanceMethods: {
    toJSON: function () { // eslint-disable-line func-names, object-shorthand
      let output = {
        type: 'conversation',
        id: this.dataValues.id.toString(),
        created_at: formatDate(this.created_at),
        last_message: this.LastMessage ? this.LastMessage.toJSON() : null,
      };

      if (this.Messages) {
        const messages = this.Messages.map(message => message.toJSON());
        output = Object.assign(output, { messages });
      }

      if (this.Users && this.Users.length > 0) {
        const users = this.Users.map(user => user.toJSON());
        output = Object.assign(output, { users });
      }

      return output;
    },
  },
  hooks: {
    afterDestroy: function (conversation) { // eslint-disable-line func-names, object-shorthand
      return conversation.getMessages()
        .then(messages => messages.map(m => m.destroy()));
    },
  },
});

export default Conversation;
