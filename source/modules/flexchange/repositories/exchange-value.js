import R from 'ramda';
import createExchangeValueModel from '../models/exchange-value';
import ExchangeValue from './dao/exchange-value';

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
export const createValuesForExchange = (exchangeId, values) => ExchangeValue
  .bulkCreate(R.map(value => ({ exchangeId, value }), values));

export const findAllWhere = (whereConstraint) => ExchangeValue
  .findAll({ where: whereConstraint })
  .then(R.map(createExchangeValueModel));
