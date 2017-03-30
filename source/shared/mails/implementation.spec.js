const { assert } = require('chai');
const R = require('ramda');
const impl = require('./implementation');

describe('Mail implementation', () => {
  describe('getNamesString', () => {
    it('should return a single name if length is 1', () => {
      const expected = 'A';
      const actual = impl.getNamesString(['A'], R.identity);

      assert.equal(actual, expected);
    });

    it('should return two names if length is 2', () => {
      const expected = 'A en B';
      const actual = impl.getNamesString(['A', 'B'], R.identity);

      assert.equal(actual, expected);
    });

    it('should return two names separated by comma if length is 3', () => {
      const expected = 'A, B en 1 andere';
      const actual = impl.getNamesString(['A', 'B', 'C'], R.identity);

      assert.equal(actual, expected);
    });

    it('should return three names separated by comma if length is 3', () => {
      const expected = 'A, B en 2 anderen';
      const actual = impl.getNamesString(['A', 'B', 'C', 'D'], R.identity);

      assert.equal(actual, expected);
    });
  });
});
