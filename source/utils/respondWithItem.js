import itemSerializer from 'utils/itemSerializer';

export default (item, serializer) => {
  return { data: serializer(item) };
};
