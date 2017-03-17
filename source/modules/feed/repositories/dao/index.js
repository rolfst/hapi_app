const FeedMessageModel = require('./message');
const LikeModel = require('./like');
const CommentModel = require('./comment');

module.exports = {
  Comment: CommentModel,
  FeedMessage: FeedMessageModel,
  Like: LikeModel,
};
