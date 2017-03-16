const FeedMessageModel = require('./message');
const LikeModel = require('./like');
const CommentModel = require('./comment');

module.exports = {
  FeedMessage: FeedMessageModel,
  Like: LikeModel,
  Comment: CommentModel,
};
