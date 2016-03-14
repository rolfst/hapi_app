import User from 'models/User';
import { destructPayload } from 'services/payload';

const values = ['firstName', 'lastName'];

module.exports = (req, reply) => {
  User.create(destructPayload(values, req.payload)).then(user => {
    reply({ data: user });
  }).catch(error => {
    reply({ message: error.message, errors: error.errors });
  });
};
