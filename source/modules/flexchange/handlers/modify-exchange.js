import { pick } from 'lodash';
import * as Logger from '../../../shared/services/logger';
import * as flexchangeService from '../services/flexchange';

const logger = Logger.createLogger('FLEXCHANGE/handler/modifyExchange');

const services = {
  accept: flexchangeService.acceptExchange,
  decline: flexchangeService.declineExchange,
  approve: flexchangeService.approveExchange,
  reject: flexchangeService.rejectExchange,
};

export default async (req, reply) => {
  try {
    const params = pick(req.params, ['exchangeId']);
    const reqPayload = pick(req.payload, ['action', 'user_id']);
    const payload = { ...params, ...reqPayload };

    const actionHook = services[payload.action];
    const message = { ...req.pre, ...req.auth };

    logger.info('Updating exchange', { message, payload });
    const updatedExchange = await actionHook(payload, message);

    return reply({ success: true, data: updatedExchange.toJSON() });
  } catch (err) {
    return reply(err);
  }
};
