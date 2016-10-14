export default (dao) => ({
  id: dao.id.toString(),
  username: dao.username,
  password: dao.password,
});
