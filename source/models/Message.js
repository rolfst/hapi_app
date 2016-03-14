import Sequelize from 'sequelize';
import model from 'connection';
import User from 'models/User';

const Message = model.define('Message', {
  parentId: Sequelize.INTEGER,
  text: Sequelize.TEXT,
  messageType: Sequelize.STRING,
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Message.belongsTo(User, { foreignKey: 'created_by' });

export default Message;
