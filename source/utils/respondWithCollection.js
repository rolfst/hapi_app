export default (collection, serializer, options = {}) => {
  const items = collection.map(item => serializer(item, options));

  return {
    data: items,
  };
};
