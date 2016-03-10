import User from 'models/User';

module.exports = (req, reply) => {
  User.findOne().then(user => reply(user));
};
