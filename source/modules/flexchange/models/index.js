import ExchangeModel from 'modules/flexchange/models/exchange';
import UserModel from 'common/models/user';
import NetworkModel from 'common/models/network';

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

export const Exchange = ExchangeModel;
