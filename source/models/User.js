import Sequelize from 'sequelize';
import model from 'connection';
import Conversation from './Conversation';

const User = model.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  firstName: {
    type: Sequelize.STRING,
    field: 'first_name',
    allowNull: false,
  },
  lastName: {
    type: Sequelize.STRING,
    field: 'last_name',
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  profileImg: {
    type: Sequelize.STRING,
    field: 'profile_img',
    allowNull: false,
  },
  password: Sequelize.STRING,
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  instanceMethods: {
    hasConversationWith: (UserModel, userIds) => {
      return Promise.resolve(Conversation.findAll({
        include: [{
          model: UserModel,
          attributes: ['id', [model.fn('COUNT', '`Users`.`id`'), 'count']],
          where: {
            id: {
              $in: userIds,
            },
          },
        }],
        group: ['Conversation.id'],
        having: [
          '`Users.count` > 1',
        ],
      })).then(existingChats => {
        return existingChats[0] || null;
      });
    },
  },
});

export default User;
