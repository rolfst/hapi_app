export default (hook) => {
  return (token) => hook(token);
};
