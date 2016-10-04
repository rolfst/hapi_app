import moment from 'moment';
import { pick, includes } from 'lodash';
import createError from '../../../shared/utils/create-error';
import camelCaseKeys from '../../../shared/utils/camel-case-keys';
import { UserRoles } from '../../../shared/services/permission';
import { findUsersByTeamIds, validateTeamIds } from '../../core/repositories/team';
import { findAllUsersForNetwork } from '../../core/repositories/network';
import { validateUserIds } from '../../core/repositories/user';
import * as networkUtil from '../../../shared/utils/network';
import analytics from '../../../shared/services/analytics';
import newExchangeEvent from '../../../shared/events/new-exchange-event';
import { exchangeTypes } from '../models/exchange';
import { findExchangeById, createExchange } from '../repositories/exchange';
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
      throw createError('422', 'Attribute end_time should be after start_time');
    }

    if (data.shiftId && !networkUtil.hasIntegration(network)) {
      throw createError('10001');
    }

    if (includes([exchangeTypes.TEAM, exchangeTypes.USER], data.type)) {
      let validator;
      if (data.type === exchangeTypes.TEAM) validator = validateTeamIds;
      if (data.type === exchangeTypes.USER) validator = validateUserIds;

      const isValid = validator ? await validator(data.values, network.id) : true;
      if (!isValid) throw createError('422', 'Specified invalid ids for type.');
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
