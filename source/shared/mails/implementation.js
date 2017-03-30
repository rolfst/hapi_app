const R = require('ramda');

/**
 * Get names from array and limit to 3 visible items
 * @param {array} items - Array of items containing names
 * @param {function} fn - Function to use to retrieve name from object
 * @method getNamesString
 * @return {string}
 */
const getNamesString = (items, fn) => {
  const pluck = R.map(fn);
  const length = R.length(items);

  return R.cond([
    [R.equals(1), R.always(pluck(items))],
    [R.equals(2), R.always(R.join(' en ', pluck(items)))],
    [R.equals(3), R.always(`${R.join(', ', pluck(R.take(2, items)))} en ${length - 2} andere`)],
    [R.lt(2), R.always(`${R.join(', ', pluck(R.take(2, items)))} en ${length - 2} anderen`)],
    [R.T, R.always('')],
  ])(length);
};

const getDatesString = (start, end) => (start.month() !== end.month() ?
  `${start.format('D MMMM')} - ${end.format('D MMMM, YYYY')}` :
  `${start.format('D')} - ${end.format('D MMMM, YYYY')}`);

exports.getNamesString = getNamesString;
exports.getDatesString = getDatesString;
