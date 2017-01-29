export default (dao) => ({
  optionId: dao.optionId.toString(),
  userId: dao.userId ? dao.userId.toString() : null,
});
