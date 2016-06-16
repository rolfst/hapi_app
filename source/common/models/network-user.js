import Sequelize from 'sequelize';
import model from 'connection';

const NetworkUser = model.define('NetworkUser', {
  externalId: {
    type: Sequelize.INTEGER,
    field: 'external_id',
  },
  roleType: {
    type: Sequelize.STRING,
    field: 'role_type',
    defaultValue: 'EMPLOYEE',
  },
  unreadCount: {
    type: Sequelize.INTEGER,
    field: 'unread_count',
  },
  lastActive: {
    type: Sequelize.DATE,
    field: 'last_active',
  },
  deletedAt: {
    type: Sequelize.DATE,
    field: 'deleted_at',
  },
  userToken: {
    type: Sequelize.STRING,
    field: 'user_token',
  },
}, {
  tableName: 'network_user',
  timestamps: false,
});

export default NetworkUser;
