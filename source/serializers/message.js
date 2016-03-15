export default (options = {}) => {
  const relations = options.relations || false;


  return message => {
    const item = {
      links: {
        self: `${process.env.BASE_URL}/messages/${message.id}`,
      },
      data: {
        type: 'messages',
        id: message.id,
        attributes: {
          text: message.text,
          created_by: message.createdBy,
          updated_at: message.updated_at,
          created_at: message.created_at,
        },
      },
    };

    if (relations) {
      item.data.relationships = {
        user: {
          links: {
            related: `${process.env.BASE_URL}/messages/${message.id}/user`,
          },
        },
      };
    }

    return item;
  };
};
