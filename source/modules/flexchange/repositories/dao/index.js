const { ActivityTypes,
  Activity: ActivityModel } = require('../../../core/repositories/dao/activity');
const UserModel = require('../../../core/repositories/dao/user');
const TeamModel = require('../../../core/repositories/dao/team');
const NetworkModel = require('../../../core/repositories/dao/network');
const { exchangeTypes, Exchange: ExchangeModel } = require('./exchange');
const ExchangeCommentModel = require('./exchange-comment');
const ExchangeResponseModel = require('./exchange-response');
const ExchangeValueModel = require('./exchange-value');

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

exports.Exchange = ExchangeModel;
exports.ExchangeComment = ExchangeCommentModel;
exports.ExchangeResponse = ExchangeResponseModel;
exports.ExchangeValue = ExchangeValueModel;
