import Boom from 'boom';
import { roles } from 'common/services/permission';
import IntegrationNotFound from 'common/errors/integration-not-found';
import { validateTeamIds } from 'common/repositories/team';
import { findAllUsersForNetwork } from 'common/repositories/network';
import { findUsersByTeamIds } from 'common/repositories/team';
import hasIntegration from 'common/utils/network-has-integration';
import analytics from 'common/services/analytics';
import newExchangeEvent from 'common/events/new-exchange-event';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { findExchangeById, createExchange } from 'modules/flexchange/repositories/exchange';
import * as createdByAdminNotification from '../notifications/exchange-created-by-admin';
import * as createdNotification from '../notifications/exchange-created';

export const sendNotification = async (exchange, network, exchangeValues, loggedUser) => {
  const { roleType } = network.NetworkUser;
  let usersPromise;

  if (exchange.type === exchangeTypes.NETWORK) usersPromise = findAllUsersForNetwork(network);
  else if (exchange.type === exchangeTypes.TEAM) usersPromise = findUsersByTeamIds(exchangeValues);

  const users = await usersPromise;
  const usersToNotify = users.filter(u => u.id !== loggedUser.id);

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
    const { title, description, date, type, values } = req.payload;
    const shiftId = req.payload.shift_id;

    if (shiftId && !hasIntegration(network)) {
      throw IntegrationNotFound;
    }

    if (type === exchangeTypes.TEAM) {
      const isValid = await validateTeamIds(values, network.id);
      if (!isValid) throw Boom.badData('Incorrect values.');
    }

    const attributes = { title, description, date, type, shiftId, values };
    const createdExchange = await createExchange(credentials.id, network.id, attributes);

    sendNotification(createdExchange, network, values, credentials);
    analytics.track(newExchangeEvent(network, createdExchange));

    const response = await findExchangeById(createdExchange.id);

    return reply({ success: true, data: response.toJSON() });
  } catch (err) {
    console.log('Error creating exchange', err);
    return reply(err);
  }
};
