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
export function createValuesForExchange(exchangeId, values) {
  const data = values.map(value => ({ exchangeId, value }));

  return ExchangeValue.bulkCreate(data);
}

export const findAllWhere = (whereConstraint) => ExchangeValue
  .findAll({ where: whereConstraint })
  .then(R.map(createExchangeValueModel));
