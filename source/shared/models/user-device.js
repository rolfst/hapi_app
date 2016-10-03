import Sequelize from 'sequelize';
import { db as model } from 'connections';

const UserDevice = model.define('UserDevice', {
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
  deviceId: {
    type: Sequelize.STRING,
    allowNull: false,
    field: 'device_id',
  },
  deviceName: {
    type: Sequelize.STRING,
    allowNull: false,
    field: 'device_name',
  },
}, {
  tableName: 'user_devices',
  timestamps: false,
});

export default UserDevice;
