import userSerializer from 'serializers/user';

export default item => {
  return {
    type: 'conversation_message',
    id: item.id.toString(),
    text: item.text,
    created_at: item.created_at,
    updated_at: item.updated_at,
    conversation_id: item.parentId,
    created_by: userSerializer(item.User),
  };
};
