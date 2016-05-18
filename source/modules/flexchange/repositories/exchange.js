import Boom from 'boom';
import { Exchange } from 'modules/flexchange/models'; // eslint-disable-line

export function findExchangeById(exchangeId) {
  return Exchange
    .findById(exchangeId)
    .then(exchange => {
      if (!exchange) return Boom.notFound(`No exchange found with id ${id}.`);

      return exchange;
    })
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

export function findExchangeById(id) {
  return Exchange
    .findById(id)
    .then(exchange => {
      if (!exchange) throw Boom.notFound(`No exchange found with id ${id}.`);

      return exchange;
    });
}
