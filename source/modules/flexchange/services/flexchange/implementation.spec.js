import { assert } from 'chai';
import * as impl from './implementation';

describe('Flexchange service', () => {
  describe('mergeShiftWithExchangeAndTeam', () => {
    it('should add exchange_id and team_id properties to shift object', () => {
      const shiftStub = {
        id: '3314',
        foo: 'Baz',
        team_id: '94',
      };

      const exchangeStub = {
        id: 123,
        title: 'Foo',
        other: 'Baz',
      };

      const teamStub = {
        id: 1233,
        externalId: '94',
        name: 'Kassa',
      };

      const actual = impl.mergeShiftWithExchangeAndTeam(
        shiftStub, exchangeStub, teamStub);

      const expected = { id: '3314', foo: 'Baz', teamId: 1233, exchangeId: 123 };

      assert.deepEqual(actual, expected);
    });
  });

  describe('mapShiftsWithExchanges', () => {
    it('merges exchanges with shifts', () => {
      const shiftStub = [{
        id: '25280341',
        start_time: '2016-12-19T08:00:00+0100',
        end_time: '2016-12-19T16:30:00+0100',
        break: '01:30:00',
        team_id: '14',
      }, {
        id: '25280343',
        start_time: '2016-12-21T08:00:00+0100',
        end_time: '2016-12-21T15:00:00+0100',
        break: '01:15:00',
        team_id: '14',
      }];

      const exchangeStub = [{
        id: 3,
        title: 'External shift #1',
        shiftId: 25280341,
      }];

      const teamStub = [{
        id: 1223,
        externalId: '14',
        name: 'Kassa',
      }];

      const actual = impl.mapShiftsWithExchangeAndTeam(
        shiftStub, exchangeStub, teamStub);

      const expected = [{
        id: '25280341',
        start_time: '2016-12-19T08:00:00+0100',
        end_time: '2016-12-19T16:30:00+0100',
        break: '01:30:00',
        exchangeId: 3,
        teamId: 1223,
      }, {
        id: '25280343',
        start_time: '2016-12-21T08:00:00+0100',
        end_time: '2016-12-21T15:00:00+0100',
        break: '01:15:00',
        exchangeId: null,
        teamId: 1223,
      }];

      assert.deepEqual(actual, expected);
    });
  });
});
