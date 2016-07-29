import Sequelize from 'sequelize';
import model from 'connection';
import formatDate from 'common/utils/format-date';
import { User } from 'common/models';
import { Exchange } from 'modules/flexchange/models';
import {
  incrementExchangeAcceptCount,
  incrementExchangeDeclineCount,
  decrementExchangeAcceptCount,
  decrementExchangeDeclineCount,
} from 'modules/flexchange/repositories/exchange';

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
  hooks: {
    afterCreate: function (exchangeResponseModel) { // eslint-disable-line func-names, object-shorthand, max-len
      return Exchange.findById(exchangeResponseModel.exchangeId).then(exchange => {
        if (exchangeResponseModel.response) {
          return incrementExchangeAcceptCount(exchange);
        }

        return incrementExchangeDeclineCount(exchange);
      });
    },
    afterDestroy: function (exchangeResponseModel) { // eslint-disable-line func-names, object-shorthand, max-len
      exchangeResponseModel.getExchange().then(exchange => {
        if (exchangeResponseModel.response) {
          return decrementExchangeAcceptCount(exchange);
        }

        return decrementExchangeDeclineCount(exchange);
      });
    },
  },
  instanceMethods: {
    toJSON: function () { // eslint-disable-line func-names, object-shorthand
      let output = {
        type: 'exchange_response',
        response: !!this.response,
        is_approved: this.approved !== null ? !!this.approved : null,
        created_at: formatDate(this.created_at),
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

export default ExchangeResponse;
