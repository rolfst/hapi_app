import { Exchange } from 'modules/flexchange/models'; // eslint-disable-line

export function findExchangesByUser(user) {
  return user.getExchanges();
}

export function findExchangesByNetwork(network) {
  return network.getExchanges();
}

export function findExchangesByTeam(team) {
  return team.getExchanges();
}
