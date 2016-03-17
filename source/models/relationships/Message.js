export default (Message, User) => {
  Message.belongsTo(User, {
    foreignKey: 'created_by',
  });
};
