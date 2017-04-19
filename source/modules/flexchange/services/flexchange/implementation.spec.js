const { assert } = require('chai');
const impl = require('./implementation');

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

  describe('replaceUsersInResponses', () => {
    it('should add user objects equal to the userId value per response', () => {
      const users = [{
        id: '1',
        fullName: 'John Doe',
      }, {
        id: '2',
        fullName: 'Samantha Carey',
      }, {
        id: '3',
        fullName: 'Liam Specter',
      }];

      const responses = [{
        id: '232',
        userId: '1',
        response: true,
      }, {
        id: '232',
        userId: '2',
        response: true,
      }];

      const actual = impl.replaceUsersIn(users, responses);
      const expected = [{
        id: '232',
        userId: '1',
        response: true,
        user: {
          id: '1',
          fullName: 'John Doe',
        },
      }, {
        id: '232',
        userId: '2',
        response: true,
        user: {
          id: '2',
          fullName: 'Samantha Carey',
        },
      }];

      assert.deepEqual(actual, expected);
    });
  });

  describe('groupValuesPerExchange', () => {
    it('returns correct pairs', () => {
      const exchangeValues = [{
        exchangeId: '2',
        value: '1',
      }, {
        exchangeId: '2',
        value: '3',
      }, {
        exchangeId: '3',
        value: '1',
      }, {
        exchangeId: '3',
        value: '1',
      }];

      assert.deepEqual(impl.groupValuesPerExchange(exchangeValues), [{
        exchangeId: '2',
        values: ['1', '3'],
      }, {
        exchangeId: '3',
        values: ['1'],
      }]);
    });
  });

  describe('findUserById', () => {
    it('returns null if user not found', () => {
      const users = [{
        id: '2',
        fullName: 'John Doe',
      }];

      assert.equal(impl.findUserById(users, '1'), null);
    });

    it('returns user if found', () => {
      const users = [{
        id: '1',
        fullName: 'John Doe',
      }];

      assert.deepEqual(impl.findUserById(users, '1'), users[0]);
    });
  });

  describe('addValues', () => {
    it('should return exchange including correct values', () => {
      const exchange = {
        id: '1',
      };

      const valuesLookup = [{
        exchangeId: '1',
        values: ['1', '2'],
      }];

      assert.deepEqual(impl.addValues(valuesLookup, exchange), {
        id: '1',
        values: ['1', '2'],
      });
    });

    it('should return empty array when lookup match not found', () => {
      const exchange = {
        id: '1',
      };

      const valuesLookup = [{
        exchangeId: '2',
        values: ['1', '2'],
      }];

      assert.deepEqual(impl.addValues(valuesLookup, exchange), {
        id: '1',
        values: [],
      });
    });
  });

  describe('makeCreatedInObject', () => {
    it('should return correct object when created for network', () => {
      const exchange = {
        id: '1',
        networkId: '1',
        teamId: null,
        shiftId: null,
        createdFor: 'ALL',
        values: ['1'],
      };

      assert.deepEqual(impl.makeCreatedInObject(exchange), {
        type: 'network',
        id: '1',
      });
    });

    it('should return correct object when created for team', () => {
      const exchange = {
        id: '1',
        networkId: '1',
        teamId: null,
        shiftId: null,
        createdFor: 'TEAM',
        values: ['1', '2'],
      };

      assert.deepEqual(impl.makeCreatedInObject(exchange), {
        type: 'team',
        ids: ['1', '2'],
      });
    });

    it('should return correct object when created for user while not a shift', () => {
      const exchange = {
        id: '1',
        networkId: '1',
        teamId: null,
        shiftId: null,
        createdFor: 'USER',
        values: ['1', '2'],
      };

      assert.deepEqual(impl.makeCreatedInObject(exchange), {
        type: 'network',
        id: '1',
      });
    });

    it('should return correct object when created as shift', () => {
      const exchange = {
        id: '1',
        networkId: '1',
        teamId: '665',
        shiftId: '342',
        createdFor: 'USER',
        values: ['1', '2'],
      };

      assert.deepEqual(impl.makeCreatedInObject(exchange), {
        type: 'team',
        ids: ['665'],
      });
    });
  });

  describe('createResponseStatus', () => {
    it('should return ACCEPTED status', () => {
      assert.equal(impl.createResponseStatus({
        response: true, isApproved: null }), 'ACCEPTED');
    });

    it('should return DECLINED status', () => {
      assert.equal(impl.createResponseStatus({
        response: false, isApproved: null }), 'DECLINED');
    });

    it('should return APPROVED status', () => {
      assert.equal(impl.createResponseStatus({
        response: true, isApproved: true }), 'APPROVED');
    });

    it('should return REJECTED status', () => {
      assert.equal(impl.createResponseStatus({
        response: true, isApproved: false }), 'REJECTED');
    });

    it('should return null if no combination matched', () => {
      assert.equal(impl.createResponseStatus({
        response: null, isApproved: null }), null);
    });

    it('should return null if input is empty', () => {
      assert.equal(impl.createResponseStatus({}), null);
    });

    it('should return null if no response or isApproved properties present', () => {
      assert.equal(impl.createResponseStatus({
        response: null, foo: 'baz' }), null);

      assert.equal(impl.createResponseStatus({
        foo: 'baz', isApproved: null }), null);
    });
  });
});
