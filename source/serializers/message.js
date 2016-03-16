const settings = {
  relations: ['user'],
  getAttributes: (message) => {
    return {
      text: message.text,
      created_by: message.createdBy,
      created_at: message.created_at,
      updated_at: message.updated_at,
    };
  },
};

export default settings;
