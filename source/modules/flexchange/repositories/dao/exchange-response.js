const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');
const dateUtils = require('../../../../shared/utils/date');
const { User } = require('../../../core/repositories/dao');

const ExchangeResponse = model.define('ExchangeResponse', {
  userId: {
    type: Sequelize.INTEGER,
    field: 'user_id',
    allowNull: false,
  },
  exchangeId: {
    type: Sequelize.INTEGER,
    field: 'exchange_id',
    allowNull: false,
  },
  response: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  approved: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'exchange_responses',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  defaultScope: {
    include: [{ model: User }],
  },
  instanceMethods: {
    toJSON: function () { // eslint-disable-line func-names, object-shorthand
      let output = {
        type: 'exchange_response',
        response: !!this.response,
        is_approved: this.approved !== null ? !!this.approved : null,
        created_at: dateUtils.toISOString(this.created_at),
      };

      if (this.User) {
        output = Object.assign(output, {
          user: this.User.toSimpleJSON(),
        });
      }

      return output;
    },
  },
});

module.exports = ExchangeResponse;
