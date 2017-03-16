const { find } = require('lodash');
const myShifts = require('./my-shifts');

export default (baseStoreUrl, token) => async (shiftId) => {
  const shifts = await myShifts(baseStoreUrl, token)();

  return find(shifts, { id: shiftId });
};
