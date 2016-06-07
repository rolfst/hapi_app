import request from 'superagent';
import User from 'common/models/user';

export default ({ email = 'ruben@flex-appeal.nl', password = 'admin' }) => {
  return request.post('https://test.api.flex-appeal.nl/v1/authorize')
    .set('Content-Type', 'application/json')
    .send({ email, password })
    .then(res => {
      const { access_token: accessToken, user } = res.body.data;

      return Promise.all([accessToken, User.findById(user.id)]);
    })
    .then(([token, user]) => {
      return { authUser: user, authToken: token };
    })
    .catch(err => console.log('error', err));
};
