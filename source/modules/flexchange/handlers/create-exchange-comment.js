import { findNetworkById } from 'common/repositories/network';
import { createExchangeComment, findCommentById } from 'modules/flexchange/repositories/comment';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      // Execute integration logic with adapter
    }

    const data = { text: req.payload.text, userId: req.auth.credentials.id };

    createExchangeComment(req.params.exchangeId, data)
      .then(newExchangeComment => findCommentById(newExchangeComment.id))
      .then(exchangeComment => reply({ success: true, data: exchangeComment }))
      .catch(err => reply(err));
  });
};
