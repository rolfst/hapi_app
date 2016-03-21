export default ({ include }) => {
  if (!include) return [];

  return include.split(',');
};
