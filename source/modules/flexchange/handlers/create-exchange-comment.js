import { pick } from 'lodash';
import * as responseUtil from 'shared/utils/response';
import * as flexchangeService from '../services/flexchange';

const FILTER_PROPERTIES = ['start', 'end'];

export default async (req, reply) => {
  const message = { ...req.pre, ...req.auth };
  const payload = { ...pick(req.params, ['exchangeId']), ...pick(req.payload, ['text']) };
  payload.filter = pick(req.query, FILTER_PROPERTIES);

  try {
    const exchangeComment = await flexchangeService.getExchangeComment(payload, message);
    return reply({ success: true, data: responseUtil.serialize(exchangeComment) });
  } catch (err) {
    return reply(err);
  }
};
