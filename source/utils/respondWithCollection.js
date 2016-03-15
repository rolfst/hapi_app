export default (collection, serializer) => {
  return collection.map(item => serializer(item));
};
