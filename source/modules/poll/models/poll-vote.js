module.exports = (dao) => ({
  optionId: dao.optionId.toString(),
  userId: dao.userId ? dao.userId.toString() : null,
  pollId: dao.pollId.toString(),
});
