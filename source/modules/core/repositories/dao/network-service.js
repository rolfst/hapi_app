const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

const NetworkIntegration = model.define('NetworkIntegration', {
  networkId: {
    type: Sequelize.INTEGER,
    field: 'network_id',
  },
  serviceId: {
    type: Sequelize.INTEGER,
    field: 'service_id',
  },
  importedAt: {
    type: Sequelize.DATE,
    field: 'imported_at',
    defaultValue: null,
  },
}, {
  tableName: 'network_service',
  timestamps: true,
  createdAt: false,
  updatedAt: false,
});

module.exports = NetworkIntegration;
