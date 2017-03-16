const R = require('ramda');
const syncService = require('../services/sync');

module.exports = async (req, reply) => {
  try {
    const payload = R.merge(req.params, req.payload);
    const message = R.merge(req.pre, req.auth);

    syncService.syncNetwork(payload, message);

    return reply().code(202);
  } catch (err) {
    return reply(err);
  }
};
