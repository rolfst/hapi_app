export default {
  'get-conversation': {
    validate: (loggedUser, conversation) => {
      return conversation.Users.some(user => user.id === loggedUser.id);
    },
  },
};
