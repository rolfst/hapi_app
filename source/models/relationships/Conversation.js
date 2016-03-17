export default (Conversation, User, Message) => {
  Conversation.belongsToMany(User, {
    foreignKey: 'conversation_id',
    otherKey: 'user_id',
    through: 'conversation_user',
    timestamps: false,
  });

  Conversation.hasMany(Message, {
    foreignKey: 'parent_id',
    scope: {
      parent_type: 'FlexAppeal\\Entities\\Conversation',
    },
  });
};
