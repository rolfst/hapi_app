import userSerializer from 'serializers/user';
import conversationSerializer from 'serializers/conversation';
import formatDate from 'utils/formatDate';

export default item => {
  let output = {
    type: 'conversation_message',
    id: item.id.toString(),
    text: item.text,
    created_at: formatDate(item.created_at),
    updated_at: formatDate(item.updated_at),
    conversation_id: item.parentId.toString(),
    created_by: userSerializer(item.User),
  };

  if (item.Conversation) {
    const conversation = conversationSerializer(item.Conversation);

    output = Object.assign(output, { conversation });
  }

  return output;
};
