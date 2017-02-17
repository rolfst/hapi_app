import Sequelize from 'sequelize';
import { db as model } from '../../../../connections';

const Message = model.define('FeedMessage', {
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
}, {
  tableName: 'feed_messages',
  createdAt: 'created_at',
  updatedAt: false,
});

export default Message;
