module.exports = (dao) => ({
  id: dao.id.toString(),
  exchangeId: dao.exchangeId.toString(),
  value: dao.value.toString(),
});
