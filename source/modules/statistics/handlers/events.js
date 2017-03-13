import createError from '../../../shared/utils/create-error';
import * as responseUtil from '../../../shared/utils/response';
import * as eventService from '../services/event';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params, ...req.query };

    let stats;

    if (req.params.viewName === 'created_message') {
      stats = await eventService.getCreatedMessages(payload, message);
    } else {
      throw createError('500'); // this should never have passed the validation
    }


    return reply({ data: responseUtil.toSnakeCase(stats.payload) });
  } catch (err) {
    return reply(err);
  }
};
