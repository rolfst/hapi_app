import User from 'models/User';

module.exports = (req, reply) => {
  User.findAll().then(users => {
    reply(JSON.stringify({ data: users }));
  });
};
