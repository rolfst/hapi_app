const settings = {
  relations: ['messages'],
  getAttributes: conversation => {
    return {
      type: conversation.type,
      created_at: conversation.created_at,
    };
  },
};

export default settings;
