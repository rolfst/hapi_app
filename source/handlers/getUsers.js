import User from 'models/User';

module.exports = (req, reply) => {
  User.findAll().then(users => {
    reply({ data: users });
  });
};
