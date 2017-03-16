import R from 'ramda';

module.exports = (request) => ({
  message: R.mergeAll([request.auth, request.pre]),
  payload: R.mergeAll([request.query, request.params, request.payload]),
});
