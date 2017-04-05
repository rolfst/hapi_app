const sequelize = require('sequelize');
const ActivityModel = require('./activity').Activity;
const NetworkModel = require('./network');
const UserModel = require('./user');
const TeamModel = require('./team');
const IntegrationModel = require('./integration');
const NetworkUserModel = require('./network-user');
const NetworkIntegrationModel = require('./network-service');
const TeamUserModel = require('./team-user');
const UserDeviceModel = require('./user-device');
const ObjectModel = require('./object');
const ObjectSeenModel = require('./objectseen');

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

ObjectSeenModel.belongsToMany(ObjectModel, {
  foreignKey: 'object_id',
  timestamps: false,
});

ObjectSeenModel.belongsToMany(UserModel, {
  foreignKey: 'user_id',
  timestamps: false,
});

exports.Activity = ActivityModel;
exports.Network = NetworkModel;
exports.User = UserModel;
exports.Team = TeamModel;
exports.Integration = IntegrationModel;
exports.NetworkUser = NetworkUserModel;
exports.TeamUser = TeamUserModel;
exports.UserDevice = UserDeviceModel;
exports.NetworkIntegration = NetworkIntegrationModel;
exports._Object = ObjectModel; // eslint-disable-line
exports.ObjectSeen = ObjectSeenModel;
