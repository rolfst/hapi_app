import fetch from 'node-fetch';

export default (endpoint, method = 'GET') => {
  return fetch(endpoint, {
    method,
    headers: {
      'logged-in-user-token': '0253b37298e8dbee6894071355f1a740',
      // 'api-key': 'flexappeal4rwrs',
    },
  }).then(res => res.json())
    .catch(err => console.log(err));
};
