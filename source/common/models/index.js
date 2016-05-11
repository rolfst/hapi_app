import NetworkModel from 'common/models/network';
import UserModel from 'common/models/user';
import IntegrationModel from 'common/models/integration';

NetworkModel.belongsToMany(IntegrationModel, {
  foreignKey: 'network_id',
  otherKey: 'service_id',
  through: 'network_service',
  timestamps: false,
});

NetworkModel.belongsToMany(UserModel, {
  foreignKey: 'network_id',
  otherKey: 'user_id',
  through: 'network_user',
  timestamps: false,
});

export const Network = NetworkModel;
export const Integration = IntegrationModel;
export const User = UserModel;
