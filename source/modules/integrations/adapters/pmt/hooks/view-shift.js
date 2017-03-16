const { find } = require('lodash');
const myShifts = require('./my-shifts');

module.exports = (baseStoreUrl, token) => async (shiftId) => {
  const shifts = await myShifts(baseStoreUrl, token)();

  return find(shifts, { id: shiftId });
};
