import R from 'ramda';
import createError from '../../../shared/utils/create-error';
import * as responseUtil from '../../../shared/utils/response';
import * as eventService from '../services/event';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params, ...req.query };
    const viewEq = R.pathEq(['params', 'viewName']);

    const handler = R.cond([
      [viewEq('created_messages'), () => eventService.getCreatedMessages],
      [viewEq('created_shifts'), () => eventService.getCreatedShifts],
      [viewEq('approved_shifts'), () => eventService.getApprovedShifts],
      [R.T, () => null],
    ])(req);

    if (!handler) throw createError('404', 'View does not exist.');

    const stats = await handler(payload, message);

    return reply({ data: responseUtil.toSnakeCase(stats.payload) });
  } catch (err) {
    return reply(err);
  }
};
