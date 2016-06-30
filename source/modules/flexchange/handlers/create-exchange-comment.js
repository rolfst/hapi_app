import {
  createExchangeComment,
  findCommentById,
} from 'modules/flexchange/repositories/comment';
import hasIntegration from 'common/utils/network-has-integration';
import * as newCommentNotification from '../notifications/new-exchange-comment';

export default async (req, reply) => {
  if (hasIntegration(req.pre.network)) {
    // Execute integration logic with adapter
  }

  const data = { text: req.payload.text, userId: req.auth.credentials.id };

  const createdExchangeComment = await createExchangeComment(req.params.exchangeId, data);
  const exchangeComment = await findCommentById(createdExchangeComment.id);

  newCommentNotification.send(exchangeComment);

  return reply({ success: true, data: exchangeComment.toJSON() });
};
