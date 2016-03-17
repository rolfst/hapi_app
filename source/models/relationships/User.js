export default (User, Conversation) => {
  User.belongsToMany(Conversation, {
    as: 'conversations',
    foreignKey: 'user_id',
    otherKey: 'conversation_id',
    through: 'conversation_user',
    timestamps: false,
  });
};
