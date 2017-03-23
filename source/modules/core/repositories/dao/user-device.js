const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

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

module.exports = UserDevice;
