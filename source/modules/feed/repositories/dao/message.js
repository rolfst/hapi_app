import Sequelize from 'sequelize';
import model from '../../../../shared/configs/sequelize';

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
    defaultValue: 'default_message',
  },
  objectId: {
    type: Sequelize.INTEGER,
    field: 'object_id',
    allowNull: true,
  },
  text: {
    type: Sequelize.STRING,
    field: 'text',
    allowNull: false,
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
    allowNull: false,
  },
}, {
  tableName: 'messages',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Message;
