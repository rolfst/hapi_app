import * as Intercom from 'intercom-client';
import { assert } from 'chai';
import sinon from 'sinon';
import moment from 'moment';
import * as service from './dispatch-event';
const { EventTypes } = service;

describe('Dispatch event', () => {
  const usersCreateSpy = sinon.spy();
  const usersUpdateSpy = sinon.spy();
  const eventsCreateSpy = sinon.spy();
  const spies = [usersCreateSpy, usersUpdateSpy, eventsCreateSpy];

  const loggedUser = {
    id: '1',
    email: 'admin@flex-appeal.nl',
    fullName: 'Admin User',
    phoneNum: '0641842185',
  };

  const findUser = () => ({ body: {
    id: 'abc123',
    user_id: loggedUser.id,
    name: loggedUser.fullName,
    email: loggedUser.email,
    phone: loggedUser.phoneNum,
    custom_attributes: {},
  } });

  const network = { id: '1', name: 'Test Network' };

  before(() => {
    sinon.stub(Intercom, 'Client').returns({
      users: { create: usersCreateSpy, update: usersUpdateSpy, find: findUser },
      events: { create: eventsCreateSpy },
    });
  });

  afterEach(() => {
    spies.forEach(spy => spy.reset());
  });

  describe('User invited', () => {
    it('should create an user in intercom', async () => {
      const user = { id: '2', fullName: 'Test User', phoneNum: '0641842185' };
      const payload = { user, network, role: 'foo' };

      await service.dispatchEvent(EventTypes.USER_INVITED, loggedUser, payload);

      assert.deepEqual(usersCreateSpy.firstCall.args[0], {
        user_id: user.id,
        email: user.email,
        name: user.fullName,
        phone: user.phoneNum,
        companies: [{ company_id: network.id }],
        custom_attributes: { role: 'foo' },
      });
    });
  });

  describe('User updated', () => {
    it('should update the user in intercom', async () => {
      const user = { ...loggedUser, name: 'Updated User' };
      await service.dispatchEvent(EventTypes.USER_UPDATED, loggedUser, { user });

      assert.isTrue(usersUpdateSpy.calledOnce);

      assert.deepEqual(usersUpdateSpy.firstCall.args[0], {
        email: user.email,
        name: user.fullName,
        phone: user.phoneNum,
      });
    });
  });

  describe('User removed', () => {
    it('should remove company from user', async () => {
      const payload = { user: loggedUser, network };
      await service.dispatchEvent(EventTypes.USER_REMOVED, loggedUser, payload);

      assert.isTrue(usersUpdateSpy.calledOnce);

      assert.deepEqual(usersUpdateSpy.firstCall.args[0], {
        email: loggedUser.email,
        companies: [{ company_id: network.id, remove: true }],
      });
    });
  });

  describe('Exchange created', () => {
    it('should increment created shifts count + add event', async () => {
      const exchange = { id: '1', date: '2016-12-19', type: 'all' };
      const timestamp = moment().unix();

      sinon.stub(service, 'createUnixTimestamp').returns(timestamp);

      await service.dispatchEvent(EventTypes.EXCHANGE_CREATED, loggedUser, { exchange });

      assert.isTrue(usersUpdateSpy.calledOnce);
      assert.isTrue(eventsCreateSpy.calledOnce);

      assert.deepEqual(usersUpdateSpy.firstCall.args[0], {
        email: loggedUser.email,
        custom_attributes: { created_shifts: 1 },
      });

      assert.deepEqual(eventsCreateSpy.firstCall.args[0], {
        created_at: timestamp,
        event_name: 'exchange-created',
        email: loggedUser.email,
        metadata: { date: exchange.date, type: exchange.type },
      });
    });
  });

  describe('Exchange approved', () => {
    it('should increment exchanged shifts count', async () => {
      const approvedUser = { id: '2', email: 'approved@flex-appeal', name: 'Approved User' };

      await service.dispatchEvent(EventTypes.EXCHANGE_APPROVED, loggedUser, { approvedUser });

      assert.deepEqual(usersUpdateSpy.firstCall.args[0], {
        email: approvedUser.email,
        custom_attributes: { exchanged_shifts: 1 },
      });
    });
  });
});
