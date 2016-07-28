import Boom from 'boom';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { findExchangeById, createExchange } from 'modules/flexchange/repositories/exchange';
import { validateTeamIds } from 'common/repositories/team';
import { findAllUsersForNetwork } from 'common/repositories/network';
import { findUsersByTeamIds } from 'common/repositories/team';
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

  if (exchange.type === exchangeTypes.NETWORK) usersPromise = findAllUsersForNetwork(network);
  else if (exchange.type === exchangeTypes.TEAM) usersPromise = findUsersByTeamIds(exchangeValues);

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

    if (hasIntegration(network)) {
      // Execute integration logic with adapter
    }

    const { title, description, date, type, values } = req.payload;
    const parsedValues = values ? JSON.parse(values) : null;

    if (type === exchangeTypes.TEAM) {
      const isValid = await validateTeamIds(parsedValues, network.id);
      if (!isValid) throw Boom.badData('Incorrect values.');
    }

    const attributes = { title, description, date, type, values: parsedValues };
    const createdExchange = await createExchange(credentials.id, network.id, attributes);

    sendNotification(createdExchange, network, values, credentials);
    analytics.track(newExchangeEvent(req.pre.network, createdExchange));

    const response = await findExchangeById(createdExchange.id);

    return reply({ success: true, data: response.toJSON() });
  } catch (err) {
    console.log('Error creating exchange', err);
    return reply(err);
  }
};
