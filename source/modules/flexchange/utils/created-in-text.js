import { exchangeTypes } from '../models/exchange';

export default (exchange) => {
  let exchangeValueOutput;

  if (exchange.type === exchangeTypes.NETWORK) {
    exchangeValueOutput = { type: 'network', id: exchange.ExchangeValues[0].value };
  } else if (exchange.type === exchangeTypes.TEAM) {
    const valueIds = exchange.ExchangeValues.map(v => v.value);
    exchangeValueOutput = { type: exchange.type.toLowerCase(), ids: valueIds };
  } else if (exchange.type === exchangeTypes.USER && exchange.shiftId !== null) {
    exchangeValueOutput = { type: 'team', ids: [exchange.teamId] };
  }

  return exchangeValueOutput;
};
