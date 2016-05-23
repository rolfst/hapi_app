import fetch from 'node-fetch';

export default (token, endpoint, method = 'GET') => {
  return fetch(endpoint, {
    method,
    headers: {
      'logged-in-user-token': token,
      // 'api-key': 'flexappeal4rwrs',
    },
  }).then(res => res.json())
    .catch(err => console.log(err));
};
