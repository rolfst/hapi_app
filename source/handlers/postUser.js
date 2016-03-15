import User from 'models/User';
import { destructPayload } from 'services/payload';

const values = ['firstName', 'lastName', 'email', 'profile_img'];

module.exports = (req, reply) => {
  const payload = destructPayload(values, req.payload);
  const data = Object.assign(payload, { profileImg: 'test.jpg', password: 'test' });

  User.create(data).then(user => {
    reply({ data: user });
  }).catch(error => {
    reply({ message: error.message, errors: error.errors });
  });
};
