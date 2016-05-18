import Boom from 'boom';
import { Exchange, ExchangeResponse } from 'modules/flexchange/models'; // eslint-disable-line
import { User } from 'common/models';

export function findExchangeById(exchangeId) {
  return Exchange
    .findById(exchangeId, { include: [{ model: User, as: 'ApprovedUser' }] })
    .then(exchange => {
      if (!exchange) return Boom.notFound(`No exchange found with id ${exchangeId}.`);

      return exchange;
    });
}

export function findExchangesByUser(user) {
  return user.getExchanges();
}

export function findExchangesByNetwork(network) {
  return network.getExchanges();
}

export function findExchangesByTeam(team) {
  return team.getExchanges();
}

export function deleteExchangeById(id) {
  return findExchangeById(id)
    .then(exchange => exchange.destroy());
}

export function createExchange(userId, networkId, payload) {
  const { title, description, date, type } = payload;

  return Exchange
    .create({ userId, networkId, title, description, date, type });
}
