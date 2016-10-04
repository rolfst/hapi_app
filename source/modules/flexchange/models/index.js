import { ActivityTypes } from '../../../shared/models/activity';
import UserModel from '../../../shared/models/user';
import ActivityModel from '../../../shared/models/activity';
import TeamModel from '../../../shared/models/team';
import NetworkModel from '../../../shared/models/network';
import { exchangeTypes } from '../models/exchange';
import ExchangeModel from '../models/exchange';
import ExchangeCommentModel from '../models/exchange-comment';
import ExchangeResponseModel from '../models/exchange-response';
import ExchangeValueModel from '../models/exchange-value';

ExchangeResponseModel.belongsTo(UserModel, {
  foreignKey: 'user_id',
});

ExchangeResponseModel.belongsTo(ExchangeModel, {
  foreignKey: 'exchange_id',
});

ExchangeCommentModel.belongsTo(UserModel, {
  foreignKey: 'created_by',
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
