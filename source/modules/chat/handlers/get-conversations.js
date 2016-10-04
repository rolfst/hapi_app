import { includes } from 'lodash';
import * as responseUtil from '../../../shared/utils/response';
import parseIncludes from '../../../shared/utils/parse-includes';
import { Message } from '../models';
import { findAllForUser } from '../repositories/conversation';

module.exports = async (req, reply) => {
  const queryIncludes = parseIncludes(req.query);
  const modelIncludes = [];

  if (includes(queryIncludes, 'messages')) {
    modelIncludes.push({ model: Message });
  }

  try {
    const conversations = await findAllForUser(req.auth.credentials, modelIncludes);

    return reply({ data: responseUtil.serialize(conversations) });
  } catch (err) {
    return reply(err);
  }
};
