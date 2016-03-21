import collectionSerializer from 'utils/collectionSerializer';

export default (collection, serializer) => {
  return { data: collection.map(item => serializer(item)) };
};
