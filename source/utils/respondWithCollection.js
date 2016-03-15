export default (collection, serializer) => {
  const items = collection.map(item => serializer(item));

  return {
    data: items,
  };
};
