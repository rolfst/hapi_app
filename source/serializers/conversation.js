import userSerializer from 'serializers/user';
import messageSerializer from 'serializers/message';
import formatDate from 'utils/formatDate';

export default item => {
  let output = {
    type: 'conversation',
    id: item.id.toString(),
    created_at: formatDate(item.created_at),
  };

  if (item.Messages) {
    const messages = item.Messages.map(message => messageSerializer(message));

    output = Object.assign(output, { messages });
  }

  if (item.Users && item.Users.length > 0) {
    const users = item.Users.map(user => userSerializer(user));

    output = Object.assign(output, { users });
  }

  return output;
};
