import Boom from 'boom';
import { Exchange, ExchangeResponse } from 'modules/flexchange/models';
import { User } from 'common/models';

/**
 * Find a specific exchange by id
 * @param {number} exchangeId - Id of exchange being looked for
 * @method findExchangeById
 * @return {promise} Find exchange promise
 */
export function findExchangeById(exchangeId) {
  return Exchange
    .findById(exchangeId,
    {
      include: [
        { model: User, as: 'ApprovedUser' },
        { model: ExchangeResponse },
      ],
    })
    .then(exchange => {
      if (!exchange) return Boom.notFound(`No exchange found with id ${exchangeId}.`);

      return exchange;
    });
}

/**
 * Find exchanges by user
 * @param {User} user - User we want the exchanges from
 * @method findExchangesByUser
 * @return {promise} Get exchanges promise
 */
export function findExchangesByUser(user) {
  return user.getExchanges();
}

/**
 * Find exchange by network
 * @param {Network} network - Netwerk we want the exchanges from
 * @method findExchangesByNetwork
 * @return {promise} Get exchanges promise
 */
export function findExchangesByNetwork(network) {
  return network.getExchanges();
}

/**
 * Find exchanges by team
 * @param {Team} team - Team we want the exchanges from
 * @method findExchangesByTeam
 * @return {promise} Get exchanges promise
 */
export function findExchangesByTeam(team) {
  return team.getExchanges();
}

/**
 * Delete a specific exchange by id
 * @param {number} exchangeId - Id of exchange to be deleted
 * @method deleteExchangeById
 * @return {promise} Delete exchange promise
 */
export function deleteExchangeById(exchangeId) {
  return findExchangeById(exchangeId)
    .then(exchange => exchange.destroy());
}

/**
 * Create a new exchange
 * @param {number} userId - Id of the user placing the exchange
 * @param {number} networkId - Id of the network the exchange is being placed in
 * @param {object} payload - Object containing payload data
 * @method createExchange
 * @return {promise} Create exchange promise
 */
export function createExchange(userId, networkId, payload) {
  const { title, description, date, type } = payload;

  return Exchange
    .create({ userId, networkId, title, description, date, type });
}

/**
 * Update an existing exchange by id
 * @param {number} exchangeId - Id of the exchange being updated
 * @param {object} payload - Objecting containing payload data
 * @method updateExchangeById
 * @return {promise} Update exchange promise
 */
export function updateExchangeById(exchangeId, payload) {
  const { title, description } = payload;

  return findExchangeById(exchangeId)
    .then(exchange => exchange.update({ title, description }));
}
