import ExchangeValue from 'modules/flexchange/models/exchange-value';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { findNetworkById } from 'common/repositories/network';
import { findTeamsByIds } from 'common/repositories/team';
import { findUsersByIds } from 'common/repositories/user';

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

export function findValuesForExchange(values, type) {
  const ids = values.map(value => value.value);

  switch (type) {
    case exchangeTypes.ALL:
      return findNetworkById(ids[0]);
    case exchangeTypes.TEAM:
      return findTeamsByIds(ids);
    case exchangeTypes.USER:
      return findUsersByIds(ids);
    default:
      throw new Error(`Invalid exchange type "${type}"`);
  }
}
