import sequelize from 'sequelize';
import ActivityModel from 'shared/models/activity';
import NetworkModel from 'shared/models/network';
import UserModel from 'shared/models/user';
import TeamModel from 'shared/models/team';
import IntegrationModel from 'shared/models/integration';
import NetworkUserModel from 'shared/models/network-user';
import TeamUserModel from 'shared/models/team-user';
import UserDeviceModel from 'shared/models/user-device';

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
  through: 'network_service',
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
