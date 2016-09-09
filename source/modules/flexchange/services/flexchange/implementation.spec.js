import { assert } from 'chai';
import * as impl from './implementation';

describe('Flexchange service', () => {
  describe('mergeShiftWithExchange', () => {
    it('should add exchange_id and team_id properties to shift object', () => {
      const shiftBlueprint = {
        id: '3314',
        foo: 'Baz',
      };

      const exchangeBlueprint = {
        id: '123',
        title: 'Foo',
        teamId: '1',
        other: 'Baz',
      };

      const actual = impl.mergeShiftWithExchange(shiftBlueprint, exchangeBlueprint);
      const expected = { id: '3314', foo: 'Baz', teamId: '1', exchangeId: '123' };

      assert.deepEqual(actual, expected);
    });
  });
});
