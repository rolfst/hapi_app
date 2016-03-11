import User from 'models/User';
import { destructPayload } from 'services/payload';

const values = ['firstName', 'lastName'];

module.exports = (req, reply) => {
  User.create(destructPayload(values, req.payload)).then(user => {
    reply(JSON.stringify({ data: user }));
  }).catch(error => {
    reply(JSON.stringify({ message: error.message, errors: error.errors }));
  });
};
