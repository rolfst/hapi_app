import Boom from 'boom';
import moment from 'moment';
import { pick, includes } from 'lodash';
import camelCaseKeys from 'common/utils/camel-case-keys';
import { UserRoles } from 'common/services/permission';
import IntegrationNotFound from 'common/errors/integration-not-found';
import { findUsersByTeamIds, validateTeamIds } from 'common/repositories/team';
import { findAllUsersForNetwork } from 'common/repositories/network';
import { validateUserIds } from 'common/repositories/user';
import * as networkUtil from 'common/utils/network';
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
      'title', 'description', 'date',
      'type', 'shift_id', 'start_time',
      'end_time', 'values', 'team_id'
    );

    const data = camelCaseKeys(whitelist);

    if (data.startTime && data.endTime && moment(data.endTime).isBefore(data.startTime)) {
      throw Boom.badData('end_time should be after start_time');
    }

    if (data.shiftId && !networkUtil.hasIntegration(network)) {
      throw new IntegrationNotFound();
    }

    if (includes([exchangeTypes.TEAM, exchangeTypes.USER], data.type)) {
      let validator;
      if (data.type === exchangeTypes.TEAM) validator = validateTeamIds;
      if (data.type === exchangeTypes.USER) validator = validateUserIds;

      const isValid = validator ? await validator(data.values, network.id) : true;
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
    return reply(err);
  }
};
