import { pick } from 'lodash';
import camelCaseKeys from '../../../shared/utils/camel-case-keys';
import * as service from '../services/flexchange';

export default async (req, reply) => {
  try {
    const message = { ...req.auth, ...req.pre };

    const whitelist = pick(req.payload,
      'title', 'description', 'date',
      'type', 'shift_id', 'start_time',
      'end_time', 'values', 'team_id'
    );

    const payload = camelCaseKeys(whitelist);

    const response = await service.createExchange(payload, message);

    return reply({ success: true, data: response.toJSON() });
  } catch (err) {
    return reply(err);
  }
};
