import Boom from 'boom';
import _ from 'lodash';
import createAdapter from 'common/utils/create-adapter';
import hasIntegration from 'common/utils/network-has-integration';
import { findExchangesByShiftIds } from 'modules/flexchange/repositories/exchange';

export const mapShiftsWithExchanges = (shifts, exchanges) => {
  return shifts.map(shift => {
    const exchange = _.find(exchanges, { shiftId: parseInt(shift.id, 10) });

    return {
      ...shift,
      exchange_id: exchange ? exchange.id : null,
      team_id: exchange ? exchange.teamId : null,
    };
  });
};

export default async (req, reply) => {
  if (!hasIntegration(req.pre.network)) {
    throw Boom.forbidden('Network does not have an activated integration.');
  }

  try {
    const adapter = createAdapter(req.pre.network, req.auth.artifacts.integrations);
    const shifts = await adapter.myShifts(req.pre.network.externalId);

    const exchanges = await findExchangesByShiftIds(shifts.map(s => s.id));

    return reply({ data: mapShiftsWithExchanges(shifts, exchanges) });
  } catch (err) {
    return reply(err);
  }
};
