import { ActivityTypes } from '../../../repositories/dao/activity';
import UserModel from '../../../repositories/dao/user';
import ActivityModel from '../../../repositories/dao/activity';
import TeamModel from '../../../repositories/dao/team';
import NetworkModel from '../../../repositories/dao/network';
import { exchangeTypes } from './exchange';
import ExchangeModel from './exchange';
import ExchangeCommentModel from './exchange-comment';
import ExchangeResponseModel from './exchange-response';
import ExchangeValueModel from './exchange-value';

ExchangeResponseModel.belongsTo(UserModel, {
  foreignKey: 'user_id',
});

ExchangeResponseModel.belongsTo(ExchangeModel, {
  foreignKey: 'exchange_id',
});

ExchangeCommentModel.belongsTo(UserModel, {
  foreignKey: 'user_id',
});

ExchangeModel.hasMany(ActivityModel, {
  foreignKey: 'source_id',
  scope: {
    activity_type: {
      $in: [
        ActivityTypes.EXCHANGE_ACCEPTED,
        ActivityTypes.EXCHANGE_REJECTED,
        ActivityTypes.EXCHANGE_APPROVED,
        ActivityTypes.EXCHANGE_CREATED,
        ActivityTypes.EXCHANGE_COMMENT,
      ],
    },
  },
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

ExchangeModel.hasMany(ExchangeCommentModel, {
  foreignKey: 'exchange_id',
  as: 'Comments',
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
