import { assert } from 'chai';
import moment from 'moment';
import Joi from 'joi';
import { omit } from 'lodash';
import scheme from './create-exchange';

describe('Create exchange validator', () => {
  it('only accepts TEAM, ALL and USER values as type', () => {
    const payload = {
      type: 'FOO',
      values: [1],
      start_time: moment().toISOString(),
      end_time: moment().add(20, 'minutes').toISOString(),
    };

    const actual = Joi.validate({ payload }, scheme);

    assert.equal(actual.error.details[0].path, 'payload.type');
    assert.ifError(actual.error[0]);
  });

  it('should allow description as optional attribute', () => {
    const payload = {
      shift_id: 1,
      team_id: 2,
      type: 'USER',
      description: null,
      date: '2016-09-10',
      values: [1],
      start_time: moment().toISOString(),
      end_time: moment().add(20, 'minutes').toISOString(),
    };

    const actual = Joi.validate({ payload }, scheme);

    assert.isNull(actual.error);
  });

  describe('Exchange for shift', () => {
    const defaultPayload = {
      shift_id: 1,
      team_id: 2,
      type: 'USER',
      date: '2016-09-10',
      values: [1],
      start_time: moment().toISOString(),
      end_time: moment().add(20, 'minutes').toISOString(),
    };

    it('validate payload when creating exchange with shift_id', () => {
      const payload = defaultPayload;
      const actual = Joi.validate({ payload }, scheme);

      assert.isNull(actual.error);
    });

    it('fail when team_id is not present with shift_id', () => {
      const payload = omit(defaultPayload, 'team_id');
      const actual = Joi.validate({ payload }, scheme);

      assert.ifError(actual.error[0]);
    });

    it('fails when type is not USER', () => {
      const payload = { ...defaultPayload, type: 'ALL' };
      const actual = Joi.validate({ payload }, scheme);

      assert.ifError(actual.error[0]);
    });
  });

  describe('Normal exchange', () => {
    it('should succeed', () => {
      const payload = {
        type: 'ALL',
        date: '2016-09-10',
        values: [1],
        start_time: moment().toISOString(),
        end_time: moment().add(20, 'minutes').toISOString(),
      };

      const actual = Joi.validate({ payload }, scheme);

      assert.isNull(actual.error);
    });

    it('should succeed with empty values', () => {
      const payload = {
        type: 'ALL',
        date: '2016-09-10',
        values: [],
        start_time: moment().toISOString(),
        end_time: moment().add(20, 'minutes').toISOString(),
      };

      const actual = Joi.validate({ payload }, scheme);

      assert.isNull(actual.error);
    });

    it('fails when type is USER and shift_id is not present', () => {
      const payload = {
        type: 'USER',
        date: '2016-09-10',
        values: [1],
        start_time: moment().toISOString(),
        end_time: moment().add(20, 'minutes').toISOString(),
      };

      const actual = Joi.validate({ payload }, scheme);

      assert.ifError(actual.error[0]);
    });

    it('fails when start_time is not specified', () => {
      const payload = {
        type: 'ALL',
        date: '2016-09-10',
        values: [1],
        end_time: moment().add(20, 'minutes').toISOString(),
      };

      const actual = Joi.validate({ payload }, scheme);

      assert.ifError(actual.error[0]);
    });

    it('fails when end_time is not specified', () => {
      const payload = {
        type: 'ALL',
        date: '2016-09-10',
        values: [1],
        start_time: moment().toISOString(),
      };

      const actual = Joi.validate({ payload }, scheme);

      assert.ifError(actual.error[0]);
    });
  });
});
