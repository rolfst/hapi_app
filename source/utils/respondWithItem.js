export default (item, serializer) => {
  return { data: serializer(item) };
};
