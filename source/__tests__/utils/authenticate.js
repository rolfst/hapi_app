import { User } from 'models';

let token;

export default ({ email = 'ruben@flex-appeal.nl', password = 'admin' }) => {
  return fetch('https://test.api.flex-appeal.nl/v1/authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(response => response.json())
    .then(json => {
      token = json.data.access_token;
      return User.findById(json.data.user.id);
    }).then(user => {
      return { authUser: user, authToken: token };
    });
};
