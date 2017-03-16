const Sequelize = require('sequelize');
const model = require('../../../../shared/configs/sequelize');

const ExchangeValue = model.define('ExchangeValue', {
  exchangeId: {
    type: Sequelize.INTEGER,
    field: 'exchange_id',
    allowNull: false,
  },
  value: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'exchange_values',
  timestamps: false,
  instanceMethods: {
    toJSON: function () { // eslint-disable-line func-names, object-shorthand
      return {
        type: 'exchange_value',
        value: this.value,
      };
    },
  },
});

module.exports = ExchangeValue;
