export default (boom, name) => {
  const error = boom;
  error.name = name;
  error.output.payload.title = name;

  return error;
};
