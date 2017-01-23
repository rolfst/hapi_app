import { assert } from 'chai';
import { pick } from 'lodash';
import sinon from 'sinon';
import dispatchEvent, { EventTypes } from '../../../shared/services/dispatch-event';
import * as service from './employee';

describe('Service: employee', () => {
  let credentials;
  let network;

  before(async () => {
    credentials = global.users.employee;
    network = global.networks.flexAppeal;
  });

  describe('Update user', () => {
    const sandbox = sinon.sandbox.create();
    let dispatchEventSpy;

    before(() => {
      dispatchEventSpy = sandbox.stub(dispatchEvent, 'dispatchEvent');
    });

    afterEach(async () => {
      dispatchEventSpy.reset();
    });

    after(() => {
      sandbox.restore();
    });

    it('should fire USER_UPDATED event', async () => {
      await service.updateEmployee(
        { attributes: pick(credentials, 'id', 'email', 'phone') },
        { credentials, network }
      );

      const { args } = dispatchEventSpy.firstCall;
      assert.equal(args[0], EventTypes.USER_UPDATED);
      assert.equal(args[1], credentials);
      assert.equal(args[2].user.email, credentials.email);
    });
  });
});
