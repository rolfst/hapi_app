import Boom from 'boom';
import moment from 'moment';
import { pick } from 'lodash';
import camelCaseKeys from 'common/utils/camel-case-keys';
import { UserRoles } from 'common/services/permission';
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

  if (roleType === UserRoles.EMPLOYEE) {
    createdNotification.send(usersToNotify, exchange);
  } else if (roleType === UserRoles.ADMIN) {
    createdByAdminNotification.send(usersToNotify, exchange);
  }
};

export default async (req, reply) => {
  try {
    const { credentials } = req.auth;
    const { network } = req.pre;

    const whitelist = pick(req.payload,
      'title', 'description', 'date', 'type', 'shift_id', 'start_time', 'end_time', 'values'
    );

    const data = camelCaseKeys(whitelist);

    if (data.startTime && data.endTime && moment(data.endTime).isBefore(data.startTime)) {
      throw Boom.badData('end_time should be after start_time');
    }

    if (data.shiftId && !hasIntegration(network)) {
      throw IntegrationNotFound;
    }

    if (data.type === exchangeTypes.TEAM) {
      const isValid = await validateTeamIds(data.values, network.id);
      if (!isValid) throw Boom.badData('Incorrect values.');
    }

    const createdExchange = await createExchange(credentials.id, network.id, {
      ...data,
      date: moment(req.payload.date).format('YYYY-MM-DD'),
    });

    sendNotification(createdExchange, network, data.values, credentials);
    analytics.track(newExchangeEvent(network, createdExchange));

    const response = await findExchangeById(createdExchange.id);

    return reply({ success: true, data: response.toJSON() });
  } catch (err) {
    console.log('Error creating exchange', err);
    return reply(err);
  }
};
