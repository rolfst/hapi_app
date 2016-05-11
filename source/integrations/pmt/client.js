export default (endpoint, method = 'GET') => {
  return fetch(endpoint, {
    method,
    headers: {
      // 'logged-in-user-token': '6a0b4152a3b53989912259c35aa4b68f',
      'api-key': 'flexappeal4rwrs',
    },
  }).then(res => res.json())
    .then(data => data.successful)
    .catch(err => console.log(err));
};
