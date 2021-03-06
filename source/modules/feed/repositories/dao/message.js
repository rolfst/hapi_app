const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');
const { EMessageTypes } = require('../../definitions');

const Message = model.define('FeedMessage', {
  parentId: {
    type: Sequelize.INTEGER,
    field: 'parent_id',
    allowNull: false,
  },
  parentType: {
    type: Sequelize.STRING,
    field: 'parent_type',
    allowNull: false,
  },
  messageType: {
    type: Sequelize.STRING,
    field: 'message_type',
    defaultValue: EMessageTypes.DEFAULT,
  },
  text: {
    type: Sequelize.STRING,
    field: 'text',
    allowNull: true,
  },
  likesCount: {
    type: Sequelize.INTEGER,
    field: 'likes_count',
    allowNull: false,
    defaultValue: 0,
  },
  commentsCount: {
    type: Sequelize.INTEGER,
    field: 'comments_count',
    allowNull: false,
    defaultValue: 0,
  },
  createdBy: {
    type: Sequelize.INTEGER,
    field: 'created_by',
    allowNull: true,
  },
}, {
  tableName: 'messages',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Message;
