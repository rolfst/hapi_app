export default (req, reply) => {
  reply({ data: req.auth.credentials.setFunctionName().toJSON() });
};
