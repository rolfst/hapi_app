import userSerializer from 'serializers/user';

export default item => {
  return {
    type: item.type,
    id: item.id.toString(),
    text: item.text,
    created_at: item.created_at,
    updated_at: item.updated_at,
    created_by: userSerializer(item.User),
  };
};
