import sequelize from 'sequelize';
import ActivityModel from './activity';
import NetworkModel from './network';
import UserModel from './user';
import TeamModel from './team';
import IntegrationModel from './integration';
import NetworkUserModel from './network-user';
import NetworkIntegrationModel from './network-service';
import TeamUserModel from './team-user';
import UserDeviceModel from './user-device';
import ObjectModel from './object';

ActivityModel.belongsTo(UserModel, {
  foreignKey: 'user_id',
});

NetworkModel.belongsTo(UserModel, {
  as: 'SuperAdmin',
  foreignKey: 'user_id',
});

NetworkModel.hasMany(TeamModel, {
  foreignKey: 'network_id',
});

NetworkModel.belongsToMany(IntegrationModel, {
  foreignKey: 'network_id',
  otherKey: 'service_id',
  through: NetworkIntegrationModel,
  timestamps: false,
});

NetworkModel.belongsToMany(UserModel, {
  foreignKey: 'network_id',
  otherKey: 'user_id',
  through: NetworkUserModel,
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

export const Activity = ActivityModel;
export const Network = NetworkModel;
export const User = UserModel;
export const Team = TeamModel;
export const Integration = IntegrationModel;
export const NetworkUser = NetworkUserModel;
export const TeamUser = TeamUserModel;
export const UserDevice = UserDeviceModel;
export const NetworkIntegration = NetworkIntegrationModel;
export const _Object = ObjectModel;