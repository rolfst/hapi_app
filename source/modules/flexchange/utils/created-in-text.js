import { exchangeTypes } from '../models/exchange';

export default (exchange) => {
  let exchangeValueOutput;

  if (exchange.type === exchangeTypes.NETWORK) {
    exchangeValueOutput = { type: 'network', id: exchange.ExchangeValues[0].value.toString() };
  } else if (exchange.type === exchangeTypes.TEAM) {
    const valueIds = exchange.ExchangeValues.map(v => v.value.toString());
    exchangeValueOutput = { type: exchange.type.toLowerCase(), ids: valueIds };
  } else if (exchange.type === exchangeTypes.USER && exchange.shiftId !== null) {
    exchangeValueOutput = { type: 'team', ids: [
      exchange.teamId ? exchange.teamId.toString() : null,
    ] };
  } else if (exchange.type === exchangeTypes.USER && exchange.shiftId === null) {
    exchangeValueOutput = { type: 'network', id: exchange.networkId.toString() };
  }

  return exchangeValueOutput;
};
