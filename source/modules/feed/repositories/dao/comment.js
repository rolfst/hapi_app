import Sequelize from 'sequelize';
import model from '../../../../shared/configs/sequelize';

const FeedComment = model.define('FeedComment', {
  messageId: {
    type: Sequelize.INTEGER,
    field: 'message_id',
    allowNull: false,
  },
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
  text: {
    type: Sequelize.STRING,
    field: 'text',
    allowNull: true,
  },
  createdAt: {
    type: Sequelize.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: Sequelize.DATE,
    field: 'updated_at',
  },
}, {
  tableName: 'feed_comments',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default FeedComment;
