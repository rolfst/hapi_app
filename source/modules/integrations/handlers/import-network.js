const R = require('ramda');
const syncService = require('../services/sync');

module.exports = async (req, reply) => {
  try {
    const message = R.merge(req.pre, req.auth);
    const payload = {
      networkId: req.params.networkId,
      ownerEmail: req.payload.external_email,
    };

    await syncService.importNetwork(payload, message);

    return reply().code(202);
  } catch (err) {
    return reply(err);
  }
};
