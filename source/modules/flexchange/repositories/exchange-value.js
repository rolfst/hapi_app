import ExchangeValue from '../models/exchange-value';

/**
 * Create values for exchange
 * @param {number} exchangeId - Id of the exchange
 * @param {array} values - The values to attach to the exchange
 * @method createValuesForExchange
 * @return {promise} Create exchange values promise
 */
export function createValuesForExchange(exchangeId, values) {
  const data = values.map(value => ({ exchangeId, value }));

  return ExchangeValue.bulkCreate(data);
}
