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
