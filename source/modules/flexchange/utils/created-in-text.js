import { exchangeTypes } from 'modules/flexchange/models/exchange';

export default (exchange) => {
  let exchangeValueOutput;

  if (exchange.type === exchangeTypes.NETWORK) {
    exchangeValueOutput = { type: 'network', id: exchange.ExchangeValues[0].value };
  } else {
    const valueIds = exchange.ExchangeValues.map(v => v.value);
    exchangeValueOutput = { type: exchange.type.toLowerCase(), ids: valueIds };
  }

  return exchangeValueOutput;
};
