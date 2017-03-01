import R from 'ramda';
import * as service from '../services/flexchange';

export default async (req, reply) => {
  try {
    const message = { ...req.auth, ...req.pre };
    const payload = {
      ...R.omit(['shift_id', 'start_time', 'end_time', 'team_id'], req.payload),
      shiftId: req.payload.shift_id,
      startTime: req.payload.start_time,
      endTime: req.payload.end_time,
      teamId: req.payload.teamId,
    };

    const response = await service.createExchange(payload, message);

    return reply({ success: true, data: response.toJSON() });
  } catch (err) {
    return reply(err);
  }
};
