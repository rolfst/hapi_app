import {
  createExchangeComment,
  findCommentById,
} from 'modules/flexchange/repositories/comment';
import * as newCommentNotification from '../notifications/new-exchange-comment';

export default async (req, reply) => {
  try {
    const data = { text: req.payload.text, userId: req.auth.credentials.id };
    const createdExchangeComment = await createExchangeComment(req.params.exchangeId, data);
    const exchangeComment = await findCommentById(createdExchangeComment.id);

    newCommentNotification.send(exchangeComment);

    return reply({ success: true, data: exchangeComment.toJSON() });
  } catch (err) {
    return reply(err);
  }
};
