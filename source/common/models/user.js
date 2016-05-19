import Sequelize from 'sequelize';
import model from 'connection';
import Conversation from 'modules/chat/models/Conversation';
import formatDate from 'common/utils/format-date';

const User = model.define('User', {
  profileImg: {
    type: Sequelize.STRING,
    field: 'profile_img',
    allowNull: false,
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
  password: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  address: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  zipCode: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'zip_code',
  },
  dateOfBirth: {
    type: Sequelize.DATE,
    allowNull: true,
    field: 'date_of_birth',
  },
  phoneNum: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'phone_num',
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  getterMethods: {
    fullName: function () { // eslint-disable-line func-names, object-shorthand
      return `${this.firstName || ''} ${this.lastName || ''}`;
    },
  },
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
    toJSON: function () { // eslint-disable-line func-names, object-shorthand
      const environment = process.env.NODE_ENV === 'production' ? 'production' : 'staging';

      return {
        type: 'user',
        id: this.id.toString(),
        first_name: this.firstName,
        last_name: this.lastName,
        full_name: this.fullName,
        email: this.email,
        phone_num: this.phoneNum,
        profile_img: `https://s3.eu-central-1.amazonaws.com/flex-appeal/${environment}/profiles/${this.profileImg}`,
        created_at: formatDate(this.created_at),
      };
    },
    toSimpleJSON: function () { // eslint-disable-line func-names, object-shorthand
      const environment = process.env.NODE_ENV === 'production' ? 'production' : 'staging';

      return {
        type: 'user',
        id: this.id.toString(),
        full_name: this.fullName,
        profile_img: `https://s3.eu-central-1.amazonaws.com/flex-appeal/${environment}/profiles/${this.profileImg}`,
      };
    },
  },
});

export default User;
