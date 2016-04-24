export default (item, serializer) => {
  return { data: item.toJSON() };
};
