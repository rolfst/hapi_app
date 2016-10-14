import Sequelize from 'sequelize';
import { db as model } from '../../connections';

const NetworkUser = model.define('NetworkUser', {
  networkId: {
    type: Sequelize.INTEGER,
    field: 'network_id',
  },
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
  },
  bulkAdded: {
    type: Sequelize.INTEGER,
    field: 'bulk_added',
    defaultValue: 0,
  },
  externalId: {
    type: Sequelize.INTEGER,
    field: 'external_id',
  },
  invisibleUser: {
    type: Sequelize.BOOLEAN,
    field: 'invisible_user',
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
  isWelcomed: {
    type: Sequelize.INTEGER,
    field: 'is_welcomed',
  },
  deletedAt: {
    type: Sequelize.DATE,
    field: 'deleted_at',
    defaultValue: null,
  },
  userToken: {
    type: Sequelize.STRING,
    field: 'user_token',
  },
}, {
  tableName: 'network_user',
  timestamps: true,
  createdAt: false,
  updatedAt: false,
});

export default NetworkUser;
