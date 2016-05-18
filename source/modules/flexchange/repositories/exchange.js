import { ExchangeModel } from 'modules/flexchange/models'; // eslint-disable-line

export function findExchangesByUser(user) {
  return user.getExchanges();
}
