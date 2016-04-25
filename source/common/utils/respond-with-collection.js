export default collection => {
  return { data: collection.map(item => item.toJSON()) };
};
