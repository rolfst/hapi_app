module.exports = (comment, creator) => {
  const creatorName = creator.fullName;
  const text = comment.text;

  return {
    text: `${creatorName} reageerde: ${text}`,
    data: { id: comment.messageId, type: 'message', track_name: 'message_comment' },
  };
};
