import Exchange from 'modules/flexchange/models/exchange';

export function findExchangeById(exchangeId) {
  return Exchange
    .findById(exchangeId)
    .then(exchange => {
      if (!exchange) return Boom.notFound(`No exchange found with id ${id}.`);

      return exchange;
    })
}

export function getExchangeValues(exchange) {
  //TODO
};
