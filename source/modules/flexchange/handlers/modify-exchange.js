import { pick } from 'lodash';
import * as flexchangeService from '../services/flexchange';

const services = {
  accept: flexchangeService.acceptExchange,
  decline: flexchangeService.declineExchange,
  approve: flexchangeService.approveExchange,
  reject: flexchangeService.rejectExchange,
};

export default async (req, reply) => {
  const params = pick(req.params, ['exchangeId']);
  const reqPayload = pick(req.payload, ['action', 'user_id']);
  const payload = { ...params, ...reqPayload };
  const { pre, auth } = req;

  try {
    const actionHook = services[payload.action];
    const message = { ...pre, ...auth };
    const updatedExchange = await actionHook(payload, message);

    return reply({ success: true, data: updatedExchange.toJSON() });
  } catch (err) {
    console.log('Error modifying exchange ${payload.exchangeId}', err);
    return reply(err);
  }
};
