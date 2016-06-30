import { createExchange } from 'modules/flexchange/repositories/exchange';
import { createValuesForExchange } from 'modules/flexchange/repositories/exchange-value';
import { findAllUsersForNetwork } from 'common/repositories/network';
import { findUsersByTeamIds } from 'common/repositories/team';
import { findUsersByIds } from 'common/repositories/user';
import hasIntegration from 'common/utils/network-has-integration';
import analytics from 'common/services/analytics';
import newExchangeEvent from 'common/events/new-exchange-event';
import * as createdByAdminNotification from '../notifications/exchange-created-by-admin';
import * as createdNotification from '../notifications/exchange-created';
import { roles } from 'common/services/permission';
import excludeUser from 'common/utils/exclude-users';

export const sendNotification = async (exchange, network, exchangeValues, loggedUser) => {
  const { roleType } = network.NetworkUser;
  let usersPromise;

  if (exchange.type === 'ALL') usersPromise = findAllUsersForNetwork(network);
  else if (exchange.type === 'TEAM') usersPromise = findUsersByTeamIds(exchangeValues);
  else if (exchange.type === 'USER') usersPromise = findUsersByIds(exchangeValues);

  const users = await usersPromise;
  const usersToNotify = excludeUser(users, loggedUser);

  if (roleType === roles.EMPLOYEE) {
    createdNotification.send(usersToNotify, exchange);
  } else if (roleType === roles.ADMIN) {
    createdByAdminNotification.send(usersToNotify, exchange);
  }
};

export default async (req, reply) => {
  try {
    const { credentials } = req.auth;
    const { network } = req.pre;
    let exchangeValues;

    if (hasIntegration(network)) {
      // Execute integration logic with adapter
    }

    const newExchange = await createExchange(credentials.id, network.id, req.payload);

    if (['TEAM', 'USER'].includes(newExchange.type)) {
      exchangeValues = JSON.parse(req.payload.values);
      createValuesForExchange(newExchange.id, exchangeValues);
    }

    sendNotification(newExchange, network, exchangeValues, credentials);

    analytics.track(newExchangeEvent(req.pre.network, newExchange));

    return reply({ success: true, data: newExchange });
  } catch (err) {
    console.log('Error creating exchange', err);
    return reply(err);
  }
};
