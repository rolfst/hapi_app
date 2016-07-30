import { assert } from 'chai';
import { mapShiftsWithExchanges } from 'modules/flexchange/handlers/my-shifts';

describe('My shifts', () => {
  it('merges exchanges with shifts', () => {
    const fakeShifts = [{
      id: '25280341',
      start_time: '2016-12-19T08:00:00+0100',
      end_time: '2016-12-19T16:30:00+0100',
      break: '01:30:00',
    }, {
      id: '25280343',
      start_time: '2016-12-21T08:00:00+0100',
      end_time: '2016-12-21T15:00:00+0100',
      break: '01:15:00',
    }];

    const fakeExchanges = [{
      id: 3,
      title: 'External shift #1',
      externalShiftId: 25280341,
    }];

    const actual = mapShiftsWithExchanges(fakeShifts, fakeExchanges);
    const expected = [{
      ...fakeShifts[0],
      exchange_id: 3,
    }, {
      ...fakeShifts[1],
      exchange_id: null,
    }];

    assert.deepEqual(actual, expected);
  });
});
