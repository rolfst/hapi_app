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

      assert.isString(actual.teamId);
      assert.isString(actual.exchangeId);
      assert.deepEqual(actual, expected);
    });
  });

  describe('mapShiftsWithExchanges', () => {
    it('merges exchanges with shifts', () => {
      const fakeShifts = [{
        id: '25280341',
        start_time: '2016-12-19T08:00:00+0100',
        end_time: '2016-12-19T16:30:00+0100',
        break: '01:30:00',
        department: '14',
      }, {
        id: '25280343',
        start_time: '2016-12-21T08:00:00+0100',
        end_time: '2016-12-21T15:00:00+0100',
        break: '01:15:00',
        department: '14',
      }];

      const fakeExchanges = [{
        id: 3,
        title: 'External shift #1',
        shiftId: 25280341,
        teamId: 14,
      }];

      const actual = impl.mapShiftsWithExchanges(fakeShifts, fakeExchanges);
      const expected = [{
        ...fakeShifts[0],
        exchangeId: '3',
        teamId: '14',
      }, {
        ...fakeShifts[1],
        exchangeId: null,
        teamId: null,
      }];

      assert.deepEqual(actual, expected);
    });
  });
});
