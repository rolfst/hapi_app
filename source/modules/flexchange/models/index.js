import ExchangeModel from 'modules/flexchange/models/exchange';
import ExchangeCommentModel from 'modules/flexchange/models/exchange-comment';
import UserModel from 'common/models/user';
import TeamModel from 'common/models/team';
import NetworkModel from 'common/models/network';

ExchangeCommentModel.belongsTo(UserModel, {
  foreignKey: 'created_by',
});

ExchangeModel.belongsToMany(ExchangeCommentModel, {
  foreignKey: 'parent_id',
});

ExchangeModel.belongsTo(UserModel, {
  foreignKey: 'user_id',
});

ExchangeModel.belongsTo(UserModel, {
  as: 'Approver',
  foreignKey: 'approved_by',
});

ExchangeModel.belongsTo(NetworkModel, {
  foreignKey: 'network_id',
});

UserModel.hasMany(ExchangeModel, {
  foreignKey: 'user_id',
});

NetworkModel.hasMany(ExchangeModel, {
  foreignKey: 'network_id',
});

ExchangeModel.belongsTo(UserModel, {
  as: 'ApprovedUser',
  foreignKey: 'approved_user',
});

TeamModel.belongsToMany(ExchangeModel, {
  foreignKey: 'value',
  otherKey: 'exchange_id',
  through: 'exchange_values',
  scope: { type: 'TEAM' },
  timestamps: false,
});

export const Exchange = ExchangeModel;
