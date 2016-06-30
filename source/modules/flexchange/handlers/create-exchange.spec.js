import { assert } from 'chai';
import sinon from 'sinon';
import * as hasIntegration from 'common/utils/network-has-integration';
import * as exchangeRepo from 'modules/flexchange/repositories/exchange';
import * as exchangeValueRepo from 'modules/flexchange/repositories/exchange-value';
import * as networkRepo from 'common/repositories/network';
import * as handler from 'modules/flexchange/handlers/create-exchange';
import * as exchangeCreatedAdminNotification from '../notifications/exchange-created-by-admin';
import * as exchangeCreatedNotification from '../notifications/exchange-created';

describe('Create exchange', () => {
  let sandbox;

  before(() => {
    sandbox = sinon.sandbox.create();

    sandbox.stub(hasIntegration, 'default').returns(null);
    sandbox.stub(exchangeRepo, 'createExchange').returns(Promise.resolve({ type: 'ALL' }));
    sandbox.stub(exchangeValueRepo, 'createValuesForExchange').returns(null);
    sandbox.stub(networkRepo, 'findAllUsersForNetwork').returns(Promise.resolve([]));
  });
  after(() => (sandbox.restore()));

  it('should send a notifications when user is an admin', async () => {
    sandbox.stub(exchangeCreatedAdminNotification, 'send').returns(Promise.resolve(null));

    const requestFixture = {
      pre: { network: {
        NetworkUser: { roleType: 'ADMIN' },
      } },
      auth: { credentials: {} },
      params: { exchangeId: null },
      payload: { user_id: 1, type: 'ALL' },
    };

    await handler.default(requestFixture, () => false);

    assert.equal(exchangeCreatedAdminNotification.send.calledOnce, true);
  });

  it('should send a notifications when user is an admin', async () => {
    sandbox.stub(exchangeCreatedNotification, 'send').returns(Promise.resolve(null));

    const requestFixture = {
      pre: { network: {
        NetworkUser: { roleType: 'EMPLOYEE' },
      } },
      auth: { credentials: {} },
      params: { exchangeId: null },
      payload: { user_id: 1, type: 'ALL' },
    };

    await handler.default(requestFixture, () => false);

    assert.equal(exchangeCreatedNotification.send.calledOnce, true);
  });
});
