import { pick } from 'lodash';
import * as service from '../services/invite-user';
import * as responseUtil from 'common/utils/response';

const FILTER_PROPERTIES = ['start', 'end'];

export default async (req, reply) => {
  const { pre, auth, query } = req;
  const message = { ...pre, ...auth };
  const filter = pick(query, FILTER_PROPERTIES);

  try {
    const payload = { filter, ...req.payload, ...req.params };
    const invitedUser = await service.inviteUser(payload, message);

    return reply({
      success: true,
      data: responseUtil.serialize(invitedUser),
    });
  } catch (err) {
    return reply(err);
  }
};
