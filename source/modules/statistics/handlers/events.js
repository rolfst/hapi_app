import R from 'ramda';
import createError from '../../../shared/utils/create-error';
import * as responseUtil from '../../../shared/utils/response';
import * as eventService from '../services/event';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params, ...req.query };

    const handler = R.cond([
      [R.path(['params', 'viewName']), () => eventService.getCreatedMessages],
      [R.T, () => null], // this should never have passed the validation
    ])(req);

    if (!handler) throw createError('500');

    const stats = await handler(payload, message);

    return reply({ data: responseUtil.toSnakeCase(stats.payload) });
  } catch (err) {
    return reply(err);
  }
};
