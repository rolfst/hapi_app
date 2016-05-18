import ExchangeComment from 'modules/flexchange/models/exchange-comment';

export function findCommentById(commentId) {
  return ExchangeComment
    .findById(commentId)
    .then(comment => {
      if (!comment) return Boom.notFound(`No comment found with id ${commentId}.`);

      return comment;
    });
}

export function createExchangeComment(exchangeId, { text, userId }) {
  return ExchangeComment.create({
    parentId: exchangeId,
    parentType: 'FlexAppeal\\Entities\\Exchange',
    text: text,
    createdBy: userId,
  });
}
