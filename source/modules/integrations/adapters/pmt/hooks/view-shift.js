const R = require('ramda');
const myShifts = require('./my-shifts');

module.exports = (baseStoreUrl, token) => async (shiftId) => {
  const shifts = await myShifts(baseStoreUrl, token)();

  return R.defaultTo(null, R.find(R.propEq('id', shiftId), shifts));
};
