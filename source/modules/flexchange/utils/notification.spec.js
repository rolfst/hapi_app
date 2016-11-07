import { assert } from 'chai';
import moment from 'moment';
import * as unit from './notification';

describe('notificationUtils', () => {
  describe('formatTime', () => {
    it('should return correct time', () => {
      const utcMoment = moment.utc().hours(10).minutes(30);
      const localMoment = moment(utcMoment).tz('Europe/Amsterdam').format('HH:mm');

      assert.equal(unit.formatTime(utcMoment), localMoment);
    });
  });
});
