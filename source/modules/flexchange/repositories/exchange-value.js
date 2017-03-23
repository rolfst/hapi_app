const R = require('ramda');
const createExchangeValueModel = require('../models/exchange-value');
const ExchangeValue = require('./dao/exchange-value');

/**
 * @module modules/flexchange/repositories/exchangeValue
 */

/**
 * Create values for exchange
 * @param {string} exchangeId - Id of the exchange
 * @param {array} values - The values to attach to the exchange
 * @method createValuesForExchange
 * @return {external:Promise} Create exchange values promise
 */
const createValuesForExchange = (exchangeId, values) => ExchangeValue
  .bulkCreate(R.map((value) => ({ exchangeId, value }), values));

const findAllWhere = (whereConstraint) => ExchangeValue
  .findAll({ where: whereConstraint })
  .then(R.map(createExchangeValueModel));

exports.createValuesForExchange = createValuesForExchange;
exports.findAllWhere = findAllWhere;
