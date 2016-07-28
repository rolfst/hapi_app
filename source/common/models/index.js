import sequelize from 'sequelize';
import NetworkModel from 'common/models/network';
import UserModel from 'common/models/user';
import TeamModel from 'common/models/team';
import IntegrationModel from 'common/models/integration';
import NetworkUserModel from 'common/models/network-user';
import UserDeviceModel from 'common/models/user-device';

NetworkModel.belongsTo(UserModel, {
  as: 'SuperAdmin',
  foreignKey: 'user_id',
});

NetworkModel.belongsToMany(IntegrationModel, {
  foreignKey: 'network_id',
  otherKey: 'service_id',
  through: 'network_service',
  timestamps: false,
});

NetworkModel.belongsToMany(UserModel, {
  foreignKey: 'network_id',
  otherKey: 'user_id',
  through: NetworkUserModel,
  scope: {
    deletedAt: { $ne: null },
  },
  timestamps: false,
});

NetworkModel.belongsToMany(UserModel, {
  as: 'Admins',
  foreignKey: 'network_id',
  otherKey: 'user_id',
  through: NetworkUserModel,
  scope: sequelize.where(sequelize.col('NetworkUser.role_type'), 'ADMIN'),
  timestamps: false,
});

UserModel.belongsToMany(NetworkModel, {
  foreignKey: 'user_id',
  otherKey: 'network_id',
  through: NetworkUserModel,
  timestamps: false,
});

UserModel.belongsToMany(TeamModel, {
  foreignKey: 'user_id',
  otherKey: 'team_id',
  through: 'team_user',
  timestamps: false,
});

TeamModel.belongsToMany(UserModel, {
  foreignKey: 'team_id',
  otherKey: 'user_id',
  through: 'team_user',
  timestamps: false,
});

export const Network = NetworkModel;
export const User = UserModel;
export const Team = TeamModel;
export const Integration = IntegrationModel;
export const NetworkUser = NetworkUserModel;
export const UserDevice = UserDeviceModel;
