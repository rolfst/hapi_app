const Sequelize = require('sequelize');
const model = require('../../../../../shared/configs/sequelize');
const dateUtils = require('../../../../../shared/utils/date');

const Conversation = model.define('Conversation', {
  type: {
    type: Sequelize.ENUM,
    values: ['PRIVATE', 'GROUP'],
  },
  createdBy: {
    type: Sequelize.INTEGER,
    field: 'created_by',
  },
  updatedAt: {
    type: Sequelize.DATE,
    field: 'updated_at',
  },
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  instanceMethods: {
    toJSON: function () { // eslint-disable-line func-names, object-shorthand
      let output = {
        type: 'conversation',
        id: this.dataValues.id.toString(),
        created_at: dateUtils.toISOString(this.created_at),
        last_message: this.LastMessage ? this.LastMessage.toJSON() : null,
      };

      if (this.Messages) {
        const messages = this.Messages.map((message) => message.toJSON());
        output = Object.assign(output, { messages });
      }

      if (this.Users && this.Users.length > 0) {
        const users = this.Users.map((user) => user.toSimpleJSON());
        output = Object.assign(output, { users });
      }

      return output;
    },
  },
  hooks: {
    afterDestroy: function (conversation) { // eslint-disable-line func-names, object-shorthand
      return conversation.getMessages()
        .then((messages) => messages.map((m) => m.destroy()));
    },
  },
});

module.exports = Conversation;
