const { assert } = require('chai');
const { pick } = require('lodash');
const sinon = require('sinon');
const testHelper = require('../../../shared/test-utils/helpers');
const Intercom = require('../../../shared/services/intercom');
const IntercomStub = require('../../../shared/test-utils/stubs/intercom');
const EmployeeDispatcher = require('../dispatcher');
const service = require('./employee');

describe('Service: employee', () => {
  let credentials;
  let network;

  before(async () => {
    credentials = await testHelper.createUser({ password: 'wp', email: 'user@flex-appeal.nl' });
    network = await testHelper.createNetwork({ userId: credentials.id, name: 'flexAppeal' });
  });

  after(() => testHelper.deleteUser(credentials));

  describe('Update user', () => {
    const sandbox = sinon.sandbox.create();
    let eventEmitterStub;

    before(() => {
      sandbox.stub(Intercom, 'getClient').returns(IntercomStub);

      eventEmitterStub = sandbox.stub(EmployeeDispatcher, 'emit');
    });

    afterEach(async () => {
      eventEmitterStub.reset();
    });

    after(() => {
      sandbox.restore();
    });

    it('should fire user.updated event', async () => {
      await service.updateEmployee(
        { attributes: pick(credentials, 'id', 'email', 'phone') },
        { credentials, network }
      );

      const { args } = eventEmitterStub.firstCall;
      assert.equal(args[0], 'user.updated');
      assert.equal(args[1].network.id, network.id);
      assert.equal(args[1].credentials.id, credentials.id);
      assert.equal(args[1].user.id, credentials.id);
    });
  });
});
