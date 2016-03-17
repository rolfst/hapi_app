import { User } from 'models';

module.exports = (req, reply) => {
  User.findAll().then(users => {
    reply({ data: users });
  });
};
