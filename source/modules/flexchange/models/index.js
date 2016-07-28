import { exchangeTypes } from 'modules/flexchange/models/exchange';
import ExchangeModel from 'modules/flexchange/models/exchange';
import ExchangeCommentModel from 'modules/flexchange/models/exchange-comment';
import ExchangeResponseModel from 'modules/flexchange/models/exchange-response';
import ExchangeValueModel from 'modules/flexchange/models/exchange-value';
import UserModel from 'common/models/user';
import TeamModel from 'common/models/team';
import NetworkModel from 'common/models/network';

ExchangeResponseModel.belongsTo(UserModel, {
  foreignKey: 'user_id',
});

ExchangeResponseModel.belongsTo(ExchangeModel, {
  foreignKey: 'exchange_id',
});

ExchangeCommentModel.belongsTo(UserModel, {
  foreignKey: 'created_by',
});

ExchangeModel.hasMany(ExchangeValueModel, {
  foreignKey: 'exchange_id',
});

ExchangeModel.hasMany(ExchangeResponseModel, {
  foreignKey: 'exchange_id',
});

ExchangeModel.hasOne(ExchangeResponseModel, {
  as: 'ResponseStatus',
  foreignKey: 'exchange_id',
});

ExchangeModel.belongsToMany(ExchangeCommentModel, {
  foreignKey: 'parent_id',
  otherKey: 'id',
  through: 'comments',
  as: 'Comments',
  scope: { parent_type: 'FlexAppeal\\Entities\\Exchange' },
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
  scope: { type: exchangeTypes.TEAM },
  timestamps: false,
});

export const Exchange = ExchangeModel;
export const ExchangeComment = ExchangeCommentModel;
export const ExchangeResponse = ExchangeResponseModel;
export const ExchangeValue = ExchangeValueModel;
