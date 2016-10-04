import * as responseUtil from 'shared/utils/response';
import { findAllForUser } from 'modules/chat/repositories/conversation';

module.exports = async (req, reply) => {
  try {
    const conversations = await findAllForUser(req.auth.credentials);

    return reply({ data: responseUtil.serialize(conversations) });
  } catch (err) {
    return reply(err);
  }
};
