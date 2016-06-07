import Sequelize from 'sequelize';
import model from 'connection';
import User from 'common/models/user';
import formatDate from 'common/utils/format-date';

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
        id: this.id.toString(),
        created_at: formatDate(this.created_at),
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
      conversation.getMessages()
        .then(messages => messages.map(message => message.destroy()));
    },
  },
});

export default Conversation;
