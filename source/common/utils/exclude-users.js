export default (users, user) => {
  return users.filter(u => u.id !== user.id);
};
