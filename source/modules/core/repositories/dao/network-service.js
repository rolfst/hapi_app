import Sequelize from 'sequelize';
import { db as model } from '../../connections';

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

export default NetworkIntegration;
