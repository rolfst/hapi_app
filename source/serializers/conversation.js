import userSerializer from 'serializers/user';
import messageSerializer from 'serializers/message';

export default item => {
  let output = {
    type: item.type,
    id: item.id.toString(),
    created_at: item.created_at,
  };

  if (item.Messages && item.Messages.length > 0) {
    const messages = item.Messages.map(message => messageSerializer(message));

    output = Object.assign(output, { messages });
  }

  if (item.Users && item.Users.length > 0) {
    const users = item.Users.map(user => userSerializer(user));

    output = Object.assign(output, { users });
  }

  return output;
};
